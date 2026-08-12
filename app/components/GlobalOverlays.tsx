'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import CartSidebar from './cart/CartSidebar';
import WishlistDrawer from './cart/WishlistDrawer';
import TrackOrderModal from './cart/TrackOrderModal';
import FloatCartBadge from './cart/FloatCartBadge';
import FloatWishBadge from './cart/FloatWishBadge';
import FloatContactButtons from './layout/FloatContactButtons';
import BackToTopButton from './layout/BackToTopButton';
import QuickOrderBridge from './checkout/QuickOrderBridge';
import WaitingOverlay from './checkout/WaitingOverlay';
import BgConfirmPopup from './checkout/BgConfirmPopup';
import PostOrderInfoModal from './checkout/PostOrderInfoModal';
import StockNotifyModal from './modals/StockNotifyModal';
import BackInStockToast from './modals/BackInStockToast';
import MembershipModal from './modals/MembershipModal';
import InvoiceModal from './modals/InvoiceModal';
import OfferPopup from './modals/OfferPopup';
import RecoveryToast from './modals/RecoveryToast';
import { OPEN_CART_EVENT, OPEN_WISHLIST_EVENT, OPEN_TRACK_ORDER_EVENT } from '@/lib/uiEvents';

export default function GlobalOverlays() {
  const [cartOpen, setCartOpen] = useState(false);
  const [wishOpen, setWishOpen] = useState(false);
  const [trackOpen, setTrackOpen] = useState(false);
  const pathname = usePathname();
  // চেকআউট পেজে কোনো ফ্লোটিং কার্ট/উইশলিস্ট বাটন দেখানো উচিত না — এখানে সেগুলো শুধু
  // বিভ্রান্তিকর, কারণ চেকআউট নিজেই একটা ফোকাসড ফ্লো।
  const hideFloatingBadges = pathname?.startsWith('/checkout') ?? false;

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
      <div className="pointer-events-none fixed left-1/2 top-6 z-[80] -translate-x-1/2 rounded-full bg-ink px-4 py-2.5 text-[13px] font-semibold text-white opacity-0 transition-all duration-300 [&.show]:pointer-events-auto [&.show]:opacity-100" id="toast" />
      <CartSidebar isOpen={cartOpen} onClose={() => setCartOpen(false)} />
      <WishlistDrawer isOpen={wishOpen} onClose={() => setWishOpen(false)} />
      <TrackOrderModal isOpen={trackOpen} onClose={() => setTrackOpen(false)} />
      {!hideFloatingBadges && (
        <>
          <FloatCartBadge />
          <FloatWishBadge />
          <FloatContactButtons />
          <BackToTopButton />
        </>
      )}
      <QuickOrderBridge />
      <WaitingOverlay />
      <BgConfirmPopup />
      <PostOrderInfoModal />
      <StockNotifyModal />
      <BackInStockToast />
      <MembershipModal />
      <InvoiceModal />
      <OfferPopup />
      <RecoveryToast />
    </>
  );
}
