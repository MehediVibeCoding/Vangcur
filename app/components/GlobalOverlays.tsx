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
  // প্রোডাক্ট পেজে (নিজের একটা ফোকাসড, বিস্তারিত পেজ) মেসেঞ্জার/হোয়াটসঅ্যাপ কার্ড,
  // ফ্লোটিং উইশলিস্ট বাজ, আর ব্যাক-টু-টপ বাটন থাকবে না — শুধু হোম আর SRP পেজে থাকবে।
  // ফ্লোটিং কার্ট বাজ ইচ্ছাকৃতভাবে বাদ (এটা প্রোডাক্ট পেজেও রাখতে বলা হয়েছে)।
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
      {/*
        আগে toast-টা top-6 এ ছিল, z-[80] দিয়ে — কিন্তু Navbar sticky z-[900] এ থাকায়
        toast আসলে Navbar-এর পিছনে ঢাকা পড়ে যেত, তাই কখনো চোখেই পড়ত না (উইশলিস্টে
        যোগ করলে, কার্টে যোগ করলে — কোনো toast-ই visually দেখা যেত না)। এখন legacy
        সাইটের মতোই নিচে (bottom-center) বসানো হয়েছে, আর z-index Navbar/dropdown
        (900/1100) দুটোরই উপরে (1300) রাখা হয়েছে, যাতে কখনো ঢাকা না পড়ে।
      */}
      <div
        className="pointer-events-none fixed bottom-6 left-1/2 z-[1300] flex -translate-x-1/2 translate-y-2 items-center gap-1.5 whitespace-nowrap rounded-full border border-brand-primary/15 bg-brand-bg px-5 py-3 text-[13px] font-semibold text-brand-primary opacity-0 shadow-sh3 transition-all duration-300 ease-out max-w-[92vw] [&.show]:pointer-events-auto [&.show]:translate-y-0 [&.show]:opacity-100"
        id="toast"
      />
      <CartSidebar isOpen={cartOpen} onClose={() => setCartOpen(false)} />
      <WishlistDrawer isOpen={wishOpen} onClose={() => setWishOpen(false)} />
      <TrackOrderModal isOpen={trackOpen} onClose={() => setTrackOpen(false)} />
      {!hideFloatingBadges && <FloatCartBadge />}
      {!hideFloatingBadges && !isProductPage && (
        <>
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
