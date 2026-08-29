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
        className="h-11 w-11 shrink-0 rounded-[10px] border border-border-base object-cover"
        loading="lazy"
        decoding="async"
      />
    );
  }
  return (
    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[10px] bg-brand-bg/40 text-2xl">
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

export default function QuickOrderModal() {
  const { t, lang } = useT();
  const router = useRouter();
  const supabase = useRef(createClient()).current;
  const [open, setOpen] = useState(false);
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

  // কার্ট খালি হয়ে গেলে স্বয়ংক্রিয়ভাবে বন্ধ করা
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
        className="fixed inset-0 z-[975] bg-ink/55 backdrop-blur-[2px] transition-opacity duration-brand"
        onClick={() => setOpen(false)}
      />

      {/* Modal / Bottom Sheet */}
      <div className="fixed inset-x-0 bottom-0 z-[980] mx-auto flex max-h-[85vh] w-full max-w-[480px] flex-col overflow-hidden rounded-t-[24px] bg-white shadow-sh3 transition-transform duration-brand sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2 sm:rounded-[22px]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border-base bg-gradient-to-r from-brand-bg/30 via-white to-white px-5 py-4">
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
            className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-muted text-muted transition-brand hover:bg-border-base hover:text-ink"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Cart Item List */}
        <div className="flex-1 overflow-y-auto px-5 py-3.5 space-y-3">
          {cart.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 rounded-xl border border-border-base/80 bg-white p-2.5 transition-brand hover:border-brand-light/30"
            >
              <CartItemThumb emoji={item.emoji} />

              <div className="min-w-0 flex-1">
                <div className="truncate font-body text-[13px] font-bold text-ink">
                  {item.name}
                </div>
                <div className="mt-0.5 font-body text-[12px] font-semibold text-brand-light">
                  ৳{item.price.toLocaleString('en-US')} / {lang === 'en' ? 'Pcs' : 'পিছ'}
                </div>
              </div>

              {/* Quantity Adjuster */}
              <div className="inline-flex items-center gap-0.5 rounded-full border border-border-base bg-surface-muted/80 p-1">
                <button
                  onClick={() => handleQty(item.id, -1)}
                  className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs font-bold text-ink shadow-xs transition-brand hover:text-brand-light"
                >
                  −
                </button>
                <span className="min-w-[20px] text-center font-body text-xs font-bold text-ink">
                  {item.qty}
                </span>
                <button
                  onClick={() => handleQty(item.id, 1)}
                  className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs font-bold text-ink shadow-xs transition-brand hover:text-brand-light"
                >
                  +
                </button>
              </div>

              {/* Delete Icon */}
              <button
                onClick={() => handleRemove(item.id)}
                title={t('সরান')}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-muted/60 transition-brand hover:bg-red-50 hover:text-red-500"
              >
                <TrashIcon />
              </button>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="border-t border-border-base bg-gradient-to-b from-white to-brand-bg/15 px-5 py-4">
          <div className="mb-3.5 flex items-center justify-between">
            <span className="font-body text-[13.5px] font-semibold text-muted">
              {t('মোট')}:
            </span>
            <span className="font-body text-lg font-extrabold text-ink">
              ৳{total.toLocaleString('en-US')}
            </span>
          </div>

          {/* Clean Order Confirm Button (No Emoji) */}
          <button
            onClick={handleConfirmOrder}
            className="w-full rounded-full bg-gradient-to-r from-info to-brand-light py-3.5 font-body text-sm font-bold text-white shadow-sh2 transition-brand duration-brand hover:brightness-[1.03] active:scale-95"
          >
            {lang === 'en' ? 'Confirm Order' : 'অর্ডার নিশ্চিত করুন'}
          </button>
        </div>
      </div>
    </>
  );
  }
