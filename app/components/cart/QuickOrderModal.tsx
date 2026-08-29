'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore, cartTotal, cartCount } from '@/lib/store/cartStore';
import { lockBody, unlockBody } from '@/lib/bodyScrollLock';
import { optimizeCloudinaryUrl } from '@/lib/cloudinaryUrl';
import { OPEN_QUICK_CART_MODAL_EVENT } from '@/lib/uiEvents';
import { fetchCustomProducts } from '@/lib/productData';
import { createClient } from '@/lib/supabase/client';
import { showToast } from '@/lib/toast';
import { useT } from '@/lib/i18n/useT';
import type { Product } from '@/types';

function CartItemThumb({ emoji }: { emoji?: string }) {
  const isUrl = typeof emoji === 'string' && (emoji.startsWith('http://') || emoji.startsWith('https://'));
  if (isUrl) {
    return (
      <img
        src={optimizeCloudinaryUrl(emoji, 120)}
        alt=""
        className="h-12 w-12 shrink-0 rounded-[12px] border border-white/80 bg-white object-cover shadow-xs"
        loading="lazy"
        decoding="async"
      />
    );
  }
  return (
    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[12px] border border-white/80 bg-white/80 text-2xl shadow-xs">
      {emoji || '📦'}
    </span>
  );
}

function TrashIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 7h16" />
      <path d="M9.5 7V5.2A1.2 1.2 0 0 1 10.7 4h2.6a1.2 1.2 0 0 1 1.2 1.2V7" />
      <path d="M6.5 7 7.3 19a2 2 0 0 0 2 1.9h5.4a2 2 0 0 0 2-1.9L17.5 7" />
      <path d="M10.2 11v6M13.8 11v6" />
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
      <svg width="26" height="26" className="absolute right-12 top-3 rotate-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
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
  const [open, setOpen] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const cart = useCartStore((s) => s.cart);
  const prodsRef = useRef<Product[]>([]);

  useEffect(() => {
    fetchCustomProducts(supabase).then((prods) => {
      if (prods.length) prodsRef.current = prods;
    });
  }, [supabase]);

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

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) {
      showToast(lang === 'en' ? 'Enter a coupon code' : 'কুপন কোড লিখুন');
      return;
    }
    // কুপন লজিকের প্রাথমিক প্লেসহোল্ডার টোস্ট
    showToast(lang === 'en' ? 'Coupon verification is in progress...' : 'কুপন কোড যাচাই করা হচ্ছে...');
  };

  const handleConfirmOrder = () => {
    try {
      sessionStorage.removeItem('vc_quick_order_items');
    } catch {
      // ignore
    }
    setOpen(false);
    router.push('/checkout');
  };

  if (!open || cart.length === 0) return null;

  const total = cartTotal(cart);
  const totalCount = cartCount(cart);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[975] bg-ink/55 backdrop-blur-[3px] transition-opacity duration-brand"
        onClick={() => setOpen(false)}
      />

      {/* Modal / Bottom Sheet with LoginModal-style Background Gradient */}
      <div className="fixed inset-x-0 bottom-0 z-[980] mx-auto flex max-h-[88vh] w-full max-w-[480px] flex-col overflow-hidden rounded-t-[28px] bg-gradient-to-b from-brand-bg via-[#DCEBFD] to-white shadow-sh3 transition-all duration-300 ease-brand sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2 sm:rounded-[28px]">
        {/* Header with Line-Art Decor */}
        <div className="relative overflow-hidden border-b border-white/60 px-5 pb-3.5 pt-4 text-left">
          <HeaderDecor />
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <h3 className="font-body text-base font-bold text-ink">
                🛒 {lang === 'en' ? 'Shopping Cart' : 'শপিং কার্ট'}
              </h3>
              <p className="mt-0.5 font-body text-[11.5px] font-semibold text-muted">
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

        {/* Scrollable Cart Items */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {cart.map((item) => (
            <div
              key={item.id}
              className="flex items-start gap-3 rounded-[16px] border border-white/80 bg-white/90 p-3 shadow-xs backdrop-blur-sm transition-brand hover:border-brand-light/30"
            >
              <CartItemThumb emoji={item.emoji} />

              {/* Title, Unit Price & Minimalist Quantity Adjuster */}
              <div className="min-w-0 flex-1">
                <div className="truncate font-body text-[13px] font-bold text-ink">
                  {item.name}
                </div>
                <div className="mt-0.5 font-body text-[11.5px] font-semibold text-muted">
                  ৳{item.price.toLocaleString('en-US')} / {lang === 'en' ? 'Pcs' : 'পিছ'}
                </div>

                {/* Minimalist Round Buttons without bulky pill background (Reference 2) */}
                <div className="mt-2.5 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleQty(item.id, -1)}
                    className="flex h-6 w-6 items-center justify-center rounded-full border border-border-base bg-white font-body text-xs font-bold text-ink shadow-xs transition-brand hover:border-brand-light hover:text-brand-light active:scale-90"
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
                    className="flex h-6 w-6 items-center justify-center rounded-full border border-border-base bg-white font-body text-xs font-bold text-ink shadow-xs transition-brand hover:border-brand-light hover:text-brand-light active:scale-90"
                    aria-label="Increase"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Total Item Price & Trash Action on Right */}
              <div className="flex flex-col items-end justify-between self-stretch pl-1">
                <button
                  type="button"
                  onClick={() => handleRemove(item.id)}
                  title={t('সরান')}
                  className="flex h-6 w-6 items-center justify-center rounded-full text-muted/50 transition-brand hover:bg-red-50 hover:text-red-500"
                >
                  <TrashIcon />
                </button>
                <div className="font-body text-[13.5px] font-extrabold text-brand-light">
                  ৳{(item.price * item.qty).toLocaleString('en-US')}
                </div>
              </div>
            </div>
          ))}

          {/* Coupon Code Input Box (Reference 2 UI) */}
          <form onSubmit={handleApplyCoupon} className="rounded-[16px] border border-white/80 bg-white/85 p-3 shadow-xs backdrop-blur-sm">
            <div className="mb-1.5 flex items-center gap-1.5 font-body text-[11.5px] font-bold text-ink">
              <span>🎟️</span>
              <span>{lang === 'en' ? 'Apply Coupon' : 'কুপন কোড'}</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                placeholder={lang === 'en' ? 'Enter coupon...' : 'কুপন কোড লিখুন...'}
                className="w-full rounded-full border border-border-base bg-white px-3.5 py-2 font-body text-xs uppercase text-ink outline-none transition-brand placeholder:text-muted/70 focus:border-brand-light/60 focus:shadow-[0_0_0_2px_rgba(0,88,199,.1)]"
              />
              <button
                type="submit"
                className="shrink-0 rounded-full bg-brand-light px-4 py-2 font-body text-xs font-bold text-white shadow-xs transition-brand hover:bg-brand-light-hover active:scale-95"
              >
                {lang === 'en' ? 'Apply' : 'প্রয়োগ'}
              </button>
            </div>
          </form>
        </div>

        {/* Footer with Grand Total & Clean Action Button */}
        <div className="border-t border-border-base bg-white/95 px-5 py-4 backdrop-blur-md">
          <div className="mb-3 flex items-center justify-between">
            <span className="font-body text-[13.5px] font-bold text-muted">
              {t('মোট')}:
            </span>
            <span className="font-body text-xl font-extrabold text-brand-primary">
              ৳{total.toLocaleString('en-US')}
            </span>
          </div>

          {/* Primary CTA (No Emoji, Pure Brand Theme) */}
          <button
            onClick={handleConfirmOrder}
            className="w-full rounded-full bg-gradient-to-r from-brand-light to-brand-light-hover py-3.5 font-body text-sm font-bold text-white shadow-[0_4px_14px_rgba(0,88,199,.28)] transition-brand duration-brand hover:-translate-y-0.5 hover:shadow-[0_8px_22px_rgba(0,88,199,.38)] active:translate-y-0 active:scale-95"
          >
            {lang === 'en' ? 'Confirm Order' : 'অর্ডার নিশ্চিত করুন'}
          </button>
        </div>
      </div>
    </>
  );
}
