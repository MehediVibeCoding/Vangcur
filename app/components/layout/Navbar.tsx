'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { CART_ADD_EVENT } from '@/lib/cartData';
import { lockBody, unlockBody } from '@/lib/bodyScrollLock';
import {
  DEFAULT_PRODS, fetchCustomProducts, mergeCustomProducts, productHref,
} from '@/lib/productData';
import { searchProducts, matchCategories as matchCategoriesData } from '@/lib/searchData';
import { DEFAULT_CATEGORIES, fetchCategories, makeCatSlug } from '@/lib/categoryData';
import { getRecentSearches, addRecentSearch, removeRecentSearch, clearRecentSearches } from '@/lib/recentSearches';
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
  const isSvg = typeof icon === 'string' && icon.trim().startsWith('<svg');
  if (isSvg) {
    return (
      <div
        className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-[9px] bg-brand-bg text-brand-primary [&_svg]:!h-[22px] [&_svg]:!w-[22px]"
        dangerouslySetInnerHTML={{ __html: icon }}
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
    <>{truncBefore}<span className="bg-brand-accent/20 text-brand-primary">{match}</span>{truncAfter}</>
  );
}

const searchInputClass = 'w-full rounded-full border-[1.5px] border-brand-primary/20 bg-brand-bg/25 py-[9px] pl-10 pr-3.5 font-body text-base text-ink transition-brand duration-brand placeholder:text-muted focus:border-brand-primary/60 focus:bg-white focus:outline-none';
const desktopSearchInputClass = 'w-full cursor-text rounded-full border-[1.5px] border-brand-primary/20 bg-brand-bg/25 py-[9px] pl-10 pr-3.5 font-body text-[13px] text-ink transition-brand duration-brand placeholder:text-muted focus:border-brand-primary/60 focus:bg-white focus:shadow-[0_0_0_3px_rgba(0,88,199,.12)] focus:outline-none';

// সার্চ বক্সে ক্লিক/ফোকাস করার সাথে সাথেই (কিছু না লিখেও) এই প্যানেলটা দেখানো
// হয় — আগে খালি বক্সে ক্লিক করলে কিছুই দেখাত না। সাম্প্রতিক অনুসন্ধান আর
// জনপ্রিয় কয়েকটা ক্যাটাগরি একসাথে দেখিয়ে ইউজারকে দ্রুত শুরু করার সুযোগ দেয়।
function SearchDefaultPanel({
  recentSearches, popularCategories, onPickRecent, onRemoveRecent, onClearRecent, onGoToCat,
}: {
  recentSearches: string[];
  popularCategories: Category[];
  onPickRecent: (term: string) => void;
  onRemoveRecent: (term: string) => void;
  onClearRecent: () => void;
  onGoToCat: (id: string) => void;
}) {
  return (
    <div className="py-1.5">
      {recentSearches.length > 0 && (
        <>
          <div className="flex items-center justify-between px-3.5 pb-1.5 pt-1.5 text-[10.5px] font-bold uppercase tracking-[.5px] text-muted">
            <span>সাম্প্রতিক অনুসন্ধান</span>
            <a className="cursor-pointer text-[11px] font-semibold text-brand-primary hover:underline" onClick={(e) => { e.stopPropagation(); onClearRecent(); }}>সব মুছুন</a>
          </div>
          <div className="flex flex-wrap gap-2 px-3.5 pb-2.5">
            {recentSearches.map((term) => (
              <span
                key={term}
                className="flex items-center gap-1.5 rounded-full bg-surface-muted py-1.5 pl-3.5 pr-2 text-[12.5px] font-medium text-ink transition-brand duration-brand hover:bg-border-base"
              >
                <button type="button" className="cursor-pointer" onClick={() => onPickRecent(term)}>{term}</button>
                <button
                  type="button"
                  className="flex h-[16px] w-[16px] shrink-0 items-center justify-center rounded-full text-muted hover:bg-white hover:text-brand-primary"
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
      )}
      {popularCategories.length > 0 && (
        <>
          <div className="flex items-center justify-between px-3.5 pb-2 pt-1.5 text-[10.5px] font-bold uppercase tracking-[.5px] text-muted">
            <span>জনপ্রিয় ক্যাটাগরি</span>
            <a className="cursor-pointer text-[11px] font-semibold text-brand-primary hover:underline" onClick={() => onGoToCat('all')}>সব দেখুন →</a>
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
  isDefaultView = false, recentSearches = [], popularCategories = [], onPickRecent, onRemoveRecent, onClearRecent,
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
  popularCategories?: Category[];
  onPickRecent?: (term: string) => void;
  onRemoveRecent?: (term: string) => void;
  onClearRecent?: () => void;
}) {
  const catName = (catId: string) => (catResults.find((c) => c.id === catId) || {}).name || catId;
  return (
    <div
      className={`${positioned ? `absolute z-[1100] ${wide ? '-left-5 -right-5' : 'left-0 right-0'}` : 'relative z-[1100] w-full'} ${tall ? 'max-h-[55vh]' : 'max-h-[420px]'} overflow-y-auto overflow-hidden rounded-[14px] border border-white/60 bg-white/95 shadow-sh3 backdrop-blur-md`}
      style={positioned ? { top: 'calc(100% + 14px)' } : undefined}
    >
      {isDefaultView ? (
        <SearchDefaultPanel
          recentSearches={recentSearches}
          popularCategories={popularCategories}
          onPickRecent={(term) => onPickRecent?.(term)}
          onRemoveRecent={(term) => onRemoveRecent?.(term)}
          onClearRecent={() => onClearRecent?.()}
          onGoToCat={onGoToCat}
        />
      ) : searchResults.length === 0 ? (
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
              className="w-full rounded-lg bg-brand-primary py-2 text-[12.5px] font-semibold text-white transition-brand duration-brand hover:bg-brand-accent"
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
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [desktopSearchHovered, setDesktopSearchHovered] = useState(false);
  const [desktopSearchFocused, setDesktopSearchFocused] = useState(false);
  const [desktopSearchGeo, setDesktopSearchGeo] = useState<{ left: number; width: number } | null>(null);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const desktopNavRowRef = useRef<HTMLDivElement>(null);
  const desktopSearchWrapRef = useRef<HTMLDivElement>(null);
  const desktopSearchBoxRef = useRef<HTMLDivElement>(null);
  const mobileSearchAreaRef = useRef<HTMLDivElement>(null);
  const cartBtnRef = useRef<HTMLButtonElement>(null);
  const mobileSearchInputRef = useRef<HTMLInputElement>(null);
  const prodsRef = useRef<Product[]>(DEFAULT_PRODS);
  const catsRef = useRef<Category[]>(DEFAULT_CATEGORIES);
  const router = useRouter();
  const hasResults = searchResults.length > 0 || catResults.length > 0;
  const desktopSearchExpanded = desktopSearchHovered || desktopSearchFocused;
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
    setRecentSearches(getRecentSearches());
  }, []);

  useEffect(() => {
    // সার্চ বক্স খোলার সাথে সাথেই (কিছু না লিখেও) ডিফল্ট প্যানেল (সাম্প্রতিক
    // অনুসন্ধান + জনপ্রিয় ক্যাটাগরি) দেখানো হয় — আগে খালি বক্সে কিছুই আসত না।
    if (mobileSearchOpen) {
      mobileSearchInputRef.current?.focus();
      setShowDropdown(true);
    }
  }, [mobileSearchOpen]);

  // মোবাইল সার্চ খোলা কিন্তু হয় কোনো ড্রপডাউনই আসেনি, অথবা এসেছে কিন্তু কোনো
  // পণ্য পাওয়া যায়নি (দুটো ক্ষেত্রেই পিছনের পেজ আনলকড/স্ক্রলযোগ্য) — এই অবস্থায়
  // ৭ সেকেন্ড নিষ্ক্রিয় থাকলে অটোমেটিক বন্ধ হয়ে যাবে। স্ক্রল করলে সাথে সাথে বন্ধ হবে।
  //
  // mobile keyboard খোলার সময় ব্রাউজার নিজে থেকেই ফোকাসড ইনপুটটাকে কিবোর্ডের
  // উপরে দেখানোর জন্য পেজ auto-scroll করে (বিশেষ করে ফুটারের মতো নিচের দিকে
  // স্ক্রল করা অবস্থায় সার্চ আইকনে ট্যাপ করলে এই auto-scroll-এর পরিমাণ বেশি
  // হয়)। আগে এই ব্রাউজার-চালিত auto-scroll-কেই ভুল করে "ইউজার নিজে স্ক্রল
  // করেছে" ধরে নিয়ে সাথে সাথে সার্চ বক্স/ড্রপডাউন বন্ধ করে দেওয়া হতো — এতেই
  // মনে হতো টাইপ করার সাথে সাথে সবকিছু "গায়েব" হয়ে যাচ্ছে। এখন প্রথম ৫০০ms
  // "arm" হওয়ার আগ পর্যন্ত স্ক্রল-ক্লোজ উপেক্ষা করা হচ্ছে, যাতে কিবোর্ড খোলার
  // সময়কার এই স্বয়ংক্রিয় অ্যাডজাস্টমেন্ট শেষ হওয়ার সুযোগ পায়।
  useEffect(() => {
    if (!mobileSearchOpen) return undefined;
    const idle = !showDropdown || !hasResults;
    const startY = window.scrollY;
    let armed = false;
    const armTimer = setTimeout(() => { armed = true; }, 500);
    const idleTimer = idle ? setTimeout(() => { setMobileSearchOpen(false); setShowDropdown(false); }, 7000) : null;
    const onScroll = () => {
      if (armed && idle && Math.abs(window.scrollY - startY) > 15) {
        setMobileSearchOpen(false);
        setShowDropdown(false);
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      clearTimeout(armTimer);
      if (idleTimer) clearTimeout(idleTimer);
      window.removeEventListener('scroll', onScroll);
    };
  }, [mobileSearchOpen, showDropdown, hasResults]);

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

  // ডেক্সটপ সার্চ বক্সের এক্সপ্যান্ডেড (hover/focus) অবস্থার জন্য left/width হিসাব করা হয়
  // এখানে, একবারই (মাউন্ট + রিসাইজে) — hover state-এর উপর নির্ভর করে না। বক্সটা সবসময়
  // position: absolute থাকে (কখনো relative <-> absolute টগল হয় না), শুধু এই left/width
  // ভ্যালু দুটো animate হয় — এতে করে আগে যে "ছোট হয়ে গিয়ে আবার বড় হওয়া" গ্লিচ হতো
  // (position টাইপ পরিবর্তনের কারণে) সেটা আর হবে না।
  useEffect(() => {
    let raf = 0;
    function measure() {
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

  // ডেক্সটপ সার্চ বক্স ছোট (collapsed — hover/focus কোনোটাই না) অবস্থায় যদি ভিতরে
  // এখনো আগের কোনো টেক্সট থেকে যায় (ইউজার নিজে ক্লিয়ার করেনি, বাইরে ক্লিক করে
  // ড্রপডাউন শুধু বন্ধ হয়েছিল), তাহলে ৭ সেকেন্ড নিষ্ক্রিয় থাকলে অটোমেটিক ক্লিয়ার
  // হয়ে বক্সটা তার ডিফল্ট ("প্রোডাক্ট খুঁজুন" আইকন) অবস্থায় ফিরে যাবে। আবার বক্সে
  // hover/focus করলে টাইমার বাতিল হয়ে যায় (dependency-তে desktopSearchExpanded আছে)।
  useEffect(() => {
    if (desktopSearchExpanded || !searchQuery) return undefined;
    const t = setTimeout(() => {
      setSearchQuery('');
      setSearchResults([]);
      setCatResults([]);
      setShowDropdown(false);
    }, 7000);
    return () => clearTimeout(t);
  }, [desktopSearchExpanded, searchQuery]);

  const handleSearchInput = useCallback((value: string) => {
    setSearchQuery(value);
    if (!value.trim()) {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
      setSearchResults([]);
      setCatResults([]);
      // টেক্সট মুছে খালি করে দিলেও (যেমন ব্যাকস্পেস দিয়ে) বক্সটা তখনো ফোকাসড
      // থাকে, তাই ড্রপডাউন পুরো বন্ধ না করে ডিফল্ট প্যানেল (সাম্প্রতিক অনুসন্ধান
      // + জনপ্রিয় ক্যাটাগরি) দেখানো হয়।
      setShowDropdown(true);
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
    handleSearchInput(term);
  };

  const removeRecentSearchTerm = (term: string) => {
    setRecentSearches(removeRecentSearch(term));
  };

  const clearAllRecentSearches = () => {
    clearRecentSearches();
    setRecentSearches([]);
  };

  // stopPropagation()-নির্ভর পুরনো পদ্ধতির বদলে এখন সরাসরি DOM containment চেক
  // করা হচ্ছে — সার্চ বক্স/ড্রপডাউনের ভিতরে ক্লিক হলে (এমনকি আগে থেকেই টেক্সট
  // থাকা অবস্থায় বক্সে আবার ক্লিক করলেও) ড্রপডাউন বন্ধ হবে না, শুধু সত্যিকারের
  // বাইরের ক্লিকেই বন্ধ হবে।
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      const insideDesktop = !!desktopSearchWrapRef.current?.contains(target);
      const insideMobile = !!mobileSearchAreaRef.current?.contains(target);
      if (!insideDesktop && !insideMobile) setShowDropdown(false);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // পিছনের স্ক্রল/ক্লিক শুধু তখনই লক হবে যখন ড্রপডাউনে সত্যিকারের রেজাল্ট (প্রোডাক্ট বা
  // ক্যাটাগরি) দেখানো হচ্ছে। কোনো পণ্য না পাওয়া গেলে (empty state) লক থাকবে না —
  // ইউজার তখন পিছনের পেজ স্বাভাবিকভাবে স্ক্রল করতে পারবে।
  useEffect(() => {
    if (!showDropdown || !hasResults) return;
    lockBody();
    return () => unlockBody();
  }, [showDropdown, hasResults]);

  return (
    <div className="sticky top-[14px] z-[900] mx-2 mb-1.5 mt-[14px] max-[400px]:mx-1.5 sm:mx-3">
      {showDropdown && (
        <div
          className="fixed inset-0 z-[850]"
          onClick={() => setShowDropdown(false)}
        />
      )}
      <nav
        className={`navbar-glass relative z-[900] border border-white/60 bg-white/70 shadow-sh2 backdrop-blur-md ${mobileSearchOpen ? 'rounded-t-[35px] rounded-b-none border-b-0 md:rounded-[35px] md:border-b' : 'rounded-[35px]'}`}
      >
        <div ref={desktopNavRowRef} className="relative mx-auto flex h-[62px] max-w-[1300px] items-center gap-[14px] px-3 max-[400px]:gap-2 sm:px-5 2xl:max-w-[1560px]">
          <div className="flex w-full items-center justify-between gap-2 max-[400px]:gap-1.5 sm:gap-3">
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
                  <svg className="pointer-events-none absolute left-[13px] top-1/2 -translate-y-1/2 text-brand-primary/70" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
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
                      onClick={() => { setSearchQuery(''); setSearchResults([]); setCatResults([]); setShowDropdown(false); }}
                      className="absolute right-2.5 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full bg-brand-bg text-brand-primary transition-brand duration-brand hover:bg-brand-primary hover:text-white"
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
                      popularCategories={popularCategories}
                      onPickRecent={pickRecentSearch}
                      onRemoveRecent={removeRecentSearchTerm}
                      onClearRecent={clearAllRecentSearches}
                    />
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button className="relative flex items-center justify-center rounded-[9px] p-2 max-[400px]:p-1.5 text-ink transition-brand duration-brand hover:bg-surface-muted hover:text-brand-primary" onClick={onWishClick} title="Wishlist">
                  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
                  </svg>
                  <span className={`absolute right-[3px] top-[3px] h-[15px] w-[15px] items-center justify-center rounded-full bg-brand-primary text-[9px] font-bold text-white ${wishCount > 0 ? 'flex animate-badge-hot-glow' : 'hidden'}`}>{wishCount}</span>
                </button>

                <button
                  className="relative flex items-center justify-center rounded-[9px] p-2 max-[400px]:p-1.5 text-ink transition-brand duration-brand hover:bg-surface-muted hover:text-brand-primary"
                  ref={cartBtnRef}
                  onClick={onCartClick}
                  title="কার্ট"
                >
                  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                    <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
                    <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
                  </svg>
                  <span className={`absolute right-[3px] top-[3px] h-[15px] w-[15px] items-center justify-center rounded-full bg-brand-primary text-[9px] font-bold text-white ${cartCount > 0 ? 'flex animate-badge-hot-glow' : 'hidden'}`}>{cartCount}</span>
                </button>

                {currentUser ? (
                  <button className="flex max-w-[130px] shrink-0 items-center gap-1.5 rounded-full bg-surface-muted px-2.5 py-1.5 font-body text-[13px] font-semibold text-ink transition-brand duration-brand hover:bg-border-base md:max-w-none md:gap-2 md:px-3.5" onClick={onAccountClick}>
                    <div className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full bg-brand-primary text-[10px] font-bold text-white">
                      {(currentUser.name || '?').split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)}
                    </div>
                    <span className="truncate">{currentUser.name || 'আমার অ্যাকাউন্ট'}</span>
                  </button>
                ) : (
                  <button className="shrink-0 rounded-full bg-brand-primary px-3.5 py-2 font-body text-[13px] font-semibold text-white shadow-sh1 transition-brand duration-brand hover:-translate-y-0.5 hover:bg-brand-accent hover:shadow-sh2 max-[400px]:px-2.5 md:px-[18px]" onClick={onLoginClick}>
                    লগইন করুন
                  </button>
                )}

                <button className="flex items-center justify-center rounded-[9px] p-2 max-[400px]:p-1.5 text-ink transition-brand duration-brand hover:bg-surface-muted hover:text-brand-primary" onClick={onTrackClick} title="অর্ডার ট্র্যাক করুন">
                  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path d="M9 17H7A5 5 0 017 7h2" /><path d="M15 7h2a5 5 0 010 10h-2" />
                    <line x1="8" y1="12" x2="16" y2="12" />
                  </svg>
                </button>

                <button className="flex items-center justify-center rounded-[9px] p-2 max-[400px]:p-1.5 text-ink transition-brand duration-brand hover:bg-surface-muted hover:text-brand-primary md:hidden" onClick={() => setMobileSearchOpen((v) => !v)} title="Search">
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
        <div
          className={`overflow-hidden transition-[max-height,opacity] duration-300 ease-in-out ${mobileSearchOpen ? 'max-h-[480px] opacity-100' : 'max-h-0 opacity-0'}`}
        >
          <div className="navbar-glass relative z-[900] -mt-px rounded-b-[22px] border border-t-0 border-white/60 bg-white/70 px-5 pb-3 pt-2 shadow-sh2 backdrop-blur-md">
            <div className="relative" onClick={(e) => e.stopPropagation()}>
              <svg className="pointer-events-none absolute left-[13px] top-1/2 -translate-y-1/2 text-brand-primary/70" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
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
                  className="absolute right-2.5 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full bg-brand-bg text-brand-primary transition-brand duration-brand hover:bg-brand-primary hover:text-white"
                  onClick={() => { setSearchQuery(''); setSearchResults([]); setCatResults([]); setShowDropdown(false); }}
                  title="মুছুন"
                  aria-label="মুছুন"
                >
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
                </button>
              )}
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
