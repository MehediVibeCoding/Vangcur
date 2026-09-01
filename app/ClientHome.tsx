'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Navbar from './components/layout/Navbar';
import HeroSlider from './components/home/HeroSlider';
import TrustStrip from './components/home/TrustStrip';
import Categories from './components/home/Categories';
import ProductGrid from './components/home/ProductGrid';
import CustomerGallery from './components/home/CustomerGallery';
import FAQ from './components/home/FAQ';
import About from './components/home/About';
import Footer from './components/layout/Footer';
import ScrollReveal from './components/ui/ScrollReveal';
import { useCartStore, cartCount } from '@/lib/store/cartStore';
import { useWishlistStore } from '@/lib/store/wishlistStore';
import { useAuthStore } from '@/lib/store/authStore';
import { OPEN_CART_EVENT, OPEN_WISHLIST_EVENT, OPEN_TRACK_ORDER_EVENT } from '@/lib/uiEvents';
import type { Product, Category } from '@/types';
import type { HeroCard } from '@/lib/heroSliderData';

const LoginModal = dynamic(() => import('./components/auth/LoginModal'));

interface ClientHomeProps {
  initialProducts: Product[];
  initialCategories?: Category[];
  initialHeroCards?: HeroCard[];
  initialCategory?: string;
}

export default function ClientHome({
  initialProducts,
  initialCategories,
  initialHeroCards,
  initialCategory,
}: ClientHomeProps) {
  const cartQty = useCartStore((s) => cartCount(s.cart));
  const wishQty = useWishlistStore((s) => s.wishlist.length);
  const currentUser = useAuthStore((s) => s.currentUser);
  const [loginOpen, setLoginOpen] = useState(false);

  useEffect(() => {
    try {
      sessionStorage.removeItem('vc_quick_order_items');
    } catch {
      // ignore
    }
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
      />
      <HeroSlider initialCards={initialHeroCards} />
      <TrustStrip />
      <ScrollReveal>
        <Categories initialCategories={initialCategories} />
      </ScrollReveal>
      <ProductGrid initialProducts={initialProducts} initialCategory={initialCategory} />
      <ScrollReveal>
        <CustomerGallery />
      </ScrollReveal>
      <ScrollReveal>
        <FAQ />
      </ScrollReveal>
      <ScrollReveal>
        <About />
      </ScrollReveal>
      <Footer />
      <LoginModal isOpen={loginOpen} onClose={() => setLoginOpen(false)} />
    </>
  );
}
