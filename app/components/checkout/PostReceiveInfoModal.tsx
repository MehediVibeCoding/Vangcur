'use client';

import { useEffect, useState } from 'react';
import { lockBody, unlockBody } from '@/lib/bodyScrollLock';
import { SHOW_POST_RECEIVE_INFO_EVENT } from '@/lib/uiEvents';
import { useT } from '@/lib/i18n/useT';

const CHECKLIST = [
  'প্রোডাক্ট পাওয়ার সাথে সাথে উপর থেকে একটানা আনবক্সিং ভিডিও করুন',
  'ভিডিওতে কোনো কাট বা পজ দেওয়া যাবে না',
  'কুরিয়ারে প্রোডাক্ট ভাঙলে বা ত্রুটি থাকলে এই ভিডিও দিয়ে ওয়ারেন্টি ক্লেইম করুন',
  'প্রোডাক্ট মিসিং বা ভুল গেলে সম্পূর্ণ দায়ভার আমাদের',
];

const IMPORTANT_NOTES = [
  'আনবক্সিং প্রমাণ ছাড়া কোনো ওয়ারেন্টি ক্লেইম গ্রহণযোগ্য নয়',
  '৬ মাসের ওয়ারেন্টিযুক্ত প্রোডাক্টের বক্স ও কাগজপত্র সংরক্ষণ করুন',
];

const lineIcon = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

// ব্র্যান্ড সিগনেচার হেডার ওয়াটারমার্ক — সিস্টেমের অন্যান্য পপআপের (BgConfirmPopup,
// WaitingOverlay) সাথে ভিজ্যুয়াল কনসিস্টেন্সি বজায় রাখার জন্য একই ডেকোরেশন
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

// হেডার ব্যাজ আইকন — ভিডিও ক্যামেরা (আনবক্সিং ভিডিওর থিম বোঝাতে)
function IconVideoBadge() {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand-light">
      <rect x="2.5" y="6" width="13" height="12" rx="2.5" />
      <path d="M15.5 10.2 21 7v10l-5.5-3.2" />
    </svg>
  );
}

function IconCheck() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function IconWarningShield() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-amber-600">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

function IconCheckBadgeSolid() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="white" className="shrink-0">
      <path d="M12 2 3 6v6c0 5.2 3.8 9.7 9 11 5.2-1.3 9-5.8 9-11V6l-9-4Zm-1.1 14.4-3.9-3.9 1.4-1.4 2.5 2.5 5.3-5.3 1.4 1.4-6.7 6.7Z" />
    </svg>
  );
}

export default function PostReceiveInfoModal() {
  const [open, setOpen] = useState(false);
  const { t } = useT();

  useEffect(() => {
    const onShow = () => setOpen(true);
    window.addEventListener(SHOW_POST_RECEIVE_INFO_EVENT, onShow);
    return () => window.removeEventListener(SHOW_POST_RECEIVE_INFO_EVENT, onShow);
  }, []);

  useEffect(() => {
    if (open) lockBody();
    else unlockBody();
  }, [open]);

  if (!open) return null;

  return (
    <>
      {/* ব্যাকড্রপ ব্লার — সিস্টেমের বাকি পপআপগুলোর সাথে মিলিয়ে */}
      <div
        className="fixed inset-0 z-[1210] bg-ink/55 backdrop-blur-[3px] transition-opacity duration-brand"
        onClick={() => setOpen(false)}
      />

      {/* সেন্ট্রালাইজড ভাসমান উইন্ডো — সিগনেচার ট্রাই-কালার ক্যানভাস */}
      <div className="fixed inset-0 z-[1215] flex items-center justify-center p-4">
        <div className="no-scrollbar relative w-full max-w-[440px] max-h-[92vh] overflow-y-auto overflow-x-hidden rounded-[28px] bg-gradient-to-b from-brand-bg via-[#DCEBFD] to-white p-6 sm:p-7 text-center shadow-sh3 ring-1 ring-white/80 animate-section-reveal">
          <HeaderDecor />

          {/* ব্যাজ আইকন */}
          <div className="relative z-10 mx-auto mb-3.5 flex h-16 w-16 items-center justify-center rounded-full border border-brand-light/40 bg-brand-bg/60 shadow-[0_4px_20px_rgba(68,167,252,0.22)]">
            <IconVideoBadge />
          </div>

          {/* টাইটেল */}
          <h2 className="relative z-10 mb-1.5 font-body text-xl font-extrabold text-ink">
            {t('প্রোডাক্ট পাওয়ার পর করণীয়')}
          </h2>

          {/* সাবটাইটেল */}
          <p className="relative z-10 mb-5 font-body text-[12.5px] leading-relaxed text-ink/80">
            {t('ওয়ারেন্টি ক্লেইম নির্বিঘ্নে করতে নিচের নিয়মগুলো অবশ্যই মেনে চলুন।')}
          </p>

          {/* চেকলিস্ট কার্ড — ফ্রস্টেড গ্লাস ও স্কাই-ব্লু টিন্ট ব্যাকগ্রাউন্ড */}
          <div className="relative z-10 mb-4 rounded-[18px] border border-white/90 bg-white/75 p-3.5 text-left shadow-xs backdrop-blur-md">
            <div className="mb-3 flex items-center gap-1.5 font-body text-[11px] font-bold uppercase tracking-wider text-brand-primary">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-brand-primary" />
              {t('আনবক্সিং ভিডিও করুন')}
            </div>
            <ul className="list-none space-y-2.5">
              {CHECKLIST.map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <span className="mt-[1px] flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border border-emerald-300 bg-emerald-100 text-emerald-700 shadow-xs">
                    <IconCheck />
                  </span>
                  <span className="font-body text-[12.5px] leading-[1.6] text-ink/85">{t(item)}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* গুরুত্বপূর্ণ নোটিশ কার্ড — অ্যাম্বার/অ্যালার্ট টিন্ট */}
          <div className="relative z-10 mb-5 rounded-[16px] border border-amber-200/80 bg-amber-50/90 p-3.5 text-left shadow-xs">
            <div className="mb-2 flex items-center gap-2">
              <IconWarningShield />
              <span className="font-body text-[12.5px] font-bold text-amber-900">{t('গুরুত্বপূর্ণ')}</span>
            </div>
            <ul className="list-none space-y-1.5">
              {IMPORTANT_NOTES.map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="mt-[6px] block h-[5px] w-[5px] shrink-0 rounded-full bg-amber-600" />
                  <span className="font-body text-[11.5px] leading-[1.65] text-amber-900/90">{t(item)}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* কনফার্মেশন বাটন — সিগনেচার গ্র্যাডিয়েন্ট */}
          <button
            onClick={() => setOpen(false)}
            className="relative z-10 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-info to-brand-light py-[13.5px] font-body text-[14.5px] font-bold text-white shadow-sh2 transition-all duration-brand hover:brightness-[1.03] active:scale-95"
          >
            <IconCheckBadgeSolid />
            <span>{t('বুঝেছি, মনে রাখব')}</span>
          </button>
        </div>
      </div>
    </>
  );
}
