'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
  /** false হলে Navbar viewport-এর top-এ sticky/pinned থাকে না — স্বাভাবিক
   * document flow-তে বসে থাকে এবং scroll করলে কনটেন্টের সাথেই উপরে সরে যায়।
   * প্রোডাক্ট পেজের মতো নিজস্ব sticky tabs-bar থাকা পেজে ব্যবহার হয় (default: true)। */
  sticky?: boolean;
  /** true হলে বাম পাশের Vangcur লোগোর বদলে একটা ব্র্যান্ড-কালার "হোমে যান" বাটন
   * দেখানো হয় — প্রোডাক্ট পেজের মতো sub-page-এ ব্যবহারের জন্য (default: false)। */
  showHomeButton?: boolean;
}

function SearchIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round">
      <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
    </svg>
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

// যাদের সার্চ হিস্ট্রি একেবারে খালি (নতুন ইউজার বা সব মুছে ফেলেছে), তাদের জন্য
// ডিফল্ট জনপ্রিয় সার্চ-টার্ম — আপাতত হার্ডকোড, পরে অ্যাডমিন প্যানেল থেকে
// এডিটযোগ্য করা হবে (তখন এটা কোনো settings/API কল দিয়ে replace হবে)।
const DEFAULT_POPULAR_SEARCHES = [
  'Neon Light', 'Smart Watch', 'Power Bank', 'TWS Earbuds', 'Headphone', 'Humidifier',
];

// সার্চ বক্সে ক্লিক/ফোকাস করার সাথে সাথেই (কিছু না লিখেও) এই প্যানেলটা দেখানো
// হয় — আগে খালি বক্সে ক্লিক করলে কিছুই দেখাত না। সাম্প্রতিক অনুসন্ধান আর
// জনপ্রিয় কয়েকটা ক্যাটাগরি একসাথে দেখিয়ে ইউজারকে দ্রুত শুরু করার সুযোগ দেয়।
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
  return (
    <div className="py-1.5">
      {recentSearches.length > 0 ? (
        <>
          <div className="flex items-center justify-between px-3.5 pb-1.5 pt-1.5 text-[10.5px] font-bold uppercase tracking-[.5px] text-muted">
            <span>সাম্প্রতিক অনুসন্ধান</span>
            <a className="cursor-pointer text-[11px] font-semibold text-brand-light hover:underline" onClick={(e) => { e.stopPropagation(); onClearRecent(); }}>সব মুছুন</a>
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
                  // mousedown-এ preventDefault না করলে ক্লিকের আগে সার্চ ইনপুট
                  // blur হয়ে যায় — সেই blur-এর কারণে বক্সের expanded state
                  // সাময়িকভাবে collapse হওয়ার race তৈরি হতো, তাই ক্লিক সম্পন্ন
                  // হওয়ার আগেই বক্স ছোট হয়ে যাচ্ছিল। এটা দিলে input focus
                  // থেকেই যায়, কোনো race হয় না।
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => onPickRecent(term)}
                >
                  {term}
                </button>
                <button
                  type="button"
                  className="flex h-[16px] w-[16px] shrink-0 items-center justify-center rounded-full text-muted hover:bg-white hover:text-brand-light"
                  onClick={(e) => { e.stopPropagation(); onRemoveRecent(term); }}
                  aria-label="মুছুন"
                >
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
                </button>
              </span>
            ))}
          </div>
          <div className="mx-3.5 mb-1.5 h-px bg-border-base" />
        </>
      ) : popularSearches.length > 0 && (
        // সার্চ হিস্ট্রি একেবারে খালি (নতুন ইউজার, অথবা সব মুছে ফেলা হয়েছে) —
        // এই ক্ষেত্রে খালি জায়গা না রেখে ডিফল্ট জনপ্রিয় সার্চ-টার্ম দেখানো হয়।
        // এখন এগুলো হার্ডকোড করা, পরে অ্যাডমিন প্যানেল থেকে এডিটযোগ্য করা হবে।
        <>
          <div className="px-3.5 pb-1.5 pt-1.5 text-[10.5px] font-bold uppercase tracking-[.5px] text-muted">
            জনপ্রিয় সার্চ
          </div>
          <div className="flex flex-wrap gap-2 px-3.5 pb-2.5">
            {popularSearches.map((term) => (
              <button
                key={term}
                type="button"
                className="cursor-pointer rounded-full bg-surface-muted py-1.5 px-3.5 text-[12.5px] font-medium text-ink transition-brand duration-brand hover:bg-border-base"
                // একই কারণে (উপরে দেখুন) — blur-race আটকাতে mousedown-এ
                // preventDefault।
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
            <span>জনপ্রিয় ক্যাটাগরি</span>
            <a className="cursor-pointer text-[11px] font-semibold text-brand-light hover:underline" onClick={() => onGoToCat('all')}>সব দেখুন →</a>
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
  searchQuery, searchResults, catResults, onGoToSrp, onGoToCat, onPick, wide, positioned = true, tall = false,
  isDefaultView = false, recentSearches = [], popularSearches = [], popularCategories = [], onPickRecent, onRemoveRecent, onClearRecent,
}: {
  searchQuery: string;
  searchResults: Product[];
  catResults: Category[];
  onGoToSrp: () => void;
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
          <span>&quot;<strong className="text-ink">{searchQuery}</strong>&quot; এর জন্য কোনো পণ্য পাওয়া যায়নি</span>
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto">
            <div className="flex items-center justify-between border-b border-border-base px-3.5 pb-1.5 pt-2 text-[10.5px] font-bold uppercase tracking-[.5px] text-muted">
              <span>{searchResults.length}টি পণ্য পাওয়া গেছে</span>
              <a className="cursor-pointer text-[11px] font-semibold text-brand-light hover:underline" onClick={onGoToSrp}>সব দেখুন →</a>
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
                    {catName(p.cat)}{p.stock <= 0 && <> · <span className="text-brand-light">স্টক শেষ</span></>}
                  </div>
                </div>
                <div className="shrink-0 text-[13px] font-bold">৳{Number(p.price).toLocaleString('en-US')}</div>
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
          </div>
          {/* বাটনটা নিচেই থাকে (আগের জায়গায়), কিন্তু এখন এই flex-item-টা fixed —
              উপরের কনটেন্ট যত লম্বাই হোক, এটা সবসময় নিচে দৃশ্যমান থাকবে। */}
          <div className="shrink-0 border-t border-border-base px-3.5 py-2.5 text-center">
            <button
              className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-brand-light py-2 text-[12.5px] font-semibold text-white transition-brand duration-brand hover:bg-brand-light-hover"
              onClick={onGoToSrp}
            >
              <SearchIcon />
              &quot;{searchQuery}&quot; এর সব ফলাফল দেখুন
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
  const mobileSearchInputRef = useRef<HTMLInputElement>(null);
  const prodsRef = useRef<Product[]>([]);
  const catsRef = useRef<Category[]>(DEFAULT_CATEGORIES);
  const router = useRouter();
  const hasResults = searchResults.length > 0 || catResults.length > 0;
  const desktopSearchExpanded = desktopSearchHovered || desktopSearchFocused || showDropdown;
  // খালি বক্সে ফোকাস হলে (কিছু না লিখেই) সাম্প্রতিক অনুসন্ধান + জনপ্রিয়
  // ক্যাটাগরির ডিফল্ট প্যানেল দেখানো হয়, সাধারণ ফলাফল/no-result state নয়।
  const isDefaultView = showDropdown && !searchQuery.trim();
  // catsRef.current পরিবর্তন হলে re-render trigger হয় না (এটা state না, ref),
  // তাই stale ডেটা এড়াতে এখানে সরাসরি DEFAULT_CATEGORIES থেকে প্রথম কয়েকটা
  // (curated "জনপ্রিয়") ক্যাটাগরি নেওয়া হচ্ছে — এগুলো নিয়মিত পরিবর্তন হয় না।
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
    // সার্চ বক্স খোলার সাথে সাথেই showDropdown সেট করা হয় toggle বাটনের
    // onClick-এ synchronously (নিচে দেখুন) — এখানে শুধু ইনপুটে ফোকাস দেওয়া হয়,
    // এতে effect-এর এক-রেন্ডার-দেরির কারণে ডিফল্ট প্যানেল (জনপ্রিয় সার্চ/
    // ক্যাটাগরি) না-খোলার race আর হয় না।
    if (mobileSearchOpen) {
      mobileSearchInputRef.current?.focus();
    }
  }, [mobileSearchOpen]);

  // মোবাইলে সার্চ বক্স/ড্রপডাউন কোনো টাইম-বেসড টাইমারে অটোমেটিক বন্ধ হবে না —
  // ইউজার ইচ্ছাকৃতভাবে কিছু না করা পর্যন্ত (চিন্তা করছে, দেখছে) খোলা থাকতে পারে,
  // যতক্ষণ ইচ্ছা। শুধু দুইভাবে বন্ধ হবে: (১) বাইরে ক্লিক করলে (আলাদা
  // handleClickOutside effect-এ আছে), (২) পিছনের পেজ স্ক্রল করলে — কারণ স্ক্রল
  // করা মানে ইউজার এখন ওয়েবসাইট দেখতে চাইছে।
  //
  // mobile keyboard খোলার সময় ব্রাউজার নিজে থেকেই ফোকাসড ইনপুটটাকে কিবোর্ডের
  // উপরে দেখানোর জন্য পেজ auto-scroll করে। আগে এই ব্রাউজার-চালিত auto-scroll-কেই
  // ভুল করে "ইউজার নিজে স্ক্রল করেছে" ধরে নিয়ে সাথে সাথে বন্ধ করে দেওয়া হতো। তাই
  // প্রথম ৫০০ms "arm" হওয়ার আগ পর্যন্ত স্ক্রল-ক্লোজ উপেক্ষা করা হচ্ছে।
  useEffect(() => {
    if (!mobileSearchOpen) return undefined;
    const startY = window.scrollY;
    let armed = false;
    const armTimer = setTimeout(() => { armed = true; }, 500);
    const onScroll = () => {
      // পিঞ্চ/জুম গেসচারের সময় ট্রিগার হওয়া scroll ইভেন্টে state আপডেট
      // (এবং তার ফলে re-render/repaint) সম্পূর্ণ বন্ধ রাখা হচ্ছে।
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

  // ডেক্সটপ সার্চ বক্সের এক্সপ্যান্ডেড (hover/focus) অবস্থার জন্য left/width হিসাব করা হয়
  // এখানে, একবারই (মাউন্ট + রিসাইজে) — hover state-এর উপর নির্ভর করে না। বক্সটা সবসময়
  // position: absolute থাকে (কখনো relative <-> absolute টগল হয় না), শুধু এই left/width
  // ভ্যালু দুটো animate হয় — এতে করে আগে যে "ছোট হয়ে গিয়ে আবার বড় হওয়া" গ্লিচ হতো
  // (position টাইপ পরিবর্তনের কারণে) সেটা আর হবে না।
  useEffect(() => {
    let raf = 0;
    function measure() {
      // পিঞ্চ/জুম গেসচারের সময় ট্রিগার হওয়া resize ইভেন্টে state আপডেট
      // (এবং তার ফলে re-render/repaint) সম্পূর্ণ বন্ধ রাখা হচ্ছে।
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

  // হোভার স্টেট এখন বক্সের নিজের onMouseEnter/onMouseLeave দিয়ে না, বরং আসল মাউস
  // মুভমেন্টের সাথে বক্সের বর্তমান (লাইভ) bounding rect মিলিয়ে ঠিক হয়। এর মানে —
  // মাউস পয়েন্টার যদি বক্সের ভিতরে ১০০% না থাকে (এক চুলও বাইরে থাকলে) তাহলে এক্সপ্যান্ড
  // হবে না। আর যেহেতু এটা শুধু আসল মাউস-মুভমেন্টে রিক্যালকুলেট হয় (বক্স নিজে অ্যানিমেট
  // হওয়ার কারণে না), তাই মাঝ-বরাবর পজিশনে বারবার বড়-ছোট হওয়ার (jumping) সমস্যাটাও হবে না।
  useEffect(() => {
    let raf = 0;
    const onMove = (e: MouseEvent) => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const box = desktopSearchBoxRef.current;
        if (!box) return;
        const r = box.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) return;
        const inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
        setDesktopSearchHovered((prev) => (prev === inside ? prev : inside));
      });
    };
    window.addEventListener('mousemove', onMove);
    return () => {
      window.removeEventListener('mousemove', onMove);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  // আগে এখানে একটা আলাদা desktopBoxReady state দিয়ে dropdown-কে showDropdown
  // ছাড়াও আরও একটা ৩০০ms জাভাস্ক্রিপ্ট-টাইমার-নির্ভর "ready" শর্তে গেট করা হতো
  // (বক্সের CSS width-transition শেষ হওয়ার আগে dropdown পপ-আপ যেন না হয়, সেই
  // কসমেটিক পলিশের জন্য)। সমস্যা হলো — showDropdown সামান্যতম কোনো কারণে (রিয়েল
  // ব্রাউজারে focus/blur/click ইভেন্টের timing-নির্ভর কোনো সূক্ষ্ম রেসে, যেটা
  // এই স্যান্ডবক্সে রিপ্রোডিউস করা যায়নি) এক মুহূর্তের জন্যও false হয়ে গেলে এই
  // ready-state সাথে সাথেই false হয়ে যেত, আর আবার true হতে নতুন করে ৩০০ms
  // অপেক্ষা করতে হতো — সেই নতুন টাইমারটা যদি কোনোভাবে শিডিউল না হয় (বা বাতিল
  // হয়ে যায়), dropdown চিরতরের জন্য অদৃশ্য থেকে যেত, যদিও searchQuery/
  // searchResults সব ঠিকই ছিল (ইউজার যা রিপোর্ট করেছে — বক্সে টেক্সট আছে,
  // কিন্তু রেজাল্ট দেখাচ্ছে না — ঠিক এটাই)। এখন dropdown সরাসরি showDropdown-এর
  // উপরেই নির্ভর করে (কোনো বাড়তি টাইমার-গেট নেই), আর visual polish (বক্স
  // চূড়ান্ত সাইজ হওয়ার আগে পপ না করা) দেওয়া হচ্ছে বিশুদ্ধ CSS fade-animation
  // দিয়ে (নিচে দেখুন .search-dropdown-reveal ক্লাস, globals.css-এ ডিফাইন করা) —
  // CSS animation কখনো "আটকে" থাকতে পারে না, নিজে থেকেই শেষ হয়ে যায়।

  // ডেক্সটপ সার্চ বক্স ছোট (collapsed — hover/focus কোনোটাই না) অবস্থায় যদি ভিতরে
  // এখনো আগের কোনো টেক্সট থেকে যায় (ইউজার নিজে ক্লিয়ার করেনি, বাইরে ক্লিক করে
  // ড্রপডাউন শুধু বন্ধ হয়েছিল), তাহলে ৭ সেকেন্ড নিষ্ক্রিয় থাকলে অটোমেটিক ক্লিয়ার
  // হয়ে বক্সটা তার ডিফল্ট ("প্রোডাক্ট খুঁজুন" আইকন) অবস্থায় ফিরে যাবে। আবার বক্সে
  // hover/focus করলে টাইমার বাতিল হয়ে যায় (dependency-তে desktopSearchExpanded আছে)।
  // এই টাইমারটা শুধুই ডেস্কটপ hover/focus সার্চ বক্সের জন্য — মোবাইল সার্চ
  // (আলাদা UI, উপরের effect-এ হ্যান্ডল হয়) খোলা থাকলে এটা একেবারেই স্কিপ করা
  // হয়, নাহলে আগে এই একই টাইমার ভুলে মোবাইলেও fire করে দুটো বন্ধ-হওয়ার
  // effect একটার পর একটা চেইন-রিয়্যাকশন ঘটাচ্ছিল (আগে টাইপ করা রেজাল্ট,
  // তারপর টেক্সটবক্স — দুটোই কয়েক সেকেন্ড পর পর অটোমেটিক বন্ধ হয়ে যেত)।
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

  // আগে এখানে একটা useEffect([searchQuery]) দিয়ে রেজাল্ট কম্পিউট করা হতো —
  // টাইপ করলে debounce (280ms) দিয়ে, আর রিসেন্ট/পপুলার চিপে ক্লিক করলে
  // skipDebounceRef নামের একটা ref-flag দিয়ে সেই একই effect-কে বলা হতো
  // "এবার সাথে সাথেই বসাও"। আসল বাগ ছিল এখানেই: চিপে ক্লিক করলে দুটো আলাদা
  // রেন্ডার-চক্র জড়িয়ে যেত — প্রথমে ক্লিক-হ্যান্ডলারের নিজের setState
  // (searchQuery/showDropdown/searchResults), তারপর সেই রেন্ডার কমিট হওয়ার
  // পর effect আবার আলাদাভাবে searchResults/catResults সেট করত। এই দুই ধাপের
  // মাঝখানে (রিয়েল ব্রাউজারে, টাইপ করার তুলনায় ক্লিকে state-update বেশি হওয়ায়)
  // ফলাফল ড্রপডাউন মাঝেমধ্যে দেখাচ্ছিল না — টাইপ করলে সমস্যা হতো না কারণ
  // সেটা সবসময় শুধু debounce (setTimeout) পাথ দিয়েই যেত, কোনো ডাবল-রাইট ছিল
  // না।
  //
  // এখন পুরো effect+ref কম্বিনেশনটাই সরিয়ে ফেলা হয়েছে। রেজাল্ট বসানোর জন্য
  // এখন মাত্র একটা ফাংশন (runSearch) আছে — টাইপিং আর চিপে ক্লিক, দুটোই এই
  // একই ফাংশনকে সরাসরি কল করে (টাইপিং একটা প্লেইন setTimeout দিয়ে ডিলে করে,
  // ক্লিক তাৎক্ষণিকভাবে, কোনো ডিলে ছাড়াই)। কোনো effect-নির্ভরতা না থাকায়
  // দুই রেন্ডার-চক্রের মধ্যে race হওয়ার সুযোগও আর নেই — যা-ই ঘটুক, একটাই
  // setState-ব্যাচে সব বসে।
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
    // টেক্সট মুছে খালি করে দিলেও (যেমন ব্যাকস্পেস দিয়ে) বক্সটা তখনো ফোকাসড
    // থাকে, তাই ড্রপডাউন পুরো বন্ধ না করে ডিফল্ট প্যানেল (সাম্প্রতিক অনুসন্ধান
    // + জনপ্রিয় ক্যাটাগরি) দেখানো হয়।
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

  const goToSrp = () => {
    const q = searchQuery.trim();
    if (!q) return;
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    setRecentSearches(addRecentSearch(q));
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

  const pickRecentSearch = (term: string) => {
    // টাইপ করার সময় যে ফাংশনটা রেজাল্ট বসায় (runSearch), চিপে ক্লিক করলেও
    // ঠিক সেই একই ফাংশন এখানে সরাসরি (কোনো ডিলে ছাড়া) কল হচ্ছে — এটাই
    // একমাত্র জায়গা যেখানে searchResults/catResults সেট হয়, তাই আর কোনো
    // effect পরে এসে দ্বিতীয়বার (এবং সম্ভাব্য ভিন্ন টাইমিং-এ) একই ডেটা
    // আবার বসানোর চেষ্টা করে না — দুটো পাথ (টাইপ/ক্লিক) আর কখনো একে অপরের
    // সাথে রেসে পড়তে পারে না।
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

  // ================================================================
  // আসল বাগের গোড়া (এতদিন যেটা ধরা পড়েনি): এই লিসেনারটা bubble phase-এ
  // ('click', capture flag ছাড়া) attach করা ছিল। ধাপে ধাপে যা ঘটত —
  //
  //  ১) "নিয়ন লাইট" চিপে ক্লিক → এটা DOM-এর গভীরে, তাই React-এর নিজস্ব
  //     bubble-phase onClick (pickRecentSearch) সবার আগে চলে (React-এর
  //     delegated listener document-এর চেয়ে গাছের নিচের দিকে বসানো)।
  //  ২) pickRecentSearch সাথে সাথে setSearchQuery/runSearch চালায় → React
  //     re-render করে "ডিফল্ট প্যানেল" (চিপ/ক্যাটাগরি বাটনগুলো) সরিয়ে
  //     "রেজাল্ট ভিউ" বসিয়ে দেয় — মানে যে চিপ-বাটনে ক্লিক হয়েছিল সেটা DOM
  //     থেকে সম্পূর্ণ সরে (unmount) যায়, এই একই ইভেন্ট এখনো bubble করছে
  //     অবস্থাতেই।
  //  ৩) native ইভেন্টটা এরপর bubble করে document পর্যন্ত পৌঁছায়, তখন এই
  //     handler-এ e.target সেই আগের (এখন DOM থেকে বিচ্ছিন্ন/detached) চিপ
  //     এলিমেন্টটাই থেকে যায়। কোনো এলিমেন্ট ডকুমেন্ট থেকে detached হয়ে
  //     গেলে ব্রাউজারের .contains() চেক তাকে আর কোনো ancestor-এর ভিতরে
  //     "আছে" বলে ধরে না — even তার আগের আসল প্যারেন্টের জন্যও না।
  //  ৪) ফলে insideDesktop/insideMobile ভুলভাবে false আসে → মনে হয় ক্লিকটা
  //     "বাইরে" হয়েছে → সাথে সাথে setShowDropdown(false) → একদম নতুন খোলা
  //     রেজাল্ট ড্রপডাউনটাই বন্ধ হয়ে যায়। টাইপ করলে সমস্যা হতো না কারণ
  //     সেটা 'click' ইভেন্টই না (keyboard event), এই লিসেনার তখন চলেই না।
  //
  // সমাধান: capture phase (তৃতীয় আর্গুমেন্ট true) ব্যবহার করা — capture
  // ইভেন্টের সবচেয়ে প্রথম ধাপ, document-এ react-এর কোনো bubble-phase
  // onClick চলারও আগে ঘটে। তাই e.target তখনো আসল, এখনো-DOM-এ-থাকা এলিমেন্ট,
  // .contains() চেক সঠিক ফলাফল দেয় — তারপরেই React-এর pickRecentSearch/
  // goToCat ইত্যাদি normal bubble-phase-এ চলে, DOM পাল্টায়, কিন্তু ততক্ষণে
  // আমাদের "ভিতরে না বাইরে" সিদ্ধান্তটা ইতিমধ্যে সঠিকভাবে নেওয়া হয়ে গেছে।
  // ================================================================
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

  // পিছনের স্ক্রল/ক্লিক লক হবে যখন ড্রপডাউনে দেখানোর মতো আসল কিছু থাকে —
  // হয় সত্যিকারের রেজাল্ট (প্রোডাক্ট/ক্যাটাগরি), অথবা ডিফল্ট প্যানেল (সাম্প্রতিক/
  // জনপ্রিয় সার্চ)। আগে শুধু hasResults-এ লক হতো, ডিফল্ট প্যানেলে হতো না —
  // তাই "সব মুছুন" চাপার পর তালিকা re-render হওয়ার সময় সামান্য reflow-scroll
  // হয়ে গেলেই সেটা "ইউজার স্ক্রল করেছে" ধরে নিয়ে পুরো ড্রপডাউন বন্ধ করে দিত।
  // শুধু "কোনো পণ্য পাওয়া যায়নি" খালি স্টেটে লক না করাই ঠিক আছে (দেখানোর
  // মতো তেমন কিছু নেই, স্ক্রল ব্লক করার দরকার নেই)।
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
              <Link
                href="/"
                aria-label="হোম পেইজে যান"
                className="flex shrink-0 items-center gap-1.5 text-brand-light no-underline transition-brand duration-brand hover:text-brand-light-hover"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 11.5 12 4l8 7.5" />
                  <path d="M6.5 10v9a1 1 0 0 0 1 1H10v-5.5h4V20h2.5a1 1 0 0 0 1-1v-9" />
                </svg>
                <span className="font-body text-[15px] font-bold">হোম</span>
              </Link>
            ) : (
              <Link className="flex shrink-0 items-center no-underline" href="/">
                <Image
                  src="/vangcur-logo.png"
                  alt="Vangcur Gadgets"
                  width={900}
                  height={317}
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
                {/* বক্সটা সবসময় position: absolute — কখনো relative-এ টগল হয় না, শুধু
                    left/width অ্যানিমেট হয়, তাই collapse হওয়ার সময় "ছোট হয়ে গিয়ে আবার
                    বড় হওয়া" গ্লিচটা আর হয় না। wrapper-এ এখন এক্সপ্লিসিট height (h-10)
                    দেওয়া হয়েছে — box টা absolute হওয়ায় flow-তে না থাকায় আগে wrapper-এর
                    height 0 হয়ে যাচ্ছিল, ফলে box-এরও height 0 হয়ে যেত (হোভার ডিটেকশন
                    কাজ করত না, আর বক্সটা ভুল জায়গায় দেখাচ্ছিল) — এটাই আসল বাগ ছিল। */}
                <div
                  ref={desktopSearchBoxRef}
                  style={desktopSearchExpanded && desktopSearchGeo ? { left: desktopSearchGeo.left, width: desktopSearchGeo.width } : undefined}
                  className={`absolute left-0 top-0 h-full w-full transition-[left,width] duration-300 ease-out ${desktopSearchExpanded ? 'z-[1000]' : ''}`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <svg className="pointer-events-none absolute left-[13px] top-1/2 -translate-y-1/2 text-brand-light/70" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                    <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
                  </svg>
                  <input
                    type="search"
                    placeholder="প্রোডাক্ট খুঁজুন..."
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
                      title="মুছুন"
                      aria-label="মুছুন"
                    >
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
                    </button>
                  )}
                  {showDropdown && (
                    <SearchDropdown
                      searchQuery={searchQuery}
                      searchResults={searchResults}
                      catResults={catResults}
                      onGoToSrp={goToSrp}
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
                  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
                  </svg>
                  <span className={`absolute right-[3px] top-[3px] h-[15px] w-[15px] items-center justify-center rounded-full bg-brand-light text-[9px] font-bold text-white ${wishCount > 0 ? 'flex animate-badge-hot-glow' : 'hidden'}`}>{wishCount}</span>
                </button>

                <button
                  className="relative flex items-center justify-center rounded-[9px] p-2 max-[400px]:p-1.5 text-ink transition-brand duration-brand hover:bg-surface-muted hover:text-brand-light"
                  ref={cartBtnRef}
                  onClick={onCartClick}
                  title="কার্ট"
                >
                  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                    <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
                    <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
                  </svg>
                  <span className={`absolute right-[3px] top-[3px] h-[15px] w-[15px] items-center justify-center rounded-full bg-brand-light text-[9px] font-bold text-white ${cartCount > 0 ? 'flex animate-badge-hot-glow' : 'hidden'}`}>{cartCount}</span>
                </button>

                {currentUser ? (
                  <button className="flex max-w-[130px] shrink-0 items-center gap-1.5 rounded-full bg-surface-muted px-2.5 py-1.5 font-body text-[13px] font-semibold text-ink transition-brand duration-brand hover:bg-border-base md:max-w-none md:gap-2 md:px-3.5" onClick={onAccountClick}>
                    <div className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full bg-brand-light text-[10px] font-bold text-white">
                      {(currentUser.name || '?').split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)}
                    </div>
                    <span className="truncate">{currentUser.name || 'আমার অ্যাকাউন্ট'}</span>
                  </button>
                ) : (
                  <button className="shrink-0 rounded-full bg-brand-light px-3.5 py-2 font-body text-[13px] font-semibold text-white shadow-sh1 transition-brand duration-brand hover:-translate-y-0.5 hover:bg-brand-light-hover hover:shadow-sh2 max-[400px]:px-2.5 md:px-[18px]" onClick={onLoginClick}>
                    লগইন করুন
                  </button>
                )}

                <button className="flex items-center justify-center rounded-[9px] p-2 max-[400px]:p-1.5 text-ink transition-brand duration-brand hover:bg-surface-muted hover:text-brand-light" onClick={onTrackClick} title="অর্ডার ট্র্যাক করুন">
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

      {/* এই wrapper-এর নিজের কোনো overflow-hidden নেই — শুধু ভিতরের input-bar box-টার
          height animate করার জন্য overflow-hidden ব্যবহার হয়েছে, dropdown সেই box-এর
          বাইরে আলাদা sibling হিসেবে বসানো, তাই clip হয়ে অদৃশ্য হয়ে যায় না। */}
      <div className="relative md:hidden" ref={mobileSearchAreaRef}>
        {/* grid-template-rows (0fr -> 1fr) দিয়ে height animate করা হচ্ছে —
            max-height-এর মতো কোনো আন্দাজের সংখ্যা (যেমন আগে max-h-[480px]) লাগে
            না, তাই ঝাঁকুনি/আটকানো ভাব ছাড়াই আসল কন্টেন্ট height অনুযায়ী মসৃণভাবে
            খোলে-বন্ধ হয়। duration ৩০০ থেকে কমিয়ে ২০০ms করা হয়েছে যাতে দ্রুত,
            snappy মনে হয়। */}
        <div
          className={`grid overflow-hidden transition-[grid-template-rows,opacity] duration-200 ease-out ${mobileSearchOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
        >
          <div className="min-h-0 overflow-hidden">
            <div className="navbar-glass relative z-[900] -mt-px rounded-b-[22px] border border-t-0 border-white/60 bg-white/80 px-5 pb-3 pt-2 shadow-sh2 backdrop-blur-[8px]">
              <div className="relative" onClick={(e) => e.stopPropagation()}>
                <svg className="pointer-events-none absolute left-[13px] top-1/2 -translate-y-1/2 text-brand-light/70" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
                </svg>
                <input
                  type="search"
                  placeholder="প্রোডাক্ট খুঁজুন..."
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
                    title="মুছুন"
                    aria-label="মুছুন"
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
              onGoToSrp={goToSrp}
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
