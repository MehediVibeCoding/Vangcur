// ফাইলের পাথ: app/guides/layout.tsx
// [NEW] /guides/* -এর সব পেজের জন্য Navbar+Footer র‍্যাপার — app/(policies)/layout.tsx-এর
// ওয়্যারিং হুবহু মিলিয়ে লেখা, শুধু <main>-এর width কনস্ট্রেইন্ট সরানো হয়েছে যেহেতু
// প্রতিটা ব্লক কম্পোনেন্ট নিজেই তার কন্টেইনার-উইডথ ঠিক করে নেয় (Hero ফুল-ব্লিড, টেক্সট আটকানো)।

'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import Navbar from '@/app/components/layout/Navbar';
import Footer from '@/app/components/layout/Footer';
import { useCartStore, cartCount } from '@/lib/store/cartStore';
import { useWishlistStore } from '@/lib/store/wishlistStore';
import { useAuthStore } from '@/lib/store/authStore';
import { OPEN_CART_EVENT, OPEN_WISHLIST_EVENT, OPEN_TRACK_ORDER_EVENT } from '@/lib/uiEvents';

const LoginModal = dynamic(() => import('@/app/components/auth/LoginModal'));

export default function GuidesLayout({ children }: { children: React.ReactNode }) {
  const cartQty = useCartStore((s) => cartCount(s.cart));
  const wishQty = useWishlistStore((s) => s.wishlist.length);
  const currentUser = useAuthStore((s) => s.currentUser);
  const [loginOpen, setLoginOpen] = useState(false);

  return (
    <div className="relative flex min-h-screen flex-col justify-between bg-white">
      <div className="relative z-10">
        <Navbar
          sticky
          cartCount={cartQty}
          wishCount={wishQty}
          currentUser={currentUser}
          onCartClick={() => window.dispatchEvent(new CustomEvent(OPEN_CART_EVENT))}
          onWishClick={() => window.dispatchEvent(new CustomEvent(OPEN_WISHLIST_EVENT))}
          onTrackClick={() => window.dispatchEvent(new CustomEvent(OPEN_TRACK_ORDER_EVENT))}
          onLoginClick={() => setLoginOpen(true)}
        />
        <main className="pb-16">{children}</main>
      </div>

      <Footer />

      <LoginModal isOpen={loginOpen} onClose={() => setLoginOpen(false)} />
    </div>
  );
}
