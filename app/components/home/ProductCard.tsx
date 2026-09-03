'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'motion/react';
import {
  productHref,
  startQuickOrder,
  QUICK_CART_EVENT,
} from '@/lib/productData';
import { useWishlistStore } from '@/lib/store/wishlistStore';
import { useCartStore } from '@/lib/store/cartStore';
import { showToast } from '@/lib/toast';
import { WISHLIST_FLY_EVENT } from '@/lib/uiEvents';
import { optimizeCloudinaryUrl } from '@/lib/cloudinaryUrl';
import { useT } from '@/lib/i18n/useT';
import type { Product } from '@/types';

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
  index?: number;
}

export default function ProductCard({ prod: p, isFirst, index = 0 }: ProductCardProps) {
  const { t, lang } = useT();
  const router = useRouter();
  const rawWished = useWishlistStore((s) => s.wishlist.some((x) => String(x.id) === String(p.id)));
  const [wished, setWished] = useState(false);
  const wishBtnRef = useRef<HTMLButtonElement>(null);
  const [shimmerPlay, setShimmerPlay] = useState(false);
  const shimmerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setWished(rawWished);
  }, [rawWished]);

  useEffect(() => () => {
    if (shimmerTimerRef.current) clearTimeout(shimmerTimerRef.current);
  }, []);

  // ক্লাস আগে থেকে on থাকলেও অ্যানিমেশন যেন আবার নতুন করে শুরু হয় (double rAF দিয়ে রিসেট)
  const triggerShimmer = () => {
    setShimmerPlay(false);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setShimmerPlay(true));
    });
  };

  // একবার শুধু — কার্ড স্ক্রলে ভিউতে ঢোকার একটু পরে Order Now বাটনে শাইন খেলবে
  const handleEntranceReveal = () => {
    shimmerTimerRef.current = setTimeout(triggerShimmer, 500);
  };

  // কার্ডে ক্লিক করে প্রোডাক্ট পেজে যাওয়ার মুহূর্তে একই শাইন আবার খেলবে, নেভিগেশনের সাথে সমান্তরালে
  const handleCardNavigateClick = () => {
    triggerShimmer();
  };

  // /checkout GlobalOverlays.tsx O Navbar.tsx-e page-level e ekbar-i prefetch hoye jay,
  // tai protita card alada kore prefetch korche na -- hover/touch e intent-based prefetch niche royei geche

  const sold = p.stock <= 0;
  const discPct = p.old > p.price ? Math.round((1 - p.price / p.old) * 100) : 0;
  const showDiscBadge = discPct >= 5 && !sold;
  const reviewCount = Math.floor((Number(p.id) || 1) * 37 + p.stock * 13) % 80 + 20;
  const href = productHref(p);

  const handleWish = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const added = useWishlistStore.getState().toggleWish(p);
    if (added && wishBtnRef.current) {
      const r = wishBtnRef.current.getBoundingClientRect();
      window.dispatchEvent(new CustomEvent(WISHLIST_FLY_EVENT, {
        detail: { x: r.left + r.width / 2, y: r.top + r.height / 2 },
      }));
    }
  };

  const handleAddToCartDirect = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (sold) return;

    const res = useCartStore.getState().addToCart([p], p.id, 1);
    if (res.ok) {
      showToast(t('কার্টে যোগ হয়েছে'));
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent(QUICK_CART_EVENT, { detail: { id: p.id } }));
      }
    } else if (res.reason === 'stock') {
      showToast(t('স্টক শেষ!'));
    }
  };

  const handleOrderNowDirect = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (sold) return;
    startQuickOrder(router, p, 1);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.08, margin: '0px 0px -40px 0px' }}
      transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
      onViewportEnter={handleEntranceReveal}
      onMouseEnter={() => router.prefetch('/checkout')}
      onTouchStart={() => router.prefetch('/checkout')}
      className="card-hover-glow group rounded-[18px] bg-white p-1 shadow-[0_4px_14px_rgba(0,88,199,.12)] transition-transform duration-brand active:scale-[.98] [transform:translateZ(0)]"
    >
      <div className="relative aspect-[0.57] overflow-hidden rounded-[14px] bg-surface-muted">
        <Link
          href={href}
          prefetch={true}
          onClick={handleCardNavigateClick}
          className="absolute inset-0 block cursor-pointer transition-transform duration-500 ease-[cubic-bezier(0.2,0.8,0.2,1)] group-hover:scale-[1.06]"
        >
          <ProdImg imgVal={(p.imgs || ['📦'])[0]} name={p.name} lazy={!isFirst && index >= 2} />
        </Link>

        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0) 60%, rgba(8,12,22,.55) 78%, rgba(5,7,14,.94) 100%)' }}
        />

        {sold ? (
          <div className="absolute left-[4.5%] top-[4.5%] z-[2] rounded-full bg-[#5A6578] px-2.5 py-1 text-[10.5px] font-bold text-white shadow-xs">
            {lang === 'en' ? 'Sold Out' : 'স্টক শেষ'}
          </div>
        ) : p.badge && (
          <div className="absolute left-[4.5%] top-[4.5%] z-[2] animate-badge-hot-glow rounded-full bg-brand-light px-2.5 py-1 text-[10px] font-bold text-white shadow-sh1">
            {p.badge}
          </div>
        )}

        <motion.button
          ref={wishBtnRef}
          whileTap={{ scale: 0.8 }}
          transition={{ type: 'spring', stiffness: 500, damping: 24 }}
          className={`absolute right-[4.5%] top-[4.5%] z-[3] flex h-7 w-7 shrink-0 items-center justify-center rounded-full backdrop-blur-[6px] transition-transform duration-brand hover:scale-[1.15] sm:h-8 sm:w-8 ${
            wished ? 'bg-white/95 text-[#FF5A6E]' : 'border border-white/50 bg-white/40 text-white'
          }`}
          onClick={handleWish}
          title="Wishlist"
          aria-label="Wishlist"
        >
          <span className="flex h-full w-full items-center justify-center">
            <HeartIcon filled={wished} />
          </span>
        </motion.button>

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
              <button
                type="button"
                disabled
                className="flex h-8 w-full min-w-0 items-center justify-center rounded-full border border-white/20 bg-[#5A6578] font-body text-[11.5px] font-bold text-white shadow-xs cursor-not-allowed select-none sm:h-9 sm:text-xs lg:h-10"
              >
                {lang === 'en' ? 'Out of Stock' : 'স্টক শেষ'}
              </button>
            ) : (
              <>
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.88 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 24 }}
                  className="box-border flex aspect-square h-8 shrink-0 items-center justify-center rounded-full border border-white/50 bg-white/25 text-white backdrop-blur-[6px] transition-colors hover:bg-white/35 sm:h-9 lg:h-10"
                  title={t('কার্টে যোগ করুন')}
                  aria-label={t('কার্টে যোগ করুন')}
                  onClick={handleAddToCartDirect}
                >
                  <CartIcon />
                </motion.button>
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 24 }}
                  className={`shimmer-sheen-oneshot${shimmerPlay ? ' shimmer-sheen-play' : ''} relative flex h-8 min-w-0 flex-1 items-center justify-center overflow-hidden whitespace-nowrap rounded-full border border-brand-light/35 font-body text-[12px] font-extrabold text-brand-primary backdrop-blur-[8px] shadow-sh1 transition-all duration-brand hover:brightness-95 sm:h-9 sm:text-[13px] lg:h-10`}
                  style={{
                    background: 'linear-gradient(115deg, rgba(255,255,255,.95) 0%, rgba(195,222,252,.7) 55%, rgba(68,167,252,.4) 100%)',
                  }}
                  onClick={handleOrderNowDirect}
                >
                  {lang === 'en' ? 'Order Now' : 'অর্ডার করুন'}
                </motion.button>
              </>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
