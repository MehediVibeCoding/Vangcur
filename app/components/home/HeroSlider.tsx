'use client';

import { useState, useRef, useCallback, useEffect, useLayoutEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { logWarn } from '@/lib/logger';
import { sanitizeSvgHtml } from '@/lib/sanitize';
import { optimizeCloudinaryUrl } from '@/lib/cloudinaryUrl';
import {
  type HeroCard,
  DUO_TOTAL,
  DEFAULT_HERO_CARDS,
  fetchHeroCards,
  padCards,
} from '@/lib/heroSliderData';

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

const AUTOPLAY_MS = 5500;
const HOVER_AUTOPLAY_MS = 8000;
const GAP = 12;

function getDuoPerPage(): number {
  if (typeof window === 'undefined') return 2;
  return window.innerWidth >= 768 ? 6 : 2;
}

interface HeroSliderProps {
  initialCards?: HeroCard[];
  onCategoryClick?: (catId: string) => void;
}

function HeroCardImage({
  src,
  alt,
  eager,
}: {
  src: string;
  alt: string;
  eager: boolean;
}) {
  return (
    <img
      className="absolute inset-0 z-0 h-full w-full rounded-[inherit] object-cover object-top transition-transform duration-300 ease-brand group-hover:scale-[1.05]"
      src={src}
      alt={alt}
      loading={eager ? 'eager' : 'lazy'}
      fetchPriority={eager ? 'high' : undefined}
      decoding="async"
    />
  );
}

export default function HeroSlider({ initialCards, onCategoryClick }: HeroSliderProps) {
  const supabase = useRef(createClient()).current;
  
  // কার্ডের সংখ্যা সবসময় ১২-এর গুণিতকে নরমালাইজড
  const [cards, setCards] = useState<HeroCard[]>(() =>
    padCards(initialCards && initialCards.length ? initialCards : DEFAULT_HERO_CARDS)
  );

  const wrapRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  
  // 🌟 স্লাইডার অরিজিন স্বাভাবিক Index 0 থেকে শুরু (জিরো লেআউট শিফট ও জিরো ফ্ল্যাশ)
  const duoIdxRef = useRef(0);
  const autoTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isInteractingRef = useRef(false);
  const infiniteJumpRef = useRef(false);
  const dragRef = useRef({ active: false, startX: 0 });
  const touchRef = useRef({ startX: 0, startY: 0 });
  const isVisibleRef = useRef(true);

  // 🌟 প্রথম ৬টি ছবির জন্য ব্রাউজার মেমোরিতে সরাসরি আর্লি প্রি-ক্যাশ
  useEffect(() => {
    if (typeof window === 'undefined' || !cards.length) return;
    const count = Math.min(6, cards.length);
    for (let idx = 0; idx < count; idx++) {
      const src = cards[idx]?.img;
      if (!src) continue;
      const href = optimizeCloudinaryUrl(src, 360);
      const preloadImg = new window.Image();
      preloadImg.src = href;
    }
  }, [cards]);

  const setPosition = useCallback((animate: boolean) => {
    const track = trackRef.current;
    const wrap = wrapRef.current;
    if (!track || !wrap) return;
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

    // transition: none প্রয়োগকালে তাৎক্ষণিক রিফ্লো নিশ্চিত করা
    if (!animate) {
      void track.offsetHeight;
    }
  }, []);

  const duoStep = useCallback((dir: number) => {
    const perPage = getDuoPerPage();
    const totalCards = cards.length;

    // 🌟 যদি Index 0-তে থাকা অবস্থায় ইউজার বামে ক্লিক করেন:
    // নিঃশব্দে ট্র্যাককে Set 2 (12)-তে জাম্প করিয়ে রিফ্লো করা হবে, তারপর 6-এ অ্যানিমেট হবে
    if (dir < 0 && duoIdxRef.current <= 0) {
      infiniteJumpRef.current = true;
      duoIdxRef.current = totalCards;
      setPosition(false);
      infiniteJumpRef.current = false;
    }

    duoIdxRef.current += dir * perPage;
    setPosition(true);
  }, [cards.length, setPosition]);

  const startAuto = useCallback((intervalMs = AUTOPLAY_MS) => {
    if (autoTimerRef.current) clearInterval(autoTimerRef.current);
    autoTimerRef.current = setInterval(() => {
      if (!isInteractingRef.current && isVisibleRef.current) {
        duoStep(1);
      }
    }, intervalMs);
  }, [duoStep]);

  useIsomorphicLayoutEffect(() => {
    const wrap = wrapRef.current;
    const track = trackRef.current;
    if (!wrap || !track) return;
    setPosition(false);
  }, [setPosition]);

  useEffect(() => {
    const wrap = wrapRef.current;
    const track = trackRef.current;
    if (!wrap || !track) return;

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
      if (window.innerWidth >= 768) {
        startAuto(HOVER_AUTOPLAY_MS);
      }
    };

    const onMouseLeaveAuto = () => {
      if (window.innerWidth >= 768) {
        startAuto(AUTOPLAY_MS);
      }
    };

    const onMouseDown = (e: MouseEvent) => {
      if (window.innerWidth < 768) return;
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

    // 🌟 নিখুঁত একমুখী ইনফিনিট লুপ বাউন্ডারি সুইচ (২৪ ➔ ১২ সিমলেস রিসেট)
    const onTransitionEnd = (e: TransitionEvent) => {
      if (e.target !== trackRef.current) return;
      if (infiniteJumpRef.current) return;

      const totalCards = cards.length; // ১২
      // ডানে স্ক্রল করতে করতে ২৪ (Set 3) পার হলে নিঃশব্দে ১২ (Set 2)-তে ফিরে আসবে
      if (duoIdxRef.current >= totalCards * 2) {
        infiniteJumpRef.current = true;
        duoIdxRef.current -= totalCards;
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
  }, [cards.length, duoStep, setPosition, startAuto]);

  useEffect(() => {
    if (initialCards && initialCards.length) return;
    const loadCards = async () => {
      try {
        const fetched = await fetchHeroCards(supabase);
        setCards(padCards(fetched));
      } catch (e) {
        logWarn('Hero card fetch failed:', e);
      }
    };
    loadCards();
  }, [supabase, initialCards]);

  const handleManualPrev = () => {
    isInteractingRef.current = true;
    if (autoTimerRef.current) clearInterval(autoTimerRef.current);
    duoStep(-1);
    setTimeout(() => {
      isInteractingRef.current = false;
      startAuto(AUTOPLAY_MS);
    }, 2500);
  };

  const handleManualNext = () => {
    isInteractingRef.current = true;
    if (autoTimerRef.current) clearInterval(autoTimerRef.current);
    duoStep(1);
    setTimeout(() => {
      isInteractingRef.current = false;
      startAuto(AUTOPLAY_MS);
    }, 2500);
  };

  const goCategory = (catId: string) => {
    if (typeof onCategoryClick === 'function') {
      onCategoryClick(catId);
    } else if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('vc:cathCategoryClick', { detail: { catId } }));
    }
    document.getElementById('prodSec')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // ৩টি পূর্ণাঙ্গ সেট (৩৬টি কার্ড: 0..11, 12..23, 24..35)
  const tripled = [...cards, ...cards, ...cards];

  return (
    <div className="relative mx-auto max-w-[1300px] bg-transparent px-3.5 pt-3.5 sm:px-5 2xl:max-w-[1560px]">
      <div className="relative w-full touch-pan-y overflow-hidden bg-transparent" ref={wrapRef}>
        <div className="flex gap-3 bg-transparent" style={{ willChange: 'transform' }} ref={trackRef}>
          {tripled.map((card, i) => {
            const bg = card.bg || 'linear-gradient(155deg,#111,#222)';
            const catId = card.catId || 'all';
            const label = card.label || '';
            const isSvgEmoji = typeof card.emoji === 'string' && card.emoji.trim().startsWith('<svg');

            // 🌟 প্রথম সেট (Set 1: i = 0..5) সরাসরি ভিউপোর্টে থাকবে এবং অতি সূক্ষ্ম ০.০২s মাইক্রো-স্ট্যাগারে একযোগে প্রবেশ করবে
            const isMobileInitial = i < 2;
            const isDesktopOnlyInitial = i >= 2 && i < 6;

            const animClass = isMobileInitial
              ? 'hero-card-anim-all'
              : isDesktopOnlyInitial
              ? 'hero-card-anim-desktop'
              : '';

            const isInitialVisible = isMobileInitial || isDesktopOnlyInitial;
            const staggerDelay = isInitialVisible ? i * 0.02 : 0;
            const isEager = i < 6;

            return (
              <div
                data-cath-card
                key={`${catId}-${i}`}
                className="aspect-[9/16] w-[calc((100%-12px)/2)] min-h-[220px] shrink-0 sm:min-h-[280px] md:w-[calc((100%-60px)/6)]"
              >
                <div
                  className={`group relative flex h-full w-full cursor-pointer flex-col justify-end overflow-hidden rounded-[14px] bg-[#111] shadow-[0_4px_16px_rgba(0,0,0,.08)] transition-transform duration-300 ease-brand [-webkit-tap-highlight-color:transparent] hover:-translate-y-0.5 hover:scale-[1.006] active:scale-[.98] ${animClass}`}
                  style={{
                    background: bg,
                    animationDelay: isInitialVisible ? `${staggerDelay}s` : undefined,
                  }}
                  onClick={() => goCategory(catId)}
                >
                  {card.img ? (
                    <HeroCardImage
                      src={optimizeCloudinaryUrl(card.img, 360)}
                      alt={label}
                      eager={isEager}
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
                      background:
                        'linear-gradient(to bottom, transparent 0%, transparent 55%, rgba(0,0,0,.40) 78%, rgba(0,0,0,.65) 100%)',
                    }}
                  />

                  <div className="relative z-[2] flex flex-col items-start gap-[5px] px-3 pb-[14px]">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-white/[.16] px-2.5 py-[4px] text-[10.5px] font-bold uppercase tracking-[.3px] text-white shadow-[0_2px_10px_rgba(0,0,0,.2)] backdrop-blur-[8px] transition-[background,border-color,transform] duration-200 group-hover:translate-x-0.5 group-hover:border-white/50 group-hover:bg-white/[.26]">
                      {label} <span className="text-[12px] transition-transform duration-200 group-hover:translate-x-0.5">→</span>
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <style>{`
        @keyframes heroCardIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .hero-card-anim-all {
          animation: heroCardIn 0.38s cubic-bezier(0.16, 1, 0.3, 1) both;
          will-change: opacity, transform;
        }
        @media (min-width: 768px) {
          .hero-card-anim-desktop {
            animation: heroCardIn 0.38s cubic-bezier(0.16, 1, 0.3, 1) both;
            will-change: opacity, transform;
          }
        }
      `}</style>

      <button
        className="absolute left-1 top-[calc(50%-7px)] z-20 hidden h-[38px] w-[38px] -translate-y-1/2 items-center justify-center rounded-full bg-white/[.94] text-[22px] font-bold leading-none text-ink shadow-[0_4px_16px_rgba(0,0,0,.22)] transition-all duration-200 ease-out hover:scale-110 hover:bg-white hover:shadow-[0_6px_22px_rgba(0,0,0,.28)] md:flex"
        onClick={handleManualPrev}
        aria-label="Previous"
      >
        &#8249;
      </button>
      <button
        className="absolute right-1 top-[calc(50%-7px)] z-20 hidden h-[38px] w-[38px] -translate-y-1/2 items-center justify-center rounded-full bg-white/[.94] text-[22px] font-bold leading-none text-ink shadow-[0_4px_16px_rgba(0,0,0,.22)] transition-all duration-200 ease-out hover:scale-110 hover:bg-white hover:shadow-[0_6px_22px_rgba(0,0,0,.28)] md:flex"
        onClick={handleManualNext}
        aria-label="Next"
      >
        &#8250;
      </button>
    </div>
  );
}
