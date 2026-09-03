'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useT } from '@/lib/i18n/useT';
import { logError } from '@/lib/logger';

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

function WarningShieldIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

function ReloadSvgIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
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

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { lang } = useT();

  useEffect(() => {
    logError('[Vangcur Global Error Boundary]:', error);
  }, [error]);

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

        <div className="relative z-10 mx-auto mb-3.5 flex h-16 w-16 items-center justify-center rounded-full border border-red-200/80 bg-red-50 text-red-600 shadow-xs">
          <WarningShieldIcon />
        </div>

        <h1 className="relative z-10 mb-2 font-body text-lg sm:text-xl font-extrabold text-ink">
          {lang === 'en' ? 'Temporary Technical Issue' : 'সাময়িক কারিগরি সমস্যা হয়েছে'}
        </h1>

        <p className="relative z-10 mb-6 font-body text-[12.5px] sm:text-[13px] leading-relaxed text-ink/80">
          {lang === 'en'
            ? 'An unexpected error occurred while processing this request. Please tap the button below to retry or return to the homepage.'
            : 'পৃষ্ঠাটি লোড করার সময় একটি অপ্রত্যাশিত ত্রুটি ঘটেছে। পুনরায় চেষ্টা করতে নিচের বাটনে চাপুন অথবা হোমপেজে ফিরে যান।'}
        </p>

        <div className="relative z-10 flex flex-col gap-2.5">
          <button
            type="button"
            onClick={() => reset()}
            className="shimmer-sheen flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-info to-brand-light py-[13px] font-body text-[14.5px] font-bold text-white shadow-sh2 transition-[filter] duration-brand hover:brightness-[1.03] active:scale-95 cursor-pointer"
          >
            <ReloadSvgIcon />
            <span>{lang === 'en' ? 'Try Again' : 'আবার চেষ্টা করুন'}</span>
          </button>

          <Link
            href="/"
            className="flex w-full items-center justify-center gap-2 rounded-full border border-border-base bg-white/85 py-[12px] font-body text-[13.5px] font-bold text-ink shadow-xs transition-colors hover:border-brand-light hover:bg-white active:scale-95 no-underline"
          >
            <HomeSvgIcon />
            <span>{lang === 'en' ? 'Back to Homepage' : 'হোমপেজে ফিরে যান'}</span>
          </Link>
        </div>

        <div className="relative z-10 mt-6 border-t border-ink/10 pt-3.5 font-body text-[11px] text-muted">
          <span>{lang === 'en' ? 'Need instant help? Contact WhatsApp: 01897-804055' : 'জরুরি সহায়তায় সরাসরি WhatsApp করুন: 01897-804055'}</span>
        </div>
      </div>
    </div>
  );
}
