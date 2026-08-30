// [REPLACE] ফাইলের পাথ: app/components/cart/QuickOrderModal.tsx
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore, cartTotal, cartCount } from '@/lib/store/cartStore';
import { useAuthStore } from '@/lib/store/authStore';
import { lockBody, unlockBody } from '@/lib/bodyScrollLock';
import { optimizeCloudinaryUrl } from '@/lib/cloudinaryUrl';
import { OPEN_QUICK_CART_MODAL_EVENT, OPEN_BULK_ORDER_EVENT } from '@/lib/uiEvents';
import { MAX_ONLINE_ORDER_TOTAL } from '@/lib/checkoutData';
import { fetchCustomProducts } from '@/lib/productData';
import { createClient } from '@/lib/supabase/client';
import { showToast } from '@/lib/toast';
import { useT } from '@/lib/i18n/useT';
import {
  getAppliedCoupon,
  saveAppliedCoupon,
  removeAppliedCoupon,
  validateCoupon,
  recalculateDiscount,
  COUPON_CHANGE_EVENT,
  type AppliedCoupon,
} from '@/lib/couponData';
import type { Product } from '@/types';

function CartItemThumb({ emoji }: { emoji?: string }) {
  const isUrl = typeof emoji === 'string' && (emoji.startsWith('http://') || emoji.startsWith('https://'));
  if (isUrl) {
    return (
      <img
        src={optimizeCloudinaryUrl(emoji, 120)}
        alt=""
        className="h-12 w-12 shrink-0 rounded-xl border border-white/80 bg-white object-cover shadow-xs"
        loading="lazy"
        decoding="async"
      />
    );
  }
  return (
    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/80 bg-white/90 text-2xl shadow-xs">
      {emoji || '📦'}
    </span>
  );
}

function TrashIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
  );
}

function CouponSvgIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-brand-light">
      <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2 2z" />
      <line x1="12" y1="9" x2="12" y2="15" strokeDasharray="2 2" />
    </svg>
  );
}

function HeaderDecor() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden text-brand-light/[0.14]">
      <svg width="34" height="34" className="absolute -left-1 top-2 -rotate-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 13a8 8 0 0 1 16 0" />
        <rect x="3" y="13" width="4" height="6" rx="1.5" />
        <rect x="17" y="13" width="4" height="6" rx="1.5" />
      </svg>
      <svg width="26" height="26" className="absolute right-14 top-3 rotate-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <rect x="7" y="2.5" width="10" height="15" rx="3" />
        <path d="M10 5.5h4" />
        <circle cx="12" cy="20" r="1.6" />
      </svg>
    </div>
  );
}

export default function QuickOrderModal() {
  const { t, lang } = useT();
  const router = useRouter();
  const supabase = useRef(createClient()).current;
  const currentUser = useAuthStore((s) => s.currentUser);

  const [open, setOpen] = useState(false);
  const cart = useCartStore((s) => s.cart);
  const prodsRef = useRef<Product[]>([]);

  // কুপন স্টেট
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);

  useEffect(() => {
    fetchCustomProducts(supabase).then((prods) => {
      if (prods.length) prodsRef.current = prods;
    });
  }, [supabase]);

  useEffect(() => {
    setAppliedCoupon(getAppliedCoupon());
    const onCouponChange = (e: Event) => {
      const c = (e as CustomEvent<{ coupon: AppliedCoupon | null }>).detail?.coupon;
      setAppliedCoupon(c || null);
    };
    window.addEventListener(COUPON_CHANGE_EVENT, onCouponChange);
    return () => window.removeEventListener(COUPON_CHANGE_EVENT, onCouponChange);
  }, []);

  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener(OPEN_QUICK_CART_MODAL_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_QUICK_CART_MODAL_EVENT, onOpen);
  }, []);

  useEffect(() => {
    if (open) lockBody();
    else unlockBody();
    return () => unlockBody();
  }, [open]);

  useEffect(() => {
    if (open && cart.length === 0) {
      setOpen(false);
    }
  }, [open, cart.length]);

  const handleQty = (id: number | string, delta: number) => {
    const res = useCartStore.getState().updateQty(prodsRef.current, id, delta);
    if (!res.ok && res.reason === 'stock') {
      showToast(t(`সর্বোচ্চ স্টক সীমায় পৌঁছে গেছে ({count}টি)`).replace('{count}', String(res.maxStock)));
    }
  };

  const handleRemove = (id: number | string) => {
    useCartStore.getState().removeItem(id);
    showToast(t('কার্ট থেকে সরানো হয়েছে'));
  };

  const subtotal = cartTotal(cart);
  const totalCount = cartCount(cart);

  // কুপন ডিসকাউন্ট রিক্যালকুলেশন
  const { discountAmount, isValid: isCouponStillValid, reason: couponInvalidReason } = useMemo(() => {
    return recalculateDiscount(appliedCoupon, subtotal);
  }, [appliedCoupon, subtotal]);

  useEffect(() => {
    if (appliedCoupon && (!cart.length || (!isCouponStillValid && couponInvalidReason))) {
      removeAppliedCoupon();
      if (cart.length && couponInvalidReason) {
        showToast(couponInvalidReason);
      }
    }
  }, [cart.length, appliedCoupon, isCouponStillValid, couponInvalidReason]);

  // কুপন অ্যাপ্লাই হ্যান্ডলার
  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = couponCode.trim().toUpperCase();
    if (!clean) {
      showToast(lang === 'en' ? 'Enter a coupon code' : 'কুপন কোড লিখুন');
      return;
    }

    if (subtotal <= 0) {
      showToast(lang === 'en' ? 'Add products to cart first' : 'প্রথমে কার্টে পণ্য যোগ করুন');
      return;
    }

    setCouponLoading(true);
    const res = await validateCoupon(supabase, clean, subtotal, currentUser?.phone, currentUser?.id);
    setCouponLoading(false);

    if (!res.ok || !res.coupon) {
      showToast(res.error || (lang === 'en' ? 'Invalid coupon code' : 'কুপন কোডটি সঠিক নয়'));
      return;
    }

    saveAppliedCoupon(res.coupon);
    setCouponCode('');
    showToast(lang === 'en' ? `Coupon "${res.coupon.code}" applied successfully!` : `কুপন "${res.coupon.code}" সফলভাবে যুক্ত হয়েছে!`);
  };

  const handleRemoveCoupon = () => {
    removeAppliedCoupon();
    showToast(lang === 'en' ? 'Coupon removed' : 'কুপন সরানো হয়েছে');
  };

  const finalTotal = Math.max(0, subtotal - discountAmount);

  const handleConfirmOrder = () => {
    // 🛡️ ২০,০০০ টাকার বেশি বিল হলে সরাসরি বাল্ক অর্ডার মডাল ওপেন
    if (finalTotal > MAX_ONLINE_ORDER_TOTAL) {
      setOpen(false);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent(OPEN_BULK_ORDER_EVENT, { detail: { total: finalTotal } }));
      }
      return;
    }

    try {
      sessionStorage.removeItem('vc_quick_order_items');
    } catch {
      // ignore
    }
    setOpen(false);
    router.push('/checkout');
  };

  if (!open || cart.length === 0) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[975] bg-ink/55 backdrop-blur-[3px] transition-opacity duration-brand"
        onClick={() => setOpen(false)}
      />

      {/* Modal / Bottom Sheet */}
      <div className="fixed inset-x-0 bottom-0 z-[980] mx-auto flex max-h-[90vh] w-full max-w-[440px] flex-col overflow-hidden rounded-t-[28px] bg-gradient-to-b from-brand-bg via-[#DCEBFD] to-white shadow-sh3 transition-all duration-300 ease-brand sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2 sm:rounded-[28px]">
        {/* Header */}
        <div className="relative shrink-0 overflow-hidden border-b border-ink/10 px-6 pb-3.5 pt-5 text-left">
          <HeaderDecor />
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <h3 className="font-body text-[17px] font-extrabold text-ink">
                🛒 {lang === 'en' ? 'Shopping Cart' : 'শপিং কার্ট'}
              </h3>
              <p className="mt-0.5 font-body text-[12px] font-semibold text-muted">
                {lang === 'en'
                  ? `${totalCount} item(s) selected`
                  : `${totalCount}টি প্রোডাক্ট নির্বাচিত`}
              </p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-white/60 bg-white/80 text-ink/60 shadow-sh1 backdrop-blur-[8px] transition-brand hover:bg-white hover:text-ink focus-visible:outline-none"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content List */}
        <div className="flex-1 overflow-y-auto px-6 py-3.5 space-y-3.5">
          {cart.map((item) => (
            <div
              key={item.id}
              className="flex items-start gap-3.5 pb-3.5 border-b border-ink/10"
            >
              <CartItemThumb emoji={item.emoji} />

              <div className="min-w-0 flex-1">
                <div className="line-clamp-1 font-body text-[13.5px] font-bold text-ink">
                  {item.name}
                </div>
                <div className="mt-0.5 font-body text-[12px] text-muted">
                  ৳{item.price.toLocaleString('en-US')} / {lang === 'en' ? 'Pcs' : 'পিছ'}
                </div>

                <div className="mt-2.5 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleQty(item.id, -1)}
                    className="flex h-6 w-6 items-center justify-center rounded-full border border-ink/25 bg-transparent font-body text-xs font-bold text-ink transition-brand hover:border-ink active:scale-90"
                    aria-label="Decrease"
                  >
                    −
                  </button>
                  <span className="min-w-[18px] text-center font-body text-xs font-bold text-ink">
                    {item.qty}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleQty(item.id, 1)}
                    className="flex h-6 w-6 items-center justify-center rounded-full border border-ink/25 bg-transparent font-body text-xs font-bold text-ink transition-brand hover:border-ink active:scale-90"
                    aria-label="Increase"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="flex flex-col items-end justify-between self-stretch pl-1">
                <div className="font-body text-[14px] font-bold text-ink">
                  ৳{(item.price * item.qty).toLocaleString('en-US')}
                </div>
                <button
                  type="button"
                  onClick={() => handleRemove(item.id)}
                  title={t('সরান')}
                  className="mt-2 flex h-7 w-7 items-center justify-center rounded-lg bg-transparent text-muted/40 transition-colors hover:bg-red-50 hover:text-red-500 active:scale-90"
                >
                  <TrashIcon />
                </button>
              </div>
            </div>
          ))}

          {/* কুপন সেকশন */}
          <div className="pt-0.5">
            {appliedCoupon && (
              <div className="mb-2.5 flex items-center justify-between font-body text-[13px] font-bold text-muted px-0.5">
                <span>{lang === 'en' ? 'Subtotal' : 'সাবটোটাল'}:</span>
                <span>৳{subtotal.toLocaleString('en-US')}</span>
              </div>
            )}

            {appliedCoupon ? (
              <div className="flex items-center justify-between rounded-[12px] border border-emerald-300/80 bg-emerald-50/80 px-3.5 py-2.5 shadow-xs">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white shadow-xs">
                    ✓
                  </span>
                  <div>
                    <div className="font-body text-[12.5px] font-bold text-emerald-800">
                      {appliedCoupon.code}
                    </div>
                    <div className="font-body text-[11px] font-medium text-emerald-700">
                      {appliedCoupon.freeShipping
                        ? (lang === 'en' ? 'Free Delivery Applied' : 'ফ্রি ডেলিভারি প্রযোজ্য')
                        : `${lang === 'en' ? 'Discount:' : 'ছাড়:'} -৳${discountAmount.toLocaleString('en-US')}`}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveCoupon}
                  className="rounded-full bg-emerald-100 p-1 text-xs font-bold text-emerald-700 hover:bg-emerald-200 transition-colors"
                  title={lang === 'en' ? 'Remove coupon' : 'কুপন মুছুন'}
                >
                  ✕
                </button>
              </div>
            ) : (
              <div>
                <div className="mb-2 flex items-center gap-1.5 font-body text-[12px] font-bold text-ink">
                  <CouponSvgIcon />
                  <span>{lang === 'en' ? 'Insert coupon' : 'কুপন কোড'}</span>
                </div>

                <form onSubmit={handleApplyCoupon} className="relative flex items-center">
                  <input
                    type="text"
                    value={couponCode}
                    onFocus={() => setIsInputFocused(true)}
                    onBlur={() => setIsInputFocused(false)}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder={lang === 'en' ? 'Coupon' : 'কুপন কোড লিখুন...'}
                    className="w-full rounded-[10px] border border-ink/20 bg-transparent py-2.5 pl-3.5 pr-20 font-body text-xs uppercase text-ink outline-none transition-brand placeholder:text-muted/60 focus:border-brand-light"
                  />
                  <button
                    type="submit"
                    disabled={couponLoading}
                    className={`absolute right-3.5 top-1/2 -translate-y-1/2 font-body text-[12.5px] font-bold text-brand-light transition-opacity active:scale-95 ${
                      isInputFocused && !couponCode.trim() ? 'opacity-40' : 'opacity-100'
                    }`}
                  >
                    {couponLoading
                      ? (lang === 'en' ? 'Applying...' : 'যাচাই...')
                      : (lang === 'en' ? 'Apply' : 'প্রয়োগ')}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="shrink-0 px-6 pb-6 pt-3">
          <div className="mb-4 flex items-center justify-between px-2">
            <span className="font-body text-[13.5px] font-bold text-muted">
              {t('মোট')}:
            </span>
            <span className="font-body text-[18px] font-extrabold text-brand-light">
              ৳{finalTotal.toLocaleString('en-US')}
            </span>
          </div>

          <button
            onClick={handleConfirmOrder}
            className="w-full rounded-full bg-gradient-to-r from-info to-brand-light py-[13.5px] font-body text-[15px] font-bold text-white shadow-sh2 transition-brand duration-brand hover:brightness-[1.03] active:scale-95"
          >
            {lang === 'en' ? 'Confirm Order' : 'অর্ডার নিশ্চিত করুন'}
          </button>
        </div>
      </div>
    </>
  );
}
