'use client';

import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { CATEGORY_FILTER_EVENT } from '@/lib/categoryData';
import {
  DEFAULT_PRODS, prodInCat, fetchCustomProducts, mergeCustomProducts,
  subscribeCustomProducts,
} from '@/lib/productData';
import type { Product } from '@/types';
import ProductCard from './ProductCard';

const PRODS_PER_PAGE = 20;
const PRODS_AUTO_THRESHOLD = 2;

export default function ProductGrid() {
  const supabase = useRef(createClient()).current;
  const [prods, setProds] = useState<Product[]>(DEFAULT_PRODS);
  const [activeCat, setActiveCat] = useState('all');
  const [renderedCount, setRenderedCount] = useState(0);
  const [showLoadMoreBtn, setShowLoadMoreBtn] = useState(false);
  const [showSpinner, setShowSpinner] = useState(false);
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());

  const gridRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const batchCountRef = useRef(0);
  const loadMorePausedRef = useRef(false);
  const renderedCountRef = useRef(0);
  const listRef = useRef<Product[]>([]);

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
    batchCountRef.current = 0;
    loadMorePausedRef.current = false;
    renderedCountRef.current = 0;
    setShowLoadMoreBtn(false);
    setShowSpinner(false);
    setRenderedCount(0);
    setRevealedIds(new Set());
    const t = setTimeout(() => appendNextBatch(), 0);
    return () => clearTimeout(t);
  }, [list, appendNextBatch]);

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

  useEffect(() => {
    const prefersReduced = typeof window !== 'undefined' && !!window.matchMedia
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced || typeof window === 'undefined' || !window.IntersectionObserver) return undefined;

    const revealObs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = (entry.target as HTMLElement).dataset.pid;
          if (id !== undefined) setRevealedIds((prev) => new Set(prev).add(id));
          revealObs.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -40px 0px', threshold: 0.08 });

    const gridObs = new MutationObserver((mutations) => {
      mutations.forEach((m) => {
        m.addedNodes.forEach((node) => {
          if (node.nodeType !== 1) return;
          const el = node as HTMLElement;
          if (el.dataset && el.dataset.pid !== undefined) revealObs.observe(el);
        });
      });
    });

    if (gridRef.current) gridObs.observe(gridRef.current, { childList: true });
    return () => { gridObs.disconnect(); revealObs.disconnect(); };
  }, []);

  useEffect(() => {
    const onFilter = (e: Event) => {
      const detail = (e as CustomEvent<{ catId?: string }>).detail;
      setActiveCat(detail?.catId || 'all');
    };
    window.addEventListener(CATEGORY_FILTER_EVENT, onFilter);
    return () => window.removeEventListener(CATEGORY_FILTER_EVENT, onFilter);
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
        <h2 className="animate-section-reveal border-l-[3px] border-brand-primary pl-3 text-xl font-bold">
          সকল <span className="text-brand-primary">প্রোডাক্ট</span>
        </h2>
        <span className="text-[13px] text-muted">{list.length}টি প্রোডাক্ট</span>
      </div>

      {list.length === 0 ? (
        <div className="col-span-full px-5 py-[60px] text-center text-muted">
          <div className="mb-3 text-5xl">📦</div>
          <p className="mb-4 text-sm">এই ক্যাটাগরিতে এখন কোনো পণ্য নেই</p>
          <button
            onClick={handleShowAll}
            className="rounded-[10px] border-none bg-ink px-[22px] py-2.5 text-[13px] font-bold text-white"
          >
            সব পণ্য দেখুন
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6" ref={gridRef}>
          {visibleItems.map((p, i) => (
            <div
              key={p.id}
              data-pid={p.id}
              className="transition-[opacity,transform] duration-[450ms] ease-brand"
              style={revealedIds.has(String(p.id))
                ? { opacity: 1, transform: 'none' }
                : { opacity: 0, transform: 'translateY(28px)' }}
            >
              <ProductCard prod={p} isFirst={i === 0} />
            </div>
          ))}
          {showCategoryEndBtn && (
            <div className="col-span-full flex flex-col items-center gap-3.5 px-4 pb-2 pt-7 text-center">
              <p className="font-body text-[13.5px] font-medium text-muted">
                এই ক্যাটাগরিতে আর কোনো প্রোডাক্ট নেই
              </p>
              <button
                onClick={handleShowAll}
                className="inline-flex items-center gap-2 rounded-xl border-none bg-ink px-7 py-[13px] font-body text-sm font-bold text-white shadow-[0_4px_16px_rgba(0,0,0,.13)]"
              >
                ওয়েবসাইটের সকল প্রোডাক্ট দেখুন
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
            className="inline-flex items-center gap-2 rounded-xl border-none bg-ink px-8 py-[13px] font-body text-sm font-bold text-white shadow-[0_4px_16px_rgba(0,0,0,.13)]"
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24"><path d="M12 5v14M5 12l7 7 7-7" /></svg>
            আরো প্রোডাক্ট দেখুন
          </button>
        )}
      </div>
    </div>
  );
}
