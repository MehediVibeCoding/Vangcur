'use server';

import { createServiceClient } from '@/lib/supabase/serviceClient';
import { logWarn } from '@/lib/logger';
import type { CouponValidationResult } from '@/lib/couponData';

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
    const supabase = createServiceClient();
    const { data, error } = await supabase.rpc('validate_and_apply_coupon', {
      p_code: cleanCode,
      p_subtotal: Number(subtotal) || 0,
      p_phone: phone ? phone.trim() : null,
      p_user_id: userId ? userId.trim() : null,
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
