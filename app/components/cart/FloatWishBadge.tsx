'use client';

import { useEffect, useState } from 'react';
import { WISH_ADD_EVENT } from '@/lib/productData';
import { OPEN_WISHLIST_EVENT } from '@/lib/uiEvents';

const AUTO_DISMISS_MS = 3000;

export default function FloatWishBadge() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let hideTimer: ReturnType<typeof setTimeout> | null = null;
    const onAdd = () => {
      if (hideTimer) clearTimeout(hideTimer);
      setVisible(true);
      hideTimer = setTimeout(() => setVisible(false), AUTO_DISMISS_MS);
    };
    window.addEventListener(WISH_ADD_EVENT, onAdd);
    return () => {
      window.removeEventListener(WISH_ADD_EVENT, onAdd);
      if (hideTimer) clearTimeout(hideTimer);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-5 right-[86px] z-40 flex h-14 w-14 cursor-pointer items-center justify-center rounded-full bg-white shadow-sh3 animate-section-reveal"
      onClick={() => window.dispatchEvent(new CustomEvent(OPEN_WISHLIST_EVENT))}
    >
      <span className="text-2xl">❤️</span>
    </div>
  );
}
