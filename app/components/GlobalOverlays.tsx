'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import FloatCartBadge from './cart/FloatCartBadge';
import FloatWishBadge from './cart/FloatWishBadge';
import FloatContactButtons from './layout/FloatContactButtons';
import BackToTopButton from './layout/BackToTopButton';
import { OPEN_CART_EVENT, OPEN_WISHLIST_EVENT, OPEN_TRACK_ORDER_EVENT } from '@/lib/uiEvents';

// এই ওভারলে/মোডাল/ড্রয়ারগুলো প্রথম পেজ-লোডে দরকার হয় না — ইউজার কার্ট/উইশলিস্ট/
// ট্র্যাক অর্ডার/মেম্বারশিপ ইত্যাদিতে ক্লিক না করা পর্যন্ত এগুলোর কোড লাগবে না।
// next/dynamic দিয়ে এগুলোকে আলাদা চাংকে ভাগ করে দেওয়া হলো (ssr: false, কারণ এগুলো
// পুরোপুরি ক্লায়েন্ট-সাইড ইন্টারঅ্যাকশন-নির্ভর, প্রথম রেন্ডারে দরকার নেই), যাতে
// মূল/প্রথম JS বান্ডেল ছোট থাকে এবং TBT/LCP কমে।
const CartSidebar = dynamic(() => import('./cart/CartSidebar'));
const WishlistDrawer = dynamic(() => import('./cart/WishlistDrawer'));
const TrackOrderModal = dynamic(() => import('./cart/TrackOrderModal'));
const QuickOrderBridge = dynamic(() => import('./checkout/QuickOrderBridge'), { ssr: false });
const WaitingOverlay = dynamic(() => import('./checkout/WaitingOverlay'), { ssr: false });
const BgConfirmPopup = dynamic(() => import('./checkout/BgConfirmPopup'), { ssr: false });
const PostOrderInfoModal = dynamic(() => import('./checkout/PostOrderInfoModal'), { ssr: false });
const StockNotifyModal = dynamic(() => import('./modals/StockNotifyModal'), { ssr: false });
const BackInStockToast = dynamic(() => import('./modals/BackInStockToast'), { ssr: false });
const MembershipModal = dynamic(() => import('./modals/MembershipModal'), { ssr: false });
const InvoiceModal = dynamic(() => import('./modals/InvoiceModal'), { ssr: false });
const OfferPopup = dynamic(() => import('./modals/OfferPopup'), { ssr: false });
const RecoveryToast = dynamic(() => import('./modals/RecoveryToast'), { ssr: false });

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
        toast আগে top-6 এ ছিল, z-[80] দিয়ে — Navbar sticky z-[900] এ থাকায় toast
        Navbar-এর পিছনে ঢাকা পড়ে যেত, কখনো চোখেই পড়ত না। এখন legacy CSS-এর
        exact bottom:80px মেনে bottom-20 এ বসানো হয়েছে (floating WhatsApp বাটনের
        উচ্চতা বরাবর, স্ক্রিনের একদম কিনারায় না), আর z-index Navbar/dropdown
        (900/1100) দুটোরই উপরে (1300) রাখা হয়েছে, যাতে কখনো ঢাকা না পড়ে।
      */}
      <div
        className="pointer-events-none fixed bottom-20 left-1/2 z-[1300] flex -translate-x-1/2 translate-y-2 items-center gap-1.5 whitespace-nowrap rounded-full border border-brand-light/15 bg-brand-bg px-5 py-3 text-[13px] font-semibold text-brand-light opacity-0 shadow-sh3 transition-all duration-300 ease-out max-w-[92vw] [&.show]:pointer-events-auto [&.show]:translate-y-0 [&.show]:opacity-100"
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
