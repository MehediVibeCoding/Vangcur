'use server';

import { after } from 'next/server';
import { headers } from 'next/headers';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/serviceClient';
import {
  DISTRICTS, getShipOptions, shipPrice, fetchShipConfig, DEFAULT_SHIP_CFG,
  validatePhone, validateAddress, validateEmail, validateTxnId,
  calculateAdvancePayment, MAX_ONLINE_ORDER_TOTAL,
} from '@/lib/checkoutData';
import {
  sanitizePlainName, validateName, MAX_NAME_LEN,
  sanitizeEmailInput, sanitizeAddressInput, MAX_ADDR_LEN,
} from '@/lib/security';
import { logWarn, logError } from '@/lib/logger';
import { staticDictionary } from '@/lib/i18n/dictionary';
import { sendTelegramOrderNotification } from '@/lib/telegram';
import type { ActionResponse, CreateOrderResult, OrderPayload } from '@/types';

const MAX_ITEMS = 30;
const MAX_QTY_PER_ITEM = 50;
const GENERIC_RETRY_MSG = 'একটু পরে আবার চেষ্টা করুন';

function fail(error: string): ActionResponse<CreateOrderResult> {
  return { ok: false, error };
}

function parseJsonish<T>(val: unknown, fallback: T): T {
  if (val === null || val === undefined) return fallback;
  if (typeof val !== 'string') return val as T;
  try {
    return JSON.parse(val) as T;
  } catch {
    return fallback;
  }
}

export async function createOrder(payload: OrderPayload): Promise<ActionResponse<CreateOrderResult>> {
  const lang = payload?.lang === 'en' ? 'en' : 'bn';
  const t = (text: string): string => (lang === 'en' ? (staticDictionary[text] ?? text) : text);

  if (!payload || typeof payload !== 'object') return fail(t('অবৈধ অনুরোধ'));

  const name = sanitizePlainName(String(payload.name || '')).trim();
  const phone = String(payload.phone || '').trim();
  const dist = String(payload.district || '').trim();
  const addr = sanitizeAddressInput(String(payload.address || '')).trim();
  const email = sanitizeEmailInput(String(payload.email || '')).trim();
  const shipping = String(payload.shipping || '').trim();
  const txn = String(payload.paymentTxn || '').trim().toUpperCase();
  const last4 = String(payload.paymentLast4 || '').trim();
  const fingerprintId = String(payload.fingerprintId || '').trim().slice(0, 128);
  const couponCode = String(payload.couponCode || '').trim().toUpperCase();
  const rawItems = Array.isArray(payload.items) ? payload.items : [];

  if (!validateName(name) || name.length > MAX_NAME_LEN) return fail(t('সঠিক নাম দিন'));
  if (!validatePhone(phone)) return fail(t('সঠিক মোবাইল নম্বর দিন'));
  if (!DISTRICTS.includes(dist)) return fail(t('সঠিক জেলা সিলেক্ট করুন'));
  if (!validateAddress(addr) || addr.length > MAX_ADDR_LEN) return fail(t('সঠিক ঠিকানা দিন'));
  if (email && !validateEmail(email)) return fail(t('সঠিক ইমেইল দিন'));

  const validShipKeys: string[] = getShipOptions(dist).map((o) => o.key);
  if (!shipping || !validShipKeys.includes(shipping)) return fail(t('সঠিক শিপিং অপশন সিলেক্ট করুন'));

  if (!rawItems.length || rawItems.length > MAX_ITEMS) return fail(t('কার্ট খালি বা অস্বাভাবিক, রিফ্রেশ করে আবার চেষ্টা করুন'));

  const mergedMap: Record<string, number> = {};
  for (const raw of rawItems) {
    const id = String(raw?.id ?? '').trim();
    const qty = Number(raw?.qty);
    if (!id || !Number.isInteger(qty) || qty < 1 || qty > MAX_QTY_PER_ITEM) {
      return fail(t('কার্টের একটি আইটেম সঠিক নয়, রিফ্রেশ করে আবার চেষ্টা করুন'));
    }
    mergedMap[id] = (mergedMap[id] || 0) + qty;
  }

  const cleanItems: { id: string; qty: number }[] = Object.entries(mergedMap).map(([id, qty]) => ({ id, qty }));
  const targetProductIds = cleanItems.map((item) => item.id);

  let service: SupabaseClient;
  try {
    service = createServiceClient();
  } catch (e) {
    logError('[checkout] service client init failed:', e);
    return fail(t('সার্ভার কনফিগারেশন সমস্যা, একটু পরে চেষ্টা করুন'));
  }

  let currentUserId: string | null = null;
  let isPrivilegedUser = false;

  try {
    const cookieClient = await createClient();
    const { data: userData } = await cookieClient.auth.getUser();
    if (userData?.user) {
      currentUserId = userData.user.id;

      // প্রোফাইল টেবিল থেকে অ্যাডমিন/মডারেটর রোল যাচাই — শুধুমাত্র DB-ভিত্তিক
      // (আগে এখানে একটা হার্ডকোডেড মডারেটর-ইমেইল শর্টকাট ছিল, সরিয়ে ফেলা হয়েছে)
      const { data: profile } = await service
        .from('profiles')
        .select('is_admin, role')
        .eq('id', userData.user.id)
        .maybeSingle();

      if (profile?.is_admin === true || ['admin', 'super_admin', 'moderator'].includes(profile?.role)) {
        isPrivilegedUser = true;
      }
    }
  } catch {
    // ignore
  }

  // 🎖️ ফিচার: Legendary (১০+ ডেলিভার্ড অর্ডার) সদস্যের একবার-ব্যবহারযোগ্য
  // "Zero Advance / ১০০% COD" ভাউচার। মেম্বারশিপ থেকে ক্লেইম করা থাকলে
  // (claim_legendary_reward RPC) এখানে atomic UPDATE...WHERE দিয়ে reserve
  // করা হচ্ছে — একই ইউজার দুই ট্যাবে একসাথে চেকআউট করলেও ভাউচার একবারই
  // ব্যবহার হবে। এই একটামাত্র লুকআপ ছাড়া checkout আর কোথাও ইউজারের
  // ডেলিভারি-সংখ্যা নতুন করে গোনে না — সেই ভারী হিসাব শুধু ক্লেইমের সময়
  // একবারই হয়।
  let legendaryVoucherReserved = false;
  if (currentUserId) {
    try {
      const { data: voucherRow } = await service
        .from('legendary_vouchers')
        .update({ is_available: false })
        .eq('user_id', currentUserId)
        .eq('is_available', true)
        .select('user_id')
        .maybeSingle();
      legendaryVoucherReserved = !!voucherRow;
    } catch (e) {
      logError('[checkout] legendary voucher reserve check failed (continuing as a normal order):', e);
    }
  }

  async function revertLegendaryVoucherIfNeeded() {
    if (!legendaryVoucherReserved || !currentUserId) return;
    try {
      await service
        .from('legendary_vouchers')
        .update({ is_available: true })
        .eq('user_id', currentUserId)
        .eq('is_available', false)
        .is('used_at', null);
    } catch (e) {
      logError('[checkout] legendary voucher release failed:', e);
    }
  }

  const hasTxn = !!txn;
  const hasLast4 = !!last4;
  if (!legendaryVoucherReserved) {
    if (!hasTxn && !hasLast4) return fail(t('Transaction ID অথবা শেষ ৪ ডিজিট দিন'));
    if (hasTxn && !validateTxnId(txn)) return fail(t('সঠিক বিকাশ ট্রানজেকশন আইডি দিন'));
    if (hasLast4 && !/^\d{4}$/.test(last4)) return fail(t('সঠিক শেষ ৪ ডিজিট দিন'));
  }

  if (!isPrivilegedUser) {
    try {
      const { data: phoneOk, error: phoneRlErr } = await service.rpc('check_and_set_rate_limit', { p_phone: phone });
      if (phoneRlErr) {
        // 🛡️ fail-closed: RPC এরর হলে চুপচাপ চালিয়ে না দিয়ে অর্ডার আটকানো হবে
        logError('[checkout] phone rate limit RPC error — fail-closed:', phoneRlErr.message);
        await revertLegendaryVoucherIfNeeded();
        return fail(GENERIC_RETRY_MSG);
      }
      if (phoneOk === false) {
        await revertLegendaryVoucherIfNeeded();
        return fail(t('একটু অপেক্ষা করুন, তারপর আবার চেষ্টা করুন'));
      }

      if (fingerprintId) {
        const { data: fpOk, error: fpErr } = await service.rpc('check_and_set_fingerprint_limit', { p_fingerprint_id: fingerprintId });
        if (fpErr) {
          logError('[checkout] fingerprint rate limit RPC error — fail-closed:', fpErr.message);
          await revertLegendaryVoucherIfNeeded();
          return fail(GENERIC_RETRY_MSG);
        }
        if (fpOk === false) {
          await revertLegendaryVoucherIfNeeded();
          return fail(t('একটু অপেক্ষা করুন, তারপর আবার চেষ্টা করুন'));
        }
      }

      // 🛡️ IP-ভিত্তিক ব্যাকস্টপ — fingerprintId খালি/অ্যাডব্লকার দিয়ে ব্লকড হলেও
      // (বা সরাসরি server action কল করে বাইপাস করার চেষ্টা হলেও), ভিজিটরের real IP
      // ইউজার নিজে বদলাতে পারে না, তাই এটা একটা স্বাধীন নিরাপত্তা স্তর
      try {
        const hdrs = await headers();
        const forwardedFor = hdrs.get('x-forwarded-for');
        const clientIp = forwardedFor ? forwardedFor.split(',')[0].trim() : (hdrs.get('x-real-ip') || '');

        const { data: ipOk, error: ipErr } = await service.rpc('check_and_set_ip_limit', { p_ip: clientIp });
        if (ipErr) {
          logError('[checkout] ip rate limit RPC error — fail-closed:', ipErr.message);
          await revertLegendaryVoucherIfNeeded();
          return fail(GENERIC_RETRY_MSG);
        }
        if (ipOk === false) {
          await revertLegendaryVoucherIfNeeded();
          return fail(t('একটু অপেক্ষা করুন, তারপর আবার চেষ্টা করুন'));
        }
      } catch (e) {
        logError('[checkout] ip rate limit exception — fail-closed:', e);
        await revertLegendaryVoucherIfNeeded();
        return fail(GENERIC_RETRY_MSG);
      }
    } catch (e) {
      logError('[checkout] rate limit exception — fail-closed:', e);
      await revertLegendaryVoucherIfNeeded();
      return fail(GENERIC_RETRY_MSG);
    }
  }

  let authoritativeProds: { id: string | number; name: string; price: number; stock: number; cat: string; imgs: string[] }[] = [];
  let shipCfg = DEFAULT_SHIP_CFG;

  try {
    const [productsResult, fetchedShipCfg] = await Promise.all([
      service
        .from('custom_products')
        .select('id, cat, name, price, stock, imgs')
        .in('id', targetProductIds),
      fetchShipConfig(service),
    ]);

    if (productsResult.data && productsResult.data.length > 0) {
      authoritativeProds = productsResult.data.map((p) => {
        let parsedImgs = parseJsonish<string[]>(p.imgs, []);
        if (!Array.isArray(parsedImgs) || !parsedImgs.length) parsedImgs = ['📦'];
        return {
          id: p.id,
          name: p.name || '',
          price: Number(p.price) || 0,
          stock: p.stock !== undefined && p.stock !== null ? Number(p.stock) : 0,
          cat: p.cat || 'general',
          imgs: parsedImgs,
        };
      });
    }

    if (fetchedShipCfg) {
      shipCfg = fetchedShipCfg;
    }
  } catch (e) {
    logWarn('[checkout] parallel fetch failed:', e);
  }

  if (!authoritativeProds.length) {
    await revertLegendaryVoucherIfNeeded();
    return fail(t(GENERIC_RETRY_MSG));
  }

  const verifiedItems: { id: string | number; name: string; emoji: string; price: number; qty: number; cat: string }[] = [];
  for (const item of cleanItems) {
    const prod = authoritativeProds.find((p) => String(p.id) === item.id);
    if (!prod) {
      await revertLegendaryVoucherIfNeeded();
      return fail(t('একটি পণ্য আর পাওয়া যাচ্ছে না, পেজ রিফ্রেশ করে আবার চেষ্টা করুন'));
    }
    verifiedItems.push({
      id: prod.id,
      name: prod.name,
      emoji: prod.imgs[0] || '📦',
      price: prod.price,
      qty: item.qty,
      cat: prod.cat,
    });
  }

  let sc = shipPrice(shipping, shipCfg);
  const vSub = verifiedItems.reduce((s, i) => s + i.price * i.qty, 0);

  let discountAmount = 0;
  let appliedCouponCode: string | null = null;
  let couponReserved = false;

  if (couponCode) {
    try {
      const { data: couponRes, error: couponErr } = await service.rpc('validate_and_apply_coupon', {
        p_code: couponCode,
        p_subtotal: vSub,
        p_phone: phone,
        p_user_id: currentUserId,
      });

      if (!couponErr && couponRes && couponRes.ok) {
        // 🛡️ ফিক্স (audit P1-18): আগে কুপনের ব্যবহার-সংখ্যা অর্ডার বসে যাওয়ার
        // *পরে* আলাদাভাবে বাড়ানো হতো (after() ব্লকে) — ফলে একসাথে দুইটা অর্ডার
        // একই কুপনের max_uses_total-এর শেষ স্লট নিয়ে race করলে দুটোই ডিসকাউন্ট
        // পেয়ে যেত। এখন এখানেই, ডিসকাউন্ট প্রয়োগের আগে, atomic RPC দিয়ে
        // ব্যবহার-সংখ্যা "রিজার্ভ" করা হচ্ছে — সীমা শেষ থাকলে অর্ডারই আটকে যাবে।
        const { data: reserved, error: reserveErr } = await service.rpc('reserve_coupon_usage', {
          p_code: couponRes.code,
        });
        if (reserveErr) {
          logError('[checkout] coupon reserve RPC error — fail-closed for this coupon:', reserveErr.message);
          await revertLegendaryVoucherIfNeeded();
          return fail(t('কুপন প্রয়োগ করা যায়নি, একটু পরে আবার চেষ্টা করুন'));
        }
        if (!reserved) {
          await revertLegendaryVoucherIfNeeded();
          return fail(t('দুঃখিত, এই কুপনটির ব্যবহারসীমা এইমাত্র শেষ হয়ে গেছে'));
        }
        couponReserved = true;
        appliedCouponCode = String(couponRes.code);
        discountAmount = Number(couponRes.discount_amount) || 0;
        if (couponRes.free_shipping === true) {
          sc = 0;
        }
      } else if (couponRes?.error) {
        await revertLegendaryVoucherIfNeeded();
        return fail(t(couponRes.error));
      }
    } catch (e) {
      logWarn('[checkout] coupon validation skipped:', e);
    }
  }

  // কুপন reserve হয়ে যাওয়ার পর অর্ডারটা শেষমেশ (max-total চেক/স্টক-শেষ/ইনসার্ট-
  // ব্যর্থতা) বসাতে না পারলে reserve করা ব্যবহার-সংখ্যা ফেরত দেওয়ার জন্য।
  async function revertCouponIfNeeded() {
    if (!couponReserved || !appliedCouponCode) return;
    try {
      await service.rpc('release_coupon_usage', { p_code: appliedCouponCode });
    } catch (e) {
      logError('[checkout] coupon usage release failed:', e);
    }
  }

  const effectiveProductSubtotal = Math.max(0, vSub - discountAmount);
  const vTotal = Math.max(0, effectiveProductSubtotal + sc);

  if (vTotal > MAX_ONLINE_ORDER_TOTAL && !isPrivilegedUser) {
    await revertCouponIfNeeded();
    await revertLegendaryVoucherIfNeeded();
    return fail(t('২০,০০০ টাকার বেশি অর্ডারের জন্য অনুগ্রহ করে সরাসরি WhatsApp-এ যোগাযোগ করুন'));
  }

  const advanceBreakdown = calculateAdvancePayment(vTotal);
  // 🎖️ Legendary ভাউচার সক্রিয় থাকলে টায়ার/শতাংশ যাই হোক, অগ্রিম ০ —
  // সম্পূর্ণটাই ক্যাশ অন ডেলিভারি।
  const advancePaidAmount = legendaryVoucherReserved ? 0 : advanceBreakdown.totalAdvance;

  const stockItems = cleanItems.map((i) => ({ id: i.id, qty: i.qty }));
  let stockDecremented = false;
  try {
    const { error: stockErr } = await service.rpc('decrement_product_stock', { p_items: stockItems });
    if (stockErr && stockErr.message?.includes('INSUFFICIENT_STOCK')) {
      await revertCouponIfNeeded();
      await revertLegendaryVoucherIfNeeded();
      return fail(t('দুঃখিত, একটি পণ্য স্টকে নেই বা পরিমাণ যথেষ্ট নেই'));
    }
    if (stockErr) {
      // 🛡️ ফিক্স (audit P1-09): আগে এখানে অজানা error (নেটওয়ার্ক/টাইমআউট/RPC
      // অনুপস্থিত) হলে চুপচাপ এগিয়ে যেত এবং স্টক না কমিয়েই অর্ডার বসে যেত
      // (overselling)। এখন fail-closed — বাকি রেট-লিমিট চেকগুলোর মতোই।
      logError('[checkout] stock decrement RPC error — fail-closed:', stockErr.message);
      await revertCouponIfNeeded();
      await revertLegendaryVoucherIfNeeded();
      return fail(GENERIC_RETRY_MSG);
    }
    stockDecremented = true;
  } catch (e) {
    logError('[checkout] stock decrement exception — fail-closed:', e);
    await revertCouponIfNeeded();
    await revertLegendaryVoucherIfNeeded();
    return fail(GENERIC_RETRY_MSG);
  }

  // 🛡️ স্টক কমার পর অর্ডার ইনসার্ট ফেইল করলে stock আটকে না থেকে ফেরত
  // দেওয়ার জন্য — নিচে ব্যর্থ হলে এই ফাংশনটাকে কল করা হবে (ইতিমধ্যে DB-তে
  // থাকা restore_product_stock RPC, একই p_items ফরম্যাট নেয়)
  async function revertStockIfNeeded() {
    if (!stockDecremented) return;
    try {
      await service.rpc('restore_product_stock', { p_items: stockItems });
    } catch (e) {
      logError('[checkout] stock restore after failed order insert also failed:', e);
    }
  }


  let orderNum = `#VC-${Date.now().toString(36).toUpperCase()}`;
  try {
    const { data: counterData, error: counterErr } = await service.rpc('increment_order_counter');
    if (!counterErr && counterData) orderNum = `#VC-${counterData}`;
  } catch {
    // fallback
  }

  let safeTxn = txn || null;
  if (safeTxn && isPrivilegedUser) {
    const { data: existingTxn } = await service
      .from('orders')
      .select('id')
      .eq('payment_txn', safeTxn)
      .limit(1);

    if (existingTxn && existingTxn.length > 0) {
      safeTxn = `${safeTxn}-${Date.now().toString(36).toUpperCase().slice(-3)}`;
    }
  }

  const primaryPayload: Record<string, unknown> = {
    order_num: orderNum,
    created_at: new Date().toISOString(),
    customer_name: name,
    customer_phone: phone,
    customer_district: dist,
    customer_address: addr,
    customer_email: email,
    items: verifiedItems,
    shipping,
    shipping_cost: sc,
    subtotal: vSub,
    total: vTotal,
    discount_amount: discountAmount,
    coupon_code: appliedCouponCode,
    advance_paid: advancePaidAmount,
    payment_txn: safeTxn,
    payment_last4: last4,
    fingerprint_id: fingerprintId || null,
    status: 'pending',
    ...(currentUserId ? { user_id: currentUserId } : {}),
  };

  const insResult = await service.from('orders').insert(primaryPayload).select('id').single();

  if (insResult.error || !insResult.data) {
    logError('[checkout] order insert failed:', insResult.error?.message, '| Code:', insResult.error?.code);
    await revertStockIfNeeded();
    await revertCouponIfNeeded();
    await revertLegendaryVoucherIfNeeded();

    if (insResult.error?.code === '23505') {
      return fail(t('এই ট্রানজেকশন আইডি দিয়ে ইতিমধ্যে একটি অর্ডার হয়েছে'));
    }
    return fail(t('দুঃখিত, অর্ডার সেভ করা যায়নি। আবার চেষ্টা করুন।'));
  }

  // 🎖️ ভাউচার স্থায়ীভাবে ব্যবহৃত হিসেবে মার্ক (is_available ইতিমধ্যে reserve
  // করার সময় false হয়ে গেছে — এখানে শুধু used_at/used_order_id রেকর্ড রাখা)
  if (legendaryVoucherReserved && currentUserId) {
    try {
      await service
        .from('legendary_vouchers')
        .update({ used_at: new Date().toISOString(), used_order_id: insResult.data.id })
        .eq('user_id', currentUserId);
    } catch (e) {
      logError('[checkout] legendary voucher finalize (used_at) failed:', e);
    }
  }

  // 🛡️ ফিক্স (audit P1-18): কুপনের ব্যবহার-সংখ্যা এখন উপরে validate-এর সময়েই
  // atomically reserve হয়ে গেছে (reserve_coupon_usage) — এখানে আবার
  // increment_coupon_usage কল করলে একই অর্ডারে দুইবার গোনা হতো, তাই বাদ।

  after(async () => {
    try {
      await sendTelegramOrderNotification({
        orderNum,
        name,
        phone,
        district: dist,
        address: addr,
        email,
        items: verifiedItems.map((i) => ({ name: i.name, qty: i.qty, price: i.price })),
        total: vTotal,
        advancePaid: advancePaidAmount,
        shippingCost: sc,
        paymentTxn: safeTxn || undefined,
        paymentLast4: last4 || undefined,
      });
    } catch (err) {
      logWarn('[checkout] telegram background notification error:', err);
    }
  });

  return { ok: true, data: { id: insResult.data.id, orderNum } };
}
