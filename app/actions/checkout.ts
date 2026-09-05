'use server';

import { after } from 'next/server';
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
const MODERATOR_EMAIL = 'mehedivibecoding@gmail.com';

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

  const hasTxn = !!txn;
  const hasLast4 = !!last4;
  if (!hasTxn && !hasLast4) return fail(t('Transaction ID অথবা শেষ ৪ ডিজিট দিন'));
  if (hasTxn && !validateTxnId(txn)) return fail(t('সঠিক বিকাশ ট্রানজেকশন আইডি দিন'));
  if (hasLast4 && !/^\d{4}$/.test(last4)) return fail(t('সঠিক শেষ ৪ ডিজিট দিন'));

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

  let service;
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
      const verifiedUserEmail = (userData.user.email || '').toLowerCase().trim();
      
      if (verifiedUserEmail === MODERATOR_EMAIL.toLowerCase()) {
        isPrivilegedUser = true;
      } else {
        const { data: profile } = await service
          .from('profiles')
          .select('is_admin, role')
          .eq('id', userData.user.id)
          .maybeSingle();

        if (profile?.is_admin === true || ['admin', 'super_admin', 'moderator'].includes(profile?.role)) {
          isPrivilegedUser = true;
        }
      }
    }
  } catch {
    // ignore
  }

  if (!isPrivilegedUser) {
    try {
      const { data: phoneOk, error: phoneRlErr } = await service.rpc('check_and_set_rate_limit', { p_phone: phone });
      if (phoneRlErr) {
        logWarn('[checkout] phone rate limit error:', phoneRlErr.message);
      } else if (phoneOk === false) {
        return fail(t('একটু অপেক্ষা করুন, তারপর আবার চেষ্টা করুন'));
      }

      if (fingerprintId) {
        const { data: fpOk, error: fpErr } = await service.rpc('check_and_set_fingerprint_limit', { p_fingerprint_id: fingerprintId });
        if (fpErr) {
          logWarn('[checkout] fingerprint rate limit error:', fpErr.message);
        } else if (fpOk === false) {
          return fail(t('একটু অপেক্ষা করুন, তারপর আবার চেষ্টা করুন'));
        }
      }
    } catch (e) {
      logWarn('[checkout] rate limit exception:', e);
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

  if (!authoritativeProds.length) return fail(t(GENERIC_RETRY_MSG));

  const verifiedItems: { id: string | number; name: string; emoji: string; price: number; qty: number; cat: string }[] = [];
  for (const item of cleanItems) {
    const prod = authoritativeProds.find((p) => String(p.id) === item.id);
    if (!prod) return fail(t('একটি পণ্য আর পাওয়া যাচ্ছে না, পেজ রিফ্রেশ করে আবার চেষ্টা করুন'));
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

  if (couponCode) {
    try {
      const { data: couponRes, error: couponErr } = await service.rpc('validate_and_apply_coupon', {
        p_code: couponCode,
        p_subtotal: vSub,
        p_phone: phone,
        p_user_id: currentUserId,
      });

      if (!couponErr && couponRes && couponRes.ok) {
        appliedCouponCode = String(couponRes.code);
        discountAmount = Number(couponRes.discount_amount) || 0;
        if (couponRes.free_shipping === true) {
          sc = 0;
        }
      } else if (couponRes?.error) {
        return fail(t(couponRes.error));
      }
    } catch (e) {
      logWarn('[checkout] coupon validation skipped:', e);
    }
  }

  const effectiveProductSubtotal = Math.max(0, vSub - discountAmount);
  const vTotal = Math.max(0, effectiveProductSubtotal + sc);

  if (vTotal > MAX_ONLINE_ORDER_TOTAL && !isPrivilegedUser) {
    return fail(t('২০,০০০ টাকার বেশি অর্ডারের জন্য অনুগ্রহ করে সরাসরি WhatsApp-এ যোগাযোগ করুন'));
  }

  const advanceBreakdown = calculateAdvancePayment(vTotal);
  const advancePaidAmount = advanceBreakdown.totalAdvance;

  const stockItems = cleanItems.map((i) => ({ id: i.id, qty: i.qty }));
  try {
    const { error: stockErr } = await service.rpc('decrement_product_stock', { p_items: stockItems });
    if (stockErr && stockErr.message?.includes('INSUFFICIENT_STOCK')) {
      return fail(t('দুঃখিত, একটি পণ্য স্টকে নেই বা পরিমাণ যথেষ্ট নেই'));
    }
  } catch (e) {
    logWarn('[checkout] stock decrement skipped:', e);
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

  let insResult = await service.from('orders').insert(primaryPayload).select('id').single();

  if (insResult.error && insResult.error.code === '42703') {
    logWarn('[checkout] Missing optional columns in DB schema, falling back to core fields...');
    const fallbackPayload: Record<string, unknown> = {
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
      payment_txn: safeTxn,
      payment_last4: last4,
      status: 'pending',
      ...(currentUserId ? { user_id: currentUserId } : {}),
    };
    insResult = await service.from('orders').insert(fallbackPayload).select('id').single();
  }

  if (insResult.error || !insResult.data) {
    logError('[checkout] order insert failed:', insResult.error?.message, '| Code:', insResult.error?.code);
    
    if (insResult.error?.code === '23505') {
      return fail(t('এই ট্রানজেকশন আইডি দিয়ে ইতিমধ্যে একটি অর্ডার হয়েছে'));
    }
    return fail(t('দুঃখিত, অর্ডার সেভ করা যায়নি। আবার চেষ্টা করুন।'));
  }

  after(async () => {
    if (appliedCouponCode) {
      try {
        await service.rpc('increment_coupon_usage', { p_code: appliedCouponCode });
      } catch (e) {
        logWarn('[checkout] increment_coupon_usage failed:', e);
      }
    }

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
