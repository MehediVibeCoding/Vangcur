'use client';

import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  CATEGORY_FILTER_EVENT, makeCatSlug, DEFAULT_CATEGORIES,
} from '@/lib/categoryData';
import { prodInCat } from '@/lib/productData';
import { useT } from '@/lib/i18n/useT';
import type { Category, Product } from '@/types';
import ProductCard from './ProductCard';

const PRODS_PER_PAGE = 20;
const PRODS_AUTO_THRESHOLD = 2;

function EmptyBoxIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 8.5 12 4l9 4.5-9 4.5-9-4.5Z" />
      <path d="M3 8.5v7L12 20l9-4.5v-7" />
      <path d="M12 13v7" />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4.5 12h15M13 5.5 20 12l-7 6.5" />
    </svg>
  );
}

const brandCtaBtnClass = 'inline-flex items-center gap-2 rounded-full border-none bg-gradient-to-r from-info to-brand-light px-7 py-3 font-body text-sm font-bold text-white shadow-sh2 transition-brand duration-brand hover:brightness-[1.03]';

interface ProductGridProps {
  initialProducts: Product[];
  initialCategory?: string;
  categoryName?: string;
}

export default function ProductGrid({ initialProducts, initialCategory, categoryName }: ProductGridProps) {
  const { t, lang } = useT();
  const searchParams = useSearchParams();
  const [prods] = useState<Product[]>(initialProducts);
  const [activeCat, setActiveCat] = useState(initialCategory || 'all');
  const [cats] = useState<Category[]>(DEFAULT_CATEGORIES);

  const initialFilteredCount = initialCategory && initialCategory !== 'all'
    ? initialProducts.filter((p) => prodInCat(p, initialCategory)).length
    : initialProducts.length;

  const [renderedCount, setRenderedCount] = useState(() => Math.min(PRODS_PER_PAGE, initialFilteredCount || PRODS_PER_PAGE));
  const [showLoadMoreBtn, setShowLoadMoreBtn] = useState(false);
  const [showSpinner, setShowSpinner] = useState(false);

  const sentinelRef = useRef<HTMLDivElement>(null);
  const batchCountRef = useRef(1);
  const loadMorePausedRef = useRef(false);
  const renderedCountRef = useRef(Math.min(PRODS_PER_PAGE, initialFilteredCount || PRODS_PER_PAGE));
  const listRef = useRef<Product[]>([]);
  const prevCatRef = useRef(activeCat);

  const list = useMemo(() => {
    const filtered = activeCat === 'all' ? prods : prods.filter((p) => prodInCat(p, activeCat));
    return [...filtered].sort((a, b) => (a.stock <= 0 ? 1 : 0) - (b.stock <= 0 ? 1 : 0));
  }, [prods, activeCat]);

  useEffect(() => { listRef.current = list; }, [list]);
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
    if (prevCatRef.current === activeCat) return;
    prevCatRef.current = activeCat;

    batchCountRef.current = 0;
    loadMorePausedRef.current = false;
    renderedCountRef.current = 0;
    setShowLoadMoreBtn(false);
    setShowSpinner(false);
    setRenderedCount(0);
    const t = setTimeout(() => appendNextBatch(), 0);
    return () => clearTimeout(t);
  }, [activeCat, appendNextBatch]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    let timer: ReturnType<typeof setTimeout> | null = null;
    const obs = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        if (timer) return;
        timer = setTimeout(() => {
          timer = null;
          if (typeof window !== 'undefined' && window.visualViewport && window.visualViewport.scale !== 1) {
            return;
          }
          if (renderedCountRef.current < listRef.current.length && !loadMorePausedRef.current) {
            appendNextBatch();
          }
        }, 180);
      } else if (timer) {
        clearTimeout(timer);
        timer = null;
      }
    }, { rootMargin: '300px' });
    obs.observe(sentinel);
    return () => {
      if (timer) clearTimeout(timer);
      obs.disconnect();
    };
  }, [appendNextBatch]);

  const handleLoadMoreClick = () => {
    setShowLoadMoreBtn(false);
    batchCountRef.current = 0;
    loadMorePausedRef.current = false;
    appendNextBatch();
  };

  useEffect(() => {
    const onFilter = (e: Event) => {
      const detail = (e as CustomEvent<{ catId?: string }>).detail;
      setActiveCat(detail?.catId || 'all');
    };
    window.addEventListener(CATEGORY_FILTER_EVENT, onFilter);
    return () => window.removeEventListener(CATEGORY_FILTER_EVENT, onFilter);
  }, []);

  useEffect(() => {
    const catFromUrl = searchParams.get('cat');
    if (!catFromUrl) return;
    setActiveCat(catFromUrl);
    try {
      const cosmeticUrl = catFromUrl === 'all' ? '/' : `/category/${makeCatSlug(catFromUrl)}`;
      window.history.replaceState({ vcStack: [], homeCurrent: true, vcCat: catFromUrl }, '', cosmeticUrl);
    } catch {
      // ignore
    }
    const t = setTimeout(() => {
      document.getElementById('prodSec')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 60);
    return () => clearTimeout(t);
  }, [searchParams]);

  const handleShowAll = () => {
    setActiveCat('all');
    window.dispatchEvent(new CustomEvent(CATEGORY_FILTER_EVENT, { detail: { catId: 'all' } }));
    try { window.history.replaceState({ vcStack: [], homeCurrent: true }, '', '/'); } catch {
      // ignore
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const visibleItems = list.slice(0, renderedCount);
  const isDone = renderedCount >= list.length;
  const showCategoryEndBtn = isDone && activeCat !== 'all' && list.length > 0;
  const activeCategoryName = categoryName || cats.find((c) => c.id === activeCat)?.name;

  return (
    <div className="mx-auto mb-11 min-h-[400px] max-w-[1300px] px-5" id="prodSec">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="border-l-[3px] border-brand-light pl-3 text-xl font-bold">
          {activeCategoryName && activeCat !== 'all' ? (
            lang === 'en' ? (
              <>{activeCategoryName} <span className="text-brand-light">Products</span></>
            ) : (
              <>{activeCategoryName} <span className="text-brand-light">সমূহ</span></>
            )
          ) : (
            <>{t('সকল')} <span className="text-brand-light">{t('প্রোডাক্ট')}</span></>
          )}
        </h2>
        <span className="text-[13px] text-muted">{lang === 'en' ? `${list.length} Products` : `${list.length}টি প্রোডাক্ট`}</span>
      </div>

      {list.length === 0 ? (
        <div className="col-span-full flex flex-col items-center gap-3.5 px-5 py-[60px] text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-brand-bg/50 to-surface-muted text-brand-light/60">
            <EmptyBoxIcon />
          </div>
          <p className="text-sm text-muted">{t('এই ক্যাটাগরিতে এখন কোনো পণ্য নেই')}</p>
          <button onClick={handleShowAll} className={brandCtaBtnClass}>
            {t('সব পণ্য দেখুন')} <ArrowRightIcon />
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {visibleItems.map((p, i) => (
            <ProductCard key={p.id} prod={p} isFirst={i === 0} />
          ))}
          {showCategoryEndBtn && (
            <div className="col-span-full flex flex-col items-center gap-3.5 px-4 pb-2 pt-7 text-center">
              <p className="font-body text-[13.5px] font-medium text-muted">
                {t('এই ক্যাটাগরিতে আর কোনো প্রোডাক্ট নেই')}
              </p>
              <button onClick={handleShowAll} className={brandCtaBtnClass}>
                {t('ওয়েবসাইটের সকল প্রোডাক্ট দেখুন')} <ArrowRightIcon />
              </button>
            </div>
          )}
        </div>
      )}

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
            className="inline-flex items-center gap-2 rounded-full border-none bg-gradient-to-r from-info to-brand-light px-8 py-[13px] font-body text-sm font-bold text-white shadow-sh2 transition-brand duration-brand hover:brightness-[1.03]"
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><path d="M12 5v14M5 12l7 7 7-7" /></svg>
            {t('আরো প্রোডাক্ট দেখুন')}
          </button>
        )}
      </div>
    </div>
  );
}
