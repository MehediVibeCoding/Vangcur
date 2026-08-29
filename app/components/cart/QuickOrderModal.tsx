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
        className="h-12 w-12 shrink-0 rounded-xl border border-border-base bg-white object-cover"
        loading="lazy"
        decoding="async"
      />
    );
  }
  return (
    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-surface-muted text-2xl">
      {emoji || '📦'}
    </span>
  );
}

function TrashIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
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
        className="fixed inset-0 z-[975] bg-ink/60 backdrop-blur-[3px] transition-opacity duration-brand"
        onClick={() => setOpen(false)}
      />

      {/* Modal / Bottom Sheet — একক অভিন্ন ব্যাকগ্রাউন্ড (No Broken Cards) */}
      <div className="fixed inset-x-0 bottom-0 z-[980] mx-auto flex max-h-[88vh] w-full max-w-[460px] flex-col overflow-hidden rounded-t-[28px] bg-gradient-to-b from-brand-bg/40 via-[#EFF6FE] to-white shadow-sh3 transition-all duration-300 ease-brand sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2 sm:rounded-[28px]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border-base px-6 pb-3.5 pt-4 text-left">
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
            className="flex h-8 w-8 items-center justify-center rounded-full border border-border-base bg-white text-muted shadow-xs transition-brand hover:text-ink"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Cart Items — রেফারেন্স ৩ অনুযায়ী সুন্দর লিস্ট ভিউ */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {cart.map((item, idx) => (
            <div
              key={item.id}
              className={`flex items-start gap-3.5 pb-4 ${
                idx !== cart.length - 1 ? 'border-b border-border-base/70' : ''
              }`}
            >
              {/* থাম্বনেইল */}
              <CartItemThumb emoji={item.emoji} />

              {/* টাইটেল, ইউনিট প্রাইস ও রেফারেন্স ২-এর মতো মিনিমালিস্ট কোয়ান্টিটি বাটন */}
              <div className="min-w-0 flex-1">
                <div className="line-clamp-1 font-body text-[13.5px] font-bold text-ink">
                  {item.name}
                </div>
                <div className="mt-0.5 font-body text-[12px] text-muted">
                  ৳{item.price.toLocaleString('en-US')} / {lang === 'en' ? 'Pcs' : 'পিছ'}
                </div>

                {/* রেফারেন্স ২ অনুযায়ী গোল বাটন */}
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

              {/* ডানপাশে আইটেম টোটাল প্রাইস এবং রেফারেন্স ৩ অনুযায়ী লালচে স্কয়ার ডিলিট বাটন */}
              <div className="flex flex-col items-end justify-between self-stretch pl-2">
                <div className="font-body text-[14px] font-bold text-ink">
                  ৳{(item.price * item.qty).toLocaleString('en-US')}
                </div>
                <button
                  type="button"
                  onClick={() => handleRemove(item.id)}
                  title={t('সরান')}
                  className="mt-2 flex h-7 w-7 items-center justify-center rounded-[8px] bg-[#FEF2F2] text-[#EF4444] shadow-xs transition-brand hover:bg-[#FEE2E2]"
                >
                  <TrashIcon />
                </button>
              </div>
            </div>
          ))}

          {/* রেফারেন্স ২ অনুযায়ী কুপন বক্স */}
          <div className="pt-1">
            <form onSubmit={handleApplyCoupon} className="rounded-[14px] border border-border-base bg-white/80 p-3 shadow-xs">
              <div className="mb-1.5 flex items-center gap-1.5 font-body text-[12px] font-bold text-ink">
                <span>🎟️</span>
                <span>{lang === 'en' ? 'Apply Coupon' : 'কুপন কোড'}</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  placeholder={lang === 'en' ? 'Enter coupon code...' : 'কুপন কোড লিখুন...'}
                  className="w-full rounded-full border border-border-base bg-white px-3.5 py-1.5 font-body text-xs uppercase text-ink outline-none transition-brand placeholder:text-muted/70 focus:border-brand-light"
                />
                <button
                  type="submit"
                  className="shrink-0 rounded-full bg-brand-light px-4 py-1.5 font-body text-xs font-bold text-white shadow-xs transition-brand hover:bg-brand-light-hover active:scale-95"
                >
                  {lang === 'en' ? 'Apply' : 'প্রয়োগ'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Footer — কোনো আলাদা কাটাকাটি ব্যাকগ্রাউন্ড ছাড়া স্মুথ ফ্লো */}
        <div className="border-t border-border-base bg-white/95 px-6 py-4">
          <div className="mb-3.5 flex items-center justify-between">
            <span className="font-body text-[14px] font-bold text-muted">
              {t('মোট')}:
            </span>
            {/* স্কাই-ব্লু কালারের প্রাইস */}
            <span className="font-body text-xl font-extrabold text-brand-light">
              ৳{total.toLocaleString('en-US')}
            </span>
          </div>

          {/* ক্লিন অর্ডার নিশ্চিত বাটন (No Emoji, No Continue Shopping) */}
          <button
            onClick={handleConfirmOrder}
            className="w-full rounded-full bg-gradient-to-r from-info to-brand-light py-3.5 font-body text-sm font-bold text-white shadow-[0_4px_14px_rgba(0,88,199,.28)] transition-brand duration-brand hover:brightness-[1.03] active:scale-95"
          >
            {lang === 'en' ? 'Confirm Order' : 'অর্ডার নিশ্চিত করুন'}
          </button>
        </div>
      </div>
    </>
  );
}
