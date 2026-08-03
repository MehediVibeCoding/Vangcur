'use client';

import { useEffect, useRef, useState } from 'react';
import { getCart, cartCount, CART_EVENT, CART_ADD_EVENT } from '@/lib/cartData';
import { OPEN_CART_EVENT } from '@/lib/uiEvents';

export default function FloatCartBadge() {
  const [count, setCount] = useState(0);
  const [jiggle, setJiggle] = useState(false);
  const btnRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCount(cartCount(getCart()));
    const onChange = (e: Event) => setCount(cartCount((e as CustomEvent).detail?.cart ?? getCart()));
    window.addEventListener(CART_EVENT, onChange);
    return () => window.removeEventListener(CART_EVENT, onChange);
  }, []);

  useEffect(() => {
    const onAdd = () => {
      setJiggle(false);
      requestAnimationFrame(() => setJiggle(true));
    };
    window.addEventListener(CART_ADD_EVENT, onAdd);
    return () => window.removeEventListener(CART_ADD_EVENT, onAdd);
  }, []);

  if (count <= 0) return null;

  return (
    <div
      className={`fixed bottom-5 right-5 z-40 flex h-14 w-14 cursor-pointer items-center justify-center rounded-full bg-brand-primary shadow-sh3 ${jiggle ? 'animate-cart-jiggle' : ''}`}
      ref={btnRef}
      onClick={() => window.dispatchEvent(new CustomEvent(OPEN_CART_EVENT))}
      onAnimationEnd={() => setJiggle(false)}
    >
      <svg width="22" height="22" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
        <line x1="3" y1="6" x2="21" y2="6" />
        <path d="M16 10a4 4 0 01-8 0" />
      </svg>
      <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-white px-1 text-[11px] font-bold text-brand-primary">
        {count}
      </span>
    </div>
  );
}
