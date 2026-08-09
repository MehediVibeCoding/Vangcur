'use client';

import { useEffect, useRef, useState } from 'react';
import { OPEN_WAIT_OVERLAY_EVENT, SHOW_BG_CONFIRM_EVENT } from '@/lib/uiEvents';

export default function BgConfirmPopup() {
  const [visible, setVisible] = useState(false);
  const [orderNum, setOrderNum] = useState('');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const onShow = (e: Event) => {
      const num = (e as CustomEvent).detail?.orderNum;
      setOrderNum(num || '');
      setVisible(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setVisible(false), 8000);
    };
    window.addEventListener(SHOW_BG_CONFIRM_EVENT, onShow);
    return () => {
      window.removeEventListener(SHOW_BG_CONFIRM_EVENT, onShow);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const openDetails = () => {
    setVisible(false);
    window.dispatchEvent(new CustomEvent(OPEN_WAIT_OVERLAY_EVENT));
  };

  return (
    <div
      className={`fixed bottom-24 right-4 z-[95] flex max-w-[280px] items-center gap-3 rounded-[14px] bg-white px-4 py-3.5 shadow-sh3 ring-1 ring-black/5 transition-all duration-300 ${
        visible ? 'pointer-events-auto translate-y-0 opacity-100' : 'pointer-events-none translate-y-3 opacity-0'
      }`}
    >
      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[#D1FAE5] text-lg">🎉</div>
      <div className="min-w-0 flex-1">
        <div className="font-body text-[12.5px] font-bold text-ink">অর্ডার কনফার্ম হয়েছে!</div>
        <div className="truncate font-body text-[11.5px] text-muted">{orderNum}</div>
      </div>
      <button
        onClick={openDetails}
        className="flex-shrink-0 rounded-full bg-ink px-3 py-1.5 font-body text-[11px] font-semibold text-white hover:bg-brand-primary"
      >
        দেখুন
      </button>
    </div>
  );
}
