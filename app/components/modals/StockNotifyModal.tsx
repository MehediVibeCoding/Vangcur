'use client';

import { useEffect, useState } from 'react';
import { STOCK_NOTIFY_EVENT } from '@/lib/productData';
import { lockBody, unlockBody } from '@/lib/bodyScrollLock';
import { showToast } from '@/lib/toast';
import { useT } from '@/lib/i18n/useT';

interface NotifyDetail {
  id: number | string;
  name: string;
}

export default function StockNotifyModal() {
  const { t } = useT();
  const [detail, setDetail] = useState<NotifyDetail | null>(null);

  useEffect(() => {
    const onOpen = (e: Event) => {
      const d = (e as CustomEvent<NotifyDetail>).detail;
      if (d && d.id !== undefined) setDetail(d);
    };
    window.addEventListener(STOCK_NOTIFY_EVENT, onOpen);
    return () => window.removeEventListener(STOCK_NOTIFY_EVENT, onOpen);
  }, []);

  useEffect(() => {
    if (detail) lockBody();
    else unlockBody();
    return () => unlockBody();
  }, [detail]);

  const isOpen = !!detail;
  const close = () => setDetail(null);

  const confirm = () => {
    if (!detail) return;
    try {
      localStorage.setItem(
        `vc_sn_${detail.id}`,
        JSON.stringify({ prodId: detail.id, prodName: detail.name, ts: Date.now() }),
      );
    } catch {
      // localStorage unavailable — silently skip
    }
    showToast(t('🔔 স্টকে এলে জানিয়ে দেওয়া হবে'));
    close();
  };

  return (
    <div className={`fixed inset-0 z-[70] transition-opacity duration-brand ${isOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'}`}>
      <div className="absolute inset-0 bg-black/50" onClick={close} />
      <div
        className={`absolute inset-x-0 bottom-0 mx-auto max-h-[85vh] w-full max-w-[420px] overflow-y-auto rounded-t-[20px] bg-white px-5 pb-6 pt-3 shadow-sh3 transition-transform duration-brand ${isOpen ? 'translate-y-0' : 'translate-y-full'}`}
      >
        <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-border-base" />
        <div className="mb-3 flex justify-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#FEF3C7] text-2xl">🔔</div>
        </div>
        <div className="mb-1.5 text-center font-display text-[16px] font-bold text-ink">{t('স্টক নোটিফিকেশন')}</div>
        <p className="mb-4 text-center font-body text-[13px] leading-[1.6] text-muted">
          <span className="font-semibold text-ink">{detail?.name}</span> {t('স্টকে এলে আপনাকে জানিয়ে দেওয়া হবে। এই তালিকা আপনার অ্যাকাউন্ট পেজে "স্টক নোটিফিকেশন"-এ পাবেন।')}
        </p>
        <button
          onClick={confirm}
          className="mb-2 w-full rounded-[9px] border-none bg-brand-light py-3 font-body text-sm font-bold text-white transition-brand duration-brand hover:bg-brand-light-hover"
        >
          🔔 {t('জানিয়ে দিন')}
        </button>
        <button onClick={close} className="w-full rounded-[9px] border-none bg-transparent py-2.5 font-body text-[13px] font-semibold text-muted hover:text-ink">
          {t('বাতিল')}
        </button>
      </div>
    </div>
  );
}
