'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import Footer from '@/app/components/layout/Footer';
import ProductCard from '@/app/components/home/ProductCard';
import { searchProducts, matchCategories } from '@/lib/searchData';
import { subscribeCustomProducts } from '@/lib/productData';
import { DEFAULT_CATEGORIES, fetchCategories } from '@/lib/categoryData';
import { sanitizeSvgHtml } from '@/lib/sanitize';
import { showToast } from '@/lib/toast';
import { useT } from '@/lib/i18n/useT';
import type { Category, Product } from '@/types';

const PRODS_PER_PAGE = 20;
const PRODS_AUTO_THRESHOLD = 2;
const MAX_SEARCH_LEN = 60;

function SearchHeader({ query, onQueryChange }: { query: string; onQueryChange: (v: string) => void }) {
  const { t, lang } = useT();
  const [value, setValue] = useState(query);
  const lastLimitToastRef = useRef(0);

  useEffect(() => { setValue(query); }, [query]);

  const handleChange = (rawVal: string) => {
    if (rawVal.length >= MAX_SEARCH_LEN) {
      const now = Date.now();
      if (now - lastLimitToastRef.current > 2200) {
        lastLimitToastRef.current = now;
        showToast(
          lang === 'en'
            ? 'Search limit reached (maximum 60 characters)'
            : 'সার্চের সর্বোচ্চ সীমা ৬০ অক্ষরে পৌঁছে গেছে',
          'error'
        );
      }
    }
    const clean = rawVal.replace(/[<>`]/g, '').slice(0, MAX_SEARCH_LEN);
    setValue(clean);
    onQueryChange(clean);
  };

  return (
    <div className="sticky top-[14px] z-[900] mx-2 mb-1.5 mt-[14px] max-[400px]:mx-1.5 sm:mx-3">
      <nav className="navbar-glass relative z-[900] rounded-[35px] border border-white/60 bg-white/80 shadow-sh2 backdrop-blur-[8px]">
        <div className="mx-auto flex h-[62px] max-w-[1300px] items-center gap-2.5 px-3 sm:gap-3 sm:px-5">
          <Link
            href="/"
            aria-label={t('হোম পেইজে যান')}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-bg text-brand-light shadow-sm transition-colors duration-brand hover:bg-brand-light hover:text-white"
          >
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 11.5 12 4l8 7.5" />
              <path d="M6.5 10v9a1 1 0 0 0 1 1H10v-5.5h4V20h2.5a1 1 0 0 0 1-1v-9" />
            </svg>
          </Link>

          <div className="relative flex-1">
            <svg className="pointer-events-none absolute left-[15px] top-1/2 -translate-y-1/2 text-brand-light/70" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              type="search"
              maxLength={MAX_SEARCH_LEN}
              value={value}
              placeholder={t('পুনরায় সার্চ করুন...')}
              onChange={(e) => handleChange(e.target.value)}
              autoComplete="off"
              style={{ outline: 'none', WebkitAppearance: 'none' }}
              className={`h-11 w-full rounded-full border border-border-base bg-white text-[14px] font-medium text-ink outline-none focus:outline-none focus:ring-0 focus-visible:outline-none transition-colors duration-200 focus:border-brand-light pl-10 ${value ? 'pr-9' : 'pr-4'}`}
            />
            {value && (
              <button
                type="button"
                onClick={() => { setValue(''); onQueryChange(''); }}
                aria-label={t('মুছুন')}
                className="absolute right-2.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-brand-bg text-brand-light transition-colors duration-brand hover:bg-brand-light hover:text-white"
              >
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
              </button>
            )}
          </div>
        </div>
      </nav>
    </div>
  );
}

function SearchGlyph() {
  return (
    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-brand-bg/50 to-surface-muted text-brand-light/60">
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
      </svg>
    </div>
  );
}

function ArrowRightIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4.5 12h15M13 5.5 20 12l-7 6.5" />
    </svg>
  );
}

const brandCtaBtnClass = 'inline-flex items-center gap-2 rounded-full border-none bg-gradient-to-r from-info to-brand-light px-7 py-3 font-body text-sm font-bold text-white no-underline shadow-sh2 transition-colors duration-brand hover:brightness-[1.03]';

function CategoryIcon({ icon }: { icon?: string }) {
  const isSvg = typeof icon === 'string' && icon.trim().startsWith('<svg');
  if (isSvg) {
    return (
      <span
        className="flex h-5 w-5 shrink-0 items-center justify-center text-brand-light [&_svg]:!h-5 [&_svg]:!w-5"
        dangerouslySetInnerHTML={{ __html: sanitizeSvgHtml(icon) }}
      />
    );
  }
  return <span className="text-base leading-none">{icon || '📂'}</span>;
}

function NoQueryState() {
  const { t } = useT();
  return (
    <div className="flex flex-col items-center gap-3 px-5 py-20 text-center">
      <SearchGlyph />
      <p className="text-[15px] font-bold text-ink">{t('কিছু লিখে সার্চ করুন')}</p>
      <div className="my-1 flex w-full max-w-xs items-center gap-3 text-[12px] text-muted">
        <span className="h-px flex-1 bg-border-base" />
        {t('অথবা')}
        <span className="h-px flex-1 bg-border-base" />
      </div>
      <Link href="/" className={brandCtaBtnClass}>
        {t('ওয়েবসাইটের হোম পেইজে ফিরে যান')} <ArrowRightIcon />
      </Link>
    </div>
  );
}

function ZeroResultsState({ query }: { query: string }) {
  const { t, lang } = useT();
  return (
    <div className="flex flex-col items-center gap-3 px-5 py-16 text-center">
      <SearchGlyph />
      <p className="text-[15px] font-bold text-ink">
        {lang === 'en' ? <>No products found for &quot;{query}&quot;</> : <>&quot;{query}&quot; এর জন্য কোনো পণ্য পাওয়া যায়নি</>}
      </p>
      <p className="max-w-sm text-[13px] text-muted">{t('অন্য কোনো নাম দিয়ে উপরের সার্চ বক্সে খুঁজে দেখুন, অথবা নিচের বাটনে ক্লিক করে ওয়েবসাইটের হোম পেইজে ফিরে যান।')}</p>
      <Link href="/" className={`mt-1 ${brandCtaBtnClass}`}>
        {t('ওয়েবসাইটের হোম পেইজে ফিরে যান')} <ArrowRightIcon />
      </Link>
    </div>
  );
}

function EndOfResults() {
  const { t } = useT();
  return (
    <div className="col-span-full flex flex-col items-center gap-3.5 px-4 pb-2 pt-7 text-center">
      <p className="font-body text-[13.5px] font-medium text-muted">{t('আর কোনো প্রোডাক্ট নেই')}</p>
      <Link href="/" className={brandCtaBtnClass}>
        {t('ওয়েবসাইটের হোম পেইজে ফিরে যান')} <ArrowRightIcon />
      </Link>
    </div>
  );
}

interface SearchClientProps {
  initialProducts: Product[];
}

export default function SearchClient({ initialProducts }: SearchClientProps) {
  const { t, lang } = useT();
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = (searchParams.get('q') || '').trim();

  const supabase = useRef(createClient()).current;
  const [prods, setProds] = useState<Product[]>(initialProducts);
  const [cats, setCats] = useState<Category[]>(DEFAULT_CATEGORIES);

  useEffect(() => {
    fetchCategories(supabase).then((c) => { if (c.length) setCats(c); });
  }, [supabase]);

  useEffect(() => {
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

    return () => { supabase.removeChannel(channel); };
  }, [supabase]);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleQueryChange = useCallback((value: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const clean = value.replace(/[<>`]/g, '').trim().slice(0, MAX_SEARCH_LEN);
      const url = clean ? `/search?q=${encodeURIComponent(clean)}` : '/search';
      router.replace(url, { scroll: false });
    }, 300);
  }, [router]);

  const goToHomeCategory = useCallback((catId: string) => {
    router.push(`/?cat=${encodeURIComponent(catId)}`);
  }, [router]);

  const matchedCats = useMemo(() => matchCategories(cats, query, 8), [cats, query]);
  const hasCategoryMatch = matchedCats.length > 0;

  const results = useMemo(() => searchProducts(prods, query), [prods, query]);

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
  const isDone = renderedCount >= results.length;

  const showCategorySection = hasCategoryMatch;
  const showCountLine = hasCategoryMatch || results.length > 0;

  return (
    <>
      <SearchHeader query={query} onQueryChange={handleQueryChange} />

      <div className="mx-auto mb-11 mt-3 min-h-[40vh] max-w-[1300px] px-5">
        {!hasQuery ? (
          <NoQueryState />
        ) : (
          <>
            {showCategorySection && (
              <div className="mb-4">
                <h2 className="mb-2.5 text-[13px] font-bold text-ink">{t('ক্যাটাগরি')}</h2>
                <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
                  {matchedCats.map((c) => (
                    <button
                      type="button"
                      key={c.id}
                      onClick={() => goToHomeCategory(c.id)}
                      className="flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full border border-border-base bg-white px-4 py-2.5 text-[13px] font-semibold text-ink transition-colors duration-brand hover:border-brand-light hover:bg-brand-bg hover:text-brand-light"
                    >
                      <CategoryIcon icon={c.icon} />
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {showCountLine && (
              <p className="mb-4 text-[13px] text-muted">{lang === 'en' ? `${results.length} products found` : `${results.length}টি পণ্য পাওয়া গেছে`}</p>
            )}

            {results.length === 0 ? (
              <ZeroResultsState query={query} />
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
                  {visibleItems.map((p, i) => (
                    <ProductCard key={p.id} prod={p} isFirst={i === 0} />
                  ))}
                  {isDone && !showSpinner && !showLoadMoreBtn && <EndOfResults />}
                </div>
                <div className="mt-2.5 flex h-[60px] items-center justify-center" ref={sentinelRef}>
                  {showSpinner && (
                    <div className="flex items-center gap-2 text-[13px] text-muted">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin">
                        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                      </svg>
                      {t('লোড হচ্ছে...')}
                    </div>
                  )}
                  {showLoadMoreBtn && (
                    <button
                      onClick={handleLoadMoreClick}
                      className="inline-flex items-center gap-2 rounded-full border-none bg-gradient-to-r from-info to-brand-light px-8 py-[13px] font-body text-sm font-bold text-white shadow-sh2 transition-colors duration-brand hover:brightness-[1.03]"
                    >
                      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><path d="M12 5v14M5 12l7 7 7-7" /></svg>
                      {t('আরো প্রোডাক্ট দেখুন')}
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
