// [NEW FILE] ফাইলের পাথ: lib/couponData.ts
import { validateCouponAction } from '@/app/actions/coupon';

export const COUPON_CHANGE_EVENT = 'vc:couponChange';
const COUPON_STORAGE_KEY = 'vc_applied_coupon';

export interface AppliedCoupon {
  code: string;
  discountType: 'fixed' | 'percent' | 'free_shipping';
  discountValue: number;
  discountAmount: number;
  freeShipping: boolean;
  minOrderAmount: number;
}

export interface CouponValidationResult {
  ok: boolean;
  coupon?: AppliedCoupon;
  error?: string;
}

/**
 * ব্রাউজার সেশন থেকে বর্তমানে অ্যাপ্লাই করা কুপন রিড করা
 */
export function getAppliedCoupon(): AppliedCoupon | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(COUPON_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * কুপন সফলভাবে অ্যাপ্লাই হলে সংরক্ষণ ও গ্লোবাল ইভেন্ট ডিসপ্যাচ
 */
export function saveAppliedCoupon(coupon: AppliedCoupon): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(COUPON_STORAGE_KEY, JSON.stringify(coupon));
    window.dispatchEvent(new CustomEvent(COUPON_CHANGE_EVENT, { detail: { coupon } }));
  } catch {
    // ignore
  }
}

/**
 * কুপন রিমুভ / বাতিল করা
 */
export function removeAppliedCoupon(): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(COUPON_STORAGE_KEY);
    window.dispatchEvent(new CustomEvent(COUPON_CHANGE_EVENT, { detail: { coupon: null } }));
  } catch {
    // ignore
  }
}

/**
 * Supabase RPC কল করে কুপন কোড ও শর্তাবলী নিখুঁতভাবে যাচাই করা
 */
export async function validateCoupon(
  code: string,
  subtotal: number,
  phone?: string,
  userId?: string | null,
  fingerprintId?: string | null,
): Promise<CouponValidationResult> {
  const cleanCode = (code || '').trim().toUpperCase();
  if (!cleanCode) {
    return { ok: false, error: 'অনুগ্রহ করে একটি কুপন কোড লিখুন' };
  }

  try {
    return await validateCouponAction(cleanCode, subtotal, phone, userId, fingerprintId);
  } catch (err: any) {
    return { ok: false, error: err?.message || 'নেটওয়ার্ক সমস্যা। আবার চেষ্টা করুন।' };
  }
}

/**
 * কার্টে পণ্যের পরিমাণ বাড়লে/কমলে স্বয়ংক্রিয়ভাবে ডিসকাউন্ট পুনঃহিসাব করা
 */
export function recalculateDiscount(
  coupon: AppliedCoupon | null,
  currentSubtotal: number,
): { discountAmount: number; isValid: boolean; reason?: string } {
  if (!coupon) {
    return { discountAmount: 0, isValid: true };
  }

  // মিনিমাম অর্ডারের শর্ত এখনও পূরণ হচ্ছে কি না
  if (coupon.minOrderAmount > 0 && currentSubtotal < coupon.minOrderAmount) {
    return {
      discountAmount: 0,
      isValid: false,
      reason: `এই কুপনের জন্য সর্বনিম্ন ৳${coupon.minOrderAmount} টাকার অর্ডার প্রয়োজন`,
    };
  }

  let discount = 0;
  if (coupon.discountType === 'fixed') {
    discount = Math.min(coupon.discountValue, currentSubtotal);
  } else if (coupon.discountType === 'percent') {
    discount = Math.round(currentSubtotal * (coupon.discountValue / 100));
    // শতাংশের ক্যাপ হিসাব
    if (coupon.discountAmount && discount > coupon.discountAmount) {
      discount = coupon.discountAmount;
    }
    discount = Math.min(discount, currentSubtotal);
  } else if (coupon.discountType === 'free_shipping') {
    discount = 0; // শিপিং চার্জে কাটবে
  }

  return { discountAmount: discount, isValid: true };
      }
