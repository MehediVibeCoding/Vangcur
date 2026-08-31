'use client';

import { useEffect, useState, type CSSProperties } from 'react';
import { MEMBERSHIP_TIERS, getTier, crownSVG, tierColorStyle } from '@/lib/membershipData';
import { sanitizeSvgHtml } from '@/lib/sanitize';
import { lockBody, unlockBody } from '@/lib/bodyScrollLock';
import { OPEN_MEMBERSHIP_EVENT } from '@/lib/uiEvents';
import { useT } from '@/lib/i18n/useT';

function cssStringToStyle(css: string): CSSProperties {
  const [prop, val] = css.split(':');
  if (!prop || !val) return {};
  const camel = prop.trim().replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
  return { [camel]: val.trim() } as CSSProperties;
}

const lineIcon = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

function CrownBadgeIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14" />
    </svg>
  );
}

function HeaderDecor() {
  const deco = { ...lineIcon, strokeWidth: 1.4 };
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden text-brand-light/[0.14]" aria-hidden="true">
      <svg {...deco} width="34" height="34" className="absolute -left-1 top-2 -rotate-12" viewBox="0 0 24 24">
        <path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14" />
      </svg>
      <svg {...deco} width="26" height="26" className="absolute right-14 top-3 rotate-6" viewBox="0 0 24 24">
        <rect x="7" y="2.5" width="10" height="15" rx="3" />
        <path d="M10 5.5h4" />
        <circle cx="12" cy="20" r="1.6" />
      </svg>
    </div>
  );
}

export default function MembershipModal() {
  const { t, lang } = useT();
  const [completedCount, setCompletedCount] = useState<number | null>(null);

  useEffect(() => {
    const onOpen = (e: Event) => {
      const d = (e as CustomEvent<{ completedCount: number }>).detail;
      setCompletedCount(d?.completedCount ?? 0);
    };
    window.addEventListener(OPEN_MEMBERSHIP_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_MEMBERSHIP_EVENT, onOpen);
  }, []);

  useEffect(() => {
    if (completedCount !== null) lockBody();
    else unlockBody();
    return () => unlockBody();
  }, [completedCount]);

  const isOpen = completedCount !== null;
  const close = () => setCompletedCount(null);
  const currentTier = isOpen ? getTier(completedCount as number) : null;
  const currentIdx = currentTier ? MEMBERSHIP_TIERS.findIndex((tier) => tier.key === currentTier.key) : -1;
  const nextTier = currentIdx >= 0 && currentIdx < MEMBERSHIP_TIERS.length - 1 ? MEMBERSHIP_TIERS[currentIdx + 1] : null;

  if (!isOpen || !currentTier) return null;

  return (
    <>
      {/* ব্যাকড্রপ ব্লার — z-[1200] দিয়ে নিশ্চিত করা হয়েছে যাতে ন্যাভবার (z-[900]) পুরোপুরি ব্যাকগ্রাউন্ডে ডার্ক হয়ে যায় */}
      <div
        className="fixed inset-0 z-[1200] bg-ink/55 backdrop-blur-[3px] transition-opacity duration-brand"
        onClick={close}
      />

      {/* সেন্ট্রালাইজড ভাসমান উইন্ডো — সিগনেচার ট্রাই-কালার ক্যানভাস */}
      <div className="fixed inset-0 z-[1205] flex items-center justify-center p-4">
        <div className="relative flex max-h-[90vh] w-full max-w-[430px] flex-col overflow-hidden rounded-[28px] bg-gradient-to-b from-brand-bg via-[#DCEBFD] to-white shadow-sh3 transition-all duration-300 ease-brand animate-section-reveal">
          
          {/* হেডার — লাইন-আর্ট ওয়াটারমার্ক ও ফ্রস্টেড ক্লোজ বাটন */}
          <div className="relative shrink-0 overflow-hidden border-b border-ink/10 px-6 pb-3.5 pt-5 text-left">
            <HeaderDecor />
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-light text-white shadow-xs">
                  <CrownBadgeIcon />
                </span>
                <h3 className="font-body text-[17px] font-extrabold text-ink">
                  {lang === 'en' ? 'VIP Membership Tier' : 'ভিআইপি মেম্বারশিপ লেভেল'}
                </h3>
              </div>
              <button
                onClick={close}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-white/60 bg-white/80 text-ink/60 shadow-sh1 backdrop-blur-[8px] transition-brand hover:bg-white hover:text-ink focus-visible:outline-none"
                aria-label={t('বন্ধ করুন')}
              >
                ✕
              </button>
            </div>
          </div>

          {/* কন্টেন্ট বডি */}
          <div className="sleek-scrollbar flex-1 overflow-y-auto px-6 py-4">
            {/* ১. বর্তমান টায়ার হাইলাইট কার্ড */}
            <div className="mb-4 rounded-[20px] border border-white/90 bg-white/85 p-4 text-center shadow-xs backdrop-blur-md">
              <div
                className="mx-auto mb-2.5 flex h-12 w-12 items-center justify-center drop-shadow-md"
                dangerouslySetInnerHTML={{ __html: sanitizeSvgHtml(crownSVG(currentTier.crown)) }}
              />
              <div
                className="font-body text-base font-extrabold"
                style={cssStringToStyle(tierColorStyle(currentTier.key))}
              >
                {lang === 'en' ? currentTier.en : currentTier.bn}
              </div>
              <div className="mt-1 font-body text-[12px] font-semibold text-muted">
                {lang === 'en'
                  ? `Completed Orders: ${completedCount}`
                  : `সম্পন্ন অর্ডার: ${completedCount}টি`}
              </div>

              {nextTier ? (
                <div className="mt-2.5 rounded-[12px] border border-brand-light/35 bg-brand-bg/30 px-3 py-1.5 font-body text-[11.5px] font-bold text-brand-light">
                  {lang === 'en'
                    ? `${Math.max(0, nextTier.min - (completedCount || 0))} more order(s) needed for next tier (${nextTier.en})`
                    : `পরবর্তী লেভেল (${nextTier.bn})-এ যেতে আর ${Math.max(0, nextTier.min - (completedCount || 0))}টি অর্ডার প্রয়োজন`}
                </div>
              ) : (
                <div className="mt-2.5 rounded-[12px] border border-emerald-300/80 bg-emerald-50/90 px-3 py-1.5 font-body text-[11.5px] font-bold text-emerald-700">
                  {lang === 'en' ? 'You are at the Highest Legendary Tier! 🎉' : 'অভিনন্দন! আপনি সর্বোচ্চ লিজেন্ডারি লেভেলে আছেন 🎉'}
                </div>
              )}
            </div>

            {/* ২. সমস্ত মেম্বারশিপ টায়ার লিস্ট */}
            <div className="flex flex-col gap-2.5">
              {MEMBERSHIP_TIERS.map((tier, i) => {
                const reached = i <= currentIdx;
                const isCurrent = i === currentIdx;

                return (
                  <div
                    key={tier.key}
                    className={`flex items-center gap-3 rounded-[16px] border p-3 transition-all duration-brand ${
                      isCurrent
                        ? 'border-brand-light bg-brand-bg/40 shadow-xs ring-1 ring-brand-light/30'
                        : reached
                        ? 'border-white/80 bg-white/90 shadow-2xs'
                        : 'border-border-base/70 bg-white/60 opacity-60'
                    }`}
                  >
                    <div
                      className="h-8 w-8 shrink-0 drop-shadow-xs"
                      dangerouslySetInnerHTML={{ __html: sanitizeSvgHtml(crownSVG(tier.crown)) }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="font-body text-[13px] font-extrabold text-ink">
                        {lang === 'en' ? tier.en : tier.bn}
                      </div>
                      <div className="font-body text-[11px] text-muted">
                        {lang === 'en'
                          ? tier.max === Infinity
                            ? `${tier.min}+ orders completed`
                            : `${tier.min}–${tier.max} orders completed`
                          : tier.max === Infinity
                          ? `${tier.min}+ অর্ডার সম্পন্ন`
                          : `${tier.min}–${tier.max}টি অর্ডার সম্পন্ন`}
                      </div>
                    </div>
                    {reached && (
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-light text-white text-[11px] font-bold shadow-xs">
                        ✓
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ফুটার বাটন */}
          <div className="shrink-0 px-6 pb-6 pt-2">
            <button
              onClick={close}
              className="w-full rounded-full bg-gradient-to-r from-info to-brand-light py-[12.5px] font-body text-[14px] font-bold text-white shadow-sh2 transition-all duration-brand hover:brightness-[1.03] active:scale-95"
            >
              {lang === 'en' ? 'Got It' : 'বুঝেছি'}
            </button>
          </div>

        </div>
      </div>
    </>
  );
}
