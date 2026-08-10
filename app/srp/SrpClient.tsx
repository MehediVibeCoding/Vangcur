'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import Footer from '@/app/components/layout/Footer';
import ProductCard from '@/app/components/home/ProductCard';
import { searchProducts, matchCategories } from '@/lib/searchData';
import {
  DEFAULT_PRODS, fetchCustomProducts, mergeCustomProducts, subscribeCustomProducts,
} from '@/lib/productData';
import { DEFAULT_CATEGORIES, fetchCategories } from '@/lib/categoryData';
import { sanitizeSvgHtml } from '@/lib/sanitize';
import type { Category, Product } from '@/types';

const PRODS_PER_PAGE = 20;
const PRODS_AUTO_THRESHOLD = 2;

// ---------- সরলীকৃত SRP-হেডার: শুধু হোম বাটন + সার্চ বক্স ----------
// (হোমপেজের পুরো Navbar-এর একই sticky/glass/rounded-pill চেহারা ধরে রাখা
// হয়েছে — শুধু ভিতরের আইটেম কমিয়ে হোম বাটন আর সার্চ বক্সে নামিয়ে আনা হয়েছে,
// আগের ওয়েবসাইটের মতো।)
function SrpHeader({ query, onQueryChange }: { query: string; onQueryChange: (v: string) => void }) {
  const [value, setValue] = useState(query);

  useEffect(() => { setValue(query); }, [query]);

  return (
    <div className="sticky top-[14px] z-[900] mx-2 mb-1.5 mt-[14px] max-[400px]:mx-1.5 sm:mx-3">
      <nav className="navbar-glass relative z-[900] rounded-[35px] border border-white/60 bg-white/70 shadow-sh2 backdrop-blur-md">
        <div className="mx-auto flex h-[62px] max-w-[1300px] items-center gap-2.5 px-3 sm:gap-3 sm:px-5">
          <Link
            href="/"
            aria-label="হোম পেইজে যান"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-ink shadow-sm transition-brand duration-brand hover:bg-brand-bg hover:text-brand-primary"
          >
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 11.5 12 4l8 7.5" />
              <path d="M6.5 10v9a1 1 0 0 0 1 1H10v-5.5h4V20h2.5a1 1 0 0 0 1-1v-9" />
            </svg>
          </Link>

          <div className="relative flex-1">
            <svg className="pointer-events-none absolute left-[15px] top-1/2 -translate-y-1/2 text-brand-primary/70" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              type="search"
              value={value}
              placeholder="পুনরায় সার্চ করুন..."
              onChange={(e) => { setValue(e.target.value); onQueryChange(e.target.value); }}
              autoComplete="off"
              className={`h-11 w-full rounded-full border border-border-base bg-white text-[14px] font-medium text-ink outline-none transition-brand duration-brand focus:border-brand-primary pl-10 ${value ? 'pr-9' : 'pr-4'}`}
            />
            {value && (
              <button
                type="button"
                onClick={() => { setValue(''); onQueryChange(''); }}
                aria-label="মুছুন"
                className="absolute right-2.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-surface-muted text-muted hover:bg-border-base"
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
              </button>
            )}
          </div>
        </div>
      </nav>
    </div>
  );
}

function CategoryIcon({ icon }: { icon?: string }) {
  const isSvg = typeof icon === 'string' && icon.trim().startsWith('<svg');
  if (isSvg) {
    return (
      <span
        className="flex h-5 w-5 shrink-0 items-center justify-center text-brand-primary [&_svg]:!h-5 [&_svg]:!w-5"
        dangerouslySetInnerHTML={{ __html: sanitizeSvgHtml(icon) }}
      />
    );
  }
  return <span className="text-base leading-none">{icon || '📂'}</span>;
}

// ---------- সার্চ কোয়েরির সাথে কোনো ক্যাটাগরি না মিললে (খুব ছোট কোয়েরি,
// বাংলা কোয়েরি ইত্যাদি) পুরো সেকশন খালি না দেখিয়ে জনপ্রিয় কয়েকটা ক্যাটাগরি
// ফলব্যাক হিসেবে দেখানো হয় — আগের ওয়েবসাইটেও ক্যাটাগরি অংশ কখনো খালি থাকত না। ----------
function relatedCategories(cats: Category[], query: string): Category[] {
  const matched = matchCategories(cats, query, 8);
  if (matched.length) return matched;
  return cats.filter((c) => c.id !== 'all').slice(0, 8);
}

function NoQueryState() {
  return (
    <div className="flex flex-col items-center gap-3 px-5 py-20 text-center">
      <div className="text-5xl">🔍</div>
      <p className="text-[15px] font-bold text-ink">কিছু লিখে সার্চ করুন</p>
      <div className="my-1 flex w-full max-w-xs items-center gap-3 text-[12px] text-muted">
        <span className="h-px flex-1 bg-border-base" />
        অথবা
        <span className="h-px flex-1 bg-border-base" />
      </div>
      <Link
        href="/"
        className="inline-flex items-center gap-2 rounded-xl border-none bg-ink px-7 py-[13px] font-body text-sm font-bold text-white no-underline shadow-[0_4px_16px_rgba(0,0,0,.13)]"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 11.5 12 4l8 7.5" />
          <path d="M6.5 10v9a1 1 0 0 0 1 1H10v-5.5h4V20h2.5a1 1 0 0 0 1-1v-9" />
        </svg>
        ওয়েবসাইটের হোম পেইজে ফিরে যান
      </Link>
    </div>
  );
}

function ZeroResultsState({ query }: { query: string }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-[18px] bg-white px-5 py-14 text-center shadow-[0_4px_14px_rgba(0,88,199,.08)]">
      <div className="text-5xl">🔍</div>
      <p className="text-[15px] font-bold text-ink">&quot;{query}&quot; এর জন্য কোনো পণ্য পাওয়া যায়নি</p>
      <p className="max-w-sm text-[13px] text-muted">অন্য কোনো নাম দিয়ে উপরের সার্চ বক্সে খুঁজে দেখুন, অথবা নিচের বাটনে ক্লিক করে সব প্রোডাক্ট দেখুন।</p>
      <Link
        href="/"
        className="mt-1 inline-flex items-center gap-2 rounded-xl border-none bg-ink px-7 py-[13px] font-body text-sm font-bold text-white no-underline shadow-[0_4px_16px_rgba(0,0,0,.13)]"
      >
        সব প্রোডাক্ট দেখুন
      </Link>
    </div>
  );
}

export default function SrpClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = (searchParams.get('q') || '').trim();

  const supabase = useRef(createClient()).current;
  const [prods, setProds] = useState<Product[]>(DEFAULT_PRODS);
  const [cats, setCats] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [activeCat, setActiveCat] = useState<string | null>(null);

  useEffect(() => {
    fetchCategories(supabase).then((c) => { if (c.length) setCats(c); });
  }, [supabase]);

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

  // হেডারের সার্চ বক্সে টাইপ করার সাথে সাথে (debounce দিয়ে) URL-এর ?q= আপডেট
  // হয় — router.replace + scroll:false, তাই প্রতিটা অক্ষরে পেজ লাফিয়ে উপরে
  // উঠে যায় না, আর history-তেও প্রতিটা কি-স্ট্রোক জমা হয় না।
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleQueryChange = useCallback((value: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setActiveCat(null);
      const url = value.trim() ? `/srp?q=${encodeURIComponent(value.trim())}` : '/srp';
      router.replace(url, { scroll: false });
    }, 300);
  }, [router]);

  const cats5 = useMemo(() => relatedCategories(cats, query), [cats, query]);

  const results = useMemo(() => {
    const matched = searchProducts(prods, query);
    if (!activeCat) return matched;
    return matched.filter((p) => p.cat === activeCat || p.cats?.includes(activeCat));
  }, [prods, query, activeCat]);

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
      <SrpHeader query={query} onQueryChange={handleQueryChange} />

      <div className="mx-auto mb-11 mt-3 min-h-[40vh] max-w-[1300px] px-5">
        {!hasQuery ? (
          <NoQueryState />
        ) : (
          <>
            <div className="mb-4">
              <h2 className="mb-2.5 text-[13px] font-bold text-ink">ক্যাটাগরি</h2>
              <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {cats5.map((c) => {
                  const active = activeCat === c.id;
                  return (
                    <button
                      type="button"
                      key={c.id}
                      onClick={() => setActiveCat((prev) => (prev === c.id ? null : c.id))}
                      className={`flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full border px-4 py-2.5 text-[13px] font-semibold transition-brand duration-brand ${
                        active
                          ? 'border-brand-primary bg-brand-primary text-white'
                          : 'border-border-base bg-white text-ink hover:bg-surface-muted'
                      }`}
                    >
                      <CategoryIcon icon={c.icon} />
                      {c.name}
                    </button>
                  );
                })}
              </div>
            </div>

            <p className="mb-4 text-[13px] text-muted">{results.length}টি পণ্য পাওয়া গেছে</p>

            {results.length === 0 ? (
              <ZeroResultsState query={query} />
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
          </>
        )}
      </div>

      <Footer />
    </>
  );
}
