'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  isWishlisted, toggleWish, productHref,
  QUICK_ORDER_EVENT, QUICK_CART_EVENT, STOCK_NOTIFY_EVENT, WISHLIST_EVENT,
} from '@/lib/productData';
import type { Product, ProductSpecs } from '@/types';

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && !!window.matchMedia
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function getCardSpecs(p: Product): string {
  const specs = (p.specs || {}) as ProductSpecs & { _quick_keys?: string[] };
  const quickKeys = specs._quick_keys;
  let entries: [string, string][] = [];
  if (Array.isArray(quickKeys)) {
    quickKeys.forEach((k) => { if (specs[k] !== undefined) entries.push([k, specs[k]]); });
  } else {
    entries = Object.entries(specs).filter(([k]) => !k.startsWith('_'));
  }
  return entries.slice(0, 2).map(([k, v]) => `${k}: ${v}`).join(' • ');
}

function StarRating({ rating }: { rating: number }) {
  const r = Math.max(0, Math.min(5, rating || 4.5));
  const full = Math.floor(r);
  const partial = r - full;
  const empty = 5 - full - (partial > 0 ? 1 : 0);
  const pct = Math.round(partial * 100);
  return (
    <span className="text-[#F59E0B]">
      {Array.from({ length: full }).map((_, i) => <span key={'f' + i}>★</span>)}
      {partial > 0 && (
        <span className="relative inline-block text-[#E5E7EB]">
          ★
          <span className="absolute left-0 top-0 overflow-hidden text-[#F59E0B]" style={{ width: pct + '%' }}>★</span>
        </span>
      )}
      {Array.from({ length: empty }).map((_, i) => <span key={'e' + i} className="text-[#E5E7EB]">★</span>)}
    </span>
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
        className="block h-full w-full object-cover"
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
  const discBgColor = p.discountColor === 'green' ? '#16A34A' : '#FF6B00';
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
    <div className="relative flex flex-col overflow-hidden rounded-brand border-[1.5px] border-border-base bg-white transition-brand duration-brand hover:-translate-y-1 hover:border-transparent hover:shadow-sh3 active:scale-[.98] active:shadow-sh1">
      {sold ? (
        <div className="absolute left-2.5 top-2.5 z-[2] rounded-full bg-muted px-[9px] py-[3px] text-[10px] font-bold text-white">Sold Out</div>
      ) : p.badge && (
        <div className="absolute left-2.5 top-2.5 z-[2] animate-badge-hot-glow rounded-full bg-brand-primary px-[9px] py-[3px] text-[10px] font-bold text-white">
          {p.badge}
        </div>
      )}
      {showDiscBadge && (
        <div
          className="absolute left-2.5 z-[2] rounded-full px-2 py-[3px] text-[10px] font-bold text-white"
          style={{ top: p.badge ? '32px' : '10px', background: discBgColor }}
        >
          {discPct}% ছাড়
        </div>
      )}
      <div className="relative overflow-hidden">
        <div className="group flex aspect-square cursor-pointer items-center justify-center overflow-hidden bg-surface-muted text-[52px] transition-transform duration-[350ms] ease-out hover:scale-[1.04]" onClick={openProduct}>
          <ProdImg imgVal={(p.imgs || ['📦'])[0]} name={p.name} lazy={!isFirst} />
        </div>
        <button
          ref={wishBtnRef}
          className={`absolute right-2 top-2 z-[3] flex h-8 w-8 items-center justify-center rounded-full text-base shadow-[0_2px_8px_rgba(0,0,0,.12)] transition-brand duration-brand hover:scale-[1.15] ${wished ? 'bg-[#FFF0F0]' : 'bg-white/[.92]'} ${heartBeat ? 'animate-heartbeat' : ''}`}
          onClick={handleWish}
          onAnimationEnd={() => setHeartBeat(false)}
          title="Wishlist"
        >
          {wished ? '❤️' : '🤍'}
        </button>
      </div>
      <div className="flex flex-1 flex-col p-3 pb-4">
        <div className="mb-1 cursor-pointer text-[12.5px] font-semibold leading-[1.4]" onClick={openProduct}>{p.name}</div>
        <div className="mb-2.5 line-clamp-2 flex-1 text-[11px] leading-[1.5] text-muted">{getCardSpecs(p)}</div>
        <div className="mb-[5px] flex items-center gap-1 text-[11px]">
          <StarRating rating={p.rating || 4.5} />
          <span className="text-muted">{(p.rating || 4.5).toFixed(1)} ({reviewCount})</span>
        </div>
        <div className="mb-2.5 flex items-baseline gap-1.5">
          <span className="text-[15px] font-bold">৳{p.price.toLocaleString()}</span>
          <span className="text-[11px] text-muted line-through">৳{p.old.toLocaleString()}</span>
        </div>
        <div className="flex w-full items-center gap-1.5">
          {sold ? (
            <button
              className="relative flex h-10 w-full min-w-0 items-center justify-center overflow-hidden rounded-[9px] border-none bg-[#F59E0B] px-2.5 font-body text-[12.5px] font-bold text-white transition-brand duration-brand"
              onClick={(e) => handleCtaClick(e, () => window.dispatchEvent(
                new CustomEvent(STOCK_NOTIFY_EVENT, { detail: { id: p.id, name: p.name } }),
              ))}
            >
              🔔 স্টকে আসলে জানান
            </button>
          ) : (
            <>
              <button
                className="relative flex h-10 min-w-0 flex-1 items-center justify-center overflow-hidden whitespace-nowrap rounded-[9px] border-none bg-ink px-2.5 font-body text-[12.5px] font-bold text-white transition-brand duration-brand hover:bg-brand-primary"
                onClick={(e) => handleCtaClick(e, () => window.dispatchEvent(
                  new CustomEvent(QUICK_ORDER_EVENT, { detail: { id: p.id } }),
                ))}
              >
                ⚡ অর্ডার করুন
              </button>
              <button
                className="box-border flex h-10 w-10 shrink-0 items-center justify-center rounded-[9px] border-[1.5px] border-border-base bg-surface-muted font-body text-sm text-ink transition-brand duration-brand hover:bg-border-base"
                title="কার্টে যোগ করুন"
                onClick={() => window.dispatchEvent(new CustomEvent(QUICK_CART_EVENT, { detail: { id: p.id } }))}
              >
                🛒
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
