'use client';

import { useEffect, useRef, useState } from 'react';

interface TrustItem {
  icon: string;
  label: string;
  sub: string;
}

const TRUST_ITEMS: TrustItem[] = [
  { icon: '🚚', label: 'দ্রুত ডেলিভারি', sub: 'ঢাকা ১-৩ দিন' },
  { icon: '🛡️', label: 'ওয়ারেন্টি', sub: 'সকল প্রোডাক্টে' },
  { icon: '✅', label: 'অথেনটিক', sub: '১০০% নিশ্চিত' },
  { icon: '💬', label: 'সাপোর্ট', sub: 'WhatsApp: 01816-365504' },
  { icon: '🔄', label: 'রিটার্ন পলিসি', sub: '৭ দিনের মধ্যে' },
];

export default function TrustStrip() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const prefersReduced = typeof window !== 'undefined'
      && window.matchMedia
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!prefersReduced && typeof window !== 'undefined' && window.IntersectionObserver) {
      const obs = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            setRevealed(true);
            obs.disconnect();
          }
        },
        { threshold: 0.2 },
      );
      if (wrapRef.current) obs.observe(wrapRef.current);
      return () => obs.disconnect();
    }
    setRevealed(true);
  }, []);

  return (
    <div className="mx-auto mb-[26px] mt-4 max-w-[1300px] px-5" ref={wrapRef}>
      <div className="flex flex-wrap items-center justify-around gap-3.5 rounded-[14px] border border-border-base bg-white px-4 py-3 md:justify-around md:px-7 md:py-4">
        {TRUST_ITEMS.map((item, i) => (
          <div
            key={item.label}
            className={`flex items-center gap-2.5 ${i >= 3 ? 'hidden md:flex' : 'flex'}`}
            style={{
              opacity: revealed ? 1 : 0,
              transform: revealed ? 'translateY(0) scale(1)' : 'translateY(10px) scale(.96)',
              transition: 'opacity .35s ease, transform .35s ease',
              transitionDelay: revealed ? `${i * 80}ms` : '0ms',
            }}
          >
            <div className="flex h-[33px] w-[33px] shrink-0 items-center justify-center rounded-lg bg-surface-muted text-[15px]">
              {item.icon}
            </div>
            <div>
              <div className="text-[12.5px] font-semibold text-ink">{item.label}</div>
              <div className="text-[11px] text-muted">{item.sub}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
