'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { usePathname, useRouter } from 'next/navigation';
import FloatCartBadge from './cart/FloatCartBadge';
import { OPEN_CART_EVENT, OPEN_WISHLIST_EVENT, OPEN_TRACK_ORDER_EVENT } from '@/lib/uiEvents';
import { useLanguageStore } from '@/lib/store/languageStore';
import { useCartStore } from '@/lib/store/cartStore';
import { useWishlistStore } from '@/lib/store/wishlistStore';

const CartSidebar = dynamic(() => import('./cart/CartSidebar'), { ssr: false });
const WishlistDrawer = dynamic(() => import('./cart/WishlistDrawer'), { ssr: false });
const TrackOrderModal = dynamic(() => import('./cart/TrackOrderModal'), { ssr: false });
const FloatContactButtons = dynamic(() => import('./layout/FloatContactButtons'), { ssr: false });
const BackToTopButton = dynamic(() => import('./layout/BackToTopButton'), { ssr: false });
const WishlistFlyOverlay = dynamic(() => import('./cart/WishlistFlyOverlay'), { ssr: false });
const RareOverlays = dynamic(() => import('./RareOverlays'), { ssr: false });

export default function GlobalOverlays() {
  const [cartOpen, setCartOpen] = useState(false);
  const [wishOpen, setWishOpen] = useState(false);
  const [trackOpen, setTrackOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const lang = useLanguageStore((s) => s.lang);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  // ইনস্ট্যান্ট চেকআউট ট্রানজিশনের জন্য প্রি-ফেচ
  useEffect(() => {
    router.prefetch('/checkout');
    router.prefetch('/');
  }, [router]);

  // hydration mismatch এড়াতে cart/wishlist store localStorage থেকে
  // শুধু client mount হওয়ার পর (hydration শেষে) লোড হয়, initial
  // server/client render দুটোই খালি state দিয়ে মেলে
  useEffect(() => {
    useCartStore.getState().hydrate();
    useWishlistStore.getState().hydrate();
  }, []);

  // মোবাইল সিপিইউ ফ্রি রাখতে প্রথম রেন্ডারের পর অলস সময়ে নন-ক্রিটিক্যাল ওভারলে লোড
  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const hideFloatingBadges = pathname?.startsWith('/checkout') ?? false;
  const isProductPage = pathname?.startsWith('/product/') ?? false;

  useEffect(() => {
    const onOpenCart = () => setCartOpen(true);
    const onOpenWish = () => setWishOpen(true);
    const onOpenTrack = () => setTrackOpen(true);
    window.addEventListener(OPEN_CART_EVENT, onOpenCart);
    window.addEventListener(OPEN_WISHLIST_EVENT, onOpenWish);
    window.addEventListener(OPEN_TRACK_ORDER_EVENT, onOpenTrack);
    return () => {
      window.removeEventListener(OPEN_CART_EVENT, onOpenCart);
      window.removeEventListener(OPEN_WISHLIST_EVENT, onOpenWish);
      window.removeEventListener(OPEN_TRACK_ORDER_EVENT, onOpenTrack);
    };
  }, []);

  return (
    <>
      <div
        className="pointer-events-none fixed bottom-20 left-1/2 z-[1300] flex -translate-x-1/2 translate-y-2 items-center gap-1.5 whitespace-nowrap rounded-full border border-brand-light/15 bg-brand-bg px-5 py-3 text-[13px] font-semibold text-brand-light opacity-0 shadow-sh3 transition-all duration-300 ease-out max-w-[92vw] [&.show]:pointer-events-auto [&.show]:translate-y-0 [&.show]:opacity-100"
        id="toast"
      />
      <CartSidebar isOpen={cartOpen} onClose={() => setCartOpen(false)} />
      <WishlistDrawer isOpen={wishOpen} onClose={() => setWishOpen(false)} />
      <TrackOrderModal isOpen={trackOpen} onClose={() => setTrackOpen(false)} />
      
      {!hideFloatingBadges && <FloatCartBadge />}

      {mounted && (
        <>
          {!hideFloatingBadges && !isProductPage && (
            <>
              <FloatContactButtons />
              <BackToTopButton />
            </>
          )}
          <WishlistFlyOverlay />
          <RareOverlays />
        </>
      )}
    </>
  );
}
