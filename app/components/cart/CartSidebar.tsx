'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { optimizeCloudinaryUrl } from '@/lib/cloudinaryUrl';
import { DEFAULT_PRODS, fetchCustomProducts, mergeCustomProducts, QUICK_CART_EVENT } from '@/lib/productData';
import {
  getCart, cartTotal, addToCart, updateQty, removeItem,
  CART_EVENT, clearCartOnRealPagehide,
} from '@/lib/cartData';
import { lockBody, unlockBody } from '@/lib/bodyScrollLock';
import { showToast } from '@/lib/toast';
import type { CartItem, Product } from '@/types';

function CartImg({ emoji }: { emoji?: string }) {
  const [broken, setBroken] = useState(false);
  const isUrl = typeof emoji === 'string' && (emoji.startsWith('http://') || emoji.startsWith('https://'));
  if (!emoji) return <span className="text-2xl">📦</span>;
  if (isUrl && !broken) {
    return (
      <img
        src={optimizeCloudinaryUrl(emoji, 150)}
        alt=""
        className="block h-full w-full rounded-[11px] object-cover"
        loading="lazy"
        decoding="async"
        onError={() => setBroken(true)}
      />
    );
  }
  return <span className="text-2xl">{emoji}</span>;
}

function IconBag() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6.3 8h11.4l-.95 12.15a1.6 1.6 0 0 1-1.6 1.45H8.85a1.6 1.6 0 0 1-1.6-1.45L6.3 8Z" />
      <path d="M9 8V6.2a3 3 0 0 1 6 0V8" />
    </svg>
  );
}
function IconClose() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round">
      <path d="M6.5 6.5l11 11M17.5 6.5l-11 11" />
    </svg>
  );
}
function IconMinus() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
      <path d="M5 12h14" />
    </svg>
  );
}
function IconPlus() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}
function IconTrash() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 7h16" />
      <path d="M9.5 7V5.2A1.2 1.2 0 0 1 10.7 4h2.6a1.2 1.2 0 0 1 1.2 1.2V7" />
      <path d="M6.5 7 7.3 19a2 2 0 0 0 2 1.9h5.4a2 2 0 0 0 2-1.9L17.5 7" />
      <path d="M10.2 11v6M13.8 11v6" />
    </svg>
  );
}
function IconLock() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="10.5" width="14" height="10" rx="3" />
      <path d="M8.25 10.5V8a3.75 3.75 0 0 1 7.5 0v2.5" />
    </svg>
  );
}
function IconArrowRight() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4.5 12h15M13 5.5 20 12l-7 6.5" />
    </svg>
  );
}
function IconCartEmpty() {
  return (
    <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6.3 8h11.4l-.95 12.15a1.6 1.6 0 0 1-1.6 1.45H8.85a1.6 1.6 0 0 1-1.6-1.45L6.3 8Z" />
      <path d="M9 8V6.2a3 3 0 0 1 6 0V8" />
      <path d="M9.8 12.5h.01M14.2 12.5h.01" strokeWidth="2.2" />
    </svg>
  );
}

interface CartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CartSidebar({ isOpen, onClose }: CartSidebarProps) {
  const router = useRouter();
  const supabase = useRef(createClient()).current;
  const [cart, setCart] = useState<CartItem[]>([]);
  const prodsRef = useRef<Product[]>(DEFAULT_PRODS);

  useEffect(() => {
    setCart(getCart());
    const handler = (e: Event) => setCart((e as CustomEvent).detail?.cart ?? getCart());
    window.addEventListener(CART_EVENT, handler);
    return () => window.removeEventListener(CART_EVENT, handler);
  }, []);

  useEffect(() => clearCartOnRealPagehide(), []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const customRows = await fetchCustomProducts(supabase);
      if (!cancelled && customRows.length) {
        prodsRef.current = mergeCustomProducts(DEFAULT_PRODS, customRows);
      }
    })();
    return () => { cancelled = true; };
  }, [supabase]);

  useEffect(() => {
    const onQuickCart = (e: Event) => {
      const id = (e as CustomEvent).detail?.id;
      if (id === undefined) return;
      const res = addToCart(prodsRef.current, id, 1);
      if (res.ok) showToast('কার্টে যোগ হয়েছে');
      else if (res.reason === 'stock') showToast('স্টক শেষ!');
    };
    window.addEventListener(QUICK_CART_EVENT, onQuickCart);
    return () => window.removeEventListener(QUICK_CART_EVENT, onQuickCart);
  }, []);

  useEffect(() => {
    if (isOpen) lockBody();
    else unlockBody();
  }, [isOpen]);

  const handleQty = (id: number | string, delta: number) => {
    const res = updateQty(prodsRef.current, id, delta);
    if (!res.ok && res.reason === 'stock') {
      showToast(`সর্বোচ্চ স্টক সীমায় পৌঁছে গেছে (${res.maxStock}টি)`);
      return;
    }
    setCart(res.cart);
  };

  const handleRemove = (id: number | string) => {
    setCart(removeItem(id));
  };

  const handleCheckout = () => {
    if (!cart.length) { showToast('কার্ট খালি!'); return; }
    onClose();
    router.push('/checkout');
  };

  const goToProducts = () => {
    onClose();
    document.getElementById('prodSec')?.scrollIntoView({ behavior: 'smooth' });
  };

  const total = cartTotal(cart);

  return (
    <>
      <div
        className={`fixed inset-0 z-[960] bg-ink/50 backdrop-blur-[2px] transition-opacity duration-brand ${isOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'}`}
        onClick={onClose}
      />
      <div
        className={`fixed inset-y-0 right-0 z-[965] flex w-full max-w-[400px] flex-col bg-white shadow-sh3 transition-transform duration-brand sm:my-3 sm:mr-3 sm:h-[calc(100%-24px)] sm:rounded-[20px]${isOpen ? ' translate-x-0' : ' translate-x-full'}`}
      >
        {/* Header */}
        <div className="relative shrink-0 overflow-hidden bg-gradient-to-br from-brand-bg/60 via-white to-white px-5 pb-4 pt-5 sm:rounded-t-[20px]">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-info to-brand-light text-white shadow-sh1">
                <IconBag />
              </span>
              <div>
                <h3 className="font-display text-base font-bold leading-tight text-ink">আপনার কার্ট</h3>
                {cart.length > 0 && (
                  <p className="font-body text-[11.5px] font-semibold text-muted">{cart.length} টি পণ্য</p>
                )}
              </div>
            </div>
            <button
              className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-muted transition-brand duration-brand hover:bg-surface-muted hover:text-ink"
              onClick={onClose}
              aria-label="বন্ধ করুন"
            >
              <IconClose />
            </button>
          </div>
          <div className="absolute inset-x-0 bottom-0 h-[3px] bg-gradient-to-r from-brand-bg via-info to-brand-light" />
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {cart.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-brand-bg/50 to-surface-muted text-brand-light/60">
                <IconCartEmpty />
              </div>
              <p className="mb-1 font-body text-sm font-bold text-ink">আপনার কার্ট খালি</p>
              <p className="mb-5 font-body text-[12.5px] text-muted">পছন্দের প্রোডাক্ট যোগ করে কেনাকাটা শুরু করুন</p>
              <button
                onClick={goToProducts}
                className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-info to-brand-light px-6 py-2.5 font-body text-[13px] font-bold text-white shadow-sh2 transition-brand duration-brand hover:brightness-[1.03]"
              >
                প্রোডাক্ট দেখুন <IconArrowRight />
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {cart.map((item) => (
                <div
                  className="flex gap-3 rounded-[14px] border border-border-base/70 bg-white p-2.5 transition-brand duration-brand hover:border-info/30 hover:shadow-sh1"
                  key={item.id}
                >
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[12px] border border-border-base/60 bg-gradient-to-br from-brand-bg/30 to-surface-muted">
                    <CartImg emoji={item.emoji} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-0.5 flex items-start justify-between gap-2">
                      <div className="truncate font-body text-[13px] font-semibold text-ink">{item.name}</div>
                      <button
                        className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-muted/70 transition-brand duration-brand hover:bg-red-50 hover:text-red-500"
                        onClick={() => handleRemove(item.id)}
                        aria-label="সরান"
                        title="সরান"
                      >
                        <IconTrash />
                      </button>
                    </div>
                    <div className="mb-2 font-body text-[13.5px] font-extrabold text-brand-light">
                      ৳{(item.price * item.qty).toLocaleString('en-US')}
                    </div>
                    <div className="inline-flex items-center gap-0.5 rounded-full border border-border-base bg-surface-muted/70 p-[3px]">
                      <button
                        className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-ink shadow-sh1 transition-brand duration-brand hover:text-brand-light"
                        onClick={() => handleQty(item.id, -1)}
                      >
                        <IconMinus />
                      </button>
                      <span className="min-w-[22px] text-center font-body text-[12.5px] font-bold text-ink">{item.qty}</span>
                      <button
                        className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-ink shadow-sh1 transition-brand duration-brand hover:text-brand-light"
                        onClick={() => handleQty(item.id, 1)}
                      >
                        <IconPlus />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {cart.length > 0 && (
          <div className="shrink-0 border-t border-border-base bg-gradient-to-b from-white to-brand-bg/15 px-5 py-4 sm:rounded-b-[20px]">
            <div className="mb-3 flex items-center justify-between">
              <span className="font-body text-[13px] font-semibold text-muted">সর্বমোট</span>
              <span className="font-body text-lg font-extrabold text-ink">৳{total.toLocaleString('en-US')}</span>
            </div>
            <button
              className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-info to-brand-light py-3.5 font-body text-sm font-bold text-white shadow-sh2 transition-brand duration-brand hover:brightness-[1.03]"
              onClick={handleCheckout}
            >
              চেকআউট করুন <IconArrowRight />
            </button>
            <div className="mt-2.5 flex items-center justify-center gap-1.5 font-body text-[11px] font-medium text-muted">
              <IconLock /> ১০০% নিরাপদ ও সুরক্ষিত চেকআউট
            </div>
          </div>
        )}
      </div>
    </>
  );
}
