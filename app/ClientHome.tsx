'use client';

import { useEffect, useState } from 'react';
import Navbar from './components/layout/Navbar';
import HeroSlider from './components/home/HeroSlider';
import TrustStrip from './components/home/TrustStrip';
import Categories from './components/home/Categories';
import ProductGrid from './components/home/ProductGrid';
import FAQ from './components/home/FAQ';
import About from './components/home/About';
import CustomerGallery from './components/home/CustomerGallery';
import Footer from './components/layout/Footer';
import { getCart, cartCount, CART_EVENT } from '@/lib/cartData';
import { getWishlist, WISHLIST_EVENT } from '@/lib/productData';
import { OPEN_CART_EVENT, OPEN_WISHLIST_EVENT, OPEN_TRACK_ORDER_EVENT } from '@/lib/uiEvents';

// এখনো convert হয়নি এমন section/overlay এখানে বাদ রাখা হয়েছে (পরে যোগ হবে):
// CatBar (অদৃশ্য, must না), CartSidebar/WishlistDrawer, LoginModal/AccountPage,
// WaitingPage/BgConfirmPopup/PostOrderInfo, BackToTop/FloatButtons, InfoOverlay,
// OrderTracking — Phase B-এর পরের ধাপগুলোতে তৈরি হওয়ার সাথে সাথে এখানে import
// যোগ হবে, ঠিক legacy ClientHome.js যেভাবে ধাপে ধাপে বড় হয়েছিল।

export default function ClientHome() {
  const [cartQty, setCartQty] = useState(0);
  const [wishQty, setWishQty] = useState(0);

  useEffect(() => {
    setCartQty(cartCount(getCart()));
    const onCartChange = () => setCartQty(cartCount(getCart()));
    window.addEventListener(CART_EVENT, onCartChange);
    return () => window.removeEventListener(CART_EVENT, onCartChange);
  }, []);

  useEffect(() => {
    setWishQty(getWishlist().length);
    const onWishChange = () => setWishQty(getWishlist().length);
    window.addEventListener(WISHLIST_EVENT, onWishChange);
    return () => window.removeEventListener(WISHLIST_EVENT, onWishChange);
  }, []);

  return (
    <>
      <Navbar
        cartCount={cartQty}
        wishCount={wishQty}
        onCartClick={() => window.dispatchEvent(new CustomEvent(OPEN_CART_EVENT))}
        onWishClick={() => window.dispatchEvent(new CustomEvent(OPEN_WISHLIST_EVENT))}
        onTrackClick={() => window.dispatchEvent(new CustomEvent(OPEN_TRACK_ORDER_EVENT))}
      />
      <HeroSlider />
      <TrustStrip />
      <Categories />
      <ProductGrid />
      <FAQ />
      <About />
      <CustomerGallery />
      <Footer />
    </>
  );
}
