'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
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
  if (!emoji) return <span className="text-[22px]">📦</span>;
  if (isUrl && !broken) {
    return (
      <img
        src={emoji}
        alt=""
        className="block h-full w-full rounded-[9px] object-cover"
        onError={() => setBroken(true)}
      />
    );
  }
  return <span className="text-[22px]">{emoji}</span>;
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
      if (res.ok) showToast('✅ কার্টে যোগ হয়েছে');
      else if (res.reason === 'stock') showToast('❌ স্টক শেষ!');
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
      showToast(`❌ সর্বোচ্চ স্টক সীমায় পৌঁছে গেছে (${res.maxStock}টি)`);
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
        className={`fixed inset-0 z-[960] bg-black/50 transition-opacity duration-brand ${isOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'}`}
        onClick={onClose}
      />
      <div
        className={`fixed inset-y-0 right-0 z-[965] flex w-full max-w-[380px] flex-col bg-white shadow-sh3 transition-transform duration-brand ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="flex items-center justify-between border-b border-border-base px-5 py-4">
          <h3 className="font-display text-base font-bold text-ink">🛒 আপনার কার্ট</h3>
          <button className="flex h-8 w-8 items-center justify-center rounded-full text-lg text-muted hover:bg-surface-muted" onClick={onClose}>✕</button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {cart.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div className="mb-2.5 text-[44px]">🛒</div>
              <p className="mb-4 text-sm text-muted">আপনার কার্ট খালি</p>
              <button
                onClick={goToProducts}
                className="rounded-[10px] bg-ink px-[22px] py-2.5 text-[13px] font-bold text-white"
              >
                প্রোডাক্ট দেখুন →
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {cart.map((item) => (
                <div className="flex gap-3" key={item.id}>
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[9px] bg-surface-muted">
                    <CartImg emoji={item.emoji} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-semibold text-ink">{item.name}</div>
                    <div className="mb-1.5 text-[13px] font-bold text-ink">৳{(item.price * item.qty).toLocaleString()}</div>
                    <div className="flex items-center gap-2">
                      <button className="flex h-7 w-7 items-center justify-center rounded-[7px] border border-border-base text-sm font-bold text-ink" onClick={() => handleQty(item.id, -1)}>−</button>
                      <span className="min-w-[18px] text-center text-[13px] font-bold text-ink">{item.qty}</span>
                      <button className="flex h-7 w-7 items-center justify-center rounded-[7px] border border-border-base text-sm font-bold text-ink" onClick={() => handleQty(item.id, 1)}>+</button>
                      <button className="ml-2 text-[12px] font-semibold text-muted hover:text-ink" onClick={() => handleRemove(item.id)}>সরান</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        {cart.length > 0 && (
          <div className="border-t border-border-base px-5 py-4">
            <div className="mb-3 flex items-center justify-between text-sm font-bold text-ink">
              <span>সর্বমোট:</span><span>৳{total.toLocaleString()}</span>
            </div>
            <button className="w-full rounded-[9px] border-none bg-brand-primary py-3.5 text-sm font-bold text-white transition-brand duration-brand hover:bg-ink" onClick={handleCheckout}>
              চেকআউট করুন →
            </button>
          </div>
        )}
      </div>
    </>
  );
}
