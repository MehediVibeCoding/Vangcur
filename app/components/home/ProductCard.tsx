'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  productHref,
  QUICK_ORDER_EVENT, QUICK_CART_EVENT, STOCK_NOTIFY_EVENT,
} from '@/lib/productData';
import { useWishlistStore } from '@/lib/store/wishlistStore';
import { optimizeCloudinaryUrl } from '@/lib/cloudinaryUrl';
import { useT } from '@/lib/i18n/useT';
import type { Product } from '@/types';

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && !!window.matchMedia
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// আগে card-এর নিজের pixel width অনুযায়ী ফন্ট/প্যাডিং স্কেল করার জন্য প্রতিটা
// ProductCard-এ একটা ResizeObserver বসানো ছিল (useCardWidth + cq() হেল্পার)।
// পিঞ্চ-জুম বা window resize-এর সময় এই ডজনখানেক observer একসাথে ফায়ার হয়ে
// React state আপডেট করত, যা প্রতিটা কার্ডের জন্য আলাদা layout recalculation +
// repaint ট্রিগার করত — এটাই মোবাইলে pinch-zoom স্টেপ-বাই-স্টেপ রিপেইন্ট/জ্যাঙ্কের
// একটা বড় কারণ ছিল।
//
// এখন কোনো runtime JS observer নেই — নিচের সব সাইজ স্ট্যাটিক Tailwind
// breakpoint ক্লাস (base/sm/xl) দিয়ে করা, যেগুলো grid-এর column breakpoint
// (2 → 2 → 3 → 4 → 6 কলাম) অনুযায়ী আগের cq() ভ্যালুগুলোর কাছাকাছি রাখা হয়েছে।
// এতে zoom/resize-এর সময় শুধু CSS media query re-evaluate হয় — কোনো JS
// measurement, state update, বা extra repaint হয় না।

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

// Navbar-এ যে হার্ট (উইশলিস্ট) আইকনটা ব্যবহার হয়েছে, ঠিক সেই একই SVG পাথ —
// ইমোজির বদলে আসল ভেক্টর আইকন, তাই ডিভাইস/ফন্ট যাই হোক শেপ সবসময় নিখুঁত গোল থাকবে
function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="52%" height="52%" viewBox="0 0 24 24" fill={filled ? '#FF5A6E' : 'none'} stroke={filled ? '#FF5A6E' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
    </svg>
  );
}

// Navbar-এর কার্ট আইকনের সেই একই SVG পাথ
function CartIcon() {
  return (
    <svg width="46%" height="46%" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
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
        src={optimizeCloudinaryUrl(imgVal, 500)}
        alt={name || ''}
        loading={lazy ? 'lazy' : 'eager'}
        // প্রথম প্রোডাক্ট কার্ডের ছবিটাই LCP element — এটাকে fetchPriority=high
        // দিয়ে ব্রাউজারকে বলে দেওয়া হচ্ছে এটা আগে ফেচ করতে (font/JS চাংকগুলোর
        // সাথে প্রতিযোগিতায় পিছিয়ে না পড়ে)
        fetchPriority={lazy ? undefined : 'high'}
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
  const { t } = useT();
  const router = useRouter();
  const wished = useWishlistStore((s) => s.wishlist.some((x) => String(x.id) === String(p.id)));
  const [heartBeat, setHeartBeat] = useState(false);
  const wishBtnRef = useRef<HTMLButtonElement>(null);

  const sold = p.stock <= 0;
  const discPct = p.old > p.price ? Math.round((1 - p.price / p.old) * 100) : 0;
  const showDiscBadge = discPct >= 5 && !sold;
  const reviewCount = Math.floor((Number(p.id) || 1) * 37 + p.stock * 13) % 80 + 20;

  const openProduct = () => {
    router.push(productHref(p));
  };

  const handleWish = () => {
    useWishlistStore.getState().toggleWish(p);
    if (!prefersReducedMotion()) {
      setHeartBeat(false);
      requestAnimationFrame(() => setHeartBeat(true));
    }
  };

  const handleCtaClick = (e: React.MouseEvent<HTMLButtonElement>, action: () => void) => {
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
    <div className="rounded-[18px] bg-white p-1 shadow-[0_4px_14px_rgba(0,88,199,.12)] transition-brand duration-brand hover:-translate-y-1 hover:shadow-sh3 active:scale-[.98]">
      <div className="relative aspect-[0.57] overflow-hidden rounded-[15px] bg-surface-muted">
        <div className="absolute inset-0 cursor-pointer" onClick={openProduct}>
          <ProdImg imgVal={(p.imgs || ['📦'])[0]} name={p.name} lazy={!isFirst} />
        </div>

        {/* কালো টিন্ট — উপরের ৭০% স্বচ্ছ, নিচের ৩০% গাঢ় */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0) 60%, rgba(8,12,22,.55) 78%, rgba(5,7,14,.94) 100%)' }}
        />

        {sold ? (
          <div className="absolute left-[4.5%] top-[4.5%] z-[2] rounded-full bg-muted px-2 py-1 text-[10px] font-bold text-white sm:px-2.5">Sold Out</div>
        ) : p.badge && (
          <div className="absolute left-[4.5%] top-[4.5%] z-[2] animate-badge-hot-glow rounded-full bg-brand-light px-2 py-1 text-[10px] font-bold text-white sm:px-2.5">
            {p.badge}
          </div>
        )}

        <button
          ref={wishBtnRef}
          className={`absolute right-[4.5%] top-[4.5%] z-[3] flex h-7 w-7 shrink-0 items-center justify-center rounded-full backdrop-blur-[8px] transition-brand duration-brand hover:scale-[1.15] sm:h-8 sm:w-8 ${wished ? 'bg-white/95' : 'border border-white/50 bg-white/40'} ${heartBeat ? 'animate-heartbeat' : ''}`}
          style={{ color: wished ? undefined : '#fff' }}
          onClick={handleWish}
          onAnimationEnd={() => setHeartBeat(false)}
          title="Wishlist"
        >
          <span className="flex h-full w-full items-center justify-center"><HeartIcon filled={wished} /></span>
        </button>

        <div className="absolute inset-x-0 bottom-0 z-[2] p-2 sm:p-3">
          <div
            className="line-clamp-1 cursor-pointer text-[10px] font-extrabold leading-tight text-white sm:text-sm xl:text-xs"
            onClick={openProduct}
          >
            {p.name}
          </div>
          <div className="mt-0.5 flex items-center gap-1 text-[9px] sm:mt-1 sm:text-[11px]">
            <StarRating rating={p.rating || 4.5} />
            <span className="text-white/65">{(p.rating || 4.5).toFixed(1)} ({reviewCount})</span>
            {showDiscBadge && (
              <span className="font-bold text-[#FF9142]">-{discPct}%</span>
            )}
          </div>
          <div className="mt-0.5 flex items-baseline gap-1 sm:gap-1.5">
            <span className="text-sm font-extrabold text-white sm:text-lg xl:text-sm">৳{p.price.toLocaleString('en-US')}</span>
            <span className="text-[10px] text-white/50 line-through sm:text-xs">৳{p.old.toLocaleString('en-US')}</span>
          </div>
          <div className="mt-1 flex w-full items-center gap-1 sm:mt-1.5 sm:gap-1.5">
            {sold ? (
              <button
                className="relative flex h-8 w-full min-w-0 items-center justify-center overflow-hidden rounded-full border-none bg-[#F59E0B] font-body text-[10px] font-bold text-white transition-brand duration-brand sm:h-9 sm:text-xs lg:h-10"
                onClick={(e) => handleCtaClick(e, () => window.dispatchEvent(
                  new CustomEvent(STOCK_NOTIFY_EVENT, { detail: { id: p.id, name: p.name } }),
                ))}
              >
                🔔 {t('স্টকে আসলে জানান')}
              </button>
            ) : (
              <>
                <button
                  className="box-border flex aspect-square h-8 shrink-0 items-center justify-center rounded-full border border-white/50 bg-white/25 text-white backdrop-blur-[8px] transition-brand duration-brand hover:bg-white/30 sm:h-9 lg:h-10"
                  title={t('কার্টে যোগ করুন')}
                  onClick={() => window.dispatchEvent(new CustomEvent(QUICK_CART_EVENT, { detail: { id: p.id } }))}
                >
                  <CartIcon />
                </button>
                <button
                  className="relative flex h-8 min-w-0 flex-1 items-center justify-center overflow-hidden whitespace-nowrap rounded-full border border-white/60 font-body text-[10px] font-bold text-brand-light backdrop-blur-[8px] transition-brand duration-brand hover:brightness-95 sm:h-9 sm:text-xs lg:h-10"
                  style={{
                    background: 'linear-gradient(115deg, rgba(255,255,255,.92) 0%, rgba(195,222,252,.85) 38%, rgba(255,255,255,.9) 64%, rgba(0,94,252,.35) 100%)',
                  }}
                  onClick={(e) => handleCtaClick(e, () => window.dispatchEvent(
                    new CustomEvent(QUICK_ORDER_EVENT, { detail: { id: p.id } }),
                  ))}
                >
                  {t('অর্ডার করুন')}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
