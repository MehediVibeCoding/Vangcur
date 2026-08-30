'use server';

import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/serviceClient';
import { fetchCustomProducts } from '@/lib/productData';
import {
  DISTRICTS, getShipOptions, shipPrice, fetchShipConfig,
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
const MAX_QTY_PER_ITEM = 20;
const GENERIC_RETRY_MSG = 'একটু পরে আবার চেষ্টা করুন';
const MODERATOR_EMAIL = 'mehedivibecoding@gmail.com';

function fail(error: string): ActionResponse<CreateOrderResult> {
  return { ok: false, error };
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
  const items = Array.isArray(payload.items) ? payload.items : [];

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

  if (!items.length || items.length > MAX_ITEMS) return fail(t('কার্ট খালি বা অস্বাভাবিক, রিফ্রেশ করে আবার চেষ্টা করুন'));
  const cleanItems: { id: string; qty: number }[] = [];
  for (const raw of items) {
    const id = String(raw?.id ?? '').trim();
    const qty = Number(raw?.qty);
    if (!id || !Number.isInteger(qty) || qty < 1 || qty > MAX_QTY_PER_ITEM) {
      return fail(t('কার্টের একটি আইটেম সঠিক নয়, রিফ্রেশ করে আবার চেষ্টা করুন'));
    }
    cleanItems.push({ id, qty });
  }

  let service;
  try {
    service = createServiceClient();
  } catch (e) {
    logError('[checkout] service client init failed:', e);
    return fail(t('সার্ভার কনফিগারেশন সমস্যা, একটু পরে চেষ্টা করুন'));
  }

  // 🛡️ জিরো-ট্রাস্ট অথেন্টিকেশন ভেরিফিকেশন (Zero-Trust Session Verification)
  // কোনো সাধারণ কাস্টমার ফর্মে মডারেটরের ইমেইল টাইপ করলেও সার্ভার কখনোই বাইপাস দেবে না,
  // শুধুমাত্র ব্রাউজারে ক্রিপ্টোগ্রাফিক সেশন ভেরিফাইড থাকলেই আনলিমিটেড পাওয়ার কার্যকর হবে।
  let currentUserId: string | null = null;
  let isPrivilegedUser = false;

  try {
    const cookieClient = await createClient();
    const { data: userData } = await cookieClient.auth.getUser();
    if (userData?.user) {
      currentUserId = userData.user.id;
      const userEmail = (userData.user.email || '').toLowerCase().trim();
      
      if (userEmail === MODERATOR_EMAIL.toLowerCase()) {
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
    currentUserId = null;
    isPrivilegedUser = false;
  }

  // ১. রেট লিমিট যাচাই (সাধারণ কাস্টমারের জন্য ২৪ ঘণ্টার ৩-অর্ডার গার্ড, মডারেটর/এডমিনের জন্য বাইপাস)
  if (!isPrivilegedUser) {
    try {
      const { data: phoneOk, error: phoneRlErr } = await service.rpc('check_and_set_rate_limit', { p_phone: phone });
      if (phoneRlErr) {
        logError('[checkout] phone rate limit error:', phoneRlErr.message);
        return fail(t(GENERIC_RETRY_MSG));
      }
      if (phoneOk === false) return fail(t('একটু অপেক্ষা করুন, তারপর আবার চেষ্টা করুন'));

      if (fingerprintId) {
        const { data: fpOk, error: fpErr } = await service.rpc('check_and_set_fingerprint_limit', { p_fingerprint_id: fingerprintId });
        if (fpErr) {
          logError('[checkout] fingerprint rate limit error:', fpErr.message);
          return fail(t(GENERIC_RETRY_MSG));
        }
        if (fpOk === false) return fail(t('একটু অপেক্ষা করুন, তারপর আবার চেষ্টা করুন'));
      }
    } catch (e) {
      logError('[checkout] rate limit exception:', e);
      return fail(t(GENERIC_RETRY_MSG));
    }
  }

  // ২. পণ্যের আসল দাম যাচাই
  let authoritativeProds: Awaited<ReturnType<typeof fetchCustomProducts>> = [];
  try {
    authoritativeProds = await fetchCustomProducts(service);
  } catch (e) {
    logWarn('[checkout] authoritative product fetch failed:', e);
  }
  if (!authoritativeProds.length) return fail(t(GENERIC_RETRY_MSG));

  const verifiedItems: { id: string | number; name: string; emoji: string; price: number; qty: number; cat: string }[] = [];
  for (const item of cleanItems) {
    const prod = authoritativeProds.find((p) => String(p.id) === item.id);
    if (!prod) return fail(t('একটি পণ্য আর পাওয়া যাচ্ছে না, পেজ রিফ্রেশ করে আবার চেষ্টা করুন'));
    verifiedItems.push({
      id: prod.id, name: prod.name, emoji: (prod.imgs || ['📦'])[0], price: prod.price, qty: item.qty, cat: prod.cat,
    });
  }

  const shipCfg = await fetchShipConfig(service);
  let sc = shipPrice(shipping, shipCfg);
  const vSub = verifiedItems.reduce((s, i) => s + i.price * i.qty, 0);

  // ৩. সার্ভার-সাইড অথরিটেটিভ কুপন ভ্যালিডেশন
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

      if (couponErr || !couponRes || !couponRes.ok) {
        return fail(t(couponRes?.error || 'কুপন কোডটি সঠিক নয় বা মেয়াদ শেষ'));
      }

      appliedCouponCode = String(couponRes.code);
      discountAmount = Number(couponRes.discount_amount) || 0;
      if (couponRes.free_shipping === true) {
        sc = 0;
      }
    } catch (e) {
      logError('[checkout] coupon validation exception:', e);
      return fail(t('কুপন যাচাই করা যায়নি, আবার চেষ্টা করুন'));
    }
  }

  const effectiveProductSubtotal = Math.max(0, vSub - discountAmount);
  const vTotal = Math.max(0, effectiveProductSubtotal + sc);

  // ২০,০০০ টাকার বেশি অর্ডারের সার্ভার গার্ড (মডারেটর ছাড়া সবার জন্য)
  if (vTotal > MAX_ONLINE_ORDER_TOTAL && !isPrivilegedUser) {
    return fail(t('২০,০০০ টাকার বেশি অর্ডারের জন্য অনুগ্রহ করে সরাসরি WhatsApp-এ যোগাযোগ করুন'));
  }

  // ৩-টায়ার ডায়নামিক অগ্রিম পেমেন্ট হিসাব
  const advanceBreakdown = calculateAdvancePayment(vTotal);
  const advancePaidAmount = advanceBreakdown.totalAdvance;

  // ৪. স্টক হ্রাস
  const stockItems = cleanItems.map((i) => ({ id: i.id, qty: i.qty }));
  try {
    const { error: stockErr } = await service.rpc('decrement_product_stock', { p_items: stockItems });
    if (stockErr) {
      logWarn('[checkout] stock decrement failed:', stockErr.message);
      if (stockErr.message?.includes('INSUFFICIENT_STOCK')) {
        return fail(t('দুঃখিত, একটি পণ্য স্টকে নেই বা পরিমাণ যথেষ্ট নেই'));
      }
      // স্টক ফাংশন না থাকলেও ফেইল-সেফ রাখার চেষ্টা
    }
  } catch (e) {
    logError('[checkout] stock decrement exception:', e);
  }

  let orderNum = `#VC-${Date.now().toString(36).toUpperCase()}`;
  try {
    const { data: counterData, error: counterErr } = await service.rpc('increment_order_counter');
    if (!counterErr && counterData) orderNum = `#VC-${counterData}`;
  } catch {
    // fallback
  }

  // ৫. অর্ডার ইনসার্ট (টেস্টিংয়ের সময় মডারেটরের ব্যবহৃত TxnID ডুপ্লিকেট কনফ্লিক্ট বাইপাস)
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

  const { data: insData, error: insErr } = await service
    .from('orders')
    .insert({
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
    })
    .select('id')
    .single();

  if (insErr || !insData) {
    logError('[checkout] order insert failed:', insErr?.message);
    try {
      await service.rpc('restore_product_stock', { p_items: stockItems });
    } catch (e) {
      logError('[checkout] stock restore after failed insert failed:', e);
    }
    if (insErr?.code === '23505') return fail(t('এই ট্রানজেকশন আইডি দিয়ে ইতিমধ্যে একটি অর্ডার হয়েছে'));
    return fail(t('দুঃখিত, অর্ডার সেভ করা যায়নি। আবার চেষ্টা করুন।'));
  }

  // ৬. কুপন ব্যবহৃত কাউন্ট বৃদ্ধি
  if (appliedCouponCode) {
    service
      .rpc('increment_coupon_usage', { p_code: appliedCouponCode })
      .then(({ error: incErr }) => {
        if (incErr) logWarn('[checkout] increment_coupon_usage failed:', incErr.message);
      });
  }

  // ৭. টেলিগ্রাম নোটিফিকেশন পাঠানো
  sendTelegramOrderNotification({
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
  }).catch((err) => {
    logWarn('[checkout] telegram notification error:', err);
  });

  return { ok: true, data: { id: insData.id, orderNum } };
}
