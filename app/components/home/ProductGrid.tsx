'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  CATEGORY_FILTER_EVENT, makeCatSlug, DEFAULT_CATEGORIES,
} from '@/lib/categoryData';
import { PRODUCTS_PAGE_SIZE, PRODUCTS_LOAD_MORE_BATCHES } from '@/lib/productData';
import { fetchProductsPageAction } from '@/app/actions/products';
import { useT } from '@/lib/i18n/useT';
import type { Category, Product } from '@/types';
import ProductCard from './ProductCard';

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
  initialHasMore?: boolean;
  categoryName?: string;
}

// 🔒 ফিক্স (audit P1-16): আগে এই কম্পোনেন্ট পুরো ক্যাটালগ props হিসেবে পেত আর
// ক্যাটাগরি বদল/স্ক্রল — দুটোই client-এ থাকা সেই একই পুরো অ্যারে থেকে
// filter/slice করত। এখন শুধু বর্তমান পেজের প্রোডাক্টগুলোই state-এ থাকে —
// ক্যাটাগরি বদলালে বা স্ক্রল করলে সার্ভার থেকে নতুন পেজ আনা হয়
// (fetchProductsPageAction)। প্রোডাক্ট কয়েকশো হয়ে গেলেও হোমপেজ হালকা থাকবে।
export default function ProductGrid({ initialProducts, initialCategory, initialHasMore, categoryName }: ProductGridProps) {
  const { t, lang } = useT();
  const searchParams = useSearchParams();
  const startCat = initialCategory || 'all';

  const [items, setItems] = useState<Product[]>(initialProducts);
  const [total, setTotal] = useState<number>(initialProducts.length);
  const [hasMore, setHasMore] = useState<boolean>(!!initialHasMore);
  const [switching, setSwitching] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [activeCat, setActiveCat] = useState(startCat);
  const [cats] = useState<Category[]>(DEFAULT_CATEGORIES);

  const sentinelRef = useRef<HTMLDivElement>(null);
  const prevCatRef = useRef(startCat);
  const reqIdRef = useRef(0);
  const activeCatRef = useRef(startCat);
  const offsetRef = useRef(initialProducts.length);
  const hasMoreRef = useRef(!!initialHasMore);
  const loadingRef = useRef(false);
  const batchIdxRef = useRef(0);

  useEffect(() => { activeCatRef.current = activeCat; }, [activeCat]);
  useEffect(() => { hasMoreRef.current = hasMore; }, [hasMore]);

  // ক্যাটাগরি বদলালে নতুন করে প্রথম পেজ আনা হয় — প্রথম মাউন্টে (SSR-এর
  // initialCategory-এর সাথে মিলে গেলে) এই effect কিছু করে না, SSR ডেটাই থাকে
  useEffect(() => {
    if (prevCatRef.current === activeCat) return;
    prevCatRef.current = activeCat;

    const myReqId = ++reqIdRef.current;
    batchIdxRef.current = 0;
    setSwitching(true);
    setLoadingMore(false);

    fetchProductsPageAction(activeCat, 0, PRODUCTS_PAGE_SIZE)
      .then((res) => {
        if (reqIdRef.current !== myReqId) return; // ইতিমধ্যে আরেকবার ক্যাটাগরি বদলেছে — পুরনো রেসপন্স উপেক্ষা
        setItems(res.products);
        setTotal(res.total);
        setHasMore(res.hasMore);
        offsetRef.current = res.products.length;
        hasMoreRef.current = res.hasMore;
        setSwitching(false);
      })
      .catch(() => {
        if (reqIdRef.current !== myReqId) return;
        setItems([]);
        setTotal(0);
        setHasMore(false);
        offsetRef.current = 0;
        hasMoreRef.current = false;
        setSwitching(false);
      });
  }, [activeCat]);

  const appendNextBatch = useCallback(() => {
    if (loadingRef.current || !hasMoreRef.current) return;
    loadingRef.current = true;
    setLoadingMore(true);

    const myReqId = reqIdRef.current;
    const cat = activeCatRef.current;
    const offset = offsetRef.current;
    const batchSize = PRODUCTS_LOAD_MORE_BATCHES[Math.min(batchIdxRef.current, PRODUCTS_LOAD_MORE_BATCHES.length - 1)];

    fetchProductsPageAction(cat, offset, batchSize)
      .then((res) => {
        if (reqIdRef.current !== myReqId) return; // এর মধ্যে ক্যাটাগরি বদলে গেছে — বাতিল
        batchIdxRef.current += 1;
        offsetRef.current = offset + res.products.length;
        hasMoreRef.current = res.hasMore;
        setItems((prev) => [...prev, ...res.products]);
        setTotal(res.total);
        setHasMore(res.hasMore);
        loadingRef.current = false;
        setLoadingMore(false);
      })
      .catch(() => {
        if (reqIdRef.current !== myReqId) return;
        loadingRef.current = false;
        setLoadingMore(false);
      });
  }, []);

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
          appendNextBatch();
        }, 120);
      } else if (timer) {
        clearTimeout(timer);
        timer = null;
      }
    }, { rootMargin: '600px' });

    obs.observe(sentinel);
    return () => {
      if (timer) clearTimeout(timer);
      obs.disconnect();
    };
  }, [appendNextBatch]);

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
      const prodSec = document.getElementById('prodSec');
      if (prodSec) {
        const targetY = prodSec.getBoundingClientRect().top + window.scrollY - 85;
        window.scrollTo({ top: targetY, behavior: 'smooth' });
      }
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

  const isDone = !hasMore;
  const showCategoryEndBtn = isDone && !switching && activeCat !== 'all' && items.length > 0;
  const activeCategoryName = categoryName || cats.find((c) => c.id === activeCat)?.name;

  return (
    <div className="mx-auto mb-11 min-h-[400px] max-w-[1300px] px-5 scroll-mt-20 sm:scroll-mt-24" id="prodSec">
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
        <span className="text-[13px] text-muted">{lang === 'en' ? `${total} Products` : `${total}টি প্রোডাক্ট`}</span>
      </div>

      {items.length === 0 && !switching ? (
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
        <div className={`grid grid-cols-2 gap-3.5 transition-brand duration-brand sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 ${switching ? 'opacity-40' : 'opacity-100'}`}>
          {items.map((p, i) => (
            <ProductCard key={`${activeCat}-${p.id}`} prod={p} isFirst={i === 0} index={i} />
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
        {(loadingMore || switching) && !isDone && (
          <div className="flex items-center gap-2 text-[13px] text-muted">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin text-brand-light">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
            </svg>
            {t('লোড হচ্ছে...')}
          </div>
        )}
      </div>
    </div>
  );
}
