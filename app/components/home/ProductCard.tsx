'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  isWishlisted, toggleWish, productHref,
  QUICK_ORDER_EVENT, QUICK_CART_EVENT, STOCK_NOTIFY_EVENT, WISHLIST_EVENT,
} from '@/lib/productData';
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

// Navbar-এর সেই একই হার্ট SVG পাথ — ইমোজির বদলে vector আইকন, তাই সব ডিভাইসে নিখুঁত গোল
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
        src={imgVal}
        alt={name || ''}
        loading={lazy ? 'lazy' : undefined}
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
  const router = useRouter();
  const [wished, setWished] = useState(() => isWishlisted(p.id));
  const [heartBeat, setHeartBeat] = useState(false);
  const wishBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handler = () => setWished(isWishlisted(p.id));
    window.addEventListener(WISHLIST_EVENT, handler);
    return () => window.removeEventListener(WISHLIST_EVENT, handler);
  }, [p.id]);

  const sold = p.stock <= 0;
  const discPct = p.old > p.price ? Math.round((1 - p.price / p.old) * 100) : 0;
  const showDiscBadge = discPct >= 5 && !sold;
  const reviewCount = Math.floor((Number(p.id) || 1) * 37 + p.stock * 13) % 80 + 20;

  const openProduct = () => {
    router.push(productHref(p));
  };

  const handleWish = () => {
    const nowWished = toggleWish(p);
    setWished(nowWished);
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
          <div className="absolute left-2 top-2 z-[2] rounded-full bg-muted px-2.5 py-[3px] text-[10px] font-bold text-white">Sold Out</div>
        ) : p.badge && (
          <div className="absolute left-2 top-2 z-[2] animate-badge-hot-glow rounded-full bg-brand-primary px-2.5 py-[3px] text-[10px] font-bold text-white">
            {p.badge}
          </div>
        )}

        <button
          ref={wishBtnRef}
          className={`absolute right-2 top-2 z-[3] flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-brand duration-brand hover:scale-[1.15] max-[380px]:h-7 max-[380px]:w-7 ${wished ? 'bg-white/95' : 'border border-white/55 bg-white/40'} ${heartBeat ? 'animate-heartbeat' : ''}`}
          style={{ color: wished ? undefined : '#fff' }}
          onClick={handleWish}
          onAnimationEnd={() => setHeartBeat(false)}
          title="Wishlist"
        >
          <HeartIcon filled={wished} />
        </button>

        <div className="absolute inset-x-0 bottom-0 z-[2] p-2.5 max-[380px]:p-2">
          <div className="line-clamp-1 cursor-pointer text-[12.5px] font-extrabold leading-tight text-white max-[380px]:text-[11px]" onClick={openProduct}>
            {p.name}
          </div>
          <div className="mt-1 flex items-center gap-1 text-[10.5px] max-[380px]:text-[9.5px]">
            <StarRating rating={p.rating || 4.5} />
            <span className="text-white/65">{(p.rating || 4.5).toFixed(1)} ({reviewCount})</span>
            {showDiscBadge && <span className="font-bold text-[#FF9142]">-{discPct}%</span>}
          </div>
          <div className="mt-0.5 flex items-baseline gap-1.5">
            <span className="text-[14.5px] font-extrabold text-white max-[380px]:text-[13px]">৳{p.price.toLocaleString()}</span>
            <span className="text-[10.5px] text-white/50 line-through max-[380px]:text-[9.5px]">৳{p.old.toLocaleString()}</span>
          </div>
          <div className="mt-2 flex w-full items-center gap-1.5 max-[380px]:mt-1.5">
            {sold ? (
              <button
                className="relative flex h-9 w-full min-w-0 items-center justify-center overflow-hidden rounded-full border-none bg-[#F59E0B] font-body text-[11px] font-bold text-white transition-brand duration-brand max-[380px]:h-8 max-[380px]:text-[10px]"
                onClick={(e) => handleCtaClick(e, () => window.dispatchEvent(
                  new CustomEvent(STOCK_NOTIFY_EVENT, { detail: { id: p.id, name: p.name } }),
                ))}
              >
                🔔 স্টকে আসলে জানান
              </button>
            ) : (
              <>
                <button
                  className="box-border flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/55 bg-white/25 text-white transition-brand duration-brand hover:bg-white/40 max-[380px]:h-8 max-[380px]:w-8"
                  title="কার্টে যোগ করুন"
                  onClick={() => window.dispatchEvent(new CustomEvent(QUICK_CART_EVENT, { detail: { id: p.id } }))}
                >
                  <CartIcon />
                </button>
                <button
                  className="relative flex h-9 min-w-0 flex-1 items-center justify-center overflow-hidden whitespace-nowrap rounded-full border border-white/60 font-body text-[11px] font-bold text-brand-primary transition-brand duration-brand hover:brightness-95 max-[380px]:h-8 max-[380px]:text-[10px]"
                  style={{ background: 'linear-gradient(115deg, rgba(255,255,255,.92) 0%, rgba(195,222,252,.85) 38%, rgba(255,255,255,.9) 64%, rgba(0,94,252,.35) 100%)' }}
                  onClick={(e) => handleCtaClick(e, () => window.dispatchEvent(
                    new CustomEvent(QUICK_ORDER_EVENT, { detail: { id: p.id } }),
                  ))}
                >
                  অর্ডার করুন
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
