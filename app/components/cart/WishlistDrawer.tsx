'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  productHref,
  QUICK_ORDER_EVENT, QUICK_CART_EVENT,
} from '@/lib/productData';
import { useWishlistStore } from '@/lib/store/wishlistStore';
import { lockBody, unlockBody } from '@/lib/bodyScrollLock';
import { showToast } from '@/lib/toast';
import { optimizeCloudinaryUrl } from '@/lib/cloudinaryUrl';
import { useT } from '@/lib/i18n/useT';
import type { WishlistItem } from '@/types';

function WishImg({ emoji }: { emoji?: string }) {
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

function HeartEmptySvgIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
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

interface WishlistDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WishlistDrawer({ isOpen, onClose }: WishlistDrawerProps) {
  const { t, lang } = useT();
  const router = useRouter();
  const items = useWishlistStore((s) => s.wishlist);

  useEffect(() => {
    router.prefetch('/checkout');
    router.prefetch('/');
  }, [router]);

  useEffect(() => {
    if (isOpen) lockBody();
    else unlockBody();
    return () => unlockBody();
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
    showToast(t('কার্টে যোগ হয়েছে'));
  };

  const orderNow = (id: number | string) => {
    onClose();
    window.dispatchEvent(new CustomEvent(QUICK_ORDER_EVENT, { detail: { id } }));
  };

  const removeItem = (id: number | string) => {
    useWishlistStore.getState().removeItem(id);
    showToast(t('Wishlist থেকে সরানো হয়েছে'));
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-[960] bg-ink/55 backdrop-blur-[3px] transition-opacity duration-brand ${
          isOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={onClose}
      />

      {/* Wishlist Drawer: মোবাইলে সম্পূর্ণ ফুল-স্ক্রিন, ডেস্কে প্রিমিয়াম রাউন্ডেড মডাল */}
      <div
        className={`fixed inset-0 z-[965] flex h-full w-full flex-col overflow-hidden bg-gradient-to-b from-brand-bg via-[#DCEBFD] to-white shadow-sh3 transition-all duration-300 ease-brand sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:max-h-[88vh] sm:max-w-[440px] sm:rounded-[28px] ${
          isOpen ? 'pointer-events-auto scale-100 opacity-100' : 'pointer-events-none scale-95 opacity-0'
        }`}
      >
        {/* Header */}
        <div className="relative shrink-0 overflow-hidden border-b border-ink/10 px-6 pb-3.5 pt-5 text-left">
          <HeaderDecor />
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <h3 className="font-body text-[17px] font-extrabold text-ink">
                ❤️ {lang === 'en' ? 'My Wishlist' : 'আপনার Wishlist'}
              </h3>
              <p className="mt-0.5 font-body text-[12px] font-semibold text-muted">
                {lang === 'en'
                  ? `${items.length} favorite item(s)`
                  : `${items.length}টি পছন্দের পণ্য`}
              </p>
            </div>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-white/60 bg-white/80 text-ink/60 shadow-sh1 backdrop-blur-[8px] transition-brand hover:bg-white hover:text-ink focus-visible:outline-none"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content List */}
        <div className="flex-1 overflow-y-auto px-6 py-3.5">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center py-10 text-center">
              <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full border border-white/80 bg-white/80 text-brand-light shadow-sm">
                <HeartEmptySvgIcon className="h-8 w-8 text-brand-light" />
              </div>
              <p className="mb-1 font-body text-[15px] font-bold text-ink">
                {t('আপনার Wishlist খালি')}
              </p>
              <p className="mb-5 max-w-xs font-body text-[12.5px] text-muted">
                {t('পছন্দের প্রোডাক্ট হার্ট আইকনে ট্যাপ করে সেভ করুন')}
              </p>
              <button
                onClick={goToProducts}
                className="rounded-full bg-gradient-to-r from-brand-light to-brand-light-hover px-6 py-2.5 font-body text-xs font-bold text-white shadow-sh2 transition-brand hover:brightness-[1.03] active:scale-95"
              >
                {t('প্রোডাক্ট দেখুন')} →
              </button>
            </div>
          ) : (
            <div className="space-y-3.5">
              {items.map((item, idx) => (
                <div
                  key={item.id}
                  className={`flex items-start gap-3.5 pb-3.5 ${
                    idx !== items.length - 1 ? 'border-b border-ink/10' : ''
                  }`}
                >
                  {/* Thumbnail */}
                  <div
                    className="cursor-pointer"
                    onClick={() => openProduct(item)}
                    title={t('প্রোডাক্ট দেখুন')}
                  >
                    <WishImg emoji={item.emoji} />
                  </div>

                  {/* Title, Price & Quick Action Pill Buttons */}
                  <div className="min-w-0 flex-1">
                    <div
                      className="cursor-pointer truncate font-body text-[13.5px] font-bold text-ink transition-colors hover:text-brand-light"
                      onClick={() => openProduct(item)}
                      title={t('প্রোডাক্ট দেখুন')}
                    >
                      {item.name}
                    </div>
                    <div className="mt-0.5 font-body text-[13px] font-extrabold text-brand-light">
                      ৳{Number(item.price).toLocaleString('en-US')}
                    </div>

                    {/* Clean Action Buttons without Emoji */}
                    <div className="mt-2 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => addToCart(item.id)}
                        className="rounded-full border border-brand-light bg-white/60 px-3 py-1 font-body text-[11px] font-bold text-brand-light transition-brand hover:bg-brand-light hover:text-white active:scale-95"
                      >
                        + {lang === 'en' ? 'Cart' : 'কার্ট'}
                      </button>
                      <button
                        type="button"
                        onClick={() => orderNow(item.id)}
                        className="rounded-full bg-gradient-to-r from-info to-brand-light px-3.5 py-1 font-body text-[11px] font-bold text-white shadow-xs transition-brand hover:brightness-[1.03] active:scale-95"
                      >
                        {lang === 'en' ? 'Order Now' : 'অর্ডার করুন'}
                      </button>
                    </div>
                  </div>

                  {/* Subtle Muted Trash Delete Button on Right */}
                  <div className="flex shrink-0 items-center justify-center pl-1 pt-1">
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      title={t('Wishlist থেকে সরান')}
                      className="flex h-7 w-7 items-center justify-center rounded-lg bg-transparent text-muted/40 transition-colors hover:bg-red-50 hover:text-red-500 active:scale-90"
                    >
                      <TrashIcon />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
