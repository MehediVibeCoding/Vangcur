// [REPLACE] ফাইলের পাথ: app/components/modals/BackInStockToast.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { getStockNotifications, removeStockNotification } from '@/lib/accountData';
import { useCartStore } from '@/lib/store/cartStore';
import { OPEN_CART_EVENT } from '@/lib/uiEvents';
import { optimizeCloudinaryUrl } from '@/lib/cloudinaryUrl';
import { showToast } from '@/lib/toast';
import { useT } from '@/lib/i18n/useT';
import type { Product } from '@/types';

interface InStockItem extends Product {
  key: string;
}

function HeaderDecor() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden text-brand-light/[0.14]" aria-hidden="true">
      <svg width="34" height="34" className="absolute -left-1 top-2 -rotate-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
      <svg width="26" height="26" className="absolute right-12 top-3 rotate-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <rect x="7" y="2.5" width="10" height="15" rx="3" />
        <path d="M10 5.5h4" />
        <circle cx="12" cy="20" r="1.6" />
      </svg>
    </div>
  );
}

function ItemThumbnail({ imgVal }: { imgVal?: string }) {
  const isUrl = typeof imgVal === 'string' && (imgVal.startsWith('http://') || imgVal.startsWith('https://'));
  if (isUrl) {
    return (
      <img
        src={optimizeCloudinaryUrl(imgVal, 140)}
        alt="Product"
        className="h-12 w-12 shrink-0 rounded-xl border border-white/90 bg-white object-cover shadow-xs"
        loading="lazy"
        decoding="async"
        onError={(e) => { e.currentTarget.style.display = 'none'; }}
      />
    );
  }
  return (
    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/90 bg-brand-bg/50 text-brand-light shadow-xs">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16.5 9.4 7.55 4.24a1.8 1.8 0 0 0-1.8 0L2.5 6.1a1.8 1.8 0 0 0-.9 1.56v8.68a1.8 1.8 0 0 0 .9 1.56l3.25 1.86a1.8 1.8 0 0 0 1.8 0l8.95-5.16a1.8 1.8 0 0 0 .9-1.56V9.4z" />
        <polyline points="3.29 7 12 12 20.71 7" />
        <line x1="12" y1="22" x2="12" y2="12" />
      </svg>
    </div>
  );
}

function CartPlusIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
  );
}

export default function BackInStockToast() {
  const { t, lang } = useT();
  const checkedRef = useRef(false);
  const [inStockItems, setInStockItems] = useState<InStockItem[]>([]);

  useEffect(() => {
    if (checkedRef.current) return;
    checkedRef.current = true;

    const notifs = getStockNotifications();
    if (notifs.length === 0) return;

    const targetIds = notifs.map((n) => n.prodId).filter(Boolean);
    if (targetIds.length === 0) return;

    (async () => {
      const supabase = createClient();
      try {
        const { data, error } = await supabase
          .from('custom_products')
          .select('id, name, price, old, stock, imgs, cat')
          .in('id', targetIds);

        if (error || !data || data.length === 0) return;

        const available: InStockItem[] = [];
        notifs.forEach((n) => {
          const prod = data.find((p) => String(p.id) === String(n.prodId));
          if (prod && Number(prod.stock) > 0) {
            let imgsArr: string[] = [];
            if (typeof prod.imgs === 'string') {
              try { imgsArr = JSON.parse(prod.imgs); } catch { imgsArr = [prod.imgs]; }
            } else if (Array.isArray(prod.imgs)) {
              imgsArr = prod.imgs;
            }

            available.push({
              id: prod.id,
              name: prod.name,
              price: Number(prod.price) || 0,
              old: Number(prod.old) || Number(prod.price) || 0,
              stock: Number(prod.stock) || 0,
              imgs: imgsArr.length ? imgsArr : ['📦'],
              cat: prod.cat || 'general',
              cats: [prod.cat || 'general'],
              specs: {},
              warranty: '৭ দিন',
              badge: '',
              rating: 5,
              discountColor: '',
              desc: '',
              _detailLoaded: false,
              key: n.key,
            });
          }
        });

        if (available.length > 0) {
          setInStockItems(available);
        }
      } catch {
        // network exception
      }
    })();
  }, []);

  if (inStockItems.length === 0) return null;

  // নোটিফিকেশন পুরোপুরি কেটে দেওয়া (লোকাল স্টোরেজ থেকে চিরতরে ডিলিট)
  const handleDismissAll = () => {
    inStockItems.forEach((item) => removeStockNotification(item.key));
    setInStockItems([]);
  };

  // একক প্রোডাক্ট কার্টে যোগ ও কার্ট ওপেন করা
  const handleAddSingleToCart = (item: InStockItem) => {
    useCartStore.getState().addToCart([item], item.id, 1);
    removeStockNotification(item.key);
    showToast(t('কার্টে যোগ হয়েছে'));

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(OPEN_CART_EVENT));
    }

    const remaining = inStockItems.filter((i) => i.id !== item.id);
    setInStockItems(remaining);
  };

  // মাল্টিপল প্রোডাক্টের ক্ষেত্রে সবগুলো একসাথে কার্টে যোগ ও কার্ট ড্রয়ার ওপেন করা
  const handleAddAllToCart = () => {
    inStockItems.forEach((item) => {
      useCartStore.getState().addToCart([item], item.id, 1);
      removeStockNotification(item.key);
    });

    showToast(lang === 'en' ? 'All items added to cart!' : 'সকল পণ্য কার্টে যুক্ত করা হয়েছে!');

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(OPEN_CART_EVENT));
    }

    setInStockItems([]);
  };

  const isMultiple = inStockItems.length > 1;

  return (
    <div className="fixed inset-x-3 bottom-4 z-[950] sm:bottom-5 sm:left-auto sm:right-5 sm:w-[390px] animate-section-reveal">
      <div className="relative overflow-hidden rounded-[24px] border border-white/80 bg-gradient-to-b from-brand-bg via-[#DCEBFD] to-white p-5 shadow-sh3 ring-1 ring-white/70 backdrop-blur-md">
        
        {/* লাইন-আর্ট ওয়াটারমার্ক */}
        <HeaderDecor />

        {/* ফ্রস্টেড সার্কুলার ক্লোজ বাটন */}
        <button
          onClick={handleDismissAll}
          className="absolute right-3.5 top-3.5 z-10 flex h-7 w-7 items-center justify-center rounded-full border border-white/60 bg-white/80 text-ink/60 shadow-xs backdrop-blur-[8px] transition-brand hover:bg-white hover:text-ink focus-visible:outline-none"
          aria-label={t('বন্ধ করুন')}
          title={t('বন্ধ করুন')}
        >
          ✕
        </button>

        {/* হেডার শিরোনাম ও সাবটাইটেল */}
        <div className="relative z-10 pr-6">
          <h3 className="font-body text-[15px] font-extrabold text-ink leading-tight">
            {isMultiple
              ? (lang === 'en' ? 'Products Back in Stock!' : 'পণ্যগুলো আবার স্টকে এসেছে!')
              : (lang === 'en' ? 'Product Back in Stock!' : 'প্রোডাক্ট আবার স্টকে এসেছে!')}
          </h3>
          <p className="mt-0.5 font-body text-[11.5px] text-muted">
            {isMultiple
              ? (lang === 'en' ? 'Items you requested are now ready to order.' : 'আপনার অনুরোধ করা পণ্যগুলো এখন অর্ডারের জন্য প্রস্তুত।')
              : (lang === 'en' ? 'The item you requested is now available.' : 'আপনার অনুরোধ করা প্রোডাক্টটি এখন স্টকে পাওয়া যাচ্ছে।')}
          </p>
        </div>

        {/* ========================================================================= */}
        {/* ১. সিঙ্গেল প্রোডাক্ট মোড                                                   */}
        {/* ========================================================================= */}
        {!isMultiple && (
          <>
            <div className="relative z-10 my-3 rounded-[16px] border border-white/90 bg-white/80 p-2.5 shadow-xs backdrop-blur-md">
              <div className="flex items-center gap-3">
                <ItemThumbnail imgVal={(inStockItems[0].imgs || [''])[0]} />
                <div className="min-w-0 flex-1">
                  <div className="line-clamp-1 font-body text-[13px] font-bold text-ink">
                    {inStockItems[0].name}
                  </div>
                  <div className="mt-0.5 flex items-center gap-2">
                    <span className="font-body text-[14px] font-extrabold text-brand-light">
                      ৳{inStockItems[0].price.toLocaleString('en-US')}
                    </span>
                    {inStockItems[0].old > inStockItems[0].price && (
                      <span className="font-body text-[11px] text-muted line-through">
                        ৳{inStockItems[0].old.toLocaleString('en-US')}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="relative z-10 mb-3.5 flex items-center gap-2 rounded-[12px] border border-emerald-300/80 bg-emerald-50/90 px-3 py-1.5 shadow-xs">
              <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-body text-[11.5px] font-bold text-emerald-800">
                {lang === 'en' ? 'In Stock — Limited Units' : 'স্টকে আছে — দ্রুত অর্ডার করুন'}
              </span>
            </div>

            <button
              onClick={() => handleAddSingleToCart(inStockItems[0])}
              className="relative z-10 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-info to-brand-light py-[11.5px] font-body text-[13.5px] font-bold text-white shadow-sh2 transition-all duration-brand hover:brightness-[1.03] active:scale-95"
            >
              <CartPlusIcon />
              <span>{lang === 'en' ? 'Add to Cart & Apply Coupon' : 'কার্টে যোগ ও কুপন দেখুন'}</span>
            </button>
          </>
        )}

        {/* ========================================================================= */}
        {/* ২. মাল্টিপল প্রোডাক্ট মোড (ক্লিন ও কম্প্যাক্ট লিস্ট)                         */}
        {/* ========================================================================= */}
        {isMultiple && (
          <>
            <div className="sleek-scrollbar relative z-10 my-3 max-h-[190px] overflow-y-auto space-y-2 pr-0.5">
              {inStockItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-2.5 rounded-[14px] border border-white/90 bg-white/80 p-2 shadow-xs backdrop-blur-md"
                >
                  <ItemThumbnail imgVal={(item.imgs || [''])[0]} />
                  <div className="min-w-0 flex-1">
                    <div className="line-clamp-1 font-body text-[12.5px] font-bold text-ink">
                      {item.name}
                    </div>
                    <div className="font-body text-[12px] font-extrabold text-brand-light">
                      ৳{item.price.toLocaleString('en-US')}
                    </div>
                  </div>
                  <button
                    onClick={() => handleAddSingleToCart(item)}
                    className="shrink-0 rounded-full border border-brand-light/40 bg-white px-2.5 py-1 font-body text-[11px] font-bold text-brand-light shadow-xs transition-colors hover:bg-brand-light hover:text-white active:scale-95"
                  >
                    {lang === 'en' ? 'Add' : 'যোগ'}
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={handleAddAllToCart}
              className="relative z-10 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-info to-brand-light py-[11.5px] font-body text-[13.5px] font-bold text-white shadow-sh2 transition-all duration-brand hover:brightness-[1.03] active:scale-95"
            >
              <CartPlusIcon />
              <span>{lang === 'en' ? 'Add All to Cart & Checkout' : 'সবগুলো কার্টে যোগ ও অর্ডার করুন'}</span>
            </button>
          </>
        )}

      </div>
    </div>
  );
}
