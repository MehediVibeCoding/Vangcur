'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import Navbar from '@/app/components/layout/Navbar';
import ProductGrid from '@/app/components/home/ProductGrid';
import Footer from '@/app/components/layout/Footer';
import { useCartStore, cartCount } from '@/lib/store/cartStore';
import { useWishlistStore } from '@/lib/store/wishlistStore';
import { useAuthStore } from '@/lib/store/authStore';
import { OPEN_CART_EVENT, OPEN_WISHLIST_EVENT, OPEN_TRACK_ORDER_EVENT, OPEN_ACCOUNT_EVENT } from '@/lib/uiEvents';
import { makeCatSlug } from '@/lib/categoryData';
import { sanitizeSvgHtml } from '@/lib/sanitize';
import type { Category, Product } from '@/types';

// লগইন মোডাল আর অ্যাকাউন্ট পেজ — ClientHome.tsx/ProductDetailClient.tsx-এর
// একই প্যাটার্নে dynamic import দিয়ে আলাদা চাংকে রাখা হলো।
const LoginModal = dynamic(() => import('@/app/components/auth/LoginModal'));
const AccountPage = dynamic(() => import('@/app/components/auth/AccountPage'));

function CatIcon({ icon }: { icon?: string }) {
  const isSvg = typeof icon === 'string' && icon.trim().startsWith('<svg');
  if (isSvg) {
    return (
      <span
        className="flex h-6 w-6 shrink-0 items-center justify-center [&_svg]:h-6 [&_svg]:w-6"
        dangerouslySetInnerHTML={{ __html: sanitizeSvgHtml(icon) }}
      />
    );
  }
  return <span className="text-xl leading-none">{icon || '📦'}</span>;
}

interface CategoryClientProps {
  initialProducts: Product[];
  category: Category;
  siblingCategories: Category[];
}

// আগে /category/<slug>-এ পুরো হোমপেজ (Hero/TrustStrip/Categories carousel/
// FAQ/About/Gallery) reuse করার কথা ভাবা হয়েছিল — কিন্তু প্রতিটা ক্যাটাগরি
// পেজে একই মার্কেটিং সেকশনগুলো বার বার দেখানো একদিকে পেজ ভারী করে, অন্যদিকে
// SEO-র জন্যও আদর্শ না (প্রতিটা ক্যাটাগরি পেজের মূল কনটেন্ট — প্রোডাক্ট
// লিস্ট — নিচের দিকে চলে যায়, বেশিরভাগ HTML হোমপেজের সাথে ডুপ্লিকেট হয়ে
// থাকে)। তাই এখানে একটা লিন, ক্যাটাগরি-নির্দিষ্ট শেল বানানো হলো — Navbar +
// breadcrumb/ক্যাটাগরি হেডার + অন্যান্য ক্যাটাগরিতে যাওয়ার কুইক-লিংক
// (internal linking-এর জন্যও ভালো) + ফিল্টার করা প্রোডাক্ট গ্রিড + Footer।
export default function CategoryClient({ initialProducts, category, siblingCategories }: CategoryClientProps) {
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

  const others = siblingCategories.filter((c) => c.id !== 'all' && c.id !== category.id);

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

      <div className="mx-auto max-w-[1300px] px-5 pt-6">
        <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-1.5 text-[13px] text-muted">
          <Link href="/" className="transition-brand duration-brand hover:text-brand-light">হোম</Link>
          <span>/</span>
          <span className="font-semibold text-ink">{category.name}</span>
        </nav>

        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-[1.5px] border-border-base bg-brand-bg text-brand-light">
            <CatIcon icon={category.icon} />
          </div>
          <h1 className="text-2xl font-bold text-ink">{category.name}</h1>
        </div>

        {others.length > 0 && (
          <div className="mb-7 flex flex-wrap gap-2">
            {others.map((c) => (
              <Link
                key={c.id}
                href={`/category/${makeCatSlug(c.id)}`}
                className="rounded-full border border-border-base bg-white px-3.5 py-1.5 text-[12.5px] font-semibold text-ink shadow-sm transition-brand duration-brand hover:border-brand-light hover:text-brand-light"
              >
                {c.name}
              </Link>
            ))}
          </div>
        )}
      </div>

      <ProductGrid initialProducts={initialProducts} initialCategory={category.id} categoryName={category.name} />

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
