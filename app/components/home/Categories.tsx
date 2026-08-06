'use client';

import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  DEFAULT_CATEGORIES, fetchCategories, makeCatSlug, CATEGORY_FILTER_EVENT,
} from '@/lib/categoryData';
import type { Category } from '@/types';

function getCatPerPage(): number {
  if (typeof window === 'undefined') return 8;
  return window.innerWidth <= 768 ? 4 : 8;
}

function getCatCols(): number {
  if (typeof window === 'undefined') return 4;
  if (window.innerWidth <= 768) return 2;
  if (window.innerWidth <= 1024) return 3;
  return 4;
}

function CatIcon({ icon }: { icon?: string }) {
  const isSvg = typeof icon === 'string' && icon.trim().startsWith('<svg');
  if (isSvg) {
    return <span className="[&_svg]:h-[26px] [&_svg]:w-[26px] [&_svg]:shrink-0" dangerouslySetInnerHTML={{ __html: icon }} />;
  }
  return <span className="text-2xl">{icon || '📦'}</span>;
}

export default function Categories() {
  const supabase = useMemo(() => createClient(), []);
  const [cats, setCats] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [catPage, setCatPage] = useState(0);

  const viewportRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const prevBtnRef = useRef<HTMLButtonElement>(null);
  const nextBtnRef = useRef<HTMLButtonElement>(null);
  const btnResetTimerRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const touchRef = useRef({ x: 0, y: 0 });
  const [gridCols, setGridCols] = useState(4);

  const maxPage = Math.max(0, Math.ceil(cats.length / getCatPerPage()) - 1);
  const clampPage = useCallback((p: number) => Math.max(0, Math.min(p, maxPage)), [maxPage]);

  useEffect(() => {
    const applyResponsive = () => {
      setGridCols(getCatCols());
      setCatPage((p) => clampPage(p));
    };
    applyResponsive();
    window.addEventListener('resize', applyResponsive);
    return () => window.removeEventListener('resize', applyResponsive);
  }, [clampPage]);

  const slide = (dir: number, btnKey: 'prev' | 'next') => {
    setCatPage((p) => {
      let next = p + dir;
      if (next > maxPage) next = 0;
      if (next < 0) next = maxPage;
      return next;
    });
    const btn = btnKey === 'prev' ? prevBtnRef.current : nextBtnRef.current;
    if (btn) {
      btn.classList.add('scale-95', 'bg-ink', 'text-white', 'border-ink');
      clearTimeout(btnResetTimerRef.current[btnKey]);
      btnResetTimerRef.current[btnKey] = setTimeout(() => {
        btn.classList.remove('scale-95', 'bg-ink', 'text-white', 'border-ink');
      }, 500);
    }
  };

  useEffect(() => {
    const vp = viewportRef.current;
    if (!vp) return;
    const onTouchStart = (e: TouchEvent) => {
      touchRef.current.x = e.touches[0].clientX;
      touchRef.current.y = e.touches[0].clientY;
    };
    const onTouchEnd = (e: TouchEvent) => {
      const dx = e.changedTouches[0].clientX - touchRef.current.x;
      const dy = e.changedTouches[0].clientY - touchRef.current.y;
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 40) slide(dx < 0 ? 1 : -1, dx < 0 ? 'next' : 'prev');
    };
    vp.addEventListener('touchstart', onTouchStart, { passive: true });
    vp.addEventListener('touchend', onTouchEnd, { passive: true });
    return () => {
      vp.removeEventListener('touchstart', onTouchStart);
      vp.removeEventListener('touchend', onTouchEnd);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [maxPage]);

  useEffect(() => {
    let cancelled = false;
    fetchCategories(supabase).then((list) => {
      if (!cancelled) setCats(list);
    });

    const channel = supabase
      .channel('categories-carousel-watch')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'store_settings', filter: 'setting_key=eq.vc_categories' },
        (payload) => {
          const row = payload.new as { setting_value?: unknown } | null;
          if (!row) return;
          const raw = row.setting_value;
          const parsed = typeof raw === 'string'
            ? (() => { try { return JSON.parse(raw); } catch { return raw; } })()
            : raw;
          if (Array.isArray(parsed) && parsed.length) setCats(parsed as Category[]);
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  useEffect(() => {
    setCatPage(0);
  }, [cats]);

  const handleSelect = (catId: string) => {
    try {
      const url = catId === 'all' ? '/' : '/category/' + makeCatSlug(catId);
      window.history.replaceState({ vcStack: [], homeCurrent: true, vcCat: catId }, '', url);
    } catch {
      // history API unavailable, ignore
    }
    window.dispatchEvent(new CustomEvent(CATEGORY_FILTER_EVENT, { detail: { catId } }));
    document.getElementById('prodSec')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const perPage = getCatPerPage();
  const pageCount = maxPage + 1;

  return (
    <div className="mx-auto mb-11 max-w-[1300px] px-5">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="border-l-[3px] border-brand-primary pl-3 text-xl font-bold">
          ক্যাটাগরি <span className="text-brand-primary">সমূহ</span>
        </h2>
      </div>

      <div className="relative overflow-visible px-[38px] md:px-[44px]">
        <button
          ref={prevBtnRef}
          className="absolute left-0 top-1/2 z-[5] flex h-[30px] w-[30px] -translate-y-1/2 items-center justify-center rounded-full border-2 border-border-base bg-white text-lg font-bold leading-none text-ink shadow-sh2 transition-brand duration-brand hover:border-ink hover:bg-ink hover:text-white md:h-9 md:w-9 md:text-xl"
          onClick={() => slide(-1, 'prev')}
        >
          &#8249;
        </button>

        <div className="touch-pan-y overflow-hidden pt-1.5" ref={viewportRef}>
          <div
            ref={gridRef}
            className="grid gap-[7px] md:gap-3"
            style={{ gridTemplateColumns: `repeat(${gridCols},1fr)` }}
          >
            {cats.map((cat, i) => {
              const start = catPage * perPage;
              const visible = i >= start && i < start + perPage;
              return (
                <div
                  key={cat.id}
                  className={`flex cursor-pointer items-center gap-1.5 rounded-2xl border-[1.5px] border-border-base bg-white p-2 shadow-[0_2px_6px_rgba(0,0,0,.04)] transition-brand duration-brand hover:-translate-y-0.5 hover:border-ink hover:shadow-sh2 md:gap-3 md:p-[13px] ${visible ? '' : 'hidden'}`}
                  onClick={() => handleSelect(cat.id)}
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-[1.5px] border-border-base bg-brand-bg text-[22px] md:h-[52px] md:w-[52px] md:text-2xl">
                    <CatIcon icon={cat.icon} />
                  </div>
                  <div className="text-xs font-bold leading-tight text-ink md:text-[13px]">{cat.name}</div>
                </div>
              );
            })}
          </div>
        </div>

        <button
          ref={nextBtnRef}
          className="absolute right-0 top-1/2 z-[5] flex h-[30px] w-[30px] -translate-y-1/2 items-center justify-center rounded-full border-2 border-border-base bg-white text-lg font-bold leading-none text-ink shadow-sh2 transition-brand duration-brand hover:border-ink hover:bg-ink hover:text-white md:h-9 md:w-9 md:text-xl"
          onClick={() => slide(1, 'next')}
        >
          &#8250;
        </button>
      </div>

      <div className="mt-3.5 flex justify-center gap-1.5">
        {Array.from({ length: pageCount }).map((_, p) => (
          <div
            key={p}
            className={`h-2 cursor-pointer rounded-full transition-brand duration-brand ${p === catPage ? 'w-[22px] rounded bg-ink' : 'w-2 bg-[#D1D5DB]'}`}
            onClick={() => setCatPage(p)}
          />
        ))}
      </div>
    </div>
  );
}
