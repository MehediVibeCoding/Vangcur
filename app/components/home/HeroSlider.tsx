'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { logWarn } from '@/lib/logger';
import { parseSupabaseVal } from '@/lib/categoryData';
import { sanitizeSvgHtml } from '@/lib/sanitize';
import { optimizeCloudinaryUrl } from '@/lib/cloudinaryUrl';

interface HeroCard {
  label: string;
  catId: string;
  emoji: string;
  img: string;
  bg: string;
}

const DUO_TOTAL = 13;
const AUTOPLAY_MS = 3500;
const HOVER_AUTOPLAY_MS = 7000;
const GAP = 12;

const CATH_CARD_DEFAULTS: HeroCard[] = [
  { label: 'Neon Lights', catId: 'rgb', emoji: '💡', img: 'https://res.cloudinary.com/dkjzleczw/image/upload/q_auto/f_auto/v1779333775/quality_restoration_20260521091638399_e24mi5.jpg', bg: 'linear-gradient(155deg,#0d1b0d,#1a3a1a,#0d2d1a)' },
  { label: 'Mini Printer', catId: 'unique', emoji: '✨', img: 'https://res.cloudinary.com/dkjzleczw/image/upload/q_auto/f_auto/v1779535309/Enhancer-AI_UHD-Like_20260521_213052_0000_tq4ud1.png', bg: 'linear-gradient(155deg,#0a1a0a,#1a3d1a,#0a2a0a)' },
  { label: 'Water Bottle', catId: 'waterbottle', emoji: '🍶', img: 'https://res.cloudinary.com/dkjzleczw/image/upload/q_auto/f_auto/v1779535309/Enhancer-AI_UHD-water_bottle_20260521_204516_0000_uim3et.png', bg: 'linear-gradient(155deg,#001a3d,#00285c,#003d7a)' },
  { label: 'RC Plan', catId: 'toys', emoji: '🧸', img: 'https://res.cloudinary.com/dkjzleczw/image/upload/q_auto/f_auto/v1779535315/RC_20260522_213519_0000_swwxnc.png', bg: 'linear-gradient(155deg,#1a0a00,#3d1f00,#5c2d00)' },
  { label: 'G Lamp', catId: 'light', emoji: '🕯️', img: 'https://res.cloudinary.com/dkjzleczw/image/upload/q_auto/f_auto/v1779535331/Enhancer-AI_UHD-Atmospher_20260521_200857_0000_c7ihlv.png', bg: 'linear-gradient(155deg,#1a0010,#3d0030,#1a0040)' },
  { label: 'Humidifier', catId: 'humidifier', emoji: '💧', img: 'https://res.cloudinary.com/dkjzleczw/image/upload/q_auto/f_auto/v1779535308/Enhancer-AI_UHD-RC_20260522_230738_0000_uearqd.png', bg: 'linear-gradient(155deg,#001a1a,#003d3d,#005252)' },
  { label: 'FAN', catId: 'fan', emoji: '💨', img: 'https://res.cloudinary.com/dkjzleczw/image/upload/q_auto/f_auto/v1779535311/Enhancer-AI_UHD-RC_20260522_230104_0000_etqeuv.png', bg: 'linear-gradient(155deg,#001a1a,#003d3d,#005252)' },
  { label: 'Alarm Clock', catId: 'alarmclock', emoji: '⏰', img: 'https://res.cloudinary.com/dkjzleczw/image/upload/q_auto/f_auto/v1779535315/Enhancer-Ultra_HD-alarm_20260521_193333_0000_o7l1t1.png', bg: 'linear-gradient(155deg,#0a0a2a,#1a1a5c,#0a0a3d)' },
  { label: 'Moon Lamp', catId: 'light', emoji: '🕯️', img: 'https://res.cloudinary.com/dkjzleczw/image/upload/q_auto/f_auto/v1779535314/Enhancer-Ultra_HD-Untitled_design_20260521_184307_0000_oqwt8c.png', bg: 'linear-gradient(155deg,#1a1a0a,#3d3d00,#2a2a00)' },
  { label: 'Crystal Ball', catId: 'crystalball', emoji: '🔮', img: 'https://res.cloudinary.com/dkjzleczw/image/upload/q_auto/f_auto/v1779535320/Enhancer-Ultra_HD-Zone_20260521_192104_0000_bwnsxc.png', bg: 'linear-gradient(155deg,#0a0a2a,#1a1a5c,#0a0a3d)' },
  { label: 'TWS', catId: 'tws', emoji: '🎧', img: 'https://res.cloudinary.com/dkjzleczw/image/upload/q_auto/f_auto/v1779535323/quality_restoration_20260522065341115_eh8yle.png', bg: 'linear-gradient(155deg,#1a0020,#3d0050,#2d0070)' },
  { label: 'Power Bank', catId: 'powerbank', emoji: '🔋', img: 'https://res.cloudinary.com/dkjzleczw/image/upload/q_auto/f_auto/v1779535311/Enhancer-AI_UHD-Power_20260523_104015_0000_aa9euv.png', bg: 'linear-gradient(155deg,#1a0a00,#3d1f00,#5c2d00)' },
  { label: 'Headphone', catId: 'headphone', emoji: '🎧', img: 'https://res.cloudinary.com/dkjzleczw/image/upload/q_auto/f_auto/v1779535317/Enhancer-Ultra_HD-Untitled_design_20260523_080608_0000_offzxw.png', bg: 'linear-gradient(155deg,#00101a,#001f3d,#003366)' },
];

function padCards(arr: unknown): HeroCard[] {
  const padded: HeroCard[] = Array.isArray(arr) ? arr.slice() : [];
  while (padded.length < DUO_TOTAL) {
    const idx = padded.length;
    padded.push(CATH_CARD_DEFAULTS[idx] || CATH_CARD_DEFAULTS[0]);
  }
  return padded.slice(0, DUO_TOTAL);
}

function getDuoPerPage(): number {
  if (typeof window === 'undefined') return 2;
  return window.innerWidth >= 769 ? 6 : 2;
}

interface HeroSliderProps {
  onCategoryClick?: (catId: string) => void;
}

export default function HeroSlider({ onCategoryClick }: HeroSliderProps) {
  const supabase = useRef(createClient()).current;
  const [cards, setCards] = useState<HeroCard[]>(CATH_CARD_DEFAULTS);
  const wrapRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const duoIdxRef = useRef(DUO_TOTAL);
  const autoTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pausedRef = useRef(false);
  const infiniteJumpRef = useRef(false);
  const dragRef = useRef({ active: false, startX: 0 });
  const touchRef = useRef({ startX: 0, startY: 0 });
  const resizeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keeps duoIdxRef.current inside [DUO_TOTAL, DUO_TOTAL*2) no matter how far it has
  // drifted. Normally onTransitionEnd corrects drift one DUO_TOTAL at a time, but that
  // relies on the 'transitionend' event actually firing — which browsers skip for
  // hidden/background tabs. Autoplay's setInterval keeps ticking (throttled, not
  // stopped) while a tab is backgrounded, so duoIdxRef can drift by many multiples of
  // DUO_TOTAL during a long background period. Modulo (not a single ± DUO_TOTAL step)
  // is what makes this recovery work regardless of how large that drift got.
  const normalizeIdx = () => {
    const span = DUO_TOTAL;
    const idx = duoIdxRef.current;
    if (idx >= span && idx < span * 2) return;
    duoIdxRef.current = ((idx - span) % span + span) % span + span;
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
    if (!wrapWidth || wrapWidth < 50) { setTimeout(() => setPosition(animate), 150); return; }
    const cardWidth = Math.floor((wrapWidth - GAP * (perPage - 1)) / perPage);
    if (!cardWidth || cardWidth < 10) return;
    allCards.forEach((c) => {
      c.style.width = cardWidth + 'px';
      c.style.minWidth = cardWidth + 'px';
      c.style.flexShrink = '0';
    });
    const offset = duoIdxRef.current * (cardWidth + GAP);
    track.style.transition = animate ? 'transform .42s cubic-bezier(.4,0,.2,1)' : 'none';
    track.style.transform = `translateX(-${offset}px)`;
  }, []);

  const duoStep = useCallback((dir: number) => {
    const perPage = getDuoPerPage();
    duoIdxRef.current += dir * perPage;
    setPosition(true);
  }, [setPosition]);

  const startAuto = useCallback(() => {
    if (autoTimerRef.current) clearInterval(autoTimerRef.current);
    autoTimerRef.current = setInterval(() => {
      if (!pausedRef.current) duoStep(1);
    }, AUTOPLAY_MS);
  }, [duoStep]);

  useEffect(() => {
    const wrap = wrapRef.current;
    const track = trackRef.current;
    if (!wrap || !track) return;
    requestAnimationFrame(() => requestAnimationFrame(() => setPosition(false)));
    startAuto();

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
        autoTimerRef.current = setInterval(() => { if (!pausedRef.current) duoStep(1); }, HOVER_AUTOPLAY_MS);
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
        setPosition(false);
        infiniteJumpRef.current = false;
      } else if (duoIdxRef.current < DUO_TOTAL) {
        infiniteJumpRef.current = true;
        duoIdxRef.current += DUO_TOTAL;
        setPosition(false);
        infiniteJumpRef.current = false;
      }
    };
    const onResize = () => {
      // পিঞ্চ/জুম গেসচারের সময় ট্রিগার হওয়া resize ইভেন্টে state আপডেট
      // (এবং তার ফলে re-render/repaint) সম্পূর্ণ বন্ধ রাখা হচ্ছে।
      if (typeof window !== 'undefined' && window.visualViewport && window.visualViewport.scale !== 1) {
        return;
      }
      if (resizeTimerRef.current) clearTimeout(resizeTimerRef.current);
      resizeTimerRef.current = setTimeout(() => {
        duoIdxRef.current = DUO_TOTAL;
        requestAnimationFrame(() => requestAnimationFrame(() => setPosition(false)));
      }, 200);
    };
    // Legacy bug fix (2026-08-05): while this tab is hidden, 'transitionend' never
    // fires (browsers don't run CSS transitions on hidden tabs), so onTransitionEnd's
    // wrap-around correction never runs — but the setInterval below keeps ticking
    // (throttled) regardless, so duoIdxRef can drift into the thousands during a long
    // background period. Left alone, the next paint jumps the track translateX() far
    // outside the viewport — the whole slider goes blank until a hard refresh resets
    // duoIdxRef via a fresh component instance. Pausing here (not just relying on
    // normalizeIdx() as a safety net) also avoids wasting the interval/CPU while hidden.
    const onDocVisibility = () => {
      if (document.hidden) {
        pausedRef.current = true;
        if (autoTimerRef.current) { clearInterval(autoTimerRef.current); autoTimerRef.current = null; }
      } else {
        setPosition(false); // instant resnap first — normalizeIdx() runs inside this
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
      if (autoTimerRef.current) clearInterval(autoTimerRef.current);
      if (resizeTimerRef.current) clearTimeout(resizeTimerRef.current);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    try {
      const cached = localStorage.getItem('vc_cath_cache');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length) setCards(padCards(parsed));
      }
    } catch {
      // cache read failed, ignore
    }

    const fetchCards = async () => {
      try {
        const { data, error } = await supabase
          .from('store_settings')
          .select('setting_value')
          .eq('setting_key', 'vc_cath_cards')
          .maybeSingle();
        if (error || !data) return;
        const parsedVal = parseSupabaseVal<unknown>(data.setting_value);
        if (Array.isArray(parsedVal) && parsedVal.length) {
          const padded = padCards(parsedVal);
          setCards(padded);
          try { localStorage.setItem('vc_cath_cache', JSON.stringify(padded)); } catch {
            // storage unavailable, ignore
          }
        }
      } catch (e) {
        logWarn('Hero card fetch failed:', e);
      }
    };
    fetchCards();

    const onVisible = () => { if (document.visibilityState === 'visible') fetchCards(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [supabase]);

  useEffect(() => {
    requestAnimationFrame(() => setPosition(false));
  }, [cards, setPosition]);

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
    <div className="relative bg-transparent p-3.5 pb-0">
      <div className="relative w-full touch-pan-y overflow-hidden bg-transparent" ref={wrapRef}>
        <div className="flex gap-3 bg-transparent px-0.5" style={{ transition: 'transform .42s cubic-bezier(.4,0,.2,1)', willChange: 'transform' }} ref={trackRef}>
          {tripled.map((card, i) => {
            const bg = card.bg || 'linear-gradient(155deg,#111,#222)';
            const catId = card.catId || 'all';
            const label = card.label || '';
            // tripled অ্যারেতে ৩টা কপি আছে (infinite-loop স্লাইডারের জন্য), কিন্তু
            // প্রথম পেইন্টে আসলে দেখা যায় শুধু মাঝের কপি থেকে duoIdxRef.current
            // (=DUO_TOTAL) ইনডেক্স থেকে শুরু করা কার্ডগুলো (মোবাইলে ২টা, ডেস্কটপে
            // ৬টা)। আগে প্রতিটা কপির প্রথম ২টা কার্ডকে eager+high-priority
            // ধরা হতো (মোট ৬টা ছবি), যার মধ্যে ৪টা আসলে পর্দার বাইরে থাকা
            // ডুপ্লিকেট কপি — এগুলো অহেতুক নেটওয়ার্ক/প্রায়োরিটি খেয়ে আসল LCP
            // ছবিটাকে দেরি করাচ্ছিল। এখন শুধু মাঝের কপির প্রথম ৬টা কার্ডকেই
            // eager রাখা হচ্ছে (মোবাইলে ২টা দৃশ্যমান + ডেস্কটপে বাকি ৪টা কভার করে)।
            const isEager = i >= DUO_TOTAL && i < DUO_TOTAL + 6;
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
                  <img
                    className="absolute inset-0 z-0 h-full w-full rounded-[inherit] object-cover object-top transition-transform duration-[550ms] ease-brand group-hover:scale-[1.07]"
                    src={optimizeCloudinaryUrl(card.img)}
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
      >
        &#8249;
      </button>
      <button
        className="absolute right-0.5 top-[calc(50%-14px)] z-20 hidden h-[38px] w-[38px] -translate-y-1/2 items-center justify-center rounded-full bg-white/[.94] text-[22px] font-bold leading-none text-ink shadow-[0_4px_16px_rgba(0,0,0,.22)] transition-all duration-200 ease-out hover:scale-110 hover:bg-white hover:shadow-[0_6px_22px_rgba(0,0,0,.28)] md:flex"
        onClick={() => duoStep(1)}
      >
        &#8250;
      </button>
    </div>
  );
}
