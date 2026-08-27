'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Navbar from './components/layout/Navbar';
import HeroSlider from './components/home/HeroSlider';
import TrustStrip from './components/home/TrustStrip';
import Categories from './components/home/Categories';
import ProductGrid from './components/home/ProductGrid';
import FAQ from './components/home/FAQ';
import About from './components/home/About';
import CustomerGallery from './components/home/CustomerGallery';
import Footer from './components/layout/Footer';
import { useCartStore, cartCount } from '@/lib/store/cartStore';
import { useWishlistStore } from '@/lib/store/wishlistStore';
import { useAuthStore } from '@/lib/store/authStore';
import { OPEN_CART_EVENT, OPEN_WISHLIST_EVENT, OPEN_TRACK_ORDER_EVENT, OPEN_ACCOUNT_EVENT } from '@/lib/uiEvents';
import type { Product, Category } from '@/types';
import type { HeroCard } from '@/lib/heroSliderData';

const LoginModal = dynamic(() => import('./components/auth/LoginModal'));
const AccountPage = dynamic(() => import('./components/auth/AccountPage'));

interface ClientHomeProps {
  initialProducts: Product[];
  initialCategories?: Category[];
  initialHeroCards?: HeroCard[];
  initialCategory?: string;
}

export default function ClientHome({ initialProducts, initialCategories, initialHeroCards, initialCategory }: ClientHomeProps) {
  const cartQty = useCartStore((s) => cartCount(s.cart));
  const wishQty = useWishlistStore((s) => s.wishlist.length);
  const currentUser = useAuthStore((s) => s.currentUser);
  const [loginOpen, setLoginOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);

  useEffect(() => {
    const onOpenAccount = () => {
      if (!useAuthStore.getState().currentUser) setLoginOpen(true);
      else setAccountOpen(true);
    };
    window.addEventListener(OPEN_ACCOUNT_EVENT, onOpenAccount);
    return () => window.removeEventListener(OPEN_ACCOUNT_EVENT, onOpenAccount);
  }, []);

  useEffect(() => {
    // চেকআউট পেজ এখন আর quick-order sessionStorage key সাথে সাথে ডিলিট
    // করে না (cart-empty বাগ ফিক্স, app/checkout/page.tsx দ্রষ্টব্য) — সেটা
    // ক্লিয়ার হয় শুধু অর্ডার সফল হলে বা × দিয়ে ক্যানসেল করলে। কিন্তু ইউজার
    // ব্রাউজার Back বাটন দিয়ে চেকআউট ছেড়ে হোমে ফিরলে ওই ক্লিয়ার-আপ চলে না,
    // তাই হোমপেজে ফেরাকেই "quick order attempt পরিত্যক্ত" ধরে এখানে
    // defensively পুরনো key মুছে ফেলা হচ্ছে, যাতে পরে normal cart দিয়ে
    // checkout করলে সেটা এই পুরনো single-item quick order দিয়ে hijack না হয়।
    try { sessionStorage.removeItem('vc_quick_order_items'); } catch { /* ignore */ }
  }, []);

  return (
    <>
      <Navbar
        cartCount={cartQty}
        wishCount={wishQty}
        currentUser={currentUser}
        onCartClick={() => window.dispatchEvent(new CustomEvent(OPEN_CART_EVENT))}
        onWishClick={() => window.dispatchEvent(new CustomEvent(OPEN_WISHLIST_EVENT))}
        onTrackClick={() => window.dispatchEvent(new CustomEvent(OPEN_TRACK_ORDER_EVENT))}
        onLoginClick={() => setLoginOpen(true)}
        onAccountClick={() => window.dispatchEvent(new CustomEvent(OPEN_ACCOUNT_EVENT))}
      />
      <HeroSlider initialCards={initialHeroCards} />
      <TrustStrip />
      <Categories initialCategories={initialCategories} />
      <ProductGrid initialProducts={initialProducts} initialCategory={initialCategory} />
      <FAQ />
      <About />
      <CustomerGallery />
      <Footer />
      <LoginModal isOpen={loginOpen} onClose={() => setLoginOpen(false)} />
      <AccountPage
        isOpen={accountOpen}
        onClose={() => setAccountOpen(false)}
        currentUser={currentUser}
      />
    </>
  );
}
