'use client';

import { useEffect, useRef, useState } from 'react';
import { useT } from '@/lib/i18n/useT';

const SHOW_AFTER_PX = 400;
const HIDE_BELOW_PX = 320; // শো/হাইড থ্রেশহোল্ডে সামান্য gap (hysteresis) রাখা হলো —
// ঠিক ৪০০px বরাবর থাকলে সামান্য স্ক্রল/জুম-জনিত resize-এ বারবার true/false
// টগল হয়ে বাটনটা unmount-remount হচ্ছিল (ফলে প্রতিবার entrance animation
// রিপ্লে হতো, "আবার লোড হওয়ার" মতো দেখাতো)।

export default function BackToTopButton() {
  const { t } = useT();
  const [visible, setVisible] = useState(false);
  const tickingRef = useRef(false);

  useEffect(() => {
    const check = () => {
      tickingRef.current = false;
      setVisible((prev) => {
        const y = window.scrollY;
        if (!prev && y > SHOW_AFTER_PX) return true;
        if (prev && y < HIDE_BELOW_PX) return false;
        return prev;
      });
    };
    const onScroll = () => {
      if (tickingRef.current) return;
      tickingRef.current = true;
      requestAnimationFrame(check);
    };
    check();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      title={t('উপরে যান')}
      className="fixed bottom-[284px] right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-white text-brand-light shadow-sh3 animate-section-reveal transition-brand duration-brand hover:bg-brand-light hover:text-white"
    >
      <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <path d="M12 19V5" />
        <path d="M5 12l7-7 7 7" />
      </svg>
    </button>
  );
}
