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
      <div className="fixed inset-0 z-[1000] bg-black/55" onClick={() => setOpen(false)} />
      <div className="fixed inset-0 z-[1001] flex items-center justify-center p-4">
        <div className="max-h-[85vh] w-full max-w-[420px] overflow-y-auto rounded-brand bg-white shadow-sh3">
          <div className="flex items-center justify-between border-b border-border-base px-5 py-4">
            <h3 className="font-display text-base font-bold text-ink">{t('📦 প্রোডাক্ট পাওয়ার পর করণীয়')}</h3>
            <button className="flex h-8 w-8 items-center justify-center rounded-full text-lg text-muted hover:bg-surface-muted" onClick={() => setOpen(false)}>✕</button>
          </div>
          <div className="px-5 py-4">
            <h4 className="mb-2.5 font-body text-[13px] font-bold text-ink">{t('📹 আনবক্সিং ভিডিও করুন')}</h4>
            <ul className="mb-4 list-none space-y-2">
              {CHECKLIST.map((item) => (
                <li key={item} className="flex gap-2 font-body text-[12.5px] leading-[1.6] text-muted">
                  <span className="mt-0.5 shrink-0 text-success">✓</span>
                  <span>{t(item)}</span>
                </li>
              ))}
            </ul>
            <div className="rounded-[10px] border border-[#FDE68A] bg-[#FFFBEB] px-3.5 py-3">
              <div className="mb-1.5 font-body text-[12.5px] font-bold text-ink">{t('⚠️ গুরুত্বপূর্ণ')}</div>
              <ul className="list-none space-y-1.5">
                {IMPORTANT_NOTES.map((item) => (
                  <li key={item} className="font-body text-[12px] leading-[1.6] text-[#92400E]">• {t(item)}</li>
                ))}
              </ul>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="mt-4 w-full rounded-[10px] bg-ink px-4 py-2.5 font-body text-[13px] font-bold text-white transition-brand duration-brand hover:bg-brand-primary"
            >
              {t('বুঝেছি ✓')}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
