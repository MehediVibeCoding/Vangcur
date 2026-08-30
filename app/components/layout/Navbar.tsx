// [REPLACE] ফাইলের পাথ: app/components/layout/Navbar.tsx
'use client';

import { useState, useEffect, useRef, useCallback, useMemo, type RefObject } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useCartStore } from '@/lib/store/cartStore';
import { lockBody, unlockBody } from '@/lib/bodyScrollLock';
import { fetchCustomProducts, productHref } from '@/lib/productData';
import { optimizeCloudinaryUrl } from '@/lib/cloudinaryUrl';
import { searchProducts, matchCategories as matchCategoriesData } from '@/lib/searchData';
import { DEFAULT_CATEGORIES, fetchCategories, makeCatSlug } from '@/lib/categoryData';
import { getRecentSearches, addRecentSearch, removeRecentSearch, clearRecentSearches } from '@/lib/recentSearches';
import { sanitizeSvgHtml } from '@/lib/sanitize';
import { WISHLIST_NAV_HIT_EVENT } from '@/lib/uiEvents';
import { useT } from '@/lib/i18n/useT';
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
  sticky?: boolean;
  showHomeButton?: boolean;
}

function SearchIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round">
      <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
    </svg>
  );
}

function HomeSvgIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function NavWishlistIcon({
  wrapRef, liquidPhase,
}: {
  wrapRef: RefObject<HTMLDivElement | null>;
  liquidPhase: 'idle' | 'filling' | 'full' | 'draining';
}) {
  const filled = liquidPhase === 'filling' || liquidPhase === 'full';
  const clipTop = filled ? 0 : 100;
  const duration = liquidPhase === 'filling' ? '650ms' : liquidPhase === 'draining' ? '500ms' : '0ms';
  const easing = liquidPhase === 'draining' ? 'cubic-bezier(.55,0,.55,1)' : 'cubic-bezier(.34,1.56,.64,1)';
  const heartPath = 'M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z';
  return (
    <div id="nav-wishlist-icon" ref={wrapRef} className="relative flex h-5 w-5 items-center justify-center">
      <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d={heartPath} />
      </svg>
      <div
        className={`pointer-events-none absolute inset-0 ${liquidPhase === 'filling' ? 'animate-liquid-wobble' : ''}`}
        style={{ clipPath: `inset(${clipTop}% 0 0 0)`, transition: `clip-path ${duration} ${easing}` }}
      >
        <svg width="20" height="20" fill="#44A7FC" stroke="none" viewBox="0 0 24 24">
          <path d={heartPath} />
        </svg>
      </div>
    </div>
  );
}

function SearchThumb({ imgVal }: { imgVal?: string }) {
  const isUrl = typeof imgVal === 'string' && (imgVal.startsWith('http://') || imgVal.startsWith('https://'));
  return (
    <div className="flex h-[42px] w-[42px] shrink-0 items-center justify-center overflow-hidden rounded-[9px] bg-surface-muted text-[22px]">
      {isUrl
        ? <img src={optimizeCloudinaryUrl(imgVal, 120)} alt="" className="h-10 w-10 rounded-md object-cover" loading="lazy" decoding="async" />
        : <span className="text-2xl">{imgVal || '📦'}</span>}
    </div>
  );
}

function CategoryIcon({ icon }: { icon?: string }) {
  const isSvg = typeof icon === 'string' && icon.trim().startsWith('<svg');
  if (isSvg) {
    return (
      <div
        className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-[9px] bg-brand-bg text-brand-light [&_svg]:!h-[22px] [&_svg]:!w-[22px]"
        dangerouslySetInnerHTML={{ __html: sanitizeSvgHtml(icon) }}
      />
    );
  }
  return <div className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-[9px] bg-brand-bg text-xl">{icon || '📂'}</div>;
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
    <>{truncBefore}<span className="bg-brand-light-hover/20 text-brand-light">{match}</span>{truncAfter}</>
  );
}

const searchInputClass = 'w-full rounded-full border-[1.5px] border-brand-light/20 bg-brand-bg/25 py-[9px] pl-10 pr-3.5 font-body text-base text-ink transition-brand duration-brand placeholder:text-muted focus:border-brand-light/60 focus:bg-white focus:outline-none';
const desktopSearchInputClass = 'w-full cursor-text rounded-full border-[1.5px] border-brand-light/20 bg-brand-bg/25 py-[9px] pl-10 pr-3.5 font-body text-[13px] text-ink transition-brand duration-brand placeholder:text-muted focus:border-brand-light/60 focus:bg-white focus:shadow-[0_0_0_3px_rgba(0,88,199,.12)] focus:outline-none';

const DEFAULT_POPULAR_SEARCHES = [
  'Neon Light', 'Smart Watch', 'Power Bank', 'TWS Earbuds', 'Headphone', 'Humidifier',
];

function SearchDefaultPanel({
  recentSearches, popularSearches, popularCategories, onPickRecent, onRemoveRecent, onClearRecent, onGoToCat,
}: {
  recentSearches: string[];
  popularSearches: string[];
  popularCategories: Category[];
  onPickRecent: (term: string) => void;
  onRemoveRecent: (term: string) => void;
  onClearRecent: () => void;
  onGoToCat: (id: string) => void;
}) {
  const { t } = useT();
  return (
    <div className="py-1.5">
      {recentSearches.length > 0 ? (
        <>
          <div className="flex items-center justify-between px-3.5 pb-1.5 pt-1.5 text-[10.5px] font-bold uppercase tracking-[.5px] text-muted">
            <span>{t('সাম্প্রতিক অনুসন্ধান')}</span>
            <a className="cursor-pointer text-[11px] font-semibold text-brand-light hover:underline" onClick={(e) => { e.stopPropagation(); onClearRecent(); }}>{t('সব মুছুন')}</a>
          </div>
          <div className="flex flex-wrap gap-2 px-3.5 pb-2.5">
            {recentSearches.map((term) => (
              <span
                key={term}
                className="flex items-center gap-1.5 rounded-full bg-surface-muted py-1.5 pl-3.5 pr-2 text-[12.5px] font-medium text-ink transition-brand duration-brand hover:bg-border-base"
              >
                <button
                  type="button"
                  className="cursor-pointer"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => onPickRecent(term)}
                >
                  {term}
                </button>
                <button
                  type="button"
                  className="flex h-[16px] w-[16px] shrink-0 items-center justify-center rounded-full text-muted hover:bg-white hover:text-brand-light"
                  onClick={(e) => { e.stopPropagation(); onRemoveRecent(term); }}
                  aria-label={t('মুছুন')}
                >
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
                </button>
              </span>
            ))}
          </div>
          <div className="mx-3.5 mb-1.5 h-px bg-border-base" />
        </>
      ) : popularSearches.length > 0 && (
        <>
          <div className="px-3.5 pb-1.5 pt-1.5 text-[10.5px] font-bold uppercase tracking-[.5px] text-muted">
            {t('জনপ্রিয় সার্চ')}
          </div>
          <div className="flex flex-wrap gap-2 px-3.5 pb-2.5">
            {popularSearches.map((term) => (
              <button
                key={term}
                type="button"
                className="cursor-pointer rounded-full bg-surface-muted py-1.5 px-3.5 text-[12.5px] font-medium text-ink transition-brand duration-brand hover:bg-border-base"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => onPickRecent(term)}
              >
                {term}
              </button>
            ))}
          </div>
          <div className="mx-3.5 mb-1.5 h-px bg-border-base" />
        </>
      )}
      {popularCategories.length > 0 && (
        <>
          <div className="flex items-center justify-between px-3.5 pb-2 pt-1.5 text-[10.5px] font-bold uppercase tracking-[.5px] text-muted">
            <span>{t('জনপ্রিয় ক্যাটাগরি')}</span>
            <a className="cursor-pointer text-[11px] font-semibold text-brand-light hover:underline" onClick={() => onGoToCat('all')}>{t('সব দেখুন →')}</a>
          </div>
          <div className="grid grid-cols-4 gap-2 px-3.5 pb-3">
            {popularCategories.map((c) => (
              <button
                type="button"
                key={c.id}
                className="flex flex-col items-center gap-1.5 rounded-[12px] p-1.5 text-center transition-brand duration-brand hover:bg-surface-muted"
                onClick={() => onGoToCat(c.id)}
              >
                <CategoryIcon icon={c.icon} />
                <span className="line-clamp-1 text-[11px] font-semibold text-ink">{c.name}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function SearchDropdown({
  searchQuery, searchResults, catResults, onGoToSearch, onGoToCat, onPick, wide, positioned = true, tall = false,
  isDefaultView = false, recentSearches = [], popularSearches = [], popularCategories = [], onPickRecent, onRemoveRecent, onClearRecent,
}: {
  searchQuery: string;
  searchResults: Product[];
  catResults: Category[];
  onGoToSearch: () => void;
  onGoToCat: (id: string) => void;
  onPick: () => void;
  wide?: boolean;
  positioned?: boolean;
  tall?: boolean;
  isDefaultView?: boolean;
  recentSearches?: string[];
  popularSearches?: string[];
  popularCategories?: Category[];
  onPickRecent?: (term: string) => void;
  onRemoveRecent?: (term: string) => void;
  onClearRecent?: () => void;
}) {
  const { t, lang } = useT();
  const catName = (catId: string) => (catResults.find((c) => c.id === catId) || {}).name || catId;
  return (
    <div
      className={`search-dropdown-reveal search-dropdown-glass ${positioned ? `absolute z-[1100] ${wide ? '-left-5 -right-5' : 'left-0 right-0'}` : 'relative z-[1100] w-full'} ${tall ? 'max-h-[55vh]' : 'max-h-[420px]'} flex flex-col overflow-hidden rounded-[14px] border border-white/60 bg-white/95 shadow-sh3 backdrop-blur-[8px]`}
      style={positioned ? { top: 'calc(100% + 14px)' } : undefined}
    >
      {isDefaultView ? (
        <div className="overflow-y-auto">
          <SearchDefaultPanel
            recentSearches={recentSearches}
            popularSearches={popularSearches}
            popularCategories={popularCategories}
            onPickRecent={(term) => onPickRecent?.(term)}
            onRemoveRecent={(term) => onRemoveRecent?.(term)}
            onClearRecent={() => onClearRecent?.()}
            onGoToCat={onGoToCat}
          />
        </div>
      ) : searchResults.length === 0 ? (
        <div className="flex flex-col items-center gap-2 px-3.5 py-5 text-center text-[13px] text-muted">
          <SearchIcon className="text-muted/60" />
          <span>
            {lang === 'en'
              ? <>No products found for &quot;<strong className="text-ink">{searchQuery}</strong>&quot;</>
              : <>&quot;<strong className="text-ink">{searchQuery}</strong>&quot; এর জন্য কোনো পণ্য পাওয়া যায়নি</>}
          </span>
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border-base px-3.5 pb-1.5 pt-2 text-[10.5px] font-bold uppercase tracking-[.5px] text-muted">
              <span>{lang === 'en' ? `${searchResults.length} products found` : `${searchResults.length}টি পণ্য পাওয়া গেছে`}</span>
              <a className="cursor-pointer text-[11px] font-semibold text-brand-light hover:underline" onClick={onGoToSearch}>{t('সব দেখুন →')}</a>
            </div>
            <div className="px-3.5 pb-1 pt-1.5 text-[10.5px] font-bold uppercase tracking-[.7px] text-muted">{t('পণ্য')}</div>
            {searchResults.map((p) => (
              <Link
                key={p.id}
                href={productHref(p)}
                prefetch={true}
                className="flex items-center gap-3 px-3.5 py-2.5 text-inherit no-underline transition-colors hover:bg-surface-muted"
                onClick={onPick}
              >
                <SearchThumb imgVal={(p.imgs || [])[0]} />
                <div className="min-w-0 flex-1">
                  <div className="overflow-hidden text-ellipsis whitespace-nowrap text-[13px] font-semibold">{highlightMatch(p.name, searchQuery)}</div>
                  <div className="mt-0.5 text-[11px] text-muted">
                    {catName(p.cat)}{p.stock <= 0 && <> · <span className="text-brand-light">{t('স্টক শেষ')}</span></>}
                  </div>
                </div>
                <div className="shrink-0 text-[13px] font-bold">৳{Number(p.price).toLocaleString('en-US')}</div>
              </Link>
            ))}
            {catResults.length > 0 && (
              <>
                <div className="mx-3.5 my-1 h-px bg-border-base" />
                <div className="px-3.5 pb-1 pt-2 text-[10.5px] font-bold uppercase tracking-[.7px] text-muted">{t('ক্যাটাগরি')}</div>
                {catResults.map((c) => (
                  <div key={c.id} className="flex cursor-pointer items-center gap-3 px-3.5 py-[9px] transition-colors hover:bg-surface-muted" onClick={() => onGoToCat(c.id)}>
                    <CategoryIcon icon={c.icon} />
                    <div className="min-w-0 flex-1">
                      <div className="text-[13px] font-semibold">{c.name}</div>
                      <div className="mt-0.5 text-[11px] text-muted">{t('ক্যাটাগরি দেখুন →')}</div>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
          <div className="shrink-0 border-t border-border-base px-3.5 py-2.5 text-center">
            <button
              className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-brand-light py-2 text-[12.5px] font-semibold text-white transition-brand duration-brand hover:bg-brand-light-hover"
              onClick={onGoToSearch}
            >
              <SearchIcon />
              {lang === 'en' ? <>See all results for &quot;{searchQuery}&quot;</> : <>&quot;{searchQuery}&quot; এর সব ফলাফল দেখুন</>}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default function Navbar({
  cartCount = 0, wishCount = 0, onCartClick, onWishClick, onLoginClick, onTrackClick, currentUser, onAccountClick,
  sticky = true, showHomeButton = false,
}: NavbarProps) {
  const { t } = useT();
  const supabase = useMemo(() => createClient(), []);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [catResults, setCatResults] = useState<Category[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [desktopSearchHovered, setDesktopSearchHovered] = useState(false);
  const [desktopSearchFocused, setDesktopSearchFocused] = useState(false);
  const [desktopSearchGeo, setDesktopSearchGeo] = useState<{ left: number; width: number } | null>(null);
  const desktopNavRowRef = useRef<HTMLDivElement>(null);
  const desktopSearchWrapRef = useRef<HTMLDivElement>(null);
  const desktopSearchBoxRef = useRef<HTMLDivElement>(null);
  const mobileSearchAreaRef = useRef<HTMLDivElement>(null);
  const mobileSearchToggleRef = useRef<HTMLButtonElement>(null);
  const cartBtnRef = useRef<HTMLButtonElement>(null);
  const wishIconWrapRef = useRef<HTMLDivElement>(null);
  const [wishLiquidPhase, setWishLiquidPhase] = useState<'idle' | 'filling' | 'full' | 'draining'>('idle');
  const mobileSearchInputRef = useRef<HTMLInputElement>(null);
  const prodsRef = useRef<Product[]>([]);
  const catsRef = useRef<Category[]>(DEFAULT_CATEGORIES);
  const router = useRouter();
  const hasResults = searchResults.length > 0 || catResults.length > 0;
  const desktopSearchExpanded = desktopSearchHovered || desktopSearchFocused || showDropdown;
  const isDefaultView = showDropdown && !searchQuery.trim();
  const popularCategories = useMemo(
    () => DEFAULT_CATEGORIES.filter((c) => c.id !== 'all').slice(0, 4),
    [],
  );
  const popularSearches = DEFAULT_POPULAR_SEARCHES;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const customRows = await fetchCustomProducts(supabase);
      if (!cancelled && customRows.length) {
        prodsRef.current = customRows;
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
    setRecentSearches(getRecentSearches());
  }, []);

  useEffect(() => {
    if (mobileSearchOpen) {
      mobileSearchInputRef.current?.focus();
    }
  }, [mobileSearchOpen]);

  useEffect(() => {
    if (!mobileSearchOpen) return undefined;
    const startY = window.scrollY;
    let armed = false;
    const armTimer = setTimeout(() => { armed = true; }, 500);
    const onScroll = () => {
      if (typeof window !== 'undefined' && window.visualViewport && window.visualViewport.scale !== 1) {
        return;
      }
      if (armed && Math.abs(window.scrollY - startY) > 15) {
        setMobileSearchOpen(false);
        setShowDropdown(false);
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      clearTimeout(armTimer);
      window.removeEventListener('scroll', onScroll);
    };
  }, [mobileSearchOpen]);

  const cartAddedTick = useCartStore((s) => s.addedTick);
  const prevCartAddedTick = useRef(cartAddedTick);
  useEffect(() => {
    if (cartAddedTick === prevCartAddedTick.current) return;
    prevCartAddedTick.current = cartAddedTick;
    const btn = cartBtnRef.current;
    if (!btn) return;
    btn.classList.remove('animate-cart-jiggle');
    void btn.offsetWidth;
    btn.classList.add('animate-cart-jiggle');
    window.setTimeout(() => btn.classList.remove('animate-cart-jiggle'), 750);
  }, [cartAddedTick]);

  useEffect(() => {
    const onHit = () => {
      const wrap = wishIconWrapRef.current;
      if (wrap) {
        wrap.classList.remove('animate-cart-jiggle');
        void wrap.offsetWidth;
        wrap.classList.add('animate-cart-jiggle');
        window.setTimeout(() => wrap.classList.remove('animate-cart-jiggle'), 750);
      }
      setWishLiquidPhase('filling');
    };
    window.addEventListener(WISHLIST_NAV_HIT_EVENT, onHit);
    return () => window.removeEventListener(WISHLIST_NAV_HIT_EVENT, onHit);
  }, []);

  useEffect(() => {
    if (wishLiquidPhase === 'filling') {
      const t = window.setTimeout(() => setWishLiquidPhase('full'), 650);
      return () => clearTimeout(t);
    }
    if (wishLiquidPhase === 'full') {
      const t = window.setTimeout(() => setWishLiquidPhase('draining'), 260);
      return () => clearTimeout(t);
    }
    if (wishLiquidPhase === 'draining') {
      const t = window.setTimeout(() => setWishLiquidPhase('idle'), 500);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [wishLiquidPhase]);

  useEffect(() => {
    let raf = 0;
    function measure() {
      if (typeof window !== 'undefined' && window.visualViewport && window.visualViewport.scale !== 1) {
        return;
      }
      const wrap = desktopSearchWrapRef.current;
      const row = desktopNavRowRef.current;
      if (!wrap || !row) return;
      const wrapRect = wrap.getBoundingClientRect();
      const rowRect = row.getBoundingClientRect();
      if (wrapRect.width === 0 || rowRect.width === 0) return;
      const expandedWidth = Math.min(560, rowRect.width - 260);
      const expandedLeftAbs = rowRect.left + (rowRect.width - expandedWidth) / 2;
      setDesktopSearchGeo({ left: expandedLeftAbs - wrapRect.left, width: expandedWidth });
    }
    measure();
    raf = requestAnimationFrame(measure);
    window.addEventListener('resize', measure);
    return () => {
      window.removeEventListener('resize', measure);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  useEffect(() => {
    if (mobileSearchOpen) return undefined;
    if (desktopSearchExpanded || !searchQuery) return undefined;
    const t = setTimeout(() => {
      setSearchQuery('');
      setSearchResults([]);
      setCatResults([]);
      setShowDropdown(false);
    }, 7000);
    return () => clearTimeout(t);
  }, [desktopSearchExpanded, searchQuery, mobileSearchOpen]);

  const runSearch = useCallback((q: string) => {
    setSearchResults(searchProducts(prodsRef.current, q).slice(0, 6));
    setCatResults(matchCategoryList(catsRef.current, q));
  }, []);

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
  }, []);

  const handleSearchInput = useCallback((value: string) => {
    setSearchQuery(value);
    setShowDropdown(true);
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    if (!value.trim()) {
      setSearchResults([]);
      setCatResults([]);
      return;
    }
    debounceTimerRef.current = setTimeout(() => runSearch(value), 280);
  }, [runSearch]);

  const goToCat = (catId: string) => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    setShowDropdown(false);
    setMobileSearchOpen(false);
    setSearchQuery('');
    setSearchResults([]);
    setCatResults([]);
    router.push(catId === 'all' ? '/' : `/category/${makeCatSlug(catId)}`);
  };

  const goToSearch = () => {
    const q = searchQuery.trim();
    if (!q) return;
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    setRecentSearches(addRecentSearch(q));
    setShowDropdown(false);
    setMobileSearchOpen(false);
    setSearchQuery('');
    setSearchResults([]);
    setCatResults([]);
    router.push(`/search?q=${encodeURIComponent(q)}`);
  };

  const handleSearchKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) goToSearch();
  };

  const pickRecentSearch = (term: string) => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    setSearchQuery(term);
    setShowDropdown(true);
    runSearch(term);
  };

  const removeRecentSearchTerm = (term: string) => {
    setRecentSearches(removeRecentSearch(term));
  };

  const clearAllRecentSearches = () => {
    clearRecentSearches();
    setRecentSearches([]);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      const insideDesktop = !!desktopSearchWrapRef.current?.contains(target);
      const insideMobile = !!mobileSearchAreaRef.current?.contains(target);
      const insideToggle = !!mobileSearchToggleRef.current?.contains(target);
      if (!insideDesktop && !insideMobile && !insideToggle) setShowDropdown(false);
    };
    document.addEventListener('click', handleClickOutside, true);
    return () => document.removeEventListener('click', handleClickOutside, true);
  }, []);

  useEffect(() => {
    if (!showDropdown) return;
    if (searchQuery.trim() && !hasResults) return;
    lockBody();
    return () => unlockBody();
  }, [showDropdown, hasResults, searchQuery]);

  return (
    <div className={`z-[900] mx-2 mb-1.5 mt-[14px] max-[400px]:mx-1.5 sm:mx-3 ${sticky ? 'sticky top-[14px]' : 'relative'}`}>
      {showDropdown && (
        <div
          className="fixed inset-0 z-[850]"
          onClick={() => setShowDropdown(false)}
        />
      )}
      <nav
        className={`navbar-glass relative z-[900] border border-white/60 bg-white/80 shadow-sh2 backdrop-blur-[8px] ${mobileSearchOpen ? 'rounded-t-[35px] rounded-b-none border-b-0 md:rounded-[35px] md:border-b' : 'rounded-[35px]'}`}
      >
        <div ref={desktopNavRowRef} className="relative mx-auto flex h-[62px] max-w-[1300px] items-center gap-[14px] px-3 max-[400px]:gap-2 sm:px-5 2xl:max-w-[1560px]">
          <div className="flex w-full items-center justify-between gap-2 max-[400px]:gap-1.5 sm:gap-3">
            {showHomeButton ? (
              /* 🌟 দৃষ্টিনন্দন ফ্রস্টেড গ্লাস রাউন্ডেড হোম পিল বাটন */
              <Link
                href="/"
                prefetch={true}
                aria-label={t('হোম')}
                title={t('হোম')}
                className="group flex shrink-0 items-center gap-1.5 rounded-full border border-border-base/80 bg-white/75 py-1 pl-1.5 pr-3 shadow-xs backdrop-blur-md transition-all duration-brand hover:border-brand-light hover:bg-brand-bg/40 active:scale-95 no-underline max-[400px]:pr-2.5"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-light text-white shadow-xs transition-transform duration-brand group-hover:scale-105">
                  <HomeSvgIcon />
                </div>
                <span className="font-body text-[13px] font-extrabold text-ink transition-colors duration-brand group-hover:text-brand-light">
                  {t('হোম')}
                </span>
              </Link>
            ) : (
              <Link className="flex shrink-0 items-center no-underline" href="/" prefetch={true}>
                <Image
                  src="/vangcur-logo.png"
                  alt="Vangcur Gadgets"
                  width={140}
                  height={49}
                  sizes="133px"
                  priority
                  className="h-7 w-auto select-none max-[400px]:h-6 md:h-8"
                  draggable={false}
                />
              </Link>
            )}

            <div className="flex items-center gap-2 md:gap-3">
              <div
                ref={desktopSearchWrapRef}
                className="relative z-10 hidden md:block md:h-10 md:w-[240px] lg:w-[300px]"
              >
                <div
                  ref={desktopSearchBoxRef}
                  onMouseEnter={() => setDesktopSearchHovered(true)}
                  onMouseLeave={() => setDesktopSearchHovered(false)}
                  style={desktopSearchExpanded && desktopSearchGeo ? { left: desktopSearchGeo.left, width: desktopSearchGeo.width } : undefined}
                  className={`absolute left-0 top-0 h-full w-full transition-[left,width] duration-300 ease-out ${desktopSearchExpanded ? 'z-[1000]' : ''}`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <svg className="pointer-events-none absolute left-[13px] top-1/2 -translate-y-1/2 text-brand-light/70" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                    <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
                  </svg>
                  <input
                    type="search"
                    placeholder={t('প্রোডাক্ট খুঁজুন...')}
                    value={searchQuery}
                    onChange={(e) => handleSearchInput(e.target.value)}
                    onKeyDown={handleSearchKey}
                    onFocus={() => { setDesktopSearchFocused(true); setShowDropdown(true); }}
                    onBlur={() => setDesktopSearchFocused(false)}
                    autoComplete="off"
                    name="product-search"
                    className={`${desktopSearchInputClass} h-full ${searchQuery ? 'pr-9' : ''}`}
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => { if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current); setSearchQuery(''); setSearchResults([]); setCatResults([]); setShowDropdown(false); }}
                      className="absolute right-2.5 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full bg-brand-bg text-brand-light transition-brand duration-brand hover:bg-brand-light hover:text-white"
                      title={t('মুছুন')}
                      aria-label={t('মুছুন')}
                    >
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
                    </button>
                  )}
                  {showDropdown && (
                    <SearchDropdown
                      searchQuery={searchQuery}
                      searchResults={searchResults}
                      catResults={catResults}
                      onGoToSearch={goToSearch}
                      onGoToCat={goToCat}
                      onPick={() => setShowDropdown(false)}
                      isDefaultView={isDefaultView}
                      recentSearches={recentSearches}
                      popularSearches={popularSearches}
                      popularCategories={popularCategories}
                      onPickRecent={pickRecentSearch}
                      onRemoveRecent={removeRecentSearchTerm}
                      onClearRecent={clearAllRecentSearches}
                    />
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button className="relative flex items-center justify-center rounded-[9px] p-2 max-[400px]:p-1.5 text-ink transition-brand duration-brand hover:bg-surface-muted hover:text-brand-light" onClick={onWishClick} title="Wishlist">
                  <NavWishlistIcon wrapRef={wishIconWrapRef} liquidPhase={wishLiquidPhase} />
                  <span className={`absolute right-[3px] top-[3px] h-[15px] w-[15px] items-center justify-center rounded-full bg-brand-light text-[9px] font-bold text-white ${wishCount > 0 ? 'flex animate-badge-hot-glow' : 'hidden'}`}>{wishCount}</span>
                </button>

                <button
                  className="relative flex items-center justify-center rounded-[9px] p-2 max-[400px]:p-1.5 text-ink transition-brand duration-brand hover:bg-surface-muted hover:text-brand-light"
                  ref={cartBtnRef}
                  onClick={onCartClick}
                  title={t('কার্ট')}
                >
                  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                    <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
                    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                  </svg>
                  <span className={`absolute right-[3px] top-[3px] h-[15px] w-[15px] items-center justify-center rounded-full bg-brand-light text-[9px] font-bold text-white ${cartCount > 0 ? 'flex animate-badge-hot-glow' : 'hidden'}`}>{cartCount}</span>
                </button>

                {currentUser ? (
                  <button className="flex max-w-[130px] shrink-0 items-center gap-1.5 rounded-full bg-surface-muted px-2.5 py-1.5 font-body text-[13px] font-semibold text-ink transition-brand duration-brand hover:bg-border-base md:max-w-none md:gap-2 md:px-3.5" onClick={onAccountClick}>
                    <div className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full bg-brand-light text-[10px] font-bold text-white shadow-sh1">
                      {(currentUser.name || '?').split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)}
                    </div>
                    <span className="truncate">{currentUser.name || t('আমার অ্যাকাউন্ট')}</span>
                  </button>
                ) : (
                  <button className="shrink-0 rounded-full bg-brand-light px-3.5 py-2 font-body text-[13px] font-semibold text-white shadow-sh1 transition-brand duration-brand hover:-translate-y-0.5 hover:bg-brand-light-hover hover:shadow-sh2 max-[400px]:px-2.5 md:px-[18px]" onClick={onLoginClick}>
                    {t('লগইন করুন')}
                  </button>
                )}

                <button className="flex items-center justify-center rounded-[9px] p-2 max-[400px]:p-1.5 text-ink transition-brand duration-brand hover:bg-surface-muted hover:text-brand-light" onClick={onTrackClick} title={t('অর্ডার ট্র্যাক করুন')}>
                  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M9 17H7A5 5 0 017 7h2" /><path d="M15 7h2a5 5 0 010 10h-2" />
                    <line x1="8" y1="12" x2="16" y2="12" />
                  </svg>
                </button>

                <button
                  ref={mobileSearchToggleRef}
                  className="flex items-center justify-center rounded-[9px] p-2 max-[400px]:p-1.5 text-ink transition-brand duration-brand hover:bg-surface-muted hover:text-brand-light md:hidden"
                  onClick={(e) => {
                    e.stopPropagation();
                    const next = !mobileSearchOpen;
                    setMobileSearchOpen(next);
                    setShowDropdown(next);
                  }}
                  title="Search"
                >
                  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                    <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* মোবাইল সার্চ এরিয়া */}
      <div className="relative md:hidden" ref={mobileSearchAreaRef}>
        <div
          className={`grid overflow-hidden transition-[grid-template-rows,opacity] duration-200 ease-out ${mobileSearchOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0 pointer-events-none'}`}
        >
          <div className="min-h-0 overflow-hidden">
            <div className="navbar-glass relative z-[900] -mt-px rounded-b-[22px] border border-t-0 border-white/60 bg-white/80 px-5 pb-3 pt-2 backdrop-blur-[8px]">
              <div className="relative" onClick={(e) => e.stopPropagation()}>
                <svg className="pointer-events-none absolute left-[13px] top-1/2 -translate-y-1/2 text-brand-light/70" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
                </svg>
                <input
                  type="search"
                  placeholder={t('প্রোডাক্ট খুঁজুন...')}
                  value={searchQuery}
                  onChange={(e) => handleSearchInput(e.target.value)}
                  onKeyDown={handleSearchKey}
                  onFocus={() => setShowDropdown(true)}
                  ref={mobileSearchInputRef}
                  autoComplete="off"
                  className={`${searchInputClass} ${searchQuery ? 'pr-9' : ''}`}
                />
                {searchQuery && (
                  <button
                    className="absolute right-2.5 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full bg-brand-bg text-brand-light transition-brand duration-brand hover:bg-brand-light hover:text-white"
                    onClick={() => { if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current); setSearchQuery(''); setSearchResults([]); setCatResults([]); setShowDropdown(false); }}
                    title={t('মুছুন')}
                    aria-label={t('মুছুন')}
                  >
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {mobileSearchOpen && showDropdown && (
          <div className="absolute left-0 right-0 top-full z-[900] mt-1.5" onClick={(e) => e.stopPropagation()}>
            <SearchDropdown
              searchQuery={searchQuery}
              searchResults={searchResults}
              catResults={catResults}
              onGoToSearch={goToSearch}
              onGoToCat={goToCat}
              onPick={() => { setShowDropdown(false); setMobileSearchOpen(false); }}
              positioned={false}
              tall
              isDefaultView={isDefaultView}
              recentSearches={recentSearches}
              popularSearches={popularSearches}
              popularCategories={popularCategories}
              onPickRecent={pickRecentSearch}
              onRemoveRecent={removeRecentSearchTerm}
              onClearRecent={clearAllRecentSearches}
            />
          </div>
        )}
      </div>
    </div>
  );
}
