'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useT } from '@/lib/i18n/useT';

const lineIcon = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

function HeaderDecor() {
  const deco = { ...lineIcon, strokeWidth: 1.4 };
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden text-brand-light/[0.14]" aria-hidden="true">
      <svg {...deco} width="34" height="34" className="absolute -left-1 top-2 -rotate-12" viewBox="0 0 24 24">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
      <svg {...deco} width="26" height="26" className="absolute right-14 top-3 rotate-6" viewBox="0 0 24 24">
        <rect x="7" y="2.5" width="10" height="15" rx="3" />
        <path d="M10 5.5h4" />
        <circle cx="12" cy="20" r="1.6" />
      </svg>
    </div>
  );
}

function DesktopSideDecor() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 hidden lg:block" aria-hidden="true">
      <div className="absolute left-[8%] top-[14%] text-brand-light/[0.14] -rotate-12">
        <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M4 14.5a8 8 0 0 1 16 0" />
          <rect x="2.7" y="14.5" width="4.3" height="7" rx="1.6" />
          <rect x="17" y="14.5" width="4.3" height="7" rx="1.6" />
        </svg>
      </div>
      <div className="absolute right-[8%] top-[18%] text-brand-light/[0.14] rotate-12">
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <rect x="7" y="6.2" width="10" height="11.6" rx="3" /><path d="M9.2 6.2V3.6h5.6v2.6M9.2 17.8v2.6h5.6v-2.6" />
        </svg>
      </div>
      <div className="absolute left-[6%] bottom-[20%] text-brand-light/[0.14] rotate-6">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <circle cx="12" cy="12" r="10" />
          <path d="m9 12 2 2 4-4" />
        </svg>
      </div>
      <div className="absolute right-[7%] bottom-[18%] text-brand-light/[0.14] -rotate-6">
        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M9 18.2h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.45 1 1.1 1 1.85v.75h5v-.75c0-.75.4-1.4 1-1.85A6 6 0 0 0 12 3Z" />
        </svg>
      </div>
    </div>
  );
}

function CompassAlertIcon() {
  return (
    <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand-light">
      <circle cx="12" cy="12" r="10" />
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
    </svg>
  );
}

function HomeSvgIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function SearchSvgIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

export default function NotFound() {
  const { lang } = useT();

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-brand-bg/35 via-[#DCEBFD]/45 to-white flex flex-col items-center justify-center p-4">
      <DesktopSideDecor />

      <div className="relative z-10 w-full max-w-[460px] overflow-hidden rounded-[28px] bg-gradient-to-b from-brand-bg via-[#DCEBFD] to-white p-6 sm:p-8 text-center shadow-sh3 ring-1 ring-white/80 animate-section-reveal">
        <HeaderDecor />

        <div className="relative z-10 mx-auto mb-4 flex justify-center">
          <Link href="/" className="inline-block">
            <Image
              src="/vangcur-logo.png"
              alt="Vangcur Gadgets"
              width={140}
              height={49}
              priority
              className="h-8 w-auto select-none"
            />
          </Link>
        </div>

        <div className="relative z-10 mx-auto mb-3.5 flex h-16 w-16 items-center justify-center rounded-full border border-brand-light/40 bg-white text-brand-light shadow-xs">
          <CompassAlertIcon />
        </div>

        <div className="relative z-10 mb-1 font-body text-[32px] sm:text-[36px] font-extrabold tracking-tight text-brand-light leading-none">
          404
        </div>

        <h1 className="relative z-10 mb-2 font-body text-lg sm:text-xl font-extrabold text-ink">
          {lang === 'en' ? 'Page Not Found' : 'পেজটি খুঁজে পাওয়া যায়নি'}
        </h1>

        <p className="relative z-10 mb-6 font-body text-[12.5px] sm:text-[13px] leading-relaxed text-ink/80">
          {lang === 'en'
            ? 'Sorry, the link you clicked might be outdated, the product may have been moved, or the address was typed incorrectly.'
            : 'দুঃখিত, আপনি যে লিংকটি খুঁজছেন তা হয়তো সরানো হয়েছে, প্রোডাক্টের লিংক পরিবর্তিত হয়েছে অথবা টাইপো হয়েছে।'}
        </p>

        <div className="relative z-10 flex flex-col gap-2.5">
          <Link
            href="/"
            className="shimmer-sheen flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-info to-brand-light py-[13px] font-body text-[14.5px] font-bold text-white shadow-sh2 transition-[filter] duration-brand hover:brightness-[1.03] active:scale-95 no-underline"
          >
            <HomeSvgIcon />
            <span>{lang === 'en' ? 'Back to Homepage' : 'হোমপেজে ফিরে যান'}</span>
          </Link>

          <Link
            href="/search"
            className="flex w-full items-center justify-center gap-2 rounded-full border border-border-base bg-white/85 py-[12px] font-body text-[13.5px] font-bold text-ink shadow-xs transition-colors hover:border-brand-light hover:bg-white active:scale-95 no-underline"
          >
            <SearchSvgIcon />
            <span>{lang === 'en' ? 'Search Products' : 'পণ্য খুঁজুন'}</span>
          </Link>
        </div>

        <div className="relative z-10 mt-6 border-t border-ink/10 pt-3.5 font-body text-[11px] text-muted">
          <span>{lang === 'en' ? 'Need help? Contact support on WhatsApp: 01897-804055' : 'সহায়তা প্রয়োজন? WhatsApp করুন: 01897-804055'}</span>
        </div>
      </div>
    </div>
  );
        }
