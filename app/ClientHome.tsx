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
import { getWishlist, WISHLIST_EVENT } from '@/lib/productData';
import { OPEN_CART_EVENT, OPEN_WISHLIST_EVENT, OPEN_TRACK_ORDER_EVENT, OPEN_ACCOUNT_EVENT } from '@/lib/uiEvents';
import { AUTH_EVENT, getCurrentUser } from '@/lib/authData';
import type { CurrentUser } from '@/types';

// লগইন মোডাল আর অ্যাকাউন্ট পেজ (৩৬KB + ৩৬KB) শুধু ইউজার লগইন/অ্যাকাউন্ট বাটনে
// ক্লিক করলেই দরকার — প্রথম পেজ-লোডে না। dynamic import দিয়ে আলাদা চাংকে ভাগ করা হলো।
const LoginModal = dynamic(() => import('./components/auth/LoginModal'));
const AccountPage = dynamic(() => import('./components/auth/AccountPage'));

export default function ClientHome() {
  const cartQty = useCartStore((s) => cartCount(s.cart));
  const [wishQty, setWishQty] = useState(() => (typeof window !== 'undefined' ? getWishlist().length : 0));
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(() => (
    typeof window !== 'undefined' ? getCurrentUser() : null
  ));
  const [loginOpen, setLoginOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);

  useEffect(() => {
    const onWishChange = () => setWishQty(getWishlist().length);
    window.addEventListener(WISHLIST_EVENT, onWishChange);
    return () => window.removeEventListener(WISHLIST_EVENT, onWishChange);
  }, []);

  useEffect(() => {
    const onAuthChange = (e: Event) => setCurrentUser((e as CustomEvent).detail?.user ?? getCurrentUser());
    window.addEventListener(AUTH_EVENT, onAuthChange);
    return () => window.removeEventListener(AUTH_EVENT, onAuthChange);
  }, []);

  useEffect(() => {
    const onOpenAccount = () => {
      if (!getCurrentUser()) setLoginOpen(true);
      else setAccountOpen(true);
    };
    window.addEventListener(OPEN_ACCOUNT_EVENT, onOpenAccount);
    return () => window.removeEventListener(OPEN_ACCOUNT_EVENT, onOpenAccount);
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
      <HeroSlider />
      <TrustStrip />
      <Categories />
      <ProductGrid />
      <FAQ />
      <About />
      <CustomerGallery />
      <Footer />
      <LoginModal isOpen={loginOpen} onClose={() => setLoginOpen(false)} />
      <AccountPage
        isOpen={accountOpen}
        onClose={() => setAccountOpen(false)}
        currentUser={currentUser}
        onAddAccount={() => setLoginOpen(true)}
      />
    </>
  );
}
