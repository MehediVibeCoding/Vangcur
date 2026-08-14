'use client';

import { useEffect, useRef, useState } from 'react';
import { WISH_ADD_EVENT } from '@/lib/productData';
import { OPEN_WISHLIST_EVENT } from '@/lib/uiEvents';

// How long it stays fully visible before fading out, and how long the fade itself takes.
const VISIBLE_MS = 4500;
const FADE_MS = 300;

export default function FloatWishBadge() {
  const [mounted, setMounted] = useState(false);
  const [show, setShow] = useState(false);
  const isVisibleRef = useRef(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const removeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rafId = useRef<number | null>(null);

  useEffect(() => {
    const onAdd = () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
      if (removeTimer.current) clearTimeout(removeTimer.current);

      if (!isVisibleRef.current) {
        // Mount it hidden first, then flip to visible a frame later so the
        // opacity/scale transition actually plays instead of snapping in.
        setMounted(true);
        setShow(false);
        if (rafId.current) cancelAnimationFrame(rafId.current);
        rafId.current = requestAnimationFrame(() => {
          rafId.current = requestAnimationFrame(() => {
            isVisibleRef.current = true;
            setShow(true);
          });
        });
      }

      // Every add — whether it's freshly appearing or already on screen —
      // (re)starts the hold timer, so rapid adds simply keep it visible longer.
      hideTimer.current = setTimeout(() => {
        isVisibleRef.current = false;
        setShow(false);
        removeTimer.current = setTimeout(() => setMounted(false), FADE_MS);
      }, VISIBLE_MS);
    };

    window.addEventListener(WISH_ADD_EVENT, onAdd);
    return () => {
      window.removeEventListener(WISH_ADD_EVENT, onAdd);
      if (hideTimer.current) clearTimeout(hideTimer.current);
      if (removeTimer.current) clearTimeout(removeTimer.current);
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, []);

  if (!mounted) return null;

  return (
    <div
      className={`fixed bottom-[218px] right-5 z-40 flex h-14 w-14 cursor-pointer items-center justify-center rounded-full bg-white shadow-sh3 ring-1 ring-brand-light/40 transition-all duration-300 ease-out ${
        show ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
      }`}
      onClick={() => window.dispatchEvent(new CustomEvent(OPEN_WISHLIST_EVENT))}
      title="উইশলিস্ট"
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-brand-light">
        <path
          d="M12 20.7s-7.36-4.6-10-8.86C.44 8.9 1.36 5.1 4.5 3.66a6 6 0 017.5 1.5 6 6 0 017.5-1.5c3.14 1.44 4.06 5.24 2.5 8.18-2.64 4.26-10 8.86-10 8.86z"
          fill="currentColor"
        />
      </svg>
    </div>
  );
}
