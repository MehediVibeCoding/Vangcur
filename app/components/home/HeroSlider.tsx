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
  // 🌟 বাগ-১ সহায়ক ফিক্স (Image Pop / Secondary Drop):
  // ছবি ডাউনলোড/ডিকোড শেষ না হওয়া পর্যন্ত opacity-0 রাখা হয়, লোড হওয়ার
  // সাথে সাথে soft fade-in হয়। ফলে কার্ডের এন্ট্রি-অ্যানিমেশন শেষ হওয়ার
  // *পরে* ছবি আলাদাভাবে হঠাৎ "পপ" করে ওঠার সমস্যা আর থাকে না — দুটো
  // মোশন একসাথে একটাই মসৃণ অনুভূতি দেয়।
  const [loaded, setLoaded] = useState(false);

  return (
    <img
      className={`absolute inset-0 z-0 h-full w-full rounded-[inherit] object-cover object-top transition-[opacity,transform] duration-300 ease-brand group-hover:scale-[1.05] ${
        loaded ? 'opacity-100' : 'opacity-0'
      }`}
      src={src}
      alt={alt}
      loading={eager ? 'eager' : 'lazy'}
      fetchPriority={eager ? 'high' : undefined}
      decoding="async"
      onLoad={() => setLoaded(true)}
      onError={() => setLoaded(true)}
    />
  );
}

export default function HeroSlider({ initialCards, onCategoryClick }: HeroSliderProps) {
  const supabase = useRef(createClient()).current;

  // কার্ডের সংখ্যা সবসময় ১২-এর গুণিতকে নরমালাইজড
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

    if (animate) {
      track.style.transition = 'transform .48s cubic-bezier(.4,0,.2,1)';
      track.style.transform = `translateX(-${offset}px)`;
      return;
    }

    // 🌟 বাগ-২ ফিক্স (Yo-Yo Rewind Glitch — রুট কজ):
    // "transition: none" আর নতুন "transform" কখনোই একই টিকে (tick) সেট
    // করা যাবে না — নাহলে ব্রাউজারের ট্রানজিশন ইঞ্জিন "none" অবস্থাটা
    // কমিট হওয়ার আগেই পুরনো .48s ট্রানজিশন দিয়ে অফসেট-পরিবর্তনটাকেও
    // অ্যানিমেট করে ফেলে (দৃশ্যমান পেছন দিকে দোদুল্যমান/রিওয়াইন্ড গ্লিচ)।
    // তাই তিন ধাপে স্পষ্টভাবে ভাঙা হলো, প্রতি ধাপের মাঝে জোরপূর্বক রিফ্লো:
    //   ধাপ ১: transition বন্ধ করা
    //   ধাপ ২: void offsetHeight — "no-transition" অবস্থাটা ব্রাউজারে
    //           তাৎক্ষণিকভাবে কমিট/পেইন্ট করানো
    //   ধাপ ৩: এরপরই transform বদলানো — ফলে ০ms-এ অদৃশ্য ইনস্ট্যান্ট জাম্প
    //   ধাপ ৪: আরেকবার রিফ্লো ফোর্স — Safari/Chrome উভয়ের জন্য চূড়ান্ত নিশ্চয়তা
    track.style.transition = 'none';
    void track.offsetHeight;
    track.style.transform = `translateX(-${offset}px)`;
    void track.offsetHeight;
  }, []);

  const duoStep = useCallback((dir: number) => {
    const perPage = getDuoPerPage();
    const totalCards = cards.length;

    // 🌟 যদি Index 0-তে থাকা অবস্থায় ইউজার বামে ক্লিক করেন:
    // নিঃশব্দে ট্র্যাককে Set 2 (12)-তে জাম্প করিয়ে রিফ্লো করা হবে, তারপর 6-এ অ্যানিমেট হবে
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
      {/* 🌟 বাগ-১ ফিক্স: <style> ট্যাগটি কার্ড-মার্কআপের আগেই বসানো হলো, যাতে
          ব্রাউজার প্রথমে @keyframes/ক্লাস রেজিস্টার করে, তারপর কার্ড পার্স করে।
          এতে দুই গ্রুপ কার্ডের এন্ট্রি-অ্যানিমেশন টাইমিং কখনোই ডিসিঙ্ক হয় না। */}
      <style>{`
        @keyframes heroCardIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .hero-card-anim-in {
          animation: heroCardIn 0.38s cubic-bezier(0.16, 1, 0.3, 1) both;
          will-change: opacity, transform;
        }
        /* মোবাইলে (< 768px) ৩য়-৬ষ্ঠ কার্ড (data-hero-desktop-extra) এর
           এন্ট্রি-অ্যানিমেশন সম্পূর্ণ নিষ্ক্রিয় — ওগুলো শুধু ডেস্কটপেই
           প্রাথমিক ভিউতে থাকে, মোবাইলে সোয়াইপ করে দেখা যায় বলে সেখানে
           নতুন করে ফেড-ইন/পপ করার দরকার নেই। */
        @media (max-width: 767.98px) {
          .hero-card-anim-in[data-hero-desktop-extra='true'] {
            animation: none;
            opacity: 1;
            transform: none;
          }
        }
      `}</style>

      <div className="relative w-full touch-pan-y overflow-hidden bg-transparent" ref={wrapRef}>
        <div className="flex gap-3 bg-transparent" style={{ willChange: 'transform' }} ref={trackRef}>
          {tripled.map((card, i) => {
            const bg = card.bg || 'linear-gradient(155deg,#111,#222)';
            const catId = card.catId || 'all';
            const label = card.label || '';
            const isSvgEmoji = typeof card.emoji === 'string' && card.emoji.trim().startsWith('<svg');

            // 🌟 বাগ-১ ফিক্স: একটিমাত্র অভিন্ন ক্লাস (hero-card-anim-in) ও
            // একটিমাত্র ফর্মুলা (i * 0.03s) — কোনো দ্বৈত-ক্লাস শাখা (branch)
            // নেই বলে টাইমিং ডিসিঙ্কের কোনো সুযোগই নেই।
            //   i = 0, 1        → মোবাইল + ডেস্কটপ উভয়েই সবসময় অ্যানিমেট
            //   i = 2, 3, 4, 5  → শুধু ডেস্কটপে (>=768px) অ্যানিমেট
            const isFirstDuo = i < 2;
            const isDesktopExtra = i >= 2 && i < 6;
            const isInitialCard = isFirstDuo || isDesktopExtra;
            const staggerDelay = i * 0.03; // 0, .03, .06, .09, .12, .15
            const isEager = i < 6;

            return (
              <div
                data-cath-card
                key={`${catId}-${i}`}
                className="aspect-[9/16] w-[calc((100%-12px)/2)] min-h-[220px] shrink-0 sm:min-h-[280px] md:w-[calc((100%-60px)/6)]"
              >
                <div
                  className={`group relative flex h-full w-full cursor-pointer flex-col justify-end overflow-hidden rounded-[14px] bg-[#111] shadow-[0_4px_16px_rgba(0,0,0,.08)] transition-transform duration-300 ease-brand [-webkit-tap-highlight-color:transparent] hover:-translate-y-0.5 hover:scale-[1.006] active:scale-[.98] ${
                    isInitialCard ? 'hero-card-anim-in' : ''
                  }`}
                  data-hero-desktop-extra={isDesktopExtra ? 'true' : undefined}
                  style={{
                    background: bg,
                    animationDelay: isInitialCard ? `${staggerDelay}s` : undefined,
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
