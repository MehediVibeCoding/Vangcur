// [REPLACE] ফাইলের পাথ: app/components/modals/WarrantyModal.tsx
'use client';

import { useEffect, useMemo } from 'react';
import Link from 'next/link';
import { getWarrantyModalContent } from '@/lib/warrantyData';
import { lockBody, unlockBody } from '@/lib/bodyScrollLock';
import { useT } from '@/lib/i18n/useT';

interface WarrantyModalProps {
  isOpen: boolean;
  onClose: () => void;
  warrantyText?: string;
}

const lineIcon = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

function ShieldSecurityIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function HeaderDecor() {
  const deco = { ...lineIcon, strokeWidth: 1.4 };
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden text-brand-light/[0.14]">
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

function ArrowLinkIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 17l9.2-9.2M17 17V8H8" />
    </svg>
  );
}

export default function WarrantyModal({ isOpen, onClose, warrantyText }: WarrantyModalProps) {
  const { t, lang } = useT();
  const content = useMemo(() => getWarrantyModalContent(warrantyText), [warrantyText]);

  useEffect(() => {
    if (isOpen) lockBody();
    else unlockBody();
    return () => unlockBody();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const onKeydown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeydown);
    return () => document.removeEventListener('keydown', onKeydown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* ব্যাকড্রপ ব্লার */}
      <div
        className="fixed inset-0 z-[1200] bg-ink/55 backdrop-blur-[3px] transition-opacity duration-brand"
        onClick={onClose}
      />

      {/* সেন্ট্রালাইজড ভাসমান উইন্ডো — সিগনেচার ট্রাই-কালার ক্যানভাস */}
      <div className="fixed inset-0 z-[1205] flex items-center justify-center p-4">
        <div className="relative flex max-h-[90vh] w-full max-w-[440px] flex-col overflow-hidden rounded-[28px] bg-gradient-to-b from-brand-bg via-[#DCEBFD] to-white shadow-sh3 transition-all duration-300 ease-brand animate-section-reveal">
          
          {/* হেডার — লাইন-আর্ট ওয়াটারমার্ক ও ফ্রস্টেড ক্লোজ বাটন */}
          <div className="relative shrink-0 overflow-hidden border-b border-ink/10 px-6 pb-3.5 pt-5 text-left">
            <HeaderDecor />
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-light text-white shadow-xs">
                  <ShieldSecurityIcon />
                </span>
                <div>
                  <h3 className="font-body text-[17px] font-extrabold text-ink">
                    {lang === 'en' ? 'Warranty Information' : 'ওয়ারেন্টি তথ্য'}
                  </h3>
                  <p className="font-body text-[11.5px] font-semibold text-brand-primary">
                    {warrantyText || (lang === 'en' ? 'Official Brand Coverage' : 'অফিসিয়াল পলিসি কভারেজ')}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-white/60 bg-white/80 text-ink/60 shadow-sh1 backdrop-blur-[8px] transition-brand hover:bg-white hover:text-ink focus-visible:outline-none"
                aria-label={t('বন্ধ করুন')}
              >
                ✕
              </button>
            </div>
          </div>

          {/* কন্টেন্ট বডি */}
          <div className="flex-1 overflow-y-auto px-6 py-4.5">
            {/* পলিসি টাইটেল ও বর্ণনা */}
            <div className="mb-4">
              <h4 className="font-body text-[15px] font-bold text-ink leading-snug">
                {t(content.title)}
              </h4>
              <p className="mt-1 font-body text-[12.5px] leading-relaxed text-muted">
                {t(content.body)}
              </p>
            </div>

            {/* শর্তাবলির তালিকা */}
            <div className="space-y-3">
              {/* পয়েন্ট ১: আনবক্সিং ভিডিও */}
              <div className="flex items-start gap-3 rounded-[16px] border border-white/80 bg-white/70 p-3 shadow-xs">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-light font-body text-xs font-bold text-white shadow-xs">
                  {lang === 'en' ? '1' : '১'}
                </span>
                <p className="font-body text-[12.5px] leading-[1.65] text-ink/85">
                  {lang === 'en'
                    ? 'A continuous, uncut unboxing video recorded from the parcel opening is mandatory for any warranty or replacement claim.'
                    : 'কুরিয়ার থেকে পার্সেল বুঝে নেওয়ার সময় প্যাকেটের বাইরে থেকে শুরু করে একটানা আন-কাট আনবক্সিং ভিডিও প্রমাণ হিসেবে সংরক্ষণ করতে হবে।'}
                </p>
              </div>

              {/* পয়েন্ট ২: মূল বক্স ও ইনভয়েস */}
              <div className="flex items-start gap-3 rounded-[16px] border border-white/80 bg-white/70 p-3 shadow-xs">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-light font-body text-xs font-bold text-white shadow-xs">
                  {lang === 'en' ? '2' : '২'}
                </span>
                <p className="font-body text-[12.5px] leading-[1.65] text-ink/85">
                  {lang === 'en'
                    ? 'The original product box, accessories, and invoice paper must be kept intact and returned during the claim process.'
                    : 'ক্লেইম করার সময় প্রোডাক্টের অরিজিনাল বক্স, ইনভয়েস পেপার এবং সাথে থাকা সকল এক্সেসরিজ অক্ষত অবস্থায় ফেরত দিতে হবে।'}
                </p>
              </div>

              {/* পয়েন্ট ৩: বিস্তারিত সুরক্ষামূলক কভারেজ ও ব্যতিক্রম */}
              <div className="flex items-start gap-3 rounded-[16px] border border-white/80 bg-white/70 p-3 shadow-xs">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-light font-body text-xs font-bold text-white shadow-xs">
                  {lang === 'en' ? '3' : '৩'}
                </span>
                <p className="font-body text-[12.5px] leading-[1.65] text-ink/85">
                  {lang === 'en'
                    ? 'Free replacement is provided for manufacturing defects or internal technical issues. However, physical damage, accidental drops, intentional breakage, burning, or water damage are strictly excluded from warranty coverage.'
                    : 'ম্যানুফ্যাকচারিং ত্রুটি বা অভ্যন্তরীণ টেকনিক্যাল সমস্যার ক্ষেত্রে সম্পূর্ণ ফ্রিতে রিপ্লেসমেন্ট প্রদান করা হবে। তবে ইচ্ছাকৃতভাবে ভেঙে ফেলা, হাত থেকে পড়ে যাওয়া, পুড়ে যাওয়া কিংবা ওয়াটার ড্যামেজের ক্ষেত্রে কোনো ওয়ারেন্টি প্রযোজ্য হবে না।'}
                </p>
              </div>
            </div>

            {/* পলিসি রেফারেন্স কলআউট বক্স (Hyperlinked Reference) */}
            <div className="mt-4 rounded-[18px] border border-brand-light/35 bg-white/80 p-3.5 shadow-xs backdrop-blur-md">
              <div className="flex items-center justify-between gap-2">
                <div className="font-body text-[12px] text-ink/80 leading-relaxed">
                  {lang === 'en'
                    ? 'Want to know more details about our warranty terms?'
                    : 'ওয়ারেন্টির বিস্তারিত নীতিমালা ও শর্তাবলী জানতে চান?'}
                </div>
                <Link
                  href="/terms"
                  onClick={onClose}
                  className="inline-flex shrink-0 items-center gap-1 font-body text-[12px] font-extrabold text-brand-primary transition-colors hover:text-brand-light-hover hover:underline"
                >
                  <span>{lang === 'en' ? 'Terms & Policy' : 'শর্তাবলী দেখুন'}</span>
                  <ArrowLinkIcon />
                </Link>
              </div>
            </div>
          </div>

          {/* ফুটার — সিগনেচার ফুল-উইথ স্কাই-ব্লু বাটন */}
          <div className="shrink-0 px-6 pb-6 pt-2">
            <button
              onClick={onClose}
              className="w-full rounded-full bg-gradient-to-r from-brand-light to-brand-light-hover py-[13.5px] font-body text-[15px] font-bold text-white shadow-sh2 transition-brand duration-brand hover:brightness-[1.03] active:scale-95 focus-visible:outline-none"
            >
              {lang === 'en' ? 'Got It' : 'বুঝেছি'}
            </button>
          </div>

        </div>
      </div>
    </>
  );
}
