'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  DEFAULT_CATEGORIES, makeCatSlug, CATEGORY_FILTER_EVENT,
} from '@/lib/categoryData';
import { sanitizeSvgHtml } from '@/lib/sanitize';
import { useT } from '@/lib/i18n/useT';
import type { Category } from '@/types';

function CatIcon({ icon }: { icon?: string }) {
  const isSvg = typeof icon === 'string' && icon.trim().startsWith('<svg');
  if (isSvg) {
    return (
      <span
        className="flex h-[26px] w-[26px] shrink-0 items-center justify-center [&_svg]:!h-[26px] [&_svg]:!w-[26px]"
        dangerouslySetInnerHTML={{ __html: sanitizeSvgHtml(icon) }}
      />
    );
  }
  return <span className="text-2xl leading-none">{icon || '📦'}</span>;
}

interface CategoriesProps {
  initialCategories?: Category[];
}

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 28 : -28,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -28 : 28,
    opacity: 0,
  }),
};

export default function Categories({ initialCategories }: CategoriesProps) {
  const { lang } = useT();
  const [cats] = useState<Category[]>(
    initialCategories && initialCategories.length ? initialCategories : DEFAULT_CATEGORIES
  );
  const [catPage, setCatPage] = useState(0);
  const [direction, setDirection] = useState(0);
  const [perPage, setPerPage] = useState(4);

  const viewportRef = useRef<HTMLDivElement>(null);
  const prevBtnRef = useRef<HTMLButtonElement>(null);
  const nextBtnRef = useRef<HTMLButtonElement>(null);
  const btnResetTimerRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const touchRef = useRef({ x: 0, y: 0 });

  const maxPage = Math.max(0, Math.ceil(cats.length / perPage) - 1);

  const applyResponsive = useCallback(() => {
    if (typeof window === 'undefined') return;
    const width = window.innerWidth;
    const pp = width <= 768 ? 4 : 8;
    setPerPage(pp);
    setCatPage((p) => {
      const nextMax = Math.max(0, Math.ceil(cats.length / pp) - 1);
      return Math.max(0, Math.min(p, nextMax));
    });
  }, [cats.length]);

  useEffect(() => {
    applyResponsive();
    window.addEventListener('resize', applyResponsive);
    return () => window.removeEventListener('resize', applyResponsive);
  }, [applyResponsive]);

  const slide = (dir: number, btnKey: 'prev' | 'next') => {
    setDirection(dir);
    setCatPage((p) => {
      let next = p + dir;
      if (next > maxPage) next = 0;
      if (next < 0) next = maxPage;
      return next;
    });

    const btn = btnKey === 'prev' ? prevBtnRef.current : nextBtnRef.current;
    if (btn) {
      btn.classList.add('scale-95', 'bg-brand-light', 'text-white', 'border-brand-light');
      clearTimeout(btnResetTimerRef.current[btnKey]);
      btnResetTimerRef.current[btnKey] = setTimeout(() => {
        btn?.classList.remove('scale-95', 'bg-brand-light', 'text-white', 'border-brand-light');
      }, 350);
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
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 36) {
        slide(dx < 0 ? 1 : -1, dx < 0 ? 'next' : 'prev');
      }
    };
    vp.addEventListener('touchstart', onTouchStart, { passive: true });
    vp.addEventListener('touchend', onTouchEnd, { passive: true });
    return () => {
      vp.removeEventListener('touchstart', onTouchStart);
      vp.removeEventListener('touchend', onTouchEnd);
    };
  }, [maxPage]);

  const handleSelect = (catId: string) => {
    try {
      const url = catId === 'all' ? '/' : '/category/' + makeCatSlug(catId);
      window.history.replaceState({ vcStack: [], homeCurrent: true, vcCat: catId }, '', url);
    } catch {
      // ignore
    }
    window.dispatchEvent(new CustomEvent(CATEGORY_FILTER_EVENT, { detail: { catId } }));
    document.getElementById('prodSec')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const currentCategories = useMemo(() => {
    const start = catPage * perPage;
    return cats.slice(start, start + perPage);
  }, [cats, catPage, perPage]);

  const pageCount = maxPage + 1;

  return (
    <div className="mx-auto mb-11 min-h-[140px] max-w-[1300px] overflow-hidden px-3.5 sm:px-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="border-l-[3px] border-brand-light pl-3 text-lg font-bold sm:text-xl text-ink">
          {lang === 'en' ? (
            <>All <span className="text-brand-light">Categories</span></>
          ) : (
            <>ক্যাটাগরি <span className="text-brand-light">সমূহ</span></>
          )}
        </h2>
      </div>

      <div className="relative px-8 sm:px-[38px] md:px-[44px]">
        {/* আগের বাটন */}
        <button
          ref={prevBtnRef}
          className="absolute left-0 top-1/2 z-[5] flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border-2 border-border-base bg-white text-base font-bold leading-none text-ink shadow-sh1 transition-brand hover:border-brand-light hover:bg-brand-light hover:text-white md:h-9 md:w-9 md:text-xl"
          onClick={() => slide(-1, 'prev')}
          aria-label="Previous Category"
        >
          &#8249;
        </button>

        {/* ক্যাটাগরি গ্রিড কনটেইনার — ডিরেকশনাল স্প্রিং ট্রানজিশন */}
        <div className="touch-pan-y overflow-hidden py-1" ref={viewportRef}>
          <AnimatePresence mode="wait" custom={direction} initial={false}>
            <motion.div
              key={catPage}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
              className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-4 md:gap-3"
            >
              {currentCategories.map((cat) => (
                <div
                  key={cat.id}
                  className="group flex min-h-[58px] cursor-pointer items-center gap-2 rounded-2xl border-[1.5px] border-border-base bg-white p-2 shadow-xs transition-brand hover:-translate-y-0.5 hover:border-brand-light hover:shadow-sh2 md:min-h-[66px] md:gap-3 md:p-3 active:scale-98"
                  onClick={() => handleSelect(cat.id)}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border-base bg-brand-bg text-[20px] text-brand-light transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] group-hover:scale-110 md:h-12 md:w-12 md:text-2xl">
                    <CatIcon icon={cat.icon} />
                  </div>
                  <div className="line-clamp-2 min-w-0 flex-1 font-body text-xs font-bold leading-[1.3] text-ink md:text-[13px]">
                    {cat.name}
                  </div>
                </div>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* পরের বাটন */}
        <button
          ref={nextBtnRef}
          className="absolute right-0 top-1/2 z-[5] flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border-2 border-border-base bg-white text-base font-bold leading-none text-ink shadow-sh1 transition-brand hover:border-brand-light hover:bg-brand-light hover:text-white md:h-9 md:w-9 md:text-xl"
          onClick={() => slide(1, 'next')}
          aria-label="Next Category"
        >
          &#8250;
        </button>
      </div>

      {/* পেজিনেশন ডটস */}
      <div className="mt-3.5 flex justify-center gap-1.5">
        {Array.from({ length: pageCount }).map((_, p) => (
          <button
            type="button"
            key={p}
            aria-label={`Go to category page ${p + 1}`}
            className={`h-1.5 cursor-pointer rounded-full transition-all duration-300 ${
              p === catPage ? 'w-5 bg-brand-light' : 'w-1.5 bg-border-base'
            }`}
            onClick={() => {
              setDirection(p >= catPage ? 1 : -1);
              setCatPage(p);
            }}
          />
        ))}
      </div>
    </div>
  );
}
