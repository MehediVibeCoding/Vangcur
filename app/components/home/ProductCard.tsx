// [REPLACE] ফাইলের পাথ: app/components/home/ProductCard.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  productHref,
  startQuickOrder, QUICK_CART_EVENT,
} from '@/lib/productData';
import { useWishlistStore } from '@/lib/store/wishlistStore';
import { WISHLIST_FLY_EVENT } from '@/lib/uiEvents';
import { optimizeCloudinaryUrl } from '@/lib/cloudinaryUrl';
import { useT } from '@/lib/i18n/useT';
import type { Product } from '@/types';

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && !!window.matchMedia
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function StarRating({ rating }: { rating: number }) {
  const r = Math.max(0, Math.min(5, rating || 4.5));
  const full = Math.floor(r);
  const partial = r - full;
  const empty = 5 - full - (partial > 0 ? 1 : 0);
  const pct = Math.round(partial * 100);
  return (
    <span className="text-[#FFC530]">
      {Array.from({ length: full }).map((_, i) => <span key={'f' + i}>★</span>)}
      {partial > 0 && (
        <span className="relative inline-block text-white/30">
          ★
          <span className="absolute left-0 top-0 overflow-hidden text-[#FFC530]" style={{ width: pct + '%' }}>★</span>
        </span>
      )}
      {Array.from({ length: empty }).map((_, i) => <span key={'e' + i} className="text-white/30">★</span>)}
    </span>
  );
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="52%" height="52%" viewBox="0 0 24 24" fill={filled ? '#FF5A6E' : 'none'} stroke={filled ? '#FF5A6E' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
    </svg>
  );
}

function CartIcon() {
  return (
    <svg width="46%" height="46%" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
  );
}

function ProdImg({ imgVal, name, lazy }: { imgVal?: string; name: string; lazy?: boolean }) {
  const [broken, setBroken] = useState(false);
  const isUrl = typeof imgVal === 'string' && (imgVal.startsWith('http://') || imgVal.startsWith('https://'));
  if (!imgVal) return <span className="text-[52px]">📦</span>;
  if (isUrl && !broken) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={optimizeCloudinaryUrl(imgVal, 380)}
        alt={name || ''}
        loading={lazy ? 'lazy' : 'eager'}
        fetchPriority={lazy ? undefined : 'high'}
        decoding="async"
        draggable={false}
        onContextMenu={(e) => e.preventDefault()}
        className="block h-full w-full select-none object-cover [-webkit-touch-callout:none]"
        onError={() => setBroken(true)}
      />
    );
  }
  if (isUrl && broken) return <span className="text-[52px]">📦</span>;
  return <span className="text-[52px]">{imgVal}</span>;
}

interface ProductCardProps {
  prod: Product;
  isFirst?: boolean;
}

export default function ProductCard({ prod: p, isFirst }: ProductCardProps) {
  const { lang } = useT();
  const router = useRouter();
  const rawWished = useWishlistStore((s) => s.wishlist.some((x) => String(x.id) === String(p.id)));
  const [wished, setWished] = useState(false);
  const [heartBeat, setHeartBeat] = useState(false);
  const wishBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setWished(rawWished);
  }, [rawWished]);

  const sold = p.stock <= 0;
  const discPct = p.old > p.price ? Math.round((1 - p.price / p.old) * 100) : 0;
  const showDiscBadge = discPct >= 5 && !sold;
  const reviewCount = Math.floor((Number(p.id) || 1) * 37 + p.stock * 13) % 80 + 20;
  const href = productHref(p);

  const handleWish = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const added = useWishlistStore.getState().toggleWish(p);
    if (!prefersReducedMotion()) {
      setHeartBeat(false);
      requestAnimationFrame(() => setHeartBeat(true));
    }
    if (added && wishBtnRef.current) {
      const r = wishBtnRef.current.getBoundingClientRect();
      window.dispatchEvent(new CustomEvent(WISHLIST_FLY_EVENT, {
        detail: { x: r.left + r.width / 2, y: r.top + r.height / 2 },
      }));
    }
  };

  const handleCtaClick = (e: React.MouseEvent<HTMLButtonElement>, action: () => void) => {
    e.preventDefault();
    e.stopPropagation();
    if (!prefersReducedMotion()) {
      const btn = e.currentTarget;
      const r = document.createElement('span');
      r.className = 'pointer-events-none absolute -ml-2.5 -mt-2.5 h-5 w-5 rounded-full bg-white/45 animate-ripple';
      const rect = btn.getBoundingClientRect();
      r.style.left = (e.clientX - rect.left) + 'px';
      r.style.top = (e.clientY - rect.top) + 'px';
      btn.appendChild(r);
      setTimeout(() => r.remove(), 600);
    }
    action();
  };

  return (
    <div className="rounded-[18px] bg-white p-1 shadow-[0_4px_14px_rgba(0,88,199,.12)] transition-transform duration-brand md:hover:-translate-y-1 md:hover:shadow-sh3 active:scale-[.98] [transform:translateZ(0)]">
      <div className="relative aspect-[0.57] overflow-hidden rounded-[15px] bg-surface-muted">
        <Link href={href} prefetch={true} className="absolute inset-0 block cursor-pointer">
          <ProdImg imgVal={(p.imgs || ['📦'])[0]} name={p.name} lazy={!isFirst} />
        </Link>

        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0) 60%, rgba(8,12,22,.55) 78%, rgba(5,7,14,.94) 100%)' }}
        />

        {sold ? (
          /* ১ম ছবির মতো নিখুঁত সফট স্লেট-অ্যাশ কালারের Sold Out ব্যাজ */
          <div className="absolute left-[4.5%] top-[4.5%] z-[2] rounded-full bg-[#5A6578] px-2.5 py-1 text-[10.5px] font-bold text-white shadow-xs">
            {lang === 'en' ? 'Sold Out' : 'স্টক শেষ'}
          </div>
        ) : p.badge && (
          <div className="absolute left-[4.5%] top-[4.5%] z-[2] animate-badge-hot-glow rounded-full bg-brand-light px-2.5 py-1 text-[10px] font-bold text-white shadow-sh1">
            {p.badge}
          </div>
        )}

        <button
          ref={wishBtnRef}
          className={`absolute right-[4.5%] top-[4.5%] z-[3] flex h-7 w-7 shrink-0 items-center justify-center rounded-full backdrop-blur-[6px] transition-transform duration-brand hover:scale-[1.15] sm:h-8 sm:w-8 ${wished ? 'bg-white/95 text-[#FF5A6E]' : 'border border-white/50 bg-white/40 text-white'} ${heartBeat ? 'animate-heartbeat' : ''}`}
          onClick={handleWish}
          onAnimationEnd={() => setHeartBeat(false)}
          title="Wishlist"
          aria-label="Wishlist"
        >
          <span className="flex h-full w-full items-center justify-center"><HeartIcon filled={wished} /></span>
        </button>

        <div className="absolute inset-x-0 bottom-0 z-[2] p-2 sm:p-3">
          <Link
            href={href}
            prefetch={true}
            title={p.name}
            className="block w-full cursor-pointer truncate overflow-hidden text-ellipsis whitespace-nowrap text-[11px] font-extrabold leading-tight text-white no-underline hover:underline sm:text-sm xl:text-xs"
          >
            {p.name}
          </Link>
          <div className="mt-0.5 flex items-center gap-1 text-[9px] sm:mt-1 sm:text-[11px]">
            <StarRating rating={p.rating || 4.5} />
            <span className="text-white/70">{(p.rating || 4.5).toFixed(1)} ({reviewCount})</span>
          </div>
          <div className="mt-0.5 flex items-baseline gap-1 sm:gap-1.5">
            <span className="text-sm font-extrabold text-white sm:text-lg xl:text-sm">৳{p.price.toLocaleString('en-US')}</span>
            {p.old > p.price && (
              <>
                <span className="text-[10px] text-white/50 line-through sm:text-xs">৳{p.old.toLocaleString('en-US')}</span>
                {showDiscBadge && (
                  <span className="text-[10px] font-bold text-[#FF9142] sm:text-xs">-{discPct}%</span>
                )}
              </>
            )}
          </div>

          <div className="mt-1 flex w-full items-center gap-1 sm:mt-1.5 sm:gap-1.5">
            {sold ? (
              /* গ্রিড কার্ডে পরিষ্কার সফট স্লেট-অ্যাশ ডিসেবলড বাটন */
              <button
                type="button"
                disabled
                className="flex h-8 w-full min-w-0 items-center justify-center rounded-full border border-white/20 bg-[#5A6578] font-body text-[11.5px] font-bold text-white shadow-xs cursor-not-allowed select-none sm:h-9 sm:text-xs lg:h-10"
              >
                {lang === 'en' ? 'Out of Stock' : 'স্টক শেষ'}
              </button>
            ) : (
              <>
                <button
                  className="box-border flex aspect-square h-8 shrink-0 items-center justify-center rounded-full border border-white/50 bg-white/25 text-white backdrop-blur-[6px] transition-colors hover:bg-white/35 sm:h-9 lg:h-10"
                  title="Add to Cart"
                  aria-label="Add to Cart"
                  onClick={(e) => handleCtaClick(e, () => window.dispatchEvent(new CustomEvent(QUICK_CART_EVENT, { detail: { id: p.id } })))}
                >
                  <CartIcon />
                </button>
                <button
                  className="relative flex h-8 min-w-0 flex-1 items-center justify-center overflow-hidden whitespace-nowrap rounded-full border border-white/60 font-body text-[12px] font-extrabold text-brand-primary backdrop-blur-[8px] shadow-sh1 transition-all duration-brand hover:brightness-95 active:scale-95 sm:h-9 sm:text-[13px] lg:h-10"
                  style={{
                    background: 'linear-gradient(115deg, rgba(255,255,255,.94) 0%, rgba(195,222,252,.9) 38%, rgba(255,255,255,.92) 64%, rgba(68,167,252,.35) 100%)',
                  }}
                  onClick={(e) => handleCtaClick(e, () => startQuickOrder(router, p, 1))}
                >
                  {lang === 'en' ? 'Order Now' : 'অর্ডার করুন'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
