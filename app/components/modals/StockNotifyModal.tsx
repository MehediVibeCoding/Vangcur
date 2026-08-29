// [REPLACE] ফাইলের পাথ: app/components/modals/StockNotifyModal.tsx
'use client';

import { useEffect, useState } from 'react';
import { STOCK_NOTIFY_EVENT } from '@/lib/productData';
import { useAuthStore } from '@/lib/store/authStore';
import { lockBody, unlockBody } from '@/lib/bodyScrollLock';
import { showToast } from '@/lib/toast';
import { validateName, sanitizePlainName, validatePhone, MAX_NAME_LEN } from '@/lib/security';
import { useT } from '@/lib/i18n/useT';

interface NotifyDetail {
  id: number | string;
  name: string;
}

const lineIcon = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

function BellIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function IconUser() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 12.75a5.25 5.25 0 1 0 0-10.5 5.25 5.25 0 0 0 0 10.5Zm0 2.15c-4.55 0-8.75 2.28-8.75 5.7a1.35 1.35 0 0 0 1.35 1.35h14.8a1.35 1.35 0 0 0 1.35-1.35c0-3.42-4.2-5.7-8.75-5.7Z" />
    </svg>
  );
}

function IconPhone() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M7.1 2.5h2.32a1.3 1.3 0 0 1 1.26.98l.74 2.92a1.5 1.5 0 0 1-.4 1.44L9.4 9.46a1 1 0 0 0-.18 1.15 13.9 13.9 0 0 0 6.17 6.17 1 1 0 0 0 1.15-.18l1.62-1.62a1.5 1.5 0 0 1 1.44-.4l2.92.74a1.3 1.3 0 0 1 .98 1.26v2.32a1.65 1.65 0 0 1-1.8 1.65C10.99 19.71 4.29 13.01 3.45 4.3A1.65 1.65 0 0 1 5.1 2.5H7.1Z" />
    </svg>
  );
}

function HeaderDecor() {
  const deco = { ...lineIcon, strokeWidth: 1.4 };
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden text-brand-light/[0.14]">
      <svg {...deco} width="34" height="34" className="absolute -left-1 top-2 -rotate-12" viewBox="0 0 24 24">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      </svg>
      <svg {...deco} width="26" height="26" className="absolute right-14 top-3 rotate-6" viewBox="0 0 24 24">
        <rect x="7" y="2.5" width="10" height="15" rx="3" />
        <path d="M10 5.5h4" />
        <circle cx="12" cy="20" r="1.6" />
      </svg>
    </div>
  );
}

export default function StockNotifyModal() {
  const { t, lang } = useT();
  const currentUser = useAuthStore((s) => s.currentUser);

  const [detail, setDetail] = useState<NotifyDetail | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [nameErr, setNameErr] = useState('');
  const [phoneErr, setPhoneErr] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const onOpen = (e: Event) => {
      const d = (e as CustomEvent<NotifyDetail>).detail;
      if (d && d.id !== undefined) {
        setDetail(d);
        setName(currentUser?.name || '');
        setPhone(currentUser?.phone || '');
        setNameErr('');
        setPhoneErr('');
      }
    };
    window.addEventListener(STOCK_NOTIFY_EVENT, onOpen);
    return () => window.removeEventListener(STOCK_NOTIFY_EVENT, onOpen);
  }, [currentUser]);

  useEffect(() => {
    if (detail) lockBody();
    else unlockBody();
    return () => unlockBody();
  }, [detail]);

  const isOpen = !!detail;
  const close = () => {
    setDetail(null);
    setNameErr('');
    setPhoneErr('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!detail) return;

    let hasErr = false;
    const cleanName = sanitizePlainName(name.trim());
    const cleanPhone = phone.trim().replace(/\D/g, '');

    if (!validateName(cleanName)) {
      setNameErr(lang === 'en' ? 'Enter a valid name (min 3 characters)' : 'কমপক্ষে ৩ অক্ষরের সঠিক নাম দিন');
      hasErr = true;
    } else {
      setNameErr('');
    }

    if (!validatePhone(cleanPhone)) {
      setPhoneErr(lang === 'en' ? 'Enter a valid 11-digit mobile number' : 'সঠিক ১১ সংখ্যার মোবাইল নম্বর দিন (01XXXXXXXXX)');
      hasErr = true;
    } else {
      setPhoneErr('');
    }

    if (hasErr) return;

    setSubmitting(true);

    try {
      // ১. ব্রাউজারের লোকাল স্টোরেজে সংরক্ষণ
      localStorage.setItem(
        `vc_sn_${detail.id}`,
        JSON.stringify({
          prodId: detail.id,
          prodName: detail.name,
          customerName: cleanName,
          phone: cleanPhone,
          ts: Date.now(),
        }),
      );

      // ২. গুগল শীটের "Stock Requests" ট্যাবে স্বয়ংক্রিয়ভাবে ডাটা পাঠানো
      fetch('/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'addStockRequest',
          productName: detail.name,
          customerName: cleanName,
          mobileNumber: cleanPhone,
          productId: String(detail.id),
        }),
      }).catch(() => {});

      // ৩. প্রোডাক্ট পেজকে জানানো যাতে সাথে সাথে বাটনটি "✅ স্টকে আসলে আপনাকে জানানো হবে" তে আপডেট হয়
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('vc:stockSubscribed', {
            detail: { id: detail.id },
          }),
        );
      }

      showToast(lang === 'en' ? '🔔 We will notify you once back in stock!' : '🔔 রিকোয়েস্ট সফল! স্টকে এলে জানিয়ে দেওয়া হবে।');
      close();
    } catch {
      showToast(t('একটি সমস্যা হয়েছে, আবার চেষ্টা করুন'));
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen || !detail) return null;

  return (
    <>
      {/* ব্যাকড্রপ ব্লার */}
      <div
        className="fixed inset-0 z-[1200] bg-ink/55 backdrop-blur-[3px] transition-opacity duration-brand"
        onClick={close}
      />

      {/* সেন্ট্রালাইজড ভাসমান উইন্ডো — সিগনেচার ট্রাই-কালার ক্যানভাস */}
      <div className="fixed inset-0 z-[1205] flex items-center justify-center p-4">
        <div className="relative flex max-h-[90vh] w-full max-w-[420px] flex-col overflow-hidden rounded-[28px] bg-gradient-to-b from-brand-bg via-[#DCEBFD] to-white p-6 shadow-sh3 transition-all duration-300 ease-brand animate-section-reveal">
          
          {/* হেডার ডেকোর ও ক্লোজ বাটন */}
          <HeaderDecor />
          <button
            onClick={close}
            className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-white/60 bg-white/80 text-ink/60 shadow-sh1 backdrop-blur-[8px] transition-brand hover:bg-white hover:text-ink focus-visible:outline-none"
            aria-label={t('বন্ধ করুন')}
          >
            ✕
          </button>

          {/* নোটিফিকেশন বেল ব্যাজ */}
          <div className="relative z-10 mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full border border-brand-light/40 bg-brand-light text-white shadow-xs">
            <BellIcon />
          </div>

          {/* টাইটেল ও সাবটাইটেল */}
          <h3 className="relative z-10 text-center font-body text-[17px] font-extrabold text-ink">
            {lang === 'en' ? 'Notify When in Stock' : 'স্টকে আসলে জানাবো'}
          </h3>
          
          <p className="relative z-10 mt-1 text-center font-body text-[12.5px] leading-relaxed text-muted">
            {lang === 'en'
              ? 'We will notify you directly via phone once this product is available.'
              : 'প্রোডাক্টটি স্টকে আসলে আমরা আপনাকে সরাসরি জানাবো।'}
          </p>

          {/* প্রোডাক্টের নাম হাইলাইট কার্ড */}
          <div className="relative z-10 my-3 rounded-[16px] border border-brand-light/30 bg-white/80 p-3 text-center shadow-xs backdrop-blur-md">
            <p className="line-clamp-2 font-body text-[13.5px] font-bold leading-snug text-brand-primary">
              {detail.name}
            </p>
          </div>

          {/* ফর্ম ইনপুটসমূহ */}
          <form onSubmit={handleSubmit} className="relative z-10 flex flex-col gap-3">
            {/* আপনার নাম ইনপুট */}
            <div>
              <label className="mb-1 block font-body text-[12px] font-bold text-ink">
                {t('আপনার নাম')}
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-light">
                  <IconUser />
                </span>
                <input
                  type="text"
                  value={name}
                  maxLength={MAX_NAME_LEN}
                  onChange={(e) => {
                    setName(sanitizePlainName(e.target.value));
                    if (nameErr) setNameErr('');
                  }}
                  placeholder={lang === 'en' ? 'Your Full Name' : 'আপনার পূর্ণ নাম লিখুন'}
                  className={`w-full rounded-[14px] border-[1.5px] bg-white py-2.5 pl-10 pr-3.5 font-body text-sm text-ink outline-none transition-brand ${
                    nameErr ? 'border-red-400 bg-red-50/50' : 'border-border-base focus:border-brand-light focus:shadow-[0_0_0_3px_rgba(68,167,252,.12)]'
                  }`}
                />
              </div>
              {nameErr && <p className="mt-1 pl-1 font-body text-[11px] font-semibold text-red-600">{nameErr}</p>}
            </div>

            {/* মোবাইল নম্বর ইনপুট */}
            <div>
              <label className="mb-1 block font-body text-[12px] font-bold text-ink">
                {t('মোবাইল নম্বর')}
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-light">
                  <IconPhone />
                </span>
                <input
                  type="tel"
                  value={phone}
                  maxLength={11}
                  onChange={(e) => {
                    setPhone(e.target.value.replace(/\D/g, ''));
                    if (phoneErr) setPhoneErr('');
                  }}
                  placeholder="01XXXXXXXXX"
                  className={`w-full rounded-[14px] border-[1.5px] bg-white py-2.5 pl-10 pr-3.5 font-body text-sm text-ink outline-none transition-brand ${
                    phoneErr ? 'border-red-400 bg-red-50/50' : 'border-border-base focus:border-brand-light focus:shadow-[0_0_0_3px_rgba(68,167,252,.12)]'
                  }`}
                />
              </div>
              {phoneErr && <p className="mt-1 pl-1 font-body text-[11px] font-semibold text-red-600">{phoneErr}</p>}
            </div>

            {/* জমা দিন সিগনেচার বাটন */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-full bg-gradient-to-r from-info to-brand-light py-[13px] font-body text-[14.5px] font-bold text-white shadow-sh2 transition-all duration-brand hover:brightness-[1.03] active:scale-95 disabled:opacity-60"
              >
                {submitting
                  ? (lang === 'en' ? 'Submitting...' : 'জমা হচ্ছে...')
                  : (lang === 'en' ? 'Submit Request' : 'জমা দিন')}
              </button>
            </div>
          </form>

        </div>
      </div>
    </>
  );
}
