'use client';

import { useEffect, useState } from 'react';
import CartSidebar from './cart/CartSidebar';
import WishlistDrawer from './cart/WishlistDrawer';
import FloatCartBadge from './cart/FloatCartBadge';
import FloatWishBadge from './cart/FloatWishBadge';
import { OPEN_CART_EVENT, OPEN_WISHLIST_EVENT } from '@/lib/uiEvents';

export default function GlobalOverlays() {
  const [cartOpen, setCartOpen] = useState(false);
  const [wishOpen, setWishOpen] = useState(false);

  useEffect(() => {
    const onOpenCart = () => setCartOpen(true);
    const onOpenWish = () => setWishOpen(true);
    window.addEventListener(OPEN_CART_EVENT, onOpenCart);
    window.addEventListener(OPEN_WISHLIST_EVENT, onOpenWish);
    return () => {
      window.removeEventListener(OPEN_CART_EVENT, onOpenCart);
      window.removeEventListener(OPEN_WISHLIST_EVENT, onOpenWish);
    };
  }, []);

  return (
    <>
      <div className="pointer-events-none fixed left-1/2 top-6 z-[80] -translate-x-1/2 rounded-full bg-ink px-4 py-2.5 text-[13px] font-semibold text-white opacity-0 transition-all duration-300 [&.show]:pointer-events-auto [&.show]:opacity-100" id="toast" />
      <CartSidebar isOpen={cartOpen} onClose={() => setCartOpen(false)} />
      <WishlistDrawer isOpen={wishOpen} onClose={() => setWishOpen(false)} />
      <FloatCartBadge />
      <FloatWishBadge />
    </>
  );
}
