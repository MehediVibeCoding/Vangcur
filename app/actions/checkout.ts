'use server';

import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/serviceClient';
import { fetchCustomProducts } from '@/lib/productData';
import {
  DISTRICTS, getShipOptions, shipPrice, fetchShipConfig,
  validatePhone, validateAddress, validateEmail, validateTxnId,
} from '@/lib/checkoutData';
import {
  sanitizePlainName, validateName, MAX_NAME_LEN,
  sanitizeEmailInput, sanitizeAddressInput, MAX_ADDR_LEN,
} from '@/lib/security';
import { logWarn, logError } from '@/lib/logger';
import { staticDictionary } from '@/lib/i18n/dictionary';
import type { ActionResponse, CreateOrderResult, OrderPayload } from '@/types';

const MAX_ITEMS = 30;
const MAX_QTY_PER_ITEM = 20;
const GENERIC_RETRY_MSG = 'একটু পরে আবার চেষ্টা করুন';

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
  const sc = shipPrice(shipping, shipCfg);
  const vSub = verifiedItems.reduce((s, i) => s + i.price * i.qty, 0);
  const vTotal = vSub + sc;

  const stockItems = cleanItems.map((i) => ({ id: i.id, qty: i.qty }));
  try {
    const { error: stockErr } = await service.rpc('decrement_product_stock', { p_items: stockItems });
    if (stockErr) {
      logWarn('[checkout] stock decrement failed:', stockErr.message);
      if (stockErr.message?.includes('INSUFFICIENT_STOCK')) {
        return fail(t('দুঃখিত, একটি পণ্য স্টকে নেই বা পরিমাণ যথেষ্ট নেই'));
      }
      return fail(t('স্টক যাচাই করা যায়নি, আবার চেষ্টা করুন'));
    }
  } catch (e) {
    logError('[checkout] stock decrement exception:', e);
    return fail(t('স্টক যাচাই করা যায়নি, আবার চেষ্টা করুন'));
  }

  let orderNum = `#VC-${Date.now().toString(36).toUpperCase()}`;
  try {
    const { data: counterData, error: counterErr } = await service.rpc('increment_order_counter');
    if (!counterErr && counterData) orderNum = `#VC-${counterData}`;
  } catch {
    // fallback value already set above
  }

  let currentUserId: string | null = null;
  try {
    const cookieClient = await createClient();
    const { data: userData } = await cookieClient.auth.getUser();
    currentUserId = userData?.user?.id || null;
  } catch {
    currentUserId = null;
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
      payment_txn: txn || null,
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
      logError('[checkout] stock restore after failed insert also failed:', e);
    }
    if (insErr?.code === '23505') return fail(t('এই ট্রানজেকশন আইডি দিয়ে ইতিমধ্যে একটি অর্ডার হয়েছে'));
    return fail(t('দুঃখিত, অর্ডার সেভ করা যায়নি। আবার চেষ্টা করুন।'));
  }

  return { ok: true, data: { id: insData.id, orderNum } };
}
