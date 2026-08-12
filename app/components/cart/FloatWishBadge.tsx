'use client';

import { useEffect, useState } from 'react';
import { getWishlist, WISHLIST_EVENT, WISH_ADD_EVENT } from '@/lib/productData';
import { OPEN_WISHLIST_EVENT } from '@/lib/uiEvents';

export default function FloatWishBadge() {
  const [count, setCount] = useState(0);
  const [beat, setBeat] = useState(false);

  useEffect(() => {
    setCount(getWishlist().length);
    const onChange = () => setCount(getWishlist().length);
    window.addEventListener(WISHLIST_EVENT, onChange);
    return () => window.removeEventListener(WISHLIST_EVENT, onChange);
  }, []);

  useEffect(() => {
    const onAdd = () => {
      setBeat(false);
      requestAnimationFrame(() => setBeat(true));
    };
    window.addEventListener(WISH_ADD_EVENT, onAdd);
    return () => window.removeEventListener(WISH_ADD_EVENT, onAdd);
  }, []);

  if (count <= 0) return null;

  return (
    <div
      className={`fixed bottom-5 right-[86px] z-40 flex h-14 w-14 cursor-pointer items-center justify-center rounded-full bg-white shadow-sh3 animate-section-reveal ${beat ? 'animate-heartbeat' : ''}`}
      onClick={() => window.dispatchEvent(new CustomEvent(OPEN_WISHLIST_EVENT))}
      onAnimationEnd={() => setBeat(false)}
    >
      <span className="text-2xl">❤️</span>
      <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-brand-primary px-1 text-[11px] font-bold text-white">
        {count}
      </span>
    </div>
  );
}
