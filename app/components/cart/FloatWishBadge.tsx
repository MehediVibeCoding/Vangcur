'use client';

import { useEffect, useRef, useState } from 'react';
import { WISH_ADD_EVENT } from '@/lib/productData';
import { OPEN_WISHLIST_EVENT } from '@/lib/uiEvents';

// Matches the site-wide toast timing in lib/toast.ts: visible for 2600ms,
// then a 300ms fade-out before it's removed.
const VISIBLE_MS = 2600;
const FADE_MS = 300;

export default function FloatWishBadge() {
  const [mounted, setMounted] = useState(false);
  const [closing, setClosing] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const removeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const onAdd = () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
      if (removeTimer.current) clearTimeout(removeTimer.current);
      setClosing(false);
      setMounted(true);
      hideTimer.current = setTimeout(() => {
        setClosing(true);
        removeTimer.current = setTimeout(() => setMounted(false), FADE_MS);
      }, VISIBLE_MS);
    };
    window.addEventListener(WISH_ADD_EVENT, onAdd);
    return () => {
      window.removeEventListener(WISH_ADD_EVENT, onAdd);
      if (hideTimer.current) clearTimeout(hideTimer.current);
      if (removeTimer.current) clearTimeout(removeTimer.current);
    };
  }, []);

  if (!mounted) return null;

  return (
    <div
      className={`fixed bottom-[218px] right-5 z-40 flex h-14 w-14 cursor-pointer items-center justify-center rounded-full bg-white shadow-sh3 ring-1 ring-brand-light/40 transition-all duration-300 ${
        closing ? 'opacity-0 scale-75' : 'opacity-100 scale-100 animate-heartbeat'
      }`}
      onClick={() => window.dispatchEvent(new CustomEvent(OPEN_WISHLIST_EVENT))}
      title="উইশলিস্ট"
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-brand-primary">
        <path
          d="M12 20.7s-7.36-4.6-10-8.86C.44 8.9 1.36 5.1 4.5 3.66a6 6 0 017.5 1.5 6 6 0 017.5-1.5c3.14 1.44 4.06 5.24 2.5 8.18-2.64 4.26-10 8.86-10 8.86z"
          fill="currentColor"
        />
      </svg>
    </div>
  );
}
