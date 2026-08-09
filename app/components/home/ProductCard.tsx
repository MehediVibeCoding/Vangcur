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
    <div className="rounded-[18px] bg-white p-1 shadow-[0_4px_14px_rgba(0,88,199,.12)] transition-brand duration-brand hover:-translate-y-1 hover:shadow-sh3 active:scale-[.98]">
      <div className="relative aspect-[0.57] overflow-hidden rounded-[15px] bg-surface-muted">
        <div className="absolute inset-0 cursor-pointer" onClick={openProduct}>
          <ProdImg imgVal={(p.imgs || ['📦'])[0]} name={p.name} lazy={!isFirst} />
        </div>

        {/* উপরের ~৭০% জায়গা স্বচ্ছ (ছবি স্পষ্ট), নিচের ~৩০%-এ ধীরে ধীরে গাঢ় হয়ে টেক্সট পড়ার মতো ব্যাকগ্রাউন্ড তৈরি হয় */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0) 60%, rgba(8,12,22,.55) 78%, rgba(5,7,14,.94) 100%)' }}
        />

        {sold ? (
          <div className="absolute left-2 top-2 z-[2] rounded-full bg-muted px-[9px] py-[3px] text-[10px] font-bold text-white">Sold Out</div>
        ) : p.badge && (
          <div className="absolute left-2 top-2 z-[2] animate-badge-hot-glow rounded-full bg-brand-primary px-[9px] py-[3px] text-[10px] font-bold text-white">
            {p.badge}
          </div>
        )}
        {showDiscBadge && (
          <div
            className="absolute left-2 z-[2] rounded-full px-2 py-[3px] text-[10px] font-bold text-white"
            style={{ top: p.badge && !sold ? '30px' : '8px', background: discBgColor }}
          >
            {discPct}% ছাড়
          </div>
        )}

        <button
          ref={wishBtnRef}
          className={`absolute right-2 top-2 z-[3] flex h-8 w-8 items-center justify-center rounded-full text-base backdrop-blur-md transition-brand duration-brand hover:scale-[1.15] ${wished ? 'bg-[#FFF0F0]/95' : 'border border-white/50 bg-white/30'} ${heartBeat ? 'animate-heartbeat' : ''}`}
          onClick={handleWish}
          onAnimationEnd={() => setHeartBeat(false)}
          title="Wishlist"
        >
          {wished ? '❤️' : '🤍'}
        </button>

        <div className="absolute inset-x-0 bottom-0 z-[2] p-2.5">
          <div className="line-clamp-1 cursor-pointer text-[12px] font-extrabold leading-tight text-white" onClick={openProduct}>{p.name}</div>
          <div className="mt-[3px] flex items-center gap-1 text-[10px]">
            <StarRating rating={p.rating || 4.5} />
            <span className="text-white/65">{(p.rating || 4.5).toFixed(1)} ({reviewCount})</span>
          </div>
          <div className="mt-[2px] flex items-baseline gap-1.5">
            <span className="text-[14.5px] font-extrabold text-white">৳{p.price.toLocaleString()}</span>
            <span className="text-[10.5px] text-white/50 line-through">৳{p.old.toLocaleString()}</span>
          </div>
          <div className="mt-1.5 flex w-full items-center gap-1.5">
            {sold ? (
              <button
                className="relative flex h-9 w-full min-w-0 items-center justify-center overflow-hidden rounded-full border-none bg-[#F59E0B] px-2.5 font-body text-[11px] font-bold text-white transition-brand duration-brand"
                onClick={(e) => handleCtaClick(e, () => window.dispatchEvent(
                  new CustomEvent(STOCK_NOTIFY_EVENT, { detail: { id: p.id, name: p.name } }),
                ))}
              >
                🔔 স্টকে আসলে জানান
              </button>
            ) : (
              <>
                <button
                  className="relative flex h-9 min-w-0 flex-1 items-center justify-center overflow-hidden whitespace-nowrap rounded-full border-none bg-white px-2.5 font-body text-[11px] font-bold text-brand-primary transition-brand duration-brand hover:bg-brand-primary hover:text-white"
                  onClick={(e) => handleCtaClick(e, () => window.dispatchEvent(
                    new CustomEvent(QUICK_ORDER_EVENT, { detail: { id: p.id } }),
                  ))}
                >
                  ⚡ অর্ডার করুন
                </button>
                <button
                  className="box-border flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/50 bg-white/15 font-body text-sm text-white backdrop-blur-md transition-brand duration-brand hover:bg-white/30"
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
    </div>
  );
}
