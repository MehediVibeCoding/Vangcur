'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  getWishlist, saveWishlist, WISHLIST_EVENT, productHref,
  QUICK_ORDER_EVENT, QUICK_CART_EVENT,
} from '@/lib/productData';
import { lockBody, unlockBody } from '@/lib/bodyScrollLock';
import { showToast } from '@/lib/toast';
import type { WishlistItem } from '@/types';

function WishImg({ emoji }: { emoji?: string }) {
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

interface WishlistDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WishlistDrawer({ isOpen, onClose }: WishlistDrawerProps) {
  const router = useRouter();
  const [items, setItems] = useState<WishlistItem[]>([]);

  useEffect(() => {
    setItems(getWishlist());
    const handler = (e: Event) => setItems((e as CustomEvent).detail?.wishlist ?? getWishlist());
    window.addEventListener(WISHLIST_EVENT, handler);
    return () => window.removeEventListener(WISHLIST_EVENT, handler);
  }, []);

  useEffect(() => {
    if (isOpen) lockBody();
    else unlockBody();
  }, [isOpen]);

  const openProduct = (item: WishlistItem) => {
    onClose();
    router.push(productHref(item));
  };

  const goToProducts = () => {
    onClose();
    document.getElementById('prodSec')?.scrollIntoView({ behavior: 'smooth' });
  };

  const addToCart = (id: number | string) => {
    window.dispatchEvent(new CustomEvent(QUICK_CART_EVENT, { detail: { id } }));
    showToast('✅ কার্টে যোগ হয়েছে');
  };

  const orderNow = (id: number | string) => {
    onClose();
    window.dispatchEvent(new CustomEvent(QUICK_ORDER_EVENT, { detail: { id } }));
  };

  const removeItem = (id: number | string) => {
    saveWishlist(getWishlist().filter((x) => String(x.id) !== String(id)));
    showToast('Wishlist থেকে সরানো হয়েছে');
  };

  return (
    <div
      className={`fixed inset-0 z-[60] flex items-center justify-center bg-black/50 transition-opacity duration-brand ${isOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'}`}
    >
      <div
        className={`flex max-h-[85vh] w-full max-w-[420px] flex-col rounded-brand bg-white shadow-sh3 transition-transform duration-brand ${isOpen ? 'scale-100' : 'scale-95'}`}
      >
        <div className="flex items-center justify-between border-b border-border-base px-5 py-4">
          <h3 className="font-display text-base font-bold text-ink">❤️ আমার Wishlist</h3>
          <button className="flex h-8 w-8 items-center justify-center rounded-full text-lg text-muted hover:bg-surface-muted" onClick={onClose}>✕</button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="mb-2.5 text-[44px]">🤍</div>
              <p className="mb-4 text-sm text-muted">আপনার Wishlist খালি</p>
              <button
                onClick={goToProducts}
                className="rounded-[10px] bg-ink px-[22px] py-2.5 text-[13px] font-bold text-white"
              >
                প্রোডাক্ট দেখুন →
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {items.map((item) => (
                <div className="flex gap-3" key={item.id}>
                  <div
                    className="flex h-14 w-14 shrink-0 cursor-pointer items-center justify-center rounded-[9px] bg-surface-muted"
                    onClick={() => openProduct(item)}
                  >
                    <WishImg emoji={item.emoji} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div
                      className="cursor-pointer truncate text-[13px] font-semibold text-ink"
                      onClick={() => openProduct(item)}
                      title="প্রোডাক্ট দেখুন"
                    >
                      {item.name}
                    </div>
                    <div className="mt-0.5 flex items-center gap-2">
                      <div className="text-[13px] font-bold text-ink">৳{Number(item.price).toLocaleString()}</div>
                      <button
                        className="flex items-center p-1 text-muted hover:text-ink"
                        onClick={() => removeItem(item.id)}
                        title="Wishlist থেকে সরান"
                      >
                        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                          <path d="M10 11v6M14 11v6" />
                          <path d="M9 6V4h6v2" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col gap-1.5">
                    <button className="whitespace-nowrap rounded-[8px] border border-border-base bg-surface-muted px-2.5 py-1.5 text-[11px] font-bold text-ink" onClick={() => addToCart(item.id)}>
                      🛒 কার্টে যোগ
                    </button>
                    <button className="whitespace-nowrap rounded-[8px] border-none bg-brand-primary px-2.5 py-1.5 text-[11px] font-bold text-white" onClick={() => orderNow(item.id)}>
                      ⚡ অর্ডার করুন
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
