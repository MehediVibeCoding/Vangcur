'use server';

import { createServiceClient } from '@/lib/supabase/serviceClient';
import { createClient } from '@/lib/supabase/server';
import { logWarn } from '@/lib/logger';
import type { CouponValidationResult } from '@/lib/couponData';
import { MEMBERSHIP_TIERS } from '@/lib/membershipData';

/**
 * কুপন যাচাই — service-role ক্লায়েন্ট দিয়ে সার্ভার-সাইডে চলে।
 * (আগে ক্লায়েন্ট থেকে সরাসরি anon key দিয়ে `validate_and_apply_coupon` RPC কল হতো —
 * যে কেউ সরাসরি Supabase REST API কল করে এলোমেলো কোড ট্রাই করতে পারত, DB
 * ফাংশনে anon/authenticated EXECUTE revoke করার পর এই রুট ছাড়া আর কোনো পথ নেই।)
 */
export async function validateCouponAction(
  code: string,
  subtotal: number,
  phone?: string | null,
  userId?: string | null,
  fingerprintId?: string | null,
): Promise<CouponValidationResult> {
  const cleanCode = (code || '').trim().toUpperCase();
  if (!cleanCode) {
    return { ok: false, error: 'অনুগ্রহ করে একটি কুপন কোড লিখুন' };
  }

  try {
    // ইউজার আইডি ক্লায়েন্টের পাঠানো মান থেকে নয়, লগইন সেশন থেকে নেওয়া হয় —
    // মেম্বারশিপ-লেভেলের কুপন যাচাইয়ে এটাই একমাত্র বিশ্বস্ত পরিচয়।
    const cookieClient = await createClient();
    const { data: userData } = await cookieClient.auth.getUser();
    const sessionUserId = userData?.user?.id ?? null;

    const supabase = createServiceClient();
    const { data, error } = await supabase.rpc('validate_and_apply_coupon', {
      p_code: cleanCode,
      p_subtotal: Number(subtotal) || 0,
      p_phone: phone ? phone.trim() : null,
      p_user_id: sessionUserId,
      p_fingerprint_id: fingerprintId ? fingerprintId.trim() : null,
    });

    if (error || !data) {
      logWarn('[Vangcur] validate_and_apply_coupon RPC error:', error?.message);
      return { ok: false, error: 'কুপন যাচাই করা সম্ভব হয়নি' };
    }

    if (!data.ok) {
      return { ok: false, error: data.error || 'অবৈধ কুপন কোড' };
    }

    return {
      ok: true,
      coupon: {
        code: data.code,
        discountType: data.discount_type,
        discountValue: Number(data.discount_value),
        discountAmount: Number(data.discount_amount),
        freeShipping: !!data.free_shipping,
        minOrderAmount: Number(data.min_order_amount) || 0,
      },
    };
  } catch (e) {
    logWarn('[Vangcur] validate_and_apply_coupon exception:', e);
    return { ok: false, error: 'নেটওয়ার্ক সমস্যা। আবার চেষ্টা করুন।' };
  }
}

/**
 * মেম্বারশিপ মডালে লেভেল-কুপনের আসল কোড দেখানোর জন্য — কোড ক্লায়েন্ট বান্ডেলে
 * হার্ডকোড করা নেই; সার্ভার লগইন সেশন থেকে ইউজারের ডেলিভার্ড অর্ডার গুনে
 * লেভেল মিললে তবেই কোড ফেরত দেয়।
 */
export async function getTierCouponCodeAction(
  tierKey: string,
): Promise<{ ok: boolean; code?: string }> {
  const tier = MEMBERSHIP_TIERS.find((t) => t.key === tierKey);
  if (!tier || tier.min <= 0) return { ok: false };

  try {
    const cookieClient = await createClient();
    const { data: userData } = await cookieClient.auth.getUser();
    const uid = userData?.user?.id;
    if (!uid) return { ok: false };

    const service = createServiceClient();
    const { count } = await service
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', uid)
      .eq('status', 'delivered');
    if ((count ?? 0) < tier.min) return { ok: false };

    const { data } = await service
      .from('coupons')
      .select('code, expires_at')
      .eq('required_tier', tierKey)
      .eq('is_active', true)
      .order('created_at', { ascending: true });

    const now = Date.now();
    const row = (data || []).find((c) => !c.expires_at || new Date(c.expires_at).getTime() > now);
    return row ? { ok: true, code: row.code as string } : { ok: false };
  } catch (e) {
    logWarn('[Vangcur] getTierCouponCodeAction exception:', e);
    return { ok: false };
  }
}
