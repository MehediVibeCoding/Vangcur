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
} from '@/lib/heroSliderData';

// সার্ভারে useLayoutEffect ওয়ার্নিং এড়াতে — ব্রাউজারে সবসময় useLayoutEffect,
// প্রথম পেইন্টের আগেই ট্র্যাকের পজিশন বসিয়ে দেয়, তাই "ভুল স্লাইড" এক মুহূর্তের
// জন্যও দেখা যায় না → hero card entrance আর ভেঙে ভেঙে আসবে না
const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

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

// ⚠️ আগে <img> ট্যাগের নিজস্ব কোনো opacity/fade ছিল না — ছবিটা যখনই নেটওয়ার্ক
// থেকে লোড শেষ হতো, ব্রাউজার সরাসরি পেইন্ট করে দিত। কিন্তু কার্ডের entrance
// animation (motion.div, opacity 0→1) সম্পূর্ণ সময়-ভিত্তিক (mount + 500ms) —
// ছবি রেডি কিনা তার সাথে এর কোনো সম্পর্ক ছিল না। ফলে ছবি লোড হতে দেরি হলে
// (স্লো নেটওয়ার্ক/কোল্ড ক্যাশ), কার্ড ততক্ষণে opacity:1 হয়ে "flat color
// placeholder" (card.bg) দেখাচ্ছিল, আর ছবি রেডি হওয়ামাত্র সেই পুরোপুরি-visible
// কার্ডের ওপর সরাসরি "পপ" করে বসে যেত — কোনো fade ছাড়াই। এটাই "ভেঙে ভেঙে/
// আটকে আটকে" এন্ট্রি অ্যানিমেশন দেখানোর আসল কারণ ছিল।
//
// ফিক্স: ছবিকে নিজের load-state অনুযায়ী আলাদাভাবে fade করানো হচ্ছে (parent-
// container timer থেকে সম্পূর্ণ স্বাধীন)। CSS-এ nested opacity গুণ হয় বলে,
// container fade হয়ে গেলেও ছবি লোড না-হওয়া পর্যন্ত অদৃশ্য থাকে (card.bg
// গ্রেডিয়েন্ট placeholder হিসেবে দেখা যায়), আর লোড শেষ হওয়ামাত্র নিজের
// ৪২০ms transition দিয়ে সেই গ্রেডিয়েন্টের ওপর মসৃণভাবে fade করে বসে — কোনো
// আকস্মিক পপ থাকে না।
function HeroCardImage({
  src,
  alt,
  eager,
}: {
  src: string;
  alt: string;
  eager: boolean;
}) {
  const imgRef = useRef<HTMLImageElement>(null);
  const [loaded, setLoaded] = useState(false);

  // ব্রাউজার ক্যাশ থেকে ইনস্ট্যান্ট লোড হওয়া ছবির জন্য — এক্ষেত্রে onLoad
  // ইভেন্ট React attach করার আগেই ফায়ার হয়ে যেতে পারে, তাই mount-এর পরে
  // .complete চেক করে নেওয়া হচ্ছে যাতে কার্ড অকারণে অদৃশ্য আটকে না থাকে।
  useEffect(() => {
    if (imgRef.current?.complete) setLoaded(true);
  }, []);

  return (
    <img
      ref={imgRef}
      // eslint-disable-next-line @next/next/no-img-element
      className={`absolute inset-0 z-0 h-full w-full rounded-[inherit] object-cover object-top transition-[opacity,transform] duration-[420ms] ease-brand group-hover:scale-[1.05] ${
        loaded ? 'opacity-100' : 'opacity-0'
      }`}
      src={src}
      alt={alt}
      loading={eager ? 'eager' : 'lazy'}
      fetchPriority={eager ? 'high' : undefined}
      decoding="async"
      onLoad={() => setLoaded(true)}
    />
  );
}

export default function HeroSlider({ initialCards, onCategoryClick }: HeroSliderProps) {
  const supabase = useRef(createClient()).current;
  const [cards, setCards] = useState<HeroCard[]>(
    initialCards && initialCards.length ? initialCards : DEFAULT_HERO_CARDS
  );
  const wrapRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const duoIdxRef = useRef(globalSavedIndex);
  const autoTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isInteractingRef = useRef(false);
  const infiniteJumpRef = useRef(false);
  const dragRef = useRef({ active: false, startX: 0 });
  const touchRef = useRef({ startX: 0, startY: 0 });
  const isVisibleRef = useRef(true);

  // ⚠️ আগে setPosition()-এর শুরুতেই normalizeIdx() কল হতো — মানে
  // duoIdxRef.current যখনই [span, span*2) রেঞ্জের বাইরে যেত (যেমন লাস্ট
  // কার্ডে থাকা অবস্থায় আবার "পরে" চাপলে), সেটা transform-animate করার
  // *আগেই* mod করে আবার শুরুর রেঞ্জে স্ন্যাপ করে ফেলত। ফলে ব্রাউজার
  // "পরের কার্ডে এগিয়ে তারপর লুপ" না দেখিয়ে সরাসরি "পিছিয়ে শুরুতে
  // ব্যাক" করে animate করত — কারণ যে ইনডেক্সে animate হচ্ছিল সেটা
  // ততক্ষণে already normalize হয়ে গেছে। onTransitionEnd-এর ভেতরের
  // normalize/wrap-back লজিকটা (transition শেষ হওয়ার পরে, নিঃশব্দে রিসেট
  // করার জন্য বানানো) তাই কখনো আসল কাজে লাগত না।
  //
  // ফিক্স: এখান থেকে normalizeIdx() বাদ — animate সবসময় আসল
  // (un-normalized) duoIdxRef.current মেনে চলবে, তাই ৩ নম্বর (শেষ) কপিতে
  // স্মুথভাবে এগিয়ে যাবে। রেঞ্জ-বাইরে যাওয়ার পর wrap-back করাটা এখন
  // পুরোপুরি onTransitionEnd-এর দায়িত্বে, যেটা transition শেষ হওয়ার
  // পরে animate=false দিয়ে নিঃশব্দে (কোনো visible jump ছাড়া) মাঝের
  // কপিতে ফিরিয়ে আনে।
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

  useIsomorphicLayoutEffect(() => {
    const wrap = wrapRef.current;
    const track = trackRef.current;
    if (!wrap || !track) return;

    // আগে এটা requestAnimationFrame-এ ছিল, ফলে প্রথম পেইন্টে ব্রাউজার
    // ভুল (untransformed) স্লাইড এক ফ্রেমের জন্য দেখিয়ে দিত, তারপর হঠাৎ
    // মাঝের সেটে "জাম্প" করত — এটাই কার্ড এনিমেশন ভেঙে ভেঙে আসার কারণ।
    // useLayoutEffect পেইন্টের আগেই সিঙ্ক্রোনাসলি চলে, তাই jump/flash হয় না।
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

  // প্রথমেই দেখা যাওয়া কার্ডগুলোর (মোবাইলে ২টা, ল্যাপটপে ৬টা) ছবি আগে থেকে
  // preload করা হচ্ছে — নাহলে lazy-load-এর কারণে placeholder gradient থেকে
  // আসল ছবিতে হঠাৎ পপ করে বদলে যায় (এন্ট্রি অ্যানিমেশনের মাঝেই)।
  useEffect(() => {
    if (typeof window === 'undefined' || !cards.length) return;
    const count = Math.min(getDuoPerPage(), cards.length);
    const existing = Array.from(
      document.head.querySelectorAll('link[rel="preload"][as="image"]')
    ).map((l) => l.getAttribute('href'));
    const created: HTMLLinkElement[] = [];

    for (let idx = 0; idx < count; idx++) {
      const src = cards[idx]?.img;
      if (!src) continue;
      const href = optimizeCloudinaryUrl(src, 360);
      if (existing.includes(href)) continue;
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = href;
      link.setAttribute('fetchpriority', 'high');
      document.head.appendChild(link);
      created.push(link);
    }

    return () => created.forEach((l) => l.remove());
  }, [cards]);

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
            // ⚠️ এটা আগে একবার ৬-এ বাড়ানো হয়েছিল (ডেস্কটপের ৬-কার্ড পেজ কভার
            // করতে), কিন্তু তাতে মোবাইলে (যেখানে একসাথে মাত্র ২টা কার্ড দেখা
            // যায়) ৬টা ছবি একসাথে high-priority fetch+decode হতে গিয়ে মেইন
            // থ্রেডে বাড়তি চাপ তৈরি করছিল — ঠিক entrance animation চলার সময়েই,
            // যেটা সেই "মাঝখানে থেমে যাওয়া" freeze-এ অবদান রাখছিল। নিচের
            // preload useEffect (getDuoPerPage()-ভিত্তিক) already ডেস্কটপের
            // ৬টা ছবি আগেভাগে <link rel=preload> দিয়ে ক্যাশে নিয়ে আসে, তাই
            // এখানে <img> ট্যাগের eager/fetchPriority প্রথম ২টাতেই যথেষ্ট।
            const isEager = i >= DUO_TOTAL && i < DUO_TOTAL + 2;
            const isSvgEmoji = typeof card.emoji === 'string' && card.emoji.trim().startsWith('<svg');

            // ⚠️ আগে এখানে শুধু মাঝের কপিকে (i >= DUO_TOTAL) "initial visible"
            // (opacity:0 দিয়ে শুরু) ধরা হতো, প্রথম কপিকে (i < DUO_TOTAL) সবসময়
            // "already visible" (opacity:1) ধরা হতো — এটাই আসল ফ্লিকারের কারণ:
            // হাইড্রেশনের আগে ব্রাউজার track-এ কোনো transform ছাড়াই প্রথম paint
            // করে (transform বসে useIsomorphicLayoutEffect-এ, যেটা JS লোড হওয়ার
            // পরেই চলে), ফলে আসলে ভিউপোর্টে প্রথম কপিটাই (opacity:1, পুরোপুরি
            // দৃশ্যমান) দেখা যায়। তারপর সেই layout effect চলে ও ট্র্যাককে
            // মাঝের কপিতে স্ন্যাপ করে দেয় — আর মাঝের কপির কার্ডগুলো তখন থেকেই
            // opacity:0 (SSR-এ বেকড) অবস্থায় ছিল। ফলাফল: ইউজার প্রথমে প্রথম
            // কপির দৃশ্যমান কার্ড দেখতো → স্ন্যাপের সাথে সাথে হঠাৎ invisible
            // মাঝের কপিতে বদলে যেত → তারপর সেগুলো আবার fade-in-up হতো —
            // ঠিক যে "flash → hide → fade in" গ্লিচটা রিপোর্ট করা হয়েছে।
            //
            // ফিক্স: DUO_TOTAL-ভিত্তিক absolute ইনডেক্সের বদলে cards.length
            // দিয়ে mod করা আপেক্ষিক পজিশন ব্যবহার করা হচ্ছে, তাই তিনটা কপিরই
            // (0..5) নম্বর কার্ডগুলো সবসময় একই initial/opacity state শেয়ার
            // করে — হাইড্রেশনের আগে বা পরে যে কপিটাই আঁকা হোক না কেন, state
            // সবসময় সামঞ্জস্যপূর্ণ থাকে, তাই কোনো visible→invisible ঝাটকা আর
            // হয় না, শুধু একটামাত্র মসৃণ fade-in-up.
            const relativePos = ((i % cards.length) + cards.length) % cards.length;
            // শুধু মাঝের (আসলে-দৃশ্যমান) কপিতেই entrance animation — আগে-পরের
            // দুইটা ডুপ্লিকেট কপিতে animation বন্ধ, কারণ ওগুলো পর্দার বাইরে
            // থাকে বলে অ্যানিমেট করার দরকারই নেই। আগে শুধু relativePos-ভিত্তিক
            // চেকে তিনটা কপিরই প্রথম ৬টা কার্ড (মোট ১৮টা motion.div) একসাথে
            // অ্যানিমেট হতো, যেটা mount-এর সময় main thread ব্লক করে দিত এবং
            // এন্ট্রি অ্যানিমেশনটাকে "আটকে আটকে" দেখাত।
            const isVisibleCopy = i >= cards.length && i < cards.length * 2;
            const isInitialVisible = isVisibleCopy && relativePos < Math.min(6, cards.length);
            const staggerDelay = isInitialVisible ? relativePos * 0.08 : 0;

            return (
              <div
                data-cath-card
                key={`${catId}-${i}`}
                className="aspect-[9/16] w-[calc((100%-12px)/2)] min-h-[220px] shrink-0 sm:min-h-[280px] md:w-[calc((100%-60px)/6)]"
              >
                {/*
                  ⚠️ আগে এখানে Framer Motion (`motion.div`, JS/requestAnimationFrame
                  দিয়ে প্রতি ফ্রেমে opacity+translateY ক্যালকুলেট করত) ব্যবহার হতো।
                  সমস্যা: ঠিক mount-এর সময়েই আরও কয়েকটা জিনিস মেইন থ্রেড দখল
                  করছিল — navbar-এর কাস্টম ফন্ট সোয়াপ, একসাথে একাধিক হিরো ইমেজ
                  ডিকোড হওয়া, আর প্রতিটা ছবি লোড হলে HeroCardImage-এর নিজের
                  React state আপডেট (রি-রেন্ডার)। মেইন থ্রেড ব্যস্ত থাকা অবস্থায়
                  JS-চালিত অ্যানিমেশনের ফ্রেম আপডেট হওয়ার সময় পেত না, ফলে কার্ড
                  (আর তার ভেতরের লেবেল টেক্সট, যেটা একই এলিমেন্টের সন্তান) মাঝ
                  পথে "জমে/থেমে" যেত, থ্রেড ফ্রি হলে আবার নড়া শুরু করত।

                  ফিক্স: প্লেইন CSS `@keyframes` animation (নিচে <style> ট্যাগে
                  সংজ্ঞায়িত, দেখো heroCardIn) — transform আর opacity-র CSS
                  animation ব্রাউজারের compositor থ্রেডে চলে, মেইন থ্রেড যতই
                  ব্যস্ত থাকুক না কেন থামে/জমে না। স্ট্যাগার ডিলে এখন
                  animation-delay ইনলাইন স্টাইল দিয়ে করা হচ্ছে (আগে framer-motion-
                  এর delay prop দিয়ে হতো)।
                */}
                <div
                  className={`group relative flex h-full w-full cursor-pointer flex-col justify-end overflow-hidden rounded-[14px] bg-[#111] shadow-[0_4px_16px_rgba(0,0,0,.08)] transition-transform duration-300 ease-brand [-webkit-tap-highlight-color:transparent] hover:-translate-y-0.5 hover:scale-[1.006] active:scale-[.98] ${
                    isInitialVisible ? 'animate-hero-card-in' : ''
                  }`}
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

      {/*
        heroCardIn কীফ্রেমটা এখানে একবারই রেন্ডার হচ্ছে (প্রতিটা কার্ডে না)।
        `both` fill-mode ব্যবহার করা হয়েছে যাতে animation-delay চলাকালীন
        কার্ড শুরুর (opacity:0) অবস্থায় থাকে, আর শেষ হওয়ার পরেও চূড়ান্ত
        (opacity:1) অবস্থাতেই আটকে থাকে — কোনো ফ্ল্যাশ ছাড়াই।
      */}
      <style>{`
        @keyframes heroCardIn {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-hero-card-in {
          animation: heroCardIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) both;
          will-change: opacity, transform;
        }
      `}</style>

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
