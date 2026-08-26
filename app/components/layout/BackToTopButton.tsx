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
      // FloatWishBadge সরে যাওয়ায় স্ট্যাকের সবচেয়ে উপরের (284px) বাটন এখন এই
      // একটাই বেঁচে ছিল — তাই এটাকে নামিয়ে কার্ট বাটনের আগের জায়গায় (152px)
      // বসানো হলো, যাতে Messenger → BackToTop → কার্ট — এই তিনটা বাটন একে
      // অন্যের গায়ে গায়ে লেগে, ফাঁকা গ্যাপ ছাড়া সিরিয়ালি সাজানো থাকে।
      // রঙও উল্টো ছিল (সাদা ব্যাকগ্রাউন্ড + নীল আইকন) — কার্ট আইকনের মতোই এখন
      // ব্র্যান্ড-নীল ব্যাকগ্রাউন্ড + সাদা আইকন করে দেওয়া হলো।
      className="fixed bottom-[152px] right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-brand-light text-white shadow-sh3 animate-section-reveal transition-brand duration-brand hover:bg-brand-light-hover"
    >
      <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <path d="M12 19V5" />
        <path d="M5 12l7-7 7 7" />
      </svg>
    </button>
  );
}
