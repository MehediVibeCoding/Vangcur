'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Navbar from '@/app/components/layout/Navbar';
import Footer from '@/app/components/layout/Footer';
import { useCartStore, cartCount } from '@/lib/store/cartStore';
import { useWishlistStore } from '@/lib/store/wishlistStore';
import { useAuthStore } from '@/lib/store/authStore';
import {
  OPEN_CART_EVENT, OPEN_WISHLIST_EVENT, OPEN_TRACK_ORDER_EVENT, OPEN_ACCOUNT_EVENT,
} from '@/lib/uiEvents';

const LoginModal = dynamic(() => import('@/app/components/auth/LoginModal'));
const AccountPage = dynamic(() => import('@/app/components/auth/AccountPage'));

export default function PoliciesLayout({ children }: { children: React.ReactNode }) {
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

  return (
    <>
      <Navbar
        showHomeButton
        cartCount={cartQty}
        wishCount={wishQty}
        currentUser={currentUser}
        onCartClick={() => window.dispatchEvent(new CustomEvent(OPEN_CART_EVENT))}
        onWishClick={() => window.dispatchEvent(new CustomEvent(OPEN_WISHLIST_EVENT))}
        onTrackClick={() => window.dispatchEvent(new CustomEvent(OPEN_TRACK_ORDER_EVENT))}
        onLoginClick={() => setLoginOpen(true)}
        onAccountClick={() => window.dispatchEvent(new CustomEvent(OPEN_ACCOUNT_EVENT))}
      />

      <main className="mx-auto w-full max-w-[760px] px-5 pb-16 pt-8">
        {children}
      </main>

      <Footer />

      <LoginModal isOpen={loginOpen} onClose={() => setLoginOpen(false)} />
      <AccountPage isOpen={accountOpen} onClose={() => setAccountOpen(false)} currentUser={currentUser} />
    </>
  );
}
