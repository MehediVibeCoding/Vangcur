'use client';

import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import {
  MEMBERSHIP_TIERS,
  getTier,
  crownSVG,
  tierColorStyle,
  tierIconSVG,
  SILVER_SPIN_SLICES,
  GOLD_SPIN_SLICES,
  computeWinningSlice,
  getTierSpinReward,
  saveTierSpinReward,
  type SpinSlice,
  type TierSpinReward,
} from '@/lib/membershipData';
import { sanitizeSvgHtml } from '@/lib/sanitize';
import { lockBody, unlockBody } from '@/lib/bodyScrollLock';
import { OPEN_MEMBERSHIP_EVENT } from '@/lib/uiEvents';
import { showToast } from '@/lib/toast';
import { useT } from '@/lib/i18n/useT';

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

function IconCopy() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function IconCheck() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function IconSparkles() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8L12 2z" />
    </svg>
  );
}

function formatCountdown(targetMs: number): string {
  const diff = Math.max(0, targetMs - Date.now());
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export default function MembershipModal() {
  const { t, lang } = useT();
  const [completedCount, setCompletedCount] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'rewards' | 'all-tiers'>('rewards');

  // স্পিন স্টেট
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinRotation, setSpinRotation] = useState(0);
  const [activeReward, setActiveReward] = useState<TierSpinReward | null>(null);
  const [countdownText, setCountdownText] = useState('');
  const [copyCodeLabel, setCopyCodeLabel] = useState('Copy');
  const [diamondCopyLabel, setDiamondCopyLabel] = useState('Copy');

  useEffect(() => {
    const onOpen = (e: Event) => {
      const d = (e as CustomEvent<{ completedCount: number }>).detail;
      setCompletedCount(d?.completedCount ?? 0);
      setActiveTab('rewards');
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
  const currentTier = useMemo(
    () => (isOpen ? getTier(completedCount as number) : null),
    [isOpen, completedCount]
  );
  const currentIdx = useMemo(
    () => (currentTier ? MEMBERSHIP_TIERS.findIndex((tier) => tier.key === currentTier.key) : -1),
    [currentTier]
  );
  const nextTier = useMemo(
    () => (currentIdx >= 0 && currentIdx < MEMBERSHIP_TIERS.length - 1 ? MEMBERSHIP_TIERS[currentIdx + 1] : null),
    [currentIdx]
  );

  // কাস্টমারের সক্রিয় টায়ার অনুযায়ী সেভ করা রিওয়ার্ড লোড
  useEffect(() => {
    if (!currentTier) return;
    const existing = getTierSpinReward(currentTier.key);
    setActiveReward(existing);
  }, [currentTier]);

  // কাউন্টডাউন টাইমার টিক
  useEffect(() => {
    if (!activeReward) return;
    setCountdownText(formatCountdown(activeReward.expiresAt));
    const timer = setInterval(() => {
      const remaining = activeReward.expiresAt - Date.now();
      if (remaining <= 0) {
        setActiveReward(null);
        clearInterval(timer);
      } else {
        setCountdownText(formatCountdown(activeReward.expiresAt));
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [activeReward]);

  const close = () => {
    setCompletedCount(null);
    setIsSpinning(false);
  };

  const handleCopyCode = useCallback(async (codeToCopy: string, isDiamond = false) => {
    try {
      await navigator.clipboard.writeText(codeToCopy);
    } catch {
      // ignore
    }
    showToast(lang === 'en' ? `Coupon ${codeToCopy} copied!` : `কুপন কোড "${codeToCopy}" কপি হয়েছে!`);
    if (isDiamond) {
      setDiamondCopyLabel(t('কপি হয়েছে!'));
      setTimeout(() => setDiamondCopyLabel('Copy'), 2000);
    } else {
      setCopyCodeLabel(t('কপি হয়েছে!'));
      setTimeout(() => setCopyCodeLabel('Copy'), 2000);
    }
  }, [lang, t]);

  // 🎡 লাকি স্পিন হ্যান্ডলার (জিরো-লস প্রোবাবিলিটি ইঞ্জিন)
  const handleTriggerSpin = (slices: SpinSlice[]) => {
    if (isSpinning || activeReward || !currentTier) return;

    setIsSpinning(true);
    const { slice, index } = computeWinningSlice(slices);

    // ৬টি স্লাইসের স্পিনারে প্রতিটি স্লাইস ৬০ ডিগ্রি
    // টপ পয়েন্টারে স্লাইসকে থামাতে টার্গেট ডিগ্রি হিসাব
    const sliceAngle = 360 / slices.length;
    const targetDegree = 360 * 5 + (360 - (index * sliceAngle + sliceAngle / 2));

    setSpinRotation(targetDegree);

    setTimeout(() => {
      setIsSpinning(false);
      const saved = saveTierSpinReward(currentTier.key, slice);
      setActiveReward(saved);
      showToast(lang === 'en' ? `🎉 Congratulations! You won ${slice.labelEn}!` : `🎉 অভিনন্দন! আপনি ${slice.label} জিতেছেন!`);
    }, 3800);
  };

  if (!isOpen || !currentTier) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-[1200] bg-ink/55 backdrop-blur-[3px] transition-opacity duration-brand"
        onClick={close}
      />

      <div className="fixed inset-0 z-[1205] flex items-center justify-center p-4">
        <div className="relative flex max-h-[92vh] w-full max-w-[440px] flex-col overflow-hidden rounded-[28px] bg-gradient-to-b from-brand-bg via-[#DCEBFD] to-white shadow-sh3 transition-all duration-300 ease-brand animate-section-reveal">
          
          {/* হেডার */}
          <div className="relative shrink-0 overflow-hidden border-b border-ink/10 px-6 pb-3.5 pt-5 text-left">
            <HeaderDecor />
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-light text-white shadow-xs">
                  <CrownBadgeIcon />
                </span>
                <div>
                  <h3 className="font-body text-[17px] font-extrabold text-ink leading-none">
                    {lang === 'en' ? 'VIP Membership Club' : 'ভিআইপি মেম্বারশিপ ক্লাব'}
                  </h3>
                  <p className="mt-1 font-body text-[11.5px] font-bold text-brand-light">
                    {lang === 'en' ? currentTier.en : currentTier.bn}
                  </p>
                </div>
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

          {/* টগল ট্যাব: এক্সক্লুসিভ রিওয়ার্ডস vs সমস্ত টায়ার */}
          <div className="relative z-10 flex border-b border-ink/10 bg-white/50 px-6 pt-2">
            <button
              onClick={() => setActiveTab('rewards')}
              className={`flex-1 pb-2.5 font-body text-[12.5px] font-bold transition-all border-b-2 ${
                activeTab === 'rewards'
                  ? 'border-brand-light text-brand-light'
                  : 'border-transparent text-muted hover:text-ink'
              }`}
            >
              🎁 {lang === 'en' ? 'My Tier Rewards' : 'লেভেল রিওয়ার্ডস'}
            </button>
            <button
              onClick={() => setActiveTab('all-tiers')}
              className={`flex-1 pb-2.5 font-body text-[12.5px] font-bold transition-all border-b-2 ${
                activeTab === 'all-tiers'
                  ? 'border-brand-light text-brand-light'
                  : 'border-transparent text-muted hover:text-ink'
              }`}
            >
              👑 {lang === 'en' ? 'All 5 VIP Tiers' : 'সকল মেম্বারশিপ লেভেল'}
            </button>
          </div>

          {/* কন্টেন্ট বডি */}
          <div className="sleek-scrollbar flex-1 overflow-y-auto px-6 py-4">
            {activeTab === 'rewards' ? (
              <div className="space-y-4">
                
                {/* বর্তমান টায়ার স্ট্যাটাস ব্যানার */}
                <div className="rounded-[20px] border border-white/90 bg-white/85 p-4 text-center shadow-xs backdrop-blur-md">
                  <div
                    className="mx-auto mb-2 flex h-11 w-11 items-center justify-center drop-shadow-md"
                    dangerouslySetInnerHTML={{ __html: sanitizeSvgHtml(crownSVG(currentTier.crown)) }}
                  />
                  <div
                    className="font-body text-base font-extrabold"
                    style={{ color: currentTier.key === 'silver' ? '#475569' : currentTier.key === 'gold' ? '#92400E' : currentTier.key === 'diamond' ? '#44A7FC' : '#D97706' }}
                  >
                    {lang === 'en' ? currentTier.en : currentTier.bn}
                  </div>
                  <div className="mt-0.5 font-body text-[12px] font-semibold text-muted">
                    {lang === 'en'
                      ? `Completed Delivered Orders: ${completedCount}`
                      : `সফল ডেলিভারি সম্পন্ন অর্ডার: ${completedCount}টি`}
                  </div>

                  {nextTier && (
                    <div className="mt-2 rounded-[12px] border border-brand-light/35 bg-brand-bg/30 px-3 py-1 font-body text-[11px] font-bold text-brand-light">
                      {lang === 'en'
                        ? `${Math.max(0, nextTier.min - (completedCount || 0))} more order(s) to unlock ${nextTier.en}`
                        : `পরবর্তী ${nextTier.bn} লেভেল আনলক করতে আর মাত্র ${Math.max(0, nextTier.min - (completedCount || 0))}টি অর্ডার প্রয়োজন`}
                    </div>
                  )}
                </div>

                {/* ========================================================================= */}
                {/* লেভেল ০: রেগুলার মেম্বার (০ অর্ডার)                                        */}
                {/* ========================================================================= */}
                {currentTier.key === 'regular' && (
                  <div className="rounded-[22px] border border-dashed border-border-base bg-white/70 p-6 text-center shadow-xs backdrop-blur-md">
                    <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-brand-bg/50 text-2xl text-brand-light shadow-xs">
                      🔒
                    </div>
                    <h4 className="font-body text-[15px] font-bold text-ink">
                      {lang === 'en' ? 'Unlock Silver Lucky Cash Spin' : 'সিলভার লাকি ক্যাশ স্পিন আনলক করুন'}
                    </h4>
                    <p className="mt-1.5 font-body text-[12.5px] leading-relaxed text-muted">
                      {lang === 'en'
                        ? 'Place and receive your 1st delivered order to unlock the Silver Lucky Cash Spin Wheel and win instant discounts!'
                        : 'আপনার প্রথম অর্ডারটি সফলভাবে রিসিভ করলেই আনলক হবে সিলভার লাকি ক্যাশ স্পিন হুইল ও ক্যাশ ডিসকাউন্ট জেতার সুযোগ!'}
                    </p>
                  </div>
                )}

                {/* ========================================================================= */}
                {/* লেভেল ১: সিলভার স্পিনার (১-২ অর্ডার)                                       */}
                {/* ========================================================================= */}
                {currentTier.key === 'silver' && (
                  <div className="rounded-[22px] border border-white/90 bg-white/85 p-4 text-center shadow-xs backdrop-blur-md">
                    <div className="mb-3 flex items-center justify-center gap-1.5 font-body text-[13px] font-extrabold text-brand-light">
                      <IconSparkles />
                      <span>{lang === 'en' ? 'Silver Lucky Cash Spin' : 'সিলভার লাকি ক্যাশ স্পিনার'}</span>
                    </div>

                    {!activeReward ? (
                      <div className="flex flex-col items-center">
                        {/* স্পিন হুইল ভিজ্যুয়াল */}
                        <div className="relative my-2 flex h-[220px] w-[220px] items-center justify-center">
                          {/* টপ পয়েন্টার অ্যারো */}
                          <div className="absolute -top-2 left-1/2 z-20 -translate-x-1/2 drop-shadow-md">
                            <svg width="20" height="24" viewBox="0 0 24 28" fill="#44A7FC">
                              <polygon points="12 28 0 4 24 4" />
                            </svg>
                          </div>

                          {/* রোটেটিং হুইল ক্যানভাস */}
                          <div
                            className="h-full w-full rounded-full border-4 border-white shadow-sh2 overflow-hidden"
                            style={{
                              transform: `rotate(${spinRotation}deg)`,
                              transition: isSpinning ? 'transform 3.8s cubic-bezier(0.15, 0.85, 0.25, 1)' : 'none',
                            }}
                          >
                            <svg viewBox="0 0 100 100" className="h-full w-full">
                              {SILVER_SPIN_SLICES.map((slice, i) => {
                                const angle = 360 / SILVER_SPIN_SLICES.length;
                                const startAngle = i * angle;
                                const endAngle = (i + 1) * angle;
                                const x1 = 50 + 50 * Math.cos((Math.PI * startAngle) / 180);
                                const y1 = 50 + 50 * Math.sin((Math.PI * startAngle) / 180);
                                const x2 = 50 + 50 * Math.cos((Math.PI * endAngle) / 180);
                                const y2 = 50 + 50 * Math.sin((Math.PI * endAngle) / 180);
                                const textAngle = startAngle + angle / 2;

                                return (
                                  <g key={slice.id}>
                                    <path
                                      d={`M50,50 L${x1},${y1} A50,50 0 0,1 ${x2},${y2} Z`}
                                      fill={slice.bg}
                                      stroke="#E2E8F0"
                                      strokeWidth="0.8"
                                    />
                                    <text
                                      x="74"
                                      y="52"
                                      fill={slice.color}
                                      fontSize="7.5"
                                      fontWeight="bold"
                                      textAnchor="middle"
                                      transform={`rotate(${textAngle}, 50, 50)`}
                                    >
                                      {slice.label}
                                    </text>
                                  </g>
                                );
                              })}
                              {/* সেন্টার নব */}
                              <circle cx="50" cy="50" r="12" fill="#FFFFFF" stroke="#44A7FC" strokeWidth="2.5" />
                              <circle cx="50" cy="50" r="4" fill="#44A7FC" />
                            </svg>
                          </div>
                        </div>

                        <button
                          onClick={() => handleTriggerSpin(SILVER_SPIN_SLICES)}
                          disabled={isSpinning}
                          className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-info to-brand-light py-3 font-body text-sm font-bold text-white shadow-sh2 transition-all duration-brand hover:brightness-105 active:scale-95 disabled:opacity-60"
                        >
                          {isSpinning ? t('চাকা ঘুরছে...') : (lang === 'en' ? '🎡 Spin & Win Discount' : '🎡 স্পিন করে ডিসকাউন্ট জিতুন')}
                        </button>
                      </div>
                    ) : (
                      /* অলরেডি স্পিন করা উইনিং রিওয়ার্ড কার্ড */
                      <div className="rounded-[18px] border border-emerald-300/80 bg-emerald-50/90 p-4 text-center shadow-xs animate-section-reveal">
                        <div className="mb-1 text-2xl">🎉</div>
                        <div className="font-body text-[15px] font-extrabold text-emerald-900">
                          {lang === 'en' ? `You Won ${activeReward.slice.labelEn}!` : `আপনি জিতেছেন ${activeReward.slice.label}!`}
                        </div>
                        <p className="mt-0.5 font-body text-[11px] text-emerald-800">
                          {lang === 'en'
                            ? `Valid on orders above ৳${activeReward.slice.minOrder}`
                            : `সর্বনিম্ন ৳${activeReward.slice.minOrder} টাকার অর্ডারে প্রযোজ্য`}
                        </p>

                        <div className="my-3 flex items-center justify-between rounded-xl border border-dashed border-emerald-400 bg-white/95 px-3.5 py-2">
                          <span className="font-body text-sm font-extrabold tracking-wider text-emerald-800">
                            {activeReward.code}
                          </span>
                          <button
                            onClick={() => handleCopyCode(activeReward.code)}
                            className="flex items-center gap-1 rounded-full bg-emerald-600 px-3 py-1 font-body text-[11px] font-bold text-white shadow-xs hover:bg-emerald-700 active:scale-95"
                          >
                            {copyCodeLabel === 'Copy' ? <IconCopy /> : <IconCheck />}
                            <span>{copyCodeLabel}</span>
                          </button>
                        </div>

                        <div className="font-body text-[10.5px] font-bold text-amber-700">
                          ⏳ {lang === 'en' ? `Expires in: ${countdownText}` : `মেয়াদ আর মাত্র: ${countdownText}`}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ========================================================================= */}
                {/* লেভেল ২: গোল্ড স্পিনার (৩-৪ অর্ডার)                                        */}
                {/* ========================================================================= */}
                {currentTier.key === 'gold' && (
                  <div className="rounded-[22px] border border-white/90 bg-white/85 p-4 text-center shadow-xs backdrop-blur-md">
                    <div className="mb-3 flex items-center justify-center gap-1.5 font-body text-[13px] font-extrabold text-amber-600">
                      <IconSparkles />
                      <span>{lang === 'en' ? 'Gold VIP Magic Spinner' : 'গোল্ড ভিআইপি ম্যাজিক স্পিনার'}</span>
                    </div>

                    {!activeReward ? (
                      <div className="flex flex-col items-center">
                        <div className="relative my-2 flex h-[220px] w-[220px] items-center justify-center">
                          <div className="absolute -top-2 left-1/2 z-20 -translate-x-1/2 drop-shadow-md">
                            <svg width="20" height="24" viewBox="0 0 24 28" fill="#F59E0B">
                              <polygon points="12 28 0 4 24 4" />
                            </svg>
                          </div>

                          <div
                            className="h-full w-full rounded-full border-4 border-white shadow-sh2 overflow-hidden"
                            style={{
                              transform: `rotate(${spinRotation}deg)`,
                              transition: isSpinning ? 'transform 3.8s cubic-bezier(0.15, 0.85, 0.25, 1)' : 'none',
                            }}
                          >
                            <svg viewBox="0 0 100 100" className="h-full w-full">
                              {GOLD_SPIN_SLICES.map((slice, i) => {
                                const angle = 360 / GOLD_SPIN_SLICES.length;
                                const startAngle = i * angle;
                                const endAngle = (i + 1) * angle;
                                const x1 = 50 + 50 * Math.cos((Math.PI * startAngle) / 180);
                                const y1 = 50 + 50 * Math.sin((Math.PI * startAngle) / 180);
                                const x2 = 50 + 50 * Math.cos((Math.PI * endAngle) / 180);
                                const y2 = 50 + 50 * Math.sin((Math.PI * endAngle) / 180);
                                const textAngle = startAngle + angle / 2;

                                return (
                                  <g key={slice.id}>
                                    <path
                                      d={`M50,50 L${x1},${y1} A50,50 0 0,1 ${x2},${y2} Z`}
                                      fill={slice.bg}
                                      stroke="#E2E8F0"
                                      strokeWidth="0.8"
                                    />
                                    <text
                                      x="74"
                                      y="52"
                                      fill={slice.color}
                                      fontSize="7"
                                      fontWeight="bold"
                                      textAnchor="middle"
                                      transform={`rotate(${textAngle}, 50, 50)`}
                                    >
                                      {slice.label}
                                    </text>
                                  </g>
                                );
                              })}
                              <circle cx="50" cy="50" r="12" fill="#FFFFFF" stroke="#F59E0B" strokeWidth="2.5" />
                              <circle cx="50" cy="50" r="4" fill="#F59E0B" />
                            </svg>
                          </div>
                        </div>

                        <button
                          onClick={() => handleTriggerSpin(GOLD_SPIN_SLICES)}
                          disabled={isSpinning}
                          className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 py-3 font-body text-sm font-bold text-white shadow-sh2 transition-all duration-brand hover:brightness-105 active:scale-95 disabled:opacity-60"
                        >
                          {isSpinning ? t('চাকা ঘুরছে...') : (lang === 'en' ? '🎯 Spin Gold Wheel' : '🎯 গোল্ড স্পিন করুন')}
                        </button>
                      </div>
                    ) : (
                      <div className="rounded-[18px] border border-emerald-300/80 bg-emerald-50/90 p-4 text-center shadow-xs animate-section-reveal">
                        <div className="mb-1 text-2xl">🎉</div>
                        <div className="font-body text-[15px] font-extrabold text-emerald-900">
                          {lang === 'en' ? `You Won ${activeReward.slice.labelEn}!` : `আপনি জিতেছেন ${activeReward.slice.label}!`}
                        </div>
                        <p className="mt-0.5 font-body text-[11px] text-emerald-800">
                          {activeReward.slice.type === 'free_shipping'
                            ? (lang === 'en' ? 'Free delivery on your next order' : 'পরবর্তী অর্ডারে সম্পূর্ণ ফ্রি ডেলিভারি')
                            : (lang === 'en' ? `Valid on orders above ৳${activeReward.slice.minOrder}` : `সর্বনিম্ন ৳${activeReward.slice.minOrder} টাকার অর্ডারে প্রযোজ্য`)}
                        </p>

                        <div className="my-3 flex items-center justify-between rounded-xl border border-dashed border-emerald-400 bg-white/95 px-3.5 py-2">
                          <span className="font-body text-sm font-extrabold tracking-wider text-emerald-800">
                            {activeReward.code}
                          </span>
                          <button
                            onClick={() => handleCopyCode(activeReward.code)}
                            className="flex items-center gap-1 rounded-full bg-emerald-600 px-3 py-1 font-body text-[11px] font-bold text-white shadow-xs hover:bg-emerald-700 active:scale-95"
                          >
                            {copyCodeLabel === 'Copy' ? <IconCopy /> : <IconCheck />}
                            <span>{copyCodeLabel}</span>
                          </button>
                        </div>

                        <div className="font-body text-[10.5px] font-bold text-amber-700">
                          ⏳ {lang === 'en' ? `Expires in: ${countdownText}` : `মেয়াদ আর মাত্র: ${countdownText}`}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* ========================================================================= */}
                {/* লেভেল ৩: ডায়মন্ড প্রিভিলেজ (৫-৯ অর্ডার)                                    */}
                {/* ========================================================================= */}
                {currentTier.key === 'diamond' && (
                  <div className="rounded-[22px] border border-brand-light/35 bg-white/90 p-4 text-left shadow-xs backdrop-blur-md space-y-3 animate-section-reveal">
                    <div className="text-center pb-2 border-b border-ink/10">
                      <span className="inline-block font-body text-[14px] font-extrabold text-brand-light">
                        💎 {lang === 'en' ? 'Diamond VIP Guaranteed Perks' : 'ডায়মন্ড মেম্বার ডাবল প্রিভিলেজ'}
                      </span>
                    </div>

                    <div className="flex items-start gap-2.5 rounded-[14px] border border-brand-light/25 bg-brand-bg/25 p-3">
                      <span className="mt-0.5 text-base">🎁</span>
                      <div className="min-w-0 flex-1">
                        <div className="font-body text-[12.5px] font-bold text-ink">
                          {lang === 'en' ? 'Flat ৳150 OFF Guaranteed Coupon' : 'ফ্ল্যাট ৳১৫০ ছাড়ের এক্সক্লুসিভ কুপন'}
                        </div>
                        <div className="mt-2 flex items-center justify-between rounded-lg border border-dashed border-brand-light/50 bg-white px-3 py-1.5">
                          <span className="font-body text-xs font-extrabold tracking-wider text-brand-light">
                            DIAMOND150
                          </span>
                          <button
                            onClick={() => handleCopyCode('DIAMOND150', true)}
                            className="flex items-center gap-1 rounded-full bg-brand-light px-2.5 py-0.5 font-body text-[10.5px] font-bold text-white shadow-2xs hover:bg-brand-light-hover"
                          >
                            {diamondCopyLabel === 'Copy' ? <IconCopy /> : <IconCheck />}
                            <span>{diamondCopyLabel}</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 rounded-[14px] border border-white/80 bg-white/80 p-3 shadow-2xs">
                      <span className="text-base">⚡</span>
                      <div className="font-body text-[12px] font-bold text-ink">
                        {lang === 'en' ? 'Priority 1-Day Dispatch & Courier Handover' : 'সবার আগে ১ দিনে কুরিয়ারে অগ্রাধিকার হ্যান্ডওভার'}
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 rounded-[14px] border border-white/80 bg-white/80 p-3 shadow-2xs">
                      <span className="text-base">✨</span>
                      <div className="font-body text-[12px] font-bold text-ink">
                        {lang === 'en' ? 'Free Mystery Tech Accessory with every parcel' : 'প্রতিটি অর্ডারের সাথে সারপ্রাইজ গ্যাজেট গিফট'}
                      </div>
                    </div>
                  </div>
                )}

                {/* ========================================================================= */}
                {/* লেভেল ৪: লিজেন্ডারি প্রিভিলেজ (১০+ অর্ডার)                                  */}
                {/* ========================================================================= */}
                {currentTier.key === 'legendary' && (
                  <div className="rounded-[22px] border border-amber-300/80 bg-gradient-to-br from-amber-50 via-white to-[#FFFBEB] p-5 text-center shadow-xs backdrop-blur-md animate-section-reveal">
                    <div className="mb-2 text-3xl">👑</div>
                    <h4 className="font-body text-[16px] font-extrabold text-amber-900">
                      {lang === 'en' ? '100% Cash on Delivery (Zero Advance)' : '১০০% ক্যাশ অন ডেলিভারি (Zero Advance)'}
                    </h4>
                    <p className="mt-1.5 font-body text-[12.5px] leading-relaxed text-amber-800/90">
                      {lang === 'en'
                        ? 'As a Legendary customer, your orders require ZERO advance payment. Enjoy 100% full Cash on Delivery privilege!'
                        : 'আপনি আমাদের সর্বোচ্চ সম্মানিত লিজেন্ডারি কাস্টমার! আপনার কোনো বিকাশ অগ্রিম পেমেন্ট লাগবে না, সম্পূর্ণ ক্যাশ অন ডেলিভারিতে অর্ডার করুন।'}
                    </p>

                    <div className="mt-3.5 inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-100/80 px-4 py-1.5 font-body text-xs font-extrabold text-amber-900 shadow-2xs">
                      <span>✓</span>
                      <span>{lang === 'en' ? 'Active on all checkout orders' : 'চেকআউটে সক্রিয় সুবিধা'}</span>
                    </div>
                  </div>
                )}

              </div>
            ) : (
              /* সমস্ত লেভেলের ওভারভিউ লিস্ট */
              <div className="flex flex-col gap-2.5">
                {MEMBERSHIP_TIERS.map((tier, i) => {
                  const reached = i <= currentIdx;
                  const isCurrent = i === currentIdx;

                  return (
                    <div
                      key={tier.key}
                      className={`flex items-center gap-3 rounded-[18px] border p-3.5 transition-all duration-brand ${
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
                        <div className="font-body text-[13.5px] font-extrabold text-ink">
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
            )}
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
