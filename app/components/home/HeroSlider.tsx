'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
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
  const pausedRef = useRef(false);
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
    let wrapWidth = wrap.getBoundingClientRect().width;
    if (!wrapWidth || wrapWidth < 10) {
      const cathWrap = wrap.parentElement;
      const cathPad = cathWrap
        ? parseFloat(getComputedStyle(cathWrap).paddingLeft) + parseFloat(getComputedStyle(cathWrap).paddingRight)
        : 28;
      wrapWidth = window.innerWidth - cathPad;
    }
    if (!wrapWidth || wrapWidth < 50) return;
    const cardWidth = Math.floor((wrapWidth - GAP * (perPage - 1)) / perPage);
    if (!cardWidth || cardWidth < 10) return;
    allCards.forEach((c) => {
      c.style.width = cardWidth + 'px';
      c.style.minWidth = cardWidth + 'px';
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

  const startAuto = useCallback(() => {
    if (autoTimerRef.current) clearInterval(autoTimerRef.current);
    autoTimerRef.current = setInterval(() => {
      if (!pausedRef.current && isVisibleRef.current) duoStep(1);
    }, AUTOPLAY_MS);
  }, [duoStep]);

  useEffect(() => {
    const wrap = wrapRef.current;
    const track = trackRef.current;
    if (!wrap || !track) return;

    requestAnimationFrame(() => setPosition(false));
    startAuto();

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        isVisibleRef.current = entry.isIntersecting;
        if (!entry.isIntersecting && autoTimerRef.current) {
          clearInterval(autoTimerRef.current);
          autoTimerRef.current = null;
        } else if (entry.isIntersecting && !autoTimerRef.current) {
          startAuto();
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(wrap);

    const onTouchStart = (e: TouchEvent) => {
      touchRef.current.startX = e.touches[0].clientX;
      touchRef.current.startY = e.touches[0].clientY;
      pausedRef.current = true;
      if (autoTimerRef.current) clearInterval(autoTimerRef.current);
    };
    const onTouchEnd = (e: TouchEvent) => {
      const dx = e.changedTouches[0].clientX - touchRef.current.startX;
      const dy = e.changedTouches[0].clientY - touchRef.current.startY;
      if (Math.abs(dx) > 36 && Math.abs(dx) > Math.abs(dy)) duoStep(dx < 0 ? 1 : -1);
      pausedRef.current = false;
      setTimeout(() => startAuto(), 2000);
    };
    const onTouchCancel = () => { pausedRef.current = false; startAuto(); };
    const onMouseEnter = () => {
      if (window.innerWidth >= 769) {
        if (autoTimerRef.current) clearInterval(autoTimerRef.current);
        autoTimerRef.current = setInterval(() => { if (!pausedRef.current && isVisibleRef.current) duoStep(1); }, HOVER_AUTOPLAY_MS);
      }
    };
    const onMouseLeaveAuto = () => { if (window.innerWidth >= 769) startAuto(); };
    const onMouseDown = (e: MouseEvent) => {
      if (window.innerWidth < 769) return;
      dragRef.current.startX = e.clientX;
      dragRef.current.active = true;
      if (autoTimerRef.current) clearInterval(autoTimerRef.current);
    };
    const onMouseUp = (e: MouseEvent) => {
      if (!dragRef.current.active) return;
      dragRef.current.active = false;
      const dx = e.clientX - dragRef.current.startX;
      if (Math.abs(dx) > 40) duoStep(dx < 0 ? 1 : -1);
      setTimeout(() => startAuto(), 1500);
    };
    const onMouseLeaveDrag = () => {
      if (dragRef.current.active) { dragRef.current.active = false; startAuto(); }
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
        pausedRef.current = true;
        if (autoTimerRef.current) { clearInterval(autoTimerRef.current); autoTimerRef.current = null; }
      } else {
        setPosition(false);
        pausedRef.current = false;
        startAuto();
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
    <div className="relative min-h-[220px] bg-transparent p-3.5 pb-0 sm:min-h-[300px] md:min-h-[280px]">
      <div className="relative w-full touch-pan-y overflow-hidden bg-transparent" ref={wrapRef}>
        <div className="flex gap-3 bg-transparent px-0.5" style={{ willChange: 'transform' }} ref={trackRef}>
          {tripled.map((card, i) => {
            const bg = card.bg || 'linear-gradient(155deg,#111,#222)';
            const catId = card.catId || 'all';
            const label = card.label || '';
            const isEager = i >= DUO_TOTAL && i < DUO_TOTAL + 2;
            const isSvgEmoji = typeof card.emoji === 'string' && card.emoji.trim().startsWith('<svg');
            return (
              <div
                data-cath-card
                key={`${catId}-${i}`}
                className="group relative flex aspect-[9/16] w-[calc((100vw-56px)/2)] max-w-[calc(50vw-8px)] min-h-[220px] shrink-0 cursor-pointer flex-col justify-end overflow-hidden rounded-[20px] bg-[#111] shadow-[0_8px_24px_rgba(0,0,0,.06),0_1px_3px_rgba(0,0,0,.03)] transition-transform duration-300 ease-brand [-webkit-tap-highlight-color:transparent] hover:-translate-y-1 hover:scale-[1.008] hover:shadow-[0_20px_52px_rgba(0,0,0,.40),0_2px_8px_rgba(0,0,0,.15)] active:scale-[.97] sm:min-h-[300px] md:min-h-[280px] md:w-[calc((100%-60px)/6)] md:max-w-none"
                style={{ background: bg }}
                onClick={() => goCategory(catId)}
              >
                {card.img ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    className="absolute inset-0 z-0 h-full w-full rounded-[inherit] object-cover object-top transition-transform duration-[550ms] ease-brand group-hover:scale-[1.07]"
                    src={optimizeCloudinaryUrl(card.img, 360)}
                    alt={label}
                    loading={isEager ? 'eager' : 'lazy'}
                    fetchPriority={isEager ? 'high' : undefined}
                    decoding="async"
                  />
                ) : isSvgEmoji ? (
                  <div
                    className="absolute inset-0 z-0 flex items-center justify-center pb-[60px] text-[72px] leading-none transition-transform duration-[550ms] ease-brand [filter:drop-shadow(0_4px_20px_rgba(0,0,0,.6))] group-hover:scale-[1.08] [&_svg]:h-20 [&_svg]:w-20"
                    dangerouslySetInnerHTML={{ __html: sanitizeSvgHtml(card.emoji) }}
                  />
                ) : card.emoji ? (
                  <div className="absolute inset-0 z-0 flex items-center justify-center pb-[60px] text-[72px] leading-none transition-transform duration-[550ms] ease-brand [filter:drop-shadow(0_4px_20px_rgba(0,0,0,.6))] group-hover:scale-[1.08]">
                    {card.emoji}
                  </div>
                ) : null}

                <div
                  className="pointer-events-none absolute inset-0 z-[1]"
                  style={{
                    background: 'linear-gradient(to bottom, transparent 0%, transparent 55%, rgba(0,0,0,.40) 78%, rgba(0,0,0,.65) 100%)',
                  }}
                />

                <div className="relative z-[2] flex flex-col items-start gap-[5px] px-3.5 pb-[18px]">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-white/[.16] px-3 py-[5px] text-[11px] font-bold uppercase tracking-[.3px] text-white shadow-[0_2px_10px_rgba(0,0,0,.2)] backdrop-blur-[8px] transition-[background,border-color,transform] duration-200 group-hover:translate-x-0.5 group-hover:border-white/50 group-hover:bg-white/[.26]">
                    {label} <span className="text-[13px] transition-transform duration-200 group-hover:translate-x-1">→</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <button
        className="absolute left-0.5 top-[calc(50%-14px)] z-20 hidden h-[38px] w-[38px] -translate-y-1/2 items-center justify-center rounded-full bg-white/[.94] text-[22px] font-bold leading-none text-ink shadow-[0_4px_16px_rgba(0,0,0,.22)] transition-all duration-200 ease-out hover:scale-110 hover:bg-white hover:shadow-[0_6px_22px_rgba(0,0,0,.28)] md:flex"
        onClick={() => duoStep(-1)}
        aria-label="Previous"
      >
        &#8249;
      </button>
      <button
        className="absolute right-0.5 top-[calc(50%-14px)] z-20 hidden h-[38px] w-[38px] -translate-y-1/2 items-center justify-center rounded-full bg-white/[.94] text-[22px] font-bold leading-none text-ink shadow-[0_4px_16px_rgba(0,0,0,.22)] transition-all duration-200 ease-out hover:scale-110 hover:bg-white hover:shadow-[0_6px_22px_rgba(0,0,0,.28)] md:flex"
        onClick={() => duoStep(1)}
        aria-label="Next"
      >
        &#8250;
      </button>
    </div>
  );
}
