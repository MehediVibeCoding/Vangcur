'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion } from 'motion/react';
import { createClient } from '@/lib/supabase/client';
import { logWarn } from '@/lib/logger';
import { sanitizeSvgHtml } from '@/lib/sanitize';
import { optimizeCloudinaryUrl } from '@/lib/cloudinaryUrl';
import {
  type HeroCard,
  DUO_TOTAL,
  DEFAULT_HERO_CARDS,
  fetchHeroCards,
} from '@/lib/heroSliderData';

const AUTOPLAY_MS = 5500;
const HOVER_AUTOPLAY_MS = 8000;
const GAP = 12;

let globalSavedIndex = DUO_TOTAL;

function getDuoPerPage(): number {
  if (typeof window === 'undefined') return 2;
  return window.innerWidth >= 769 ? 6 : 2;
}

interface HeroSliderProps {
  initialCards?: HeroCard[];
  onCategoryClick?: (catId: string) => void;
}

export default function HeroSlider({ initialCards, onCategoryClick }: HeroSliderProps) {
  const supabase = useRef(createClient()).current;
  const [cards, setCards] = useState<HeroCard[]>(initialCards && initialCards.length ? initialCards : DEFAULT_HERO_CARDS);
  const wrapRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const duoIdxRef = useRef(globalSavedIndex);
  const autoTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isInteractingRef = useRef(false);
  const infiniteJumpRef = useRef(false);
  const dragRef = useRef({ active: false, startX: 0 });
  const touchRef = useRef({ startX: 0, startY: 0 });
  const isVisibleRef = useRef(true);

  const normalizeIdx = () => {
    const span = DUO_TOTAL;
    const idx = duoIdxRef.current;
    if (idx >= span && idx < span * 2) return;
    duoIdxRef.current = ((idx - span) % span + span) % span + span;
    globalSavedIndex = duoIdxRef.current;
  };

  const setPosition = useCallback((animate: boolean) => {
    const track = trackRef.current;
    const wrap = wrapRef.current;
    if (!track || !wrap) return;
    normalizeIdx();
    const allCards = track.querySelectorAll<HTMLElement>('[data-cath-card]');
    const perPage = getDuoPerPage();
    const wrapWidth = wrap.clientWidth || wrap.getBoundingClientRect().width;
    if (!wrapWidth || wrapWidth < 50) return;
    
    const cardWidth = Math.floor((wrapWidth - GAP * (perPage - 1)) / perPage);
    if (!cardWidth || cardWidth < 10) return;

    allCards.forEach((c) => {
      c.style.width = `${cardWidth}px`;
      c.style.minWidth = `${cardWidth}px`;
      c.style.maxWidth = `${cardWidth}px`;
      c.style.flexShrink = '0';
    });

    const offset = duoIdxRef.current * (cardWidth + GAP);
    track.style.transition = animate ? 'transform .48s cubic-bezier(.4,0,.2,1)' : 'none';
    track.style.transform = `translateX(-${offset}px)`;
  }, []);

  const duoStep = useCallback((dir: number) => {
    const perPage = getDuoPerPage();
    duoIdxRef.current += dir * perPage;
    globalSavedIndex = duoIdxRef.current;
    setPosition(true);
  }, [setPosition]);

  const startAuto = useCallback((intervalMs = AUTOPLAY_MS) => {
    if (autoTimerRef.current) clearInterval(autoTimerRef.current);
    autoTimerRef.current = setInterval(() => {
      if (!isInteractingRef.current && isVisibleRef.current) {
        duoStep(1);
      }
    }, intervalMs);
  }, [duoStep]);

  useEffect(() => {
    const wrap = wrapRef.current;
    const track = trackRef.current;
    if (!wrap || !track) return;

    requestAnimationFrame(() => setPosition(false));
    startAuto(AUTOPLAY_MS);

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        isVisibleRef.current = entry.isIntersecting;
        if (!entry.isIntersecting && autoTimerRef.current) {
          clearInterval(autoTimerRef.current);
          autoTimerRef.current = null;
        } else if (entry.isIntersecting && !autoTimerRef.current) {
          startAuto(AUTOPLAY_MS);
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(wrap);

    const onTouchStart = (e: TouchEvent) => {
      touchRef.current.startX = e.touches[0].clientX;
      touchRef.current.startY = e.touches[0].clientY;
      isInteractingRef.current = true;
      if (autoTimerRef.current) clearInterval(autoTimerRef.current);
    };

    const onTouchEnd = (e: TouchEvent) => {
      const dx = e.changedTouches[0].clientX - touchRef.current.startX;
      const dy = e.changedTouches[0].clientY - touchRef.current.startY;
      if (Math.abs(dx) > 36 && Math.abs(dx) > Math.abs(dy)) {
        duoStep(dx < 0 ? 1 : -1);
      }
      isInteractingRef.current = false;
      setTimeout(() => startAuto(AUTOPLAY_MS), 2500);
    };

    const onTouchCancel = () => {
      isInteractingRef.current = false;
      startAuto(AUTOPLAY_MS);
    };

    const onMouseEnter = () => {
      if (window.innerWidth >= 769) {
        startAuto(HOVER_AUTOPLAY_MS);
      }
    };

    const onMouseLeaveAuto = () => {
      if (window.innerWidth >= 769) {
        startAuto(AUTOPLAY_MS);
      }
    };

    const onMouseDown = (e: MouseEvent) => {
      if (window.innerWidth < 769) return;
      dragRef.current.startX = e.clientX;
      dragRef.current.active = true;
      isInteractingRef.current = true;
      if (autoTimerRef.current) clearInterval(autoTimerRef.current);
    };

    const onMouseUp = (e: MouseEvent) => {
      if (!dragRef.current.active) return;
      dragRef.current.active = false;
      isInteractingRef.current = false;
      const dx = e.clientX - dragRef.current.startX;
      if (Math.abs(dx) > 40) {
        duoStep(dx < 0 ? 1 : -1);
      }
      setTimeout(() => startAuto(AUTOPLAY_MS), 1500);
    };

    const onMouseLeaveDrag = () => {
      if (dragRef.current.active) {
        dragRef.current.active = false;
        isInteractingRef.current = false;
        startAuto(AUTOPLAY_MS);
      }
    };

    const onTransitionEnd = () => {
      if (infiniteJumpRef.current) return;
      if (duoIdxRef.current >= DUO_TOTAL * 2) {
        infiniteJumpRef.current = true;
        duoIdxRef.current -= DUO_TOTAL;
        globalSavedIndex = duoIdxRef.current;
        setPosition(false);
        infiniteJumpRef.current = false;
      } else if (duoIdxRef.current < DUO_TOTAL) {
        infiniteJumpRef.current = true;
        duoIdxRef.current += DUO_TOTAL;
        globalSavedIndex = duoIdxRef.current;
        setPosition(false);
        infiniteJumpRef.current = false;
      }
    };

    const onResize = () => {
      if (typeof window !== 'undefined' && window.visualViewport && window.visualViewport.scale !== 1) return;
      requestAnimationFrame(() => setPosition(false));
    };

    const onDocVisibility = () => {
      if (document.hidden) {
        isInteractingRef.current = true;
        if (autoTimerRef.current) {
          clearInterval(autoTimerRef.current);
          autoTimerRef.current = null;
        }
      } else {
        setPosition(false);
        isInteractingRef.current = false;
        startAuto(AUTOPLAY_MS);
      }
    };

    document.addEventListener('visibilitychange', onDocVisibility);
    wrap.addEventListener('touchstart', onTouchStart, { passive: true });
    wrap.addEventListener('touchend', onTouchEnd, { passive: true });
    wrap.addEventListener('touchcancel', onTouchCancel, { passive: true });
    wrap.addEventListener('mouseenter', onMouseEnter);
    wrap.addEventListener('mouseleave', onMouseLeaveAuto);
    wrap.addEventListener('mousedown', onMouseDown);
    wrap.addEventListener('mouseup', onMouseUp);
    wrap.addEventListener('mouseleave', onMouseLeaveDrag);
    track.addEventListener('transitionend', onTransitionEnd);
    window.addEventListener('resize', onResize);

    return () => {
      observer.disconnect();
      if (autoTimerRef.current) clearInterval(autoTimerRef.current);
      wrap.removeEventListener('touchstart', onTouchStart);
      wrap.removeEventListener('touchend', onTouchEnd);
      wrap.removeEventListener('touchcancel', onTouchCancel);
      wrap.removeEventListener('mouseenter', onMouseEnter);
      wrap.removeEventListener('mouseleave', onMouseLeaveAuto);
      wrap.removeEventListener('mousedown', onMouseDown);
      wrap.removeEventListener('mouseup', onMouseUp);
      wrap.removeEventListener('mouseleave', onMouseLeaveDrag);
      track.removeEventListener('transitionend', onTransitionEnd);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onDocVisibility);
    };
  }, [duoStep, setPosition, startAuto]);

  useEffect(() => {
    if (initialCards && initialCards.length) return;
    const loadCards = async () => {
      try {
        const fetched = await fetchHeroCards(supabase);
        setCards(fetched);
      } catch (e) {
        logWarn('Hero card fetch failed:', e);
      }
    };
    loadCards();
  }, [supabase, initialCards]);

  const goCategory = (catId: string) => {
    if (typeof onCategoryClick === 'function') {
      onCategoryClick(catId);
    } else if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('vc:cathCategoryClick', { detail: { catId } }));
    }
    document.getElementById('prodSec')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const tripled = [...cards, ...cards, ...cards];

  return (
    <div className="relative mx-auto max-w-[1300px] bg-transparent px-3.5 pt-3.5 sm:px-5 2xl:max-w-[1560px]">
      <div className="relative w-full touch-pan-y overflow-hidden bg-transparent" ref={wrapRef}>
        <div className="flex gap-3 bg-transparent" style={{ willChange: 'transform' }} ref={trackRef}>
          {tripled.map((card, i) => {
            const bg = card.bg || 'linear-gradient(155deg,#111,#222)';
            const catId = card.catId || 'all';
            const label = card.label || '';
            const isEager = i >= DUO_TOTAL && i < DUO_TOTAL + 2;
            const isSvgEmoji = typeof card.emoji === 'string' && card.emoji.trim().startsWith('<svg');
            
            // দৃশ্যমান প্রাথমিক ব্যাচের জন্য স্ট্যাগার্ড ডিলে ক্যালকুলেশন
            const staggerDelay = i >= DUO_TOTAL && i < DUO_TOTAL + 6 ? (i - DUO_TOTAL) * 0.08 : 0;

            return (
              <motion.div
                data-cath-card
                key={`${catId}-${i}`}
                initial={{ opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: staggerDelay, ease: [0.4, 0, 0.2, 1] }}
                className="group relative flex aspect-[9/16] w-[calc((100%-12px)/2)] min-h-[220px] shrink-0 cursor-pointer flex-col justify-end overflow-hidden rounded-[14px] bg-[#111] shadow-[0_4px_16px_rgba(0,0,0,.08)] transition-transform duration-300 ease-brand [-webkit-tap-highlight-color:transparent] hover:-translate-y-0.5 hover:scale-[1.006] active:scale-[.98] sm:min-h-[280px] md:w-[calc((100%-60px)/6)]"
                style={{ background: bg }}
                onClick={() => goCategory(catId)}
              >
                {card.img ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    className="absolute inset-0 z-0 h-full w-full rounded-[inherit] object-cover object-top transition-transform duration-[550ms] ease-brand group-hover:scale-[1.05]"
                    src={optimizeCloudinaryUrl(card.img, 360)}
                    alt={label}
                    loading={isEager ? 'eager' : 'lazy'}
                    fetchPriority={isEager ? 'high' : undefined}
                    decoding="async"
                  />
                ) : isSvgEmoji ? (
                  <div
                    className="absolute inset-0 z-0 flex items-center justify-center pb-[60px] text-[72px] leading-none transition-transform duration-[550ms] ease-brand [filter:drop-shadow(0_4px_20px_rgba(0,0,0,.6))] group-hover:scale-[1.06] [&_svg]:h-20 [&_svg]:w-20"
                    dangerouslySetInnerHTML={{ __html: sanitizeSvgHtml(card.emoji) }}
                  />
                ) : card.emoji ? (
                  <div className="absolute inset-0 z-0 flex items-center justify-center pb-[60px] text-[72px] leading-none transition-transform duration-[550ms] ease-brand [filter:drop-shadow(0_4px_20px_rgba(0,0,0,.6))] group-hover:scale-[1.06]">
                    {card.emoji}
                  </div>
                ) : null}

                <div
                  className="pointer-events-none absolute inset-0 z-[1]"
                  style={{
                    background: 'linear-gradient(to bottom, transparent 0%, transparent 55%, rgba(0,0,0,.40) 78%, rgba(0,0,0,.65) 100%)',
                  }}
                />

                <div className="relative z-[2] flex flex-col items-start gap-[5px] px-3 pb-[14px]">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-white/[.16] px-2.5 py-[4px] text-[10.5px] font-bold uppercase tracking-[.3px] text-white shadow-[0_2px_10px_rgba(0,0,0,.2)] backdrop-blur-[8px] transition-[background,border-color,transform] duration-200 group-hover:translate-x-0.5 group-hover:border-white/50 group-hover:bg-white/[.26]">
                    {label} <span className="text-[12px] transition-transform duration-200 group-hover:translate-x-0.5">→</span>
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      <button
        className="absolute left-1 top-[calc(50%-7px)] z-20 hidden h-[38px] w-[38px] -translate-y-1/2 items-center justify-center rounded-full bg-white/[.94] text-[22px] font-bold leading-none text-ink shadow-[0_4px_16px_rgba(0,0,0,.22)] transition-all duration-200 ease-out hover:scale-110 hover:bg-white hover:shadow-[0_6px_22px_rgba(0,0,0,.28)] md:flex"
        onClick={() => duoStep(-1)}
        aria-label="Previous"
      >
        &#8249;
      </button>
      <button
        className="absolute right-1 top-[calc(50%-7px)] z-20 hidden h-[38px] w-[38px] -translate-y-1/2 items-center justify-center rounded-full bg-white/[.94] text-[22px] font-bold leading-none text-ink shadow-[0_4px_16px_rgba(0,0,0,.22)] transition-all duration-200 ease-out hover:scale-110 hover:bg-white hover:shadow-[0_6px_22px_rgba(0,0,0,.28)] md:flex"
        onClick={() => duoStep(1)}
        aria-label="Next"
      >
        &#8250;
      </button>
    </div>
  );
}
