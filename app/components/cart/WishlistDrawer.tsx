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
  if (!emoji) return <span className="text-2xl">📦</span>;
  if (isUrl && !broken) {
    return (
      <img
        src={emoji}
        alt=""
        className="block h-full w-full rounded-[11px] object-cover"
        onError={() => setBroken(true)}
      />
    );
  }
  return <span className="text-2xl">{emoji}</span>;
}

function IconHeart({ filled = true }: { filled?: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20.2c-.3 0-.6-.1-.8-.3-2-1.7-3.9-3.3-5.3-4.9C4.1 13.1 3 11.3 3 9.3 3 6.9 4.9 5 7.3 5c1.4 0 2.7.7 3.6 1.9.2.3.7.3.9 0C12.7 5.7 14 5 15.4 5 17.8 5 19.7 6.9 19.7 9.3c0 2-1.1 3.8-2.9 5.7-1.4 1.6-3.3 3.2-5.3 4.9-.2.2-.5.3-.8.3Z" />
    </svg>
  );
}
function IconHeartEmpty() {
  return (
    <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20.2c-.3 0-.6-.1-.8-.3-2-1.7-3.9-3.3-5.3-4.9C4.1 13.1 3 11.3 3 9.3 3 6.9 4.9 5 7.3 5c1.4 0 2.7.7 3.6 1.9.2.3.7.3.9 0C12.7 5.7 14 5 15.4 5 17.8 5 19.7 6.9 19.7 9.3c0 2-1.1 3.8-2.9 5.7-1.4 1.6-3.3 3.2-5.3 4.9-.2.2-.5.3-.8.3Z" />
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
function IconBag() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6.3 8h11.4l-.95 12.15a1.6 1.6 0 0 1-1.6 1.45H8.85a1.6 1.6 0 0 1-1.6-1.45L6.3 8Z" />
      <path d="M9 8V6.2a3 3 0 0 1 6 0V8" />
    </svg>
  );
}
function IconBolt() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" />
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
    showToast('কার্টে যোগ হয়েছে');
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
      className={`fixed inset-0 z-[960] flex items-center justify-center bg-ink/50 p-4 backdrop-blur-[2px] transition-opacity duration-brand ${isOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'}`}
      onClick={onClose}
    >
      <div
        className={`flex max-h-[85vh] w-full max-w-[440px] flex-col overflow-hidden rounded-[20px] bg-white shadow-sh3 transition-transform duration-brand ${isOpen ? 'scale-100' : 'scale-95'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative shrink-0 bg-gradient-to-br from-brand-bg/60 via-white to-white px-5 pb-4 pt-5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-rose-400 to-red-500 text-white shadow-sh1">
                <IconHeart />
              </span>
              <div>
                <h3 className="font-display text-base font-bold leading-tight text-ink">আমার Wishlist</h3>
                {items.length > 0 && (
                  <p className="font-body text-[11.5px] font-semibold text-muted">{items.length} টি পছন্দের পণ্য</p>
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
          <div className="absolute inset-x-0 bottom-0 h-[3px] bg-gradient-to-r from-brand-bg via-rose-400 to-brand-primary" />
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-rose-50 to-surface-muted text-rose-300">
                <IconHeartEmpty />
              </div>
              <p className="mb-1 font-body text-sm font-bold text-ink">আপনার Wishlist খালি</p>
              <p className="mb-5 font-body text-[12.5px] text-muted">পছন্দের প্রোডাক্ট হার্ট আইকনে ট্যাপ করে সেভ করুন</p>
              <button
                onClick={goToProducts}
                className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-info to-brand-primary px-6 py-2.5 font-body text-[13px] font-bold text-white shadow-sh2 transition-brand duration-brand hover:brightness-[1.03]"
              >
                প্রোডাক্ট দেখুন <IconArrowRight />
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {items.map((item) => (
                <div
                  className="flex gap-3 rounded-[14px] border border-border-base/70 bg-white p-2.5 transition-brand duration-brand hover:border-rose-200 hover:shadow-sh1"
                  key={item.id}
                >
                  <div
                    className="flex h-16 w-16 shrink-0 cursor-pointer items-center justify-center rounded-[12px] border border-border-base/60 bg-gradient-to-br from-brand-bg/30 to-surface-muted"
                    onClick={() => openProduct(item)}
                  >
                    <WishImg emoji={item.emoji} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-0.5 flex items-start justify-between gap-2">
                      <div
                        className="cursor-pointer truncate font-body text-[13px] font-semibold text-ink"
                        onClick={() => openProduct(item)}
                        title="প্রোডাক্ট দেখুন"
                      >
                        {item.name}
                      </div>
                      <button
                        className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-muted/70 transition-brand duration-brand hover:bg-red-50 hover:text-red-500"
                        onClick={() => removeItem(item.id)}
                        title="Wishlist থেকে সরান"
                      >
                        <IconTrash />
                      </button>
                    </div>
                    <div className="mb-2 font-body text-[13.5px] font-extrabold text-brand-primary">
                      ৳{Number(item.price).toLocaleString('en-US')}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        className="flex items-center gap-1 whitespace-nowrap rounded-full border-[1.5px] border-brand-primary/25 bg-white px-2.5 py-1.5 font-body text-[11px] font-bold text-brand-primary transition-brand duration-brand hover:bg-info/10"
                        onClick={() => addToCart(item.id)}
                      >
                        <IconBag /> কার্টে যোগ
                      </button>
                      <button
                        className="flex items-center gap-1 whitespace-nowrap rounded-full bg-gradient-to-r from-info to-brand-primary px-2.5 py-1.5 font-body text-[11px] font-bold text-white shadow-sh1 transition-brand duration-brand hover:brightness-[1.03]"
                        onClick={() => orderNow(item.id)}
                      >
                        <IconBolt /> অর্ডার করুন
                      </button>
                    </div>
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
