'use client';

import { useEffect, useRef, useState } from 'react';

interface TrustItem {
  label: string;
  sub: string;
  tint: string;
  icon: React.ReactNode;
}

const iconProps = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

const TRUST_ITEMS: TrustItem[] = [
  {
    label: 'দ্রুত ডেলিভারি',
    sub: 'ঢাকা ১–৩ দিন',
    tint: 'text-brand-primary bg-brand-primary/10',
    icon: (
      <svg {...iconProps}>
        <path d="M2.5 7.5h11v9h-11z" />
        <path d="M13.5 10.5h3.2l3.3 3v3h-6.5" />
        <circle cx="7" cy="18" r="1.8" />
        <circle cx="16.5" cy="18" r="1.8" />
      </svg>
    ),
  },
  {
    label: 'ওয়ারেন্টি',
    sub: 'সকল প্রোডাক্টে',
    tint: 'text-brand-accent bg-brand-accent/10',
    icon: (
      <svg {...iconProps}>
        <path d="M12 3.5l7 2.5v5.2c0 4.4-3 7.4-7 9.3-4-1.9-7-4.9-7-9.3V6l7-2.5z" />
        <path d="M9 12l2 2 4-4.2" />
      </svg>
    ),
  },
  {
    label: 'অথেনটিক',
    sub: '১০০% নিশ্চিত',
    tint: 'text-success bg-success/10',
    icon: (
      <svg {...iconProps}>
        <path d="M9 5.5H7A1.5 1.5 0 0 0 5.5 7v10A1.5 1.5 0 0 0 7 18.5h10a1.5 1.5 0 0 0 1.5-1.5V7A1.5 1.5 0 0 0 17 5.5h-2" />
        <path d="M8.5 5a1.5 1.5 0 0 1 1.5-1.5h4A1.5 1.5 0 0 1 15.5 5v1h-7V5z" />
        <path d="M8.5 12l2.3 2.3L15.5 10" />
      </svg>
    ),
  },
  {
    label: 'সাপোর্ট',
    sub: 'WhatsApp: 01816-365504',
    tint: 'text-gold bg-gold/10',
    icon: (
      <svg {...iconProps}>
        <path d="M4 12a8 8 0 1 1 3.1 6.3L4 19.5l1.2-3.2A7.96 7.96 0 0 1 4 12z" />
        <path d="M8.5 11.2c0 2.4 1.9 4.3 4.3 4.3" />
        <circle cx="9" cy="10.8" r=".4" fill="currentColor" />
        <circle cx="12" cy="10.8" r=".4" fill="currentColor" />
        <circle cx="15" cy="10.8" r=".4" fill="currentColor" />
      </svg>
    ),
  },
  {
    label: 'রিটার্ন পলিসি',
    sub: '৭ দিনের মধ্যে',
    tint: 'text-info bg-info/10',
    icon: (
      <svg {...iconProps}>
        <path d="M4 12a8 8 0 1 1 2.3 5.6" />
        <path d="M4 17.5v-4h4" />
      </svg>
    ),
  },
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
      <div className="relative overflow-hidden rounded-2xl border border-white/60 bg-white/70 shadow-sh2 backdrop-blur-md">
        <div className="h-[3px] w-full bg-gradient-to-r from-brand-bg via-brand-accent to-brand-primary" />
        <div className="flex flex-wrap items-center justify-around gap-x-3 gap-y-4 px-4 py-4 md:flex-nowrap md:px-7 md:py-5">
          {TRUST_ITEMS.map((item, i) => (
            <div key={item.label} className="flex items-center gap-3">
              <div
                className={`flex items-center gap-2 rounded-xl px-1 py-1 transition-brand duration-brand ${i >= 3 ? 'hidden md:flex' : ''}`}
                style={{
                  opacity: revealed ? 1 : 0,
                  transform: revealed ? 'translateY(0) scale(1)' : 'translateY(10px) scale(.96)',
                  transition: 'opacity .35s ease, transform .35s ease',
                  transitionDelay: revealed ? `${i * 80}ms` : '0ms',
                }}
              >
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full md:h-10 md:w-10 ${item.tint} [&_svg]:h-[17px] [&_svg]:w-[17px] md:[&_svg]:h-[19px] md:[&_svg]:w-[19px]`}>
                  {item.icon}
                </div>
                <div className="min-w-0">
                  <div className="whitespace-nowrap text-[11.5px] font-bold text-ink md:text-[12.5px]">{item.label}</div>
                  <div className="truncate text-[10.5px] text-muted md:text-[11px]">{item.sub}</div>
                </div>
              </div>
              {i < TRUST_ITEMS.length - 1 && (
                <div className="hidden h-9 w-px shrink-0 bg-border-base md:block" />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
