'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import Navbar from '@/app/components/layout/Navbar';
import ProductGrid from '@/app/components/home/ProductGrid';
import Footer from '@/app/components/layout/Footer';
import { useCartStore, cartCount } from '@/lib/store/cartStore';
import { useWishlistStore } from '@/lib/store/wishlistStore';
import { useAuthStore } from '@/lib/store/authStore';
import { OPEN_CART_EVENT, OPEN_WISHLIST_EVENT, OPEN_TRACK_ORDER_EVENT } from '@/lib/uiEvents';
import { makeCatSlug } from '@/lib/categoryData';
import { sanitizeSvgHtml } from '@/lib/sanitize';
import { useT } from '@/lib/i18n/useT';
import type { Category, Product } from '@/types';

const LoginModal = dynamic(() => import('@/app/components/auth/LoginModal'));

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

export default function CategoryClient({ initialProducts, category, siblingCategories }: CategoryClientProps) {
  const { t } = useT();
  const cartQty = useCartStore((s) => cartCount(s.cart));
  const wishQty = useWishlistStore((s) => s.wishlist.length);
  const currentUser = useAuthStore((s) => s.currentUser);
  const [loginOpen, setLoginOpen] = useState(false);

  const others = siblingCategories.filter((c) => c.id !== 'all' && c.id !== category.id);

  return (
    <>
      <Navbar
        showHomeButton
        sticky={false}
        cartCount={cartQty}
        wishCount={wishQty}
        currentUser={currentUser}
        onCartClick={() => window.dispatchEvent(new CustomEvent(OPEN_CART_EVENT))}
        onWishClick={() => window.dispatchEvent(new CustomEvent(OPEN_WISHLIST_EVENT))}
        onTrackClick={() => window.dispatchEvent(new CustomEvent(OPEN_TRACK_ORDER_EVENT))}
        onLoginClick={() => setLoginOpen(true)}
      />

      <div className="mx-auto max-w-[1300px] px-5 pt-6">
        <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-1.5 text-[13px] text-muted">
          <Link href="/" className="transition-brand duration-brand hover:text-brand-light">{t('হোম')}</Link>
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
    </>
  );
}
