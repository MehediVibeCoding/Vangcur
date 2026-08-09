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
      {/*
        container-type: inline-size — এই প্যানেলটাকে নিজেই একটা "container" বানানো
        হলো, যাতে ভিতরের সবকিছুর সাইজ (নিচে cqw এককে লেখা) এই প্যানেলের নিজের
        width অনুযায়ী স্কেল করে — পুরো ভিউপোর্ট/স্ক্রিন width অনুযায়ী না। এতে
        ছোট স্ক্রিনের ফোনেও (যেখানে কার্ড সরু হয়ে যায়) টেক্সট/বাটন ব্লকটা কার্ডের
        ঠিক ৩০%-ই থাকে — বড় স্ক্রিনের মতো একই অনুপাত, কোনো device-ভেদে হেরফের হয় না।
      */}
      <div className="relative aspect-[0.57] overflow-hidden rounded-[15px] bg-surface-muted" style={{ containerType: 'inline-size' }}>
        <div className="absolute inset-0 cursor-pointer" onClick={openProduct}>
          <ProdImg imgVal={(p.imgs || ['📦'])[0]} name={p.name} lazy={!isFirst} />
        </div>

        {/* কালো টিন্ট — উপরের ৭০% স্বচ্ছ, নিচের ৩০% গাঢ় */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0) 60%, rgba(8,12,22,.55) 78%, rgba(5,7,14,.94) 100%)' }}
        />

        {sold ? (
          <div className="absolute left-[4.5%] top-[4.5%] z-[2] rounded-full bg-muted text-white" style={{ padding: 'clamp(3px,1.6cqw,6px) clamp(7px,3.8cqw,12px)', fontSize: 'clamp(9px,5cqw,11px)', fontWeight: 700 }}>Sold Out</div>
        ) : p.badge && (
          <div className="absolute left-[4.5%] top-[4.5%] z-[2] animate-badge-hot-glow rounded-full bg-brand-primary text-white" style={{ padding: 'clamp(3px,1.6cqw,6px) clamp(7px,3.8cqw,12px)', fontSize: 'clamp(9px,5cqw,11px)', fontWeight: 700 }}>
            {p.badge}
          </div>
        )}

        <button
          ref={wishBtnRef}
          className={`absolute right-[4.5%] top-[4.5%] z-[3] aspect-square shrink-0 rounded-full backdrop-blur-md transition-brand duration-brand hover:scale-[1.15] ${wished ? 'bg-white/95' : 'border border-white/50 bg-white/30'} ${heartBeat ? 'animate-heartbeat' : ''}`}
          style={{ width: 'clamp(26px,16cqw,34px)', color: wished ? undefined : '#fff' }}
          onClick={handleWish}
          onAnimationEnd={() => setHeartBeat(false)}
          title="Wishlist"
        >
          <span className="flex h-full w-full items-center justify-center"><HeartIcon filled={wished} /></span>
        </button>

        <div className="absolute inset-x-0 bottom-0 z-[2]" style={{ padding: 'clamp(6px,4.2cqw,13px)' }}>
          <div
            className="line-clamp-1 cursor-pointer font-extrabold leading-tight text-white"
            style={{ fontSize: 'clamp(10px,6.3cqw,15px)' }}
            onClick={openProduct}
          >
            {p.name}
          </div>
          <div className="flex items-center" style={{ gap: 'clamp(3px,1.6cqw,5px)', marginTop: 'clamp(2px,1.3cqw,4px)', fontSize: 'clamp(8.5px,5.3cqw,12px)' }}>
            <StarRating rating={p.rating || 4.5} />
            <span className="text-white/65" style={{ fontSize: 'clamp(8px,5cqw,11px)' }}>{(p.rating || 4.5).toFixed(1)} ({reviewCount})</span>
            {showDiscBadge && (
              <span className="font-bold text-[#FF9142]" style={{ fontSize: 'clamp(8px,5cqw,11px)' }}>-{discPct}%</span>
            )}
          </div>
          <div className="flex items-baseline" style={{ gap: 'clamp(4px,2.5cqw,7px)', marginTop: 'clamp(1px,1cqw,3px)' }}>
            <span className="font-extrabold text-white" style={{ fontSize: 'clamp(12px,7.6cqw,18px)' }}>৳{p.price.toLocaleString()}</span>
            <span className="text-white/50 line-through" style={{ fontSize: 'clamp(9px,5.5cqw,13px)' }}>৳{p.old.toLocaleString()}</span>
          </div>
          <div className="flex w-full items-center" style={{ gap: 'clamp(4px,2.5cqw,7px)', marginTop: 'clamp(4px,2.6cqw,8px)' }}>
            {sold ? (
              <button
                className="relative flex w-full min-w-0 items-center justify-center overflow-hidden rounded-full border-none bg-[#F59E0B] font-body font-bold text-white transition-brand duration-brand"
                style={{ height: 'clamp(28px,18cqw,40px)', fontSize: 'clamp(9px,5.8cqw,13px)' }}
                onClick={(e) => handleCtaClick(e, () => window.dispatchEvent(
                  new CustomEvent(STOCK_NOTIFY_EVENT, { detail: { id: p.id, name: p.name } }),
                ))}
              >
                🔔 স্টকে আসলে জানান
              </button>
            ) : (
              <>
                <button
                  className="box-border flex aspect-square shrink-0 items-center justify-center rounded-full border border-white/50 bg-white/15 text-white backdrop-blur-md transition-brand duration-brand hover:bg-white/30"
                  style={{ height: 'clamp(28px,18cqw,40px)' }}
                  title="কার্টে যোগ করুন"
                  onClick={() => window.dispatchEvent(new CustomEvent(QUICK_CART_EVENT, { detail: { id: p.id } }))}
                >
                  <CartIcon />
                </button>
                <button
                  className="relative flex min-w-0 flex-1 items-center justify-center overflow-hidden whitespace-nowrap rounded-full border border-white/60 font-body font-bold text-brand-primary backdrop-blur-md transition-brand duration-brand hover:brightness-95"
                  style={{
                    height: 'clamp(28px,18cqw,40px)',
                    fontSize: 'clamp(9px,5.8cqw,13px)',
                    background: 'linear-gradient(115deg, rgba(255,255,255,.92) 0%, rgba(195,222,252,.85) 38%, rgba(255,255,255,.9) 64%, rgba(0,94,252,.35) 100%)',
                  }}
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
