'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { CART_ADD_EVENT } from '@/lib/cartData';
import {
  DEFAULT_PRODS, fetchCustomProducts, mergeCustomProducts, productHref,
} from '@/lib/productData';
import { searchProducts, matchCategories as matchCategoriesData } from '@/lib/searchData';
import { DEFAULT_CATEGORIES, fetchCategories, makeCatSlug } from '@/lib/categoryData';
import type { Product, Category, CurrentUser } from '@/types';

interface NavbarProps {
  cartCount?: number;
  wishCount?: number;
  onCartClick?: () => void;
  onWishClick?: () => void;
  onLoginClick?: () => void;
  onTrackClick?: () => void;
  currentUser?: CurrentUser | null;
  onAccountClick?: () => void;
}

function SearchThumb({ imgVal }: { imgVal?: string }) {
  const isUrl = typeof imgVal === 'string' && (imgVal.startsWith('http://') || imgVal.startsWith('https://'));
  return (
    <div className="flex h-[42px] w-[42px] shrink-0 items-center justify-center overflow-hidden rounded-[9px] bg-surface-muted text-[22px]">
      {isUrl
        ? <img src={imgVal} alt="" className="h-10 w-10 rounded-md object-cover" />
        : <span className="text-2xl">{imgVal || '📦'}</span>}
    </div>
  );
}

function CategoryIcon({ icon }: { icon?: string }) {
  const isSvg = typeof icon === 'string' && icon.startsWith('<svg');
  if (isSvg) {
    return (
      <div
        className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-[9px] bg-surface-muted text-ink [&_svg]:h-[22px] [&_svg]:w-[22px]"
        dangerouslySetInnerHTML={{ __html: icon.replace(/width="\d+"/, 'width="22"').replace(/height="\d+"/, 'height="22"') }}
      />
    );
  }
  return <div className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-[9px] bg-surface-muted text-xl">{icon || '📂'}</div>;
}

function matchCategoryList(cats: Category[], q: string): Category[] {
  return matchCategoriesData(cats, q, 5);
}

function highlightMatch(text: string, q: string) {
  const idx = text.toLowerCase().indexOf(q.toLowerCase());
  if (idx === -1) return text.length > 45 ? text.slice(0, 45) + '...' : text;
  const before = text.slice(0, idx);
  const match = text.slice(idx, idx + q.length);
  const after = text.slice(idx + q.length);
  const truncBefore = before.length > 20 ? '...' + before.slice(-20) : before;
  const truncAfter = after.length > 25 ? after.slice(0, 25) + '...' : after;
  return (
    <>{truncBefore}<span className="bg-brand-accent/20 text-brand-primary">{match}</span>{truncAfter}</>
  );
}

const searchInputClass = 'w-full rounded-full border-[1.5px] border-border-base bg-surface-muted py-[9px] pl-10 pr-3.5 font-body text-base transition-brand duration-brand placeholder:text-muted focus:border-ink focus:bg-white focus:outline-none';

function SearchDropdown({
  searchQuery, searchResults, catResults, onGoToSrp, onGoToCat, onPick,
}: {
  searchQuery: string;
  searchResults: Product[];
  catResults: Category[];
  onGoToSrp: () => void;
  onGoToCat: (id: string) => void;
  onPick: () => void;
}) {
  const catName = (catId: string) => (catResults.find((c) => c.id === catId) || {}).name || catId;
  return (
    <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-[1100] max-h-[420px] overflow-y-auto overflow-hidden rounded-[14px] border-[1.5px] border-white/70 bg-white/95 shadow-sh3 backdrop-blur-md">
      {searchResults.length === 0 ? (
        <div className="px-3.5 py-5 text-center text-[13px] text-muted">
          🔍 &quot;<strong>{searchQuery}</strong>&quot; এর জন্য কোনো পণ্য পাওয়া যায়নি
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between border-b border-border-base px-3.5 pb-1.5 pt-2 text-[10.5px] font-bold uppercase tracking-[.5px] text-muted">
            <span>{searchResults.length}টি পণ্য পাওয়া গেছে</span>
            <a className="cursor-pointer text-[11px] font-semibold text-brand-primary hover:underline" onClick={onGoToSrp}>সব দেখুন →</a>
          </div>
          <div className="px-3.5 pb-1 pt-1.5 text-[10.5px] font-bold uppercase tracking-[.7px] text-muted">পণ্য</div>
          {searchResults.map((p) => (
            <Link
              key={p.id}
              href={productHref(p)}
              className="flex items-center gap-3 px-3.5 py-2.5 text-inherit no-underline transition-colors hover:bg-surface-muted"
              onClick={onPick}
            >
              <SearchThumb imgVal={(p.imgs || [])[0]} />
              <div className="min-w-0 flex-1">
                <div className="overflow-hidden text-ellipsis whitespace-nowrap text-[13px] font-semibold">{highlightMatch(p.name, searchQuery)}</div>
                <div className="mt-0.5 text-[11px] text-muted">
                  {catName(p.cat)}{p.stock <= 0 && <> · <span className="text-brand-primary">স্টক শেষ</span></>}
                </div>
              </div>
              <div className="shrink-0 text-[13px] font-bold">৳{Number(p.price).toLocaleString()}</div>
            </Link>
          ))}
          {catResults.length > 0 && (
            <>
              <div className="mx-3.5 my-1 h-px bg-border-base" />
              <div className="px-3.5 pb-1 pt-2 text-[10.5px] font-bold uppercase tracking-[.7px] text-muted">ক্যাটাগরি</div>
              {catResults.map((c) => (
                <div key={c.id} className="flex cursor-pointer items-center gap-3 px-3.5 py-[9px] transition-colors hover:bg-surface-muted" onClick={() => onGoToCat(c.id)}>
                  <CategoryIcon icon={c.icon} />
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-semibold">{c.name}</div>
                    <div className="mt-0.5 text-[11px] text-muted">ক্যাটাগরি দেখুন →</div>
                  </div>
                </div>
              ))}
            </>
          )}
          <div className="border-t border-border-base px-3.5 py-2.5 text-center">
            <button
              className="w-full rounded-lg bg-ink py-2 text-[12.5px] font-semibold text-white transition-brand duration-brand hover:bg-brand-primary"
              onClick={onGoToSrp}
            >
              🔍 &quot;{searchQuery}&quot; এর সব ফলাফল দেখুন
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default function Navbar({
  cartCount = 0, wishCount = 0, onCartClick, onWishClick, onLoginClick, onTrackClick, currentUser, onAccountClick,
}: NavbarProps) {
  const supabase = useMemo(() => createClient(), []);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [catResults, setCatResults] = useState<Category[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cartBtnRef = useRef<HTMLButtonElement>(null);
  const mobileSearchInputRef = useRef<HTMLInputElement>(null);
  const prodsRef = useRef<Product[]>(DEFAULT_PRODS);
  const catsRef = useRef<Category[]>(DEFAULT_CATEGORIES);
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const customRows = await fetchCustomProducts(supabase);
      if (!cancelled && customRows.length) {
        prodsRef.current = mergeCustomProducts(DEFAULT_PRODS, customRows);
      }
    })();
    return () => { cancelled = true; };
  }, [supabase]);

  useEffect(() => {
    let cancelled = false;
    fetchCategories(supabase).then((list) => { if (!cancelled) catsRef.current = list; });
    return () => { cancelled = true; };
  }, [supabase]);

  useEffect(() => {
    if (mobileSearchOpen) mobileSearchInputRef.current?.focus();
  }, [mobileSearchOpen]);

  useEffect(() => {
    const onCartAdd = () => {
      const btn = cartBtnRef.current;
      if (!btn) return;
      btn.classList.remove('animate-cart-jiggle');
      void btn.offsetWidth;
      btn.classList.add('animate-cart-jiggle');
      window.setTimeout(() => btn.classList.remove('animate-cart-jiggle'), 750);
    };
    window.addEventListener(CART_ADD_EVENT, onCartAdd);
    return () => window.removeEventListener(CART_ADD_EVENT, onCartAdd);
  }, []);

  const handleSearchInput = useCallback((value: string) => {
    setSearchQuery(value);
    if (!value.trim()) {
      setSearchResults([]);
      setCatResults([]);
      setShowDropdown(false);
      return;
    }
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      const results = searchProducts(prodsRef.current, value).slice(0, 6);
      setSearchResults(results);
      setCatResults(matchCategoryList(catsRef.current, value));
      setShowDropdown(true);
    }, 280);
  }, []);

  const goToCat = (catId: string) => {
    setShowDropdown(false);
    setMobileSearchOpen(false);
    setSearchQuery('');
    setSearchResults([]);
    setCatResults([]);
    router.push(catId === 'all' ? '/' : `/category/${makeCatSlug(catId)}`);
  };

  const goToSrp = () => {
    const q = searchQuery.trim();
    if (!q) return;
    setShowDropdown(false);
    setMobileSearchOpen(false);
    setSearchQuery('');
    setSearchResults([]);
    setCatResults([]);
    router.push(`/srp?q=${encodeURIComponent(q)}`);
  };

  const handleSearchKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) goToSrp();
  };

  useEffect(() => {
    const handleClickOutside = () => setShowDropdown(false);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <>
      <nav className="sticky top-[14px] z-[900] mx-3 mb-1.5 mt-[14px] overflow-hidden rounded-[35px] border border-white/60 bg-white/70 shadow-sh2 backdrop-blur-md transition-all duration-brand ease-brand">
        <div className="relative mx-auto flex h-[62px] max-w-[1300px] items-center gap-[14px] px-5 2xl:max-w-[1560px]">
          <div className="flex w-full items-center justify-between gap-3">
            <Link className="flex shrink-0 items-center no-underline" href="/">
              <img
                src="/vangcur-logo.png"
                alt="Vangcur Gadgets"
                className="h-7 w-auto select-none md:h-8"
                draggable={false}
              />
            </Link>

            <div className="flex items-center gap-2 md:gap-3">
              <div className="relative hidden w-[240px] md:block lg:w-[300px]" onClick={(e) => e.stopPropagation()}>
                <svg className="pointer-events-none absolute left-[13px] top-1/2 -translate-y-1/2 text-muted" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
                </svg>
                <input
                  type="search"
                  placeholder="প্রোডাক্ট খুঁজুন..."
                  value={searchQuery}
                  onChange={(e) => handleSearchInput(e.target.value)}
                  onKeyDown={handleSearchKey}
                  onFocus={() => searchQuery && setShowDropdown(true)}
                  autoComplete="off"
                  name="product-search"
                  className="w-full cursor-text rounded-full border border-ink/[0.06] bg-ink/[0.035] py-[9px] pl-10 pr-3.5 font-body text-[13px] text-ink shadow-[inset_0_1px_3px_rgba(0,0,0,.05)] transition-brand duration-brand placeholder:text-muted focus:border-brand-primary/40 focus:bg-white focus:shadow-[0_0_0_3px_rgba(0,88,199,.12)] focus:outline-none"
                />
                {showDropdown && (
                  <SearchDropdown
                    searchQuery={searchQuery}
                    searchResults={searchResults}
                    catResults={catResults}
                    onGoToSrp={goToSrp}
                    onGoToCat={goToCat}
                    onPick={() => setShowDropdown(false)}
                  />
                )}
              </div>

              <div className="flex items-center gap-2">
                <button className="relative flex h-9 w-9 items-center justify-center rounded-full border border-ink/[0.06] bg-ink/[0.03] text-ink transition-brand duration-brand hover:bg-brand-bg/50 hover:text-brand-primary md:h-10 md:w-10" onClick={onWishClick} title="Wishlist">
                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
                  </svg>
                  <span className={`absolute right-1 top-1 h-[14px] w-[14px] items-center justify-center rounded-full bg-brand-primary text-[8.5px] font-bold text-white ${wishCount > 0 ? 'flex animate-badge-hot-glow' : 'hidden'}`}>{wishCount}</span>
                </button>

                <button
                  className="relative flex h-9 w-9 items-center justify-center rounded-full border border-ink/[0.06] bg-ink/[0.03] text-ink transition-brand duration-brand hover:bg-brand-bg/50 hover:text-brand-primary md:h-10 md:w-10"
                  ref={cartBtnRef}
                  onClick={onCartClick}
                  title="কার্ট"
                >
                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                    <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
                    <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
                  </svg>
                  <span className={`absolute right-1 top-1 h-[14px] w-[14px] items-center justify-center rounded-full bg-brand-primary text-[8.5px] font-bold text-white ${cartCount > 0 ? 'flex animate-badge-hot-glow' : 'hidden'}`}>{cartCount}</span>
                </button>

                {currentUser ? (
                  <button className="flex shrink-0 items-center gap-2 rounded-full bg-surface-muted px-3 py-1.5 font-body text-[13px] font-semibold text-ink transition-brand duration-brand hover:bg-border-base md:px-3.5" onClick={onAccountClick}>
                    <div className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full bg-ink text-[10px] font-bold text-white">
                      {(currentUser.name || '?').split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)}
                    </div>
                    <span className="hidden md:inline">{currentUser.name || 'আমার অ্যাকাউন্ট'}</span>
                  </button>
                ) : (
                  <button className="shrink-0 rounded-full bg-brand-primary px-3.5 py-2 font-body text-[13px] font-semibold text-white shadow-sh1 transition-brand duration-brand hover:-translate-y-0.5 hover:bg-brand-accent hover:shadow-sh2 md:px-[18px]" onClick={onLoginClick}>লগইন</button>
                )}

                <button className="flex h-9 w-9 items-center justify-center rounded-full border border-ink/[0.06] bg-ink/[0.03] text-ink transition-brand duration-brand hover:bg-brand-bg/50 hover:text-brand-primary md:h-10 md:w-10" onClick={onTrackClick} title="অর্ডার ট্র্যাক করুন">
                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M9 17H7A5 5 0 017 7h2" /><path d="M15 7h2a5 5 0 010 10h-2" />
                    <line x1="8" y1="12" x2="16" y2="12" />
                  </svg>
                </button>

                <button className="flex h-9 w-9 items-center justify-center rounded-full border border-ink/[0.06] bg-ink/[0.03] text-ink transition-brand duration-brand hover:bg-brand-bg/50 hover:text-brand-primary md:hidden" onClick={() => setMobileSearchOpen((v) => !v)} title="Search">
                  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                    <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="pointer-events-none relative z-[890] -mt-[7px] flex justify-center">
        <div className="h-[3px] w-[180px] rounded-full bg-gradient-to-r from-brand-bg via-brand-accent to-brand-primary opacity-60 blur-[1.5px]" />
      </div>

      {mobileSearchOpen && (
        <div className="border-b border-white/60 bg-white/85 px-4 py-2 backdrop-blur-md md:hidden">
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <svg className="pointer-events-none absolute left-[13px] top-1/2 -translate-y-1/2 text-muted" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              type="search"
              placeholder="প্রোডাক্ট খুঁজুন..."
              value={searchQuery}
              onChange={(e) => handleSearchInput(e.target.value)}
              onKeyDown={handleSearchKey}
              ref={mobileSearchInputRef}
              autoComplete="off"
              className={searchInputClass}
            />
            {searchQuery && (
              <button
                className="absolute right-3 top-1/2 flex h-[18px] w-[18px] -translate-y-1/2 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-white transition-brand duration-brand hover:bg-ink"
                onClick={() => { setSearchQuery(''); setSearchResults([]); setCatResults([]); setShowDropdown(false); }}
                title="মুছুন"
              >✕</button>
            )}
            {showDropdown && (
              <SearchDropdown
                searchQuery={searchQuery}
                searchResults={searchResults}
                catResults={catResults}
                onGoToSrp={goToSrp}
                onGoToCat={goToCat}
                onPick={() => { setShowDropdown(false); setMobileSearchOpen(false); }}
              />
            )}
          </div>
        </div>
      )}
    </>
  );
}
