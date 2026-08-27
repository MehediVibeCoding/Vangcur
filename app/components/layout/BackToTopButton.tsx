'use client';

import { useEffect, useRef, useState } from 'react';
import { useT } from '@/lib/i18n/useT';

export default function BackToTopButton() {
  const { t } = useT();
  const [visible, setVisible] = useState(false);
  const tickingRef = useRef(false);

  useEffect(() => {
    const check = () => {
      tickingRef.current = false;
      const isMobile = window.innerWidth <= 768;
      const targetProductIndex = isMobile ? 9 : 19; // মোবাইলে ১০ম প্রোডাক্ট এবং ডেস্কে ২০তম প্রোডাক্ট
      
      const productCards = document.querySelectorAll('#prodSec [data-prod-card], #prodSec .grid > div');
      
      let shouldShow = false;
      if (productCards.length > targetProductIndex) {
        const targetCard = productCards[targetProductIndex] as HTMLElement;
        const rect = targetCard.getBoundingClientRect();
        shouldShow = rect.top < window.innerHeight;
      } else {
        const fallbackThreshold = isMobile ? 1500 : 2200;
        const fallbackHide = isMobile ? 1200 : 1800;
        const y = window.scrollY;
        shouldShow = visible ? y > fallbackHide : y > fallbackThreshold;
      }

      setVisible(shouldShow);
    };

    const onScroll = () => {
      if (tickingRef.current) return;
      tickingRef.current = true;
      requestAnimationFrame(check);
    };

    check();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      title={t('উপরে যান')}
      aria-label={t('উপরে যান')}
      className="fixed bottom-[164px] right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-brand-light text-white shadow-sh3 animate-section-reveal transition-brand duration-brand hover:bg-brand-light-hover"
    >
      <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <path d="M12 19V5" />
        <path d="M5 12l7-7 7 7" />
      </svg>
    </button>
  );
}
