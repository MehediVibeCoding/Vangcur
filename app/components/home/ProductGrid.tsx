'use client';

import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { CATEGORY_FILTER_EVENT, makeCatSlug } from '@/lib/categoryData';
import { prodInCat, subscribeCustomProducts } from '@/lib/productData';
import type { Product } from '@/types';
import ProductCard from './ProductCard';

const PRODS_PER_PAGE = 20;
const PRODS_AUTO_THRESHOLD = 2;

// ---------- CartSidebar-এর খালি-কার্ট স্টেটের ঠিক same ভিজ্যুয়াল ভাষা —
// gradient circle ব্যাজে প্রফেশনাল স্ট্রোক আইকন (📦 ইমোজির বদলে), আর
// rounded-full gradient (info -> brand-light) pill বাটন (আগের কালো
// rounded-xl বাটনের বদলে) — চেকআউট/কার্ট বাটনের সাথে মিলিয়ে। ----------
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
}

export default function ProductGrid({ initialProducts, initialCategory }: ProductGridProps) {
  const supabase = useRef(createClient()).current;
  const searchParams = useSearchParams();
  const [prods, setProds] = useState<Product[]>(initialProducts);
  const [activeCat, setActiveCat] = useState(initialCategory || 'all');
  // /category/[slug] (Server Component)-এ initialCategory pass হলে প্রথম
  // ব্যাচের সাইজ ওই ক্যাটাগরিতে ফিল্টার করা কাউন্ট অনুযায়ী হিসাব হয়, পুরো
  // unfiltered লিস্টের length অনুযায়ী না।
  const initialFilteredCount = initialCategory && initialCategory !== 'all'
    ? initialProducts.filter((p) => prodInCat(p, initialCategory)).length
    : initialProducts.length;
  // প্রোডাক্ট লিস্ট এখন app/page.tsx (Server Component)-এ সার্ভারেই Supabase
  // থেকে fetch হয়ে initialProducts prop হিসেবে এখানে আসে — তাই প্রথম পেইন্টেই
  // (সার্ভার-রেন্ডারড HTML-এই) আসল প্রোডাক্ট কার্ড ও প্রথম প্রোডাক্ট ছবি (LCP
  // element) থাকে, ব্রাউজার প্রিলোড স্ক্যানার সেটা আগে থেকেই ফেচ শুরু করতে পারে,
  // আর CLS/স্টেল-ডেটা কোনোটাই হয় না।
  const [renderedCount, setRenderedCount] = useState(() => Math.min(PRODS_PER_PAGE, initialFilteredCount));
  const [showLoadMoreBtn, setShowLoadMoreBtn] = useState(false);
  const [showSpinner, setShowSpinner] = useState(false);

  const sentinelRef = useRef<HTMLDivElement>(null);
  const batchCountRef = useRef(1);
  const loadMorePausedRef = useRef(false);
  const renderedCountRef = useRef(Math.min(PRODS_PER_PAGE, initialFilteredCount));
  const listRef = useRef<Product[]>([]);
  const didInitRef = useRef(false);
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
    const catChanged = prevCatRef.current !== activeCat;
    prevCatRef.current = activeCat;

    if (!didInitRef.current) {
      // প্রথম মাউন্ট — প্রথম ব্যাচ ইতিমধ্যে initial state-এ রেন্ডার হয়ে আছে,
      // তাই এখানে রিসেট করে খালি করার দরকার নেই।
      didInitRef.current = true;
      return;
    }
    if (!catChanged) return;

    batchCountRef.current = 0;
    loadMorePausedRef.current = false;
    renderedCountRef.current = 0;
    setShowLoadMoreBtn(false);
    setShowSpinner(false);
    setRenderedCount(0);
    const t = setTimeout(() => appendNextBatch(), 0);
    return () => clearTimeout(t);
  }, [list, activeCat, appendNextBatch]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    // পিঞ্চ-জুমের সময় ভিজ্যুয়াল ভিউপোর্ট বদলে যাওয়ায় sentinel মুহূর্তের জন্য
    // intersecting হয়ে যেতে পারে যদিও ব্যবহারকারী আসলে স্ক্রল করেননি — তাই
    // সাথে সাথে ব্যাচ লোড না করে একটা ছোট delay (debounce) দেওয়া হচ্ছে, আর সেই
    // সময়ের মধ্যে intersection চলে গেলে (transient/জুম-জনিত হলে) বাতিল হয়ে যায়।
    let timer: ReturnType<typeof setTimeout> | null = null;
    const obs = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        if (timer) return;
        timer = setTimeout(() => {
          timer = null;
          // পিঞ্চ/জুম গেসচারের সময় ট্রিগার হওয়া state আপডেট (এবং তার ফলে
          // re-render/repaint) সম্পূর্ণ বন্ধ রাখা হচ্ছে।
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

  // অন্য পেইজ থেকে (যেমন সার্চ ফলাফল পেইজ, SRP) কোনো ক্যাটাগরির বাটনে ক্লিক
  // করলে সেটা এখানে ?cat=<id> কোয়েরি প্যারামিটার নিয়ে হোমপেইজে নিয়ে আসে —
  // মাউন্ট হওয়ার সাথে সাথেই সেই ক্যাটাগরিটা সরাসরি ট্রিগার হয় (Categories.tsx-এর
  // handleSelect ঠিক যা করে তারই সমতুল্য), যাতে অন্য পেইজ থেকে ক্লিক করলেও একই
  // রকম আচরণ পাওয়া যায় — আগের ওয়েবসাইটের লজিক অনুযায়ী।
  useEffect(() => {
    const catFromUrl = searchParams.get('cat');
    if (!catFromUrl) return;
    setActiveCat(catFromUrl);
    try {
      const cosmeticUrl = catFromUrl === 'all' ? '/' : `/category/${makeCatSlug(catFromUrl)}`;
      window.history.replaceState({ vcStack: [], homeCurrent: true, vcCat: catFromUrl }, '', cosmeticUrl);
    } catch {
      // history API unavailable, ignore
    }
    const t = setTimeout(() => {
      document.getElementById('prodSec')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 60);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const handleShowAll = () => {
    setActiveCat('all');
    window.dispatchEvent(new CustomEvent(CATEGORY_FILTER_EVENT, { detail: { catId: 'all' } }));
    try { window.history.replaceState({ vcStack: [], homeCurrent: true }, '', '/'); } catch {
      // history API unavailable, ignore
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const visibleItems = list.slice(0, renderedCount);
  const isDone = renderedCount >= list.length;
  const showCategoryEndBtn = isDone && activeCat !== 'all' && list.length > 0;

  return (
    <div className="mx-auto mb-11 max-w-[1300px] px-5" id="prodSec">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="border-l-[3px] border-brand-light pl-3 text-xl font-bold">
          সকল <span className="text-brand-light">প্রোডাক্ট</span>
        </h2>
        <span className="text-[13px] text-muted">{list.length}টি প্রোডাক্ট</span>
      </div>

      {list.length === 0 ? (
        <div className="col-span-full flex flex-col items-center gap-3.5 px-5 py-[60px] text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-brand-bg/50 to-surface-muted text-brand-light/60">
            <EmptyBoxIcon />
          </div>
          <p className="text-sm text-muted">এই ক্যাটাগরিতে এখন কোনো পণ্য নেই</p>
          <button onClick={handleShowAll} className={brandCtaBtnClass}>
            সব পণ্য দেখুন <ArrowRightIcon />
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
                এই ক্যাটাগরিতে আর কোনো প্রোডাক্ট নেই
              </p>
              <button onClick={handleShowAll} className={brandCtaBtnClass}>
                ওয়েবসাইটের সকল প্রোডাক্ট দেখুন <ArrowRightIcon />
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
            লোড হচ্ছে...
          </div>
        )}
        {showLoadMoreBtn && (
          <button
            onClick={handleLoadMoreClick}
            className="inline-flex items-center gap-2 rounded-full border-none bg-gradient-to-r from-info to-brand-light px-8 py-[13px] font-body text-sm font-bold text-white shadow-sh2 transition-brand duration-brand hover:brightness-[1.03]"
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><path d="M12 5v14M5 12l7 7 7-7" /></svg>
            আরো প্রোডাক্ট দেখুন
          </button>
        )}
      </div>
    </div>
  );
}
