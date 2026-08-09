'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import Navbar from '@/app/components/layout/Navbar';
import Footer from '@/app/components/layout/Footer';
import LoginModal from '@/app/components/auth/LoginModal';
import AccountPage from '@/app/components/auth/AccountPage';
import ProductCard from '@/app/components/home/ProductCard';
import { searchProducts } from '@/lib/searchData';
import {
  DEFAULT_PRODS, fetchCustomProducts, mergeCustomProducts, subscribeCustomProducts,
  getWishlist, WISHLIST_EVENT,
} from '@/lib/productData';
import { getCart, cartCount, CART_EVENT } from '@/lib/cartData';
import { OPEN_CART_EVENT, OPEN_WISHLIST_EVENT, OPEN_TRACK_ORDER_EVENT, OPEN_ACCOUNT_EVENT } from '@/lib/uiEvents';
import { AUTH_EVENT, getCurrentUser } from '@/lib/authData';
import type { CurrentUser, Product } from '@/types';

const PRODS_PER_PAGE = 20;
const PRODS_AUTO_THRESHOLD = 2;

type SortKey = 'relevance' | 'price-asc' | 'price-desc';

function EmptyState({ query }: { query: string }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-[18px] bg-white px-5 py-16 text-center shadow-[0_4px_14px_rgba(0,88,199,.08)]">
      <div className="text-5xl">🔍</div>
      {query ? (
        <>
          <p className="text-[15px] font-bold text-ink">&quot;{query}&quot; এর জন্য কোনো প্রোডাক্ট পাওয়া যায়নি</p>
          <p className="max-w-sm text-[13px] text-muted">অন্য কোনো নাম দিয়ে উপরের সার্চ বক্সে খুঁজে দেখুন, অথবা নিচের বাটনে ক্লিক করে সব প্রোডাক্ট দেখুন।</p>
        </>
      ) : (
        <p className="text-[15px] font-bold text-ink">প্রোডাক্ট খুঁজতে উপরের সার্চ বক্সে লিখুন</p>
      )}
      <Link
        href="/"
        className="mt-2 inline-flex items-center gap-2 rounded-xl border-none bg-ink px-7 py-[13px] font-body text-sm font-bold text-white no-underline shadow-[0_4px_16px_rgba(0,0,0,.13)]"
      >
        সব প্রোডাক্ট দেখুন
      </Link>
    </div>
  );
}

export default function SrpClient() {
  const searchParams = useSearchParams();
  const query = (searchParams.get('q') || '').trim();

  const supabase = useRef(createClient()).current;
  const [prods, setProds] = useState<Product[]>(DEFAULT_PRODS);
  const [sortKey, setSortKey] = useState<SortKey>('relevance');

  const [cartQty, setCartQty] = useState(() => (typeof window !== 'undefined' ? cartCount(getCart()) : 0));
  const [wishQty, setWishQty] = useState(() => (typeof window !== 'undefined' ? getWishlist().length : 0));
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(() => (
    typeof window !== 'undefined' ? getCurrentUser() : null
  ));
  const [loginOpen, setLoginOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);

  useEffect(() => {
    const onCartChange = () => setCartQty(cartCount(getCart()));
    window.addEventListener(CART_EVENT, onCartChange);
    return () => window.removeEventListener(CART_EVENT, onCartChange);
  }, []);

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

  useEffect(() => {
    let cancelled = false;
    fetchCustomProducts(supabase).then((customRows) => {
      if (cancelled || !customRows.length) return;
      setProds((prev) => mergeCustomProducts(prev, customRows));
    });

    const channel = subscribeCustomProducts(supabase, {
      onInsert: (mapped) => setProds((prev) => (
        prev.find((x) => String(x.id) === String(mapped.id)) ? prev : [...prev, mapped]
      )),
      onUpdate: (mapped) => setProds((prev) => {
        const idx = prev.findIndex((x) => String(x.id) === String(mapped.id));
        if (idx === -1) return prev;
        const next = [...prev];
        next[idx] = { ...next[idx], ...mapped };
        return next;
      }),
      onDelete: (id) => setProds((prev) => prev.filter((x) => String(x.id) !== String(id))),
    });

    return () => { cancelled = true; supabase.removeChannel(channel); };
  }, [supabase]);

  const results = useMemo(() => {
    const matched = searchProducts(prods, query);
    if (sortKey === 'price-asc') return [...matched].sort((a, b) => a.price - b.price);
    if (sortKey === 'price-desc') return [...matched].sort((a, b) => b.price - a.price);
    return matched;
  }, [prods, query, sortKey]);

  const [renderedCount, setRenderedCount] = useState(0);
  const [showLoadMoreBtn, setShowLoadMoreBtn] = useState(false);
  const [showSpinner, setShowSpinner] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const batchCountRef = useRef(0);
  const loadMorePausedRef = useRef(false);
  const renderedCountRef = useRef(0);
  const listRef = useRef<Product[]>([]);

  useEffect(() => { listRef.current = results; }, [results]);
  useEffect(() => { renderedCountRef.current = renderedCount; }, [renderedCount]);

  const appendNextBatch = useCallback(() => {
    const currentList = listRef.current;
    const cur = renderedCountRef.current;
    if (cur >= currentList.length) return;
    const nextCount = Math.min(cur + PRODS_PER_PAGE, currentList.length);
    batchCountRef.current += 1;
    renderedCountRef.current = nextCount;
    setRenderedCount(nextCount);

    if (nextCount >= currentList.length) {
      loadMorePausedRef.current = false;
      setShowLoadMoreBtn(false);
      setShowSpinner(false);
    } else if (batchCountRef.current % PRODS_AUTO_THRESHOLD === 0) {
      loadMorePausedRef.current = true;
      setShowLoadMoreBtn(true);
      setShowSpinner(false);
    } else {
      loadMorePausedRef.current = false;
      setShowLoadMoreBtn(false);
      setShowSpinner(true);
    }
  }, []);

  useEffect(() => {
    batchCountRef.current = 0;
    loadMorePausedRef.current = false;
    renderedCountRef.current = 0;
    setShowLoadMoreBtn(false);
    setShowSpinner(false);
    setRenderedCount(0);
    const t = setTimeout(() => appendNextBatch(), 0);
    return () => clearTimeout(t);
  }, [results, appendNextBatch]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const obs = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && renderedCountRef.current < listRef.current.length && !loadMorePausedRef.current) {
        appendNextBatch();
      }
    }, { rootMargin: '300px' });
    obs.observe(sentinel);
    return () => obs.disconnect();
  }, [appendNextBatch]);

  const handleLoadMoreClick = () => {
    setShowLoadMoreBtn(false);
    batchCountRef.current = 0;
    loadMorePausedRef.current = false;
    appendNextBatch();
  };

  const visibleItems = results.slice(0, renderedCount);
  const hasQuery = query.length > 0;

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

      <div className="mx-auto mb-11 mt-5 min-h-[40vh] max-w-[1300px] px-5">
        {hasQuery && (
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-lg font-bold text-ink sm:text-xl">
                &quot;<span className="text-brand-primary">{query}</span>&quot; এর জন্য ফলাফল
              </h1>
              <p className="mt-1 text-[13px] text-muted">{results.length}টি প্রোডাক্ট পাওয়া গেছে</p>
            </div>
            {results.length > 1 && (
              <select
                value={sortKey}
                onChange={(e) => setSortKey(e.target.value as SortKey)}
                className="rounded-[10px] border border-border-base bg-white px-3 py-2 text-[12.5px] font-semibold text-ink"
              >
                <option value="relevance">প্রাসঙ্গিকতা</option>
                <option value="price-asc">দাম: কম থেকে বেশি</option>
                <option value="price-desc">দাম: বেশি থেকে কম</option>
              </select>
            )}
          </div>
        )}

        {results.length === 0 ? (
          <EmptyState query={query} />
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
              {visibleItems.map((p, i) => (
                <ProductCard key={p.id} prod={p} isFirst={i === 0} />
              ))}
            </div>
            <div className="mt-2.5 flex h-[60px] items-center justify-center" ref={sentinelRef}>
              {showSpinner && (
                <div className="flex items-center gap-2 text-[13px] text-muted">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin">
                    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                  </svg>
                  লোড হচ্ছে...
                </div>
              )}
              {showLoadMoreBtn && (
                <button
                  onClick={handleLoadMoreClick}
                  className="inline-flex items-center gap-2 rounded-xl border-none bg-ink px-8 py-[13px] font-body text-sm font-bold text-white shadow-[0_4px_16px_rgba(0,0,0,.13)]"
                >
                  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><path d="M12 5v14M5 12l7 7 7-7" /></svg>
                  আরো প্রোডাক্ট দেখুন
                </button>
              )}
            </div>
          </>
        )}
      </div>

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
