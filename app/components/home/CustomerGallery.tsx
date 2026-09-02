'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { createClient } from '@/lib/supabase/client';
import { logWarn } from '@/lib/logger';
import { optimizeCloudinaryUrl } from '@/lib/cloudinaryUrl';
import { useT } from '@/lib/i18n/useT';

interface Review {
  id: number | string;
  image_url?: string | null;
  like_count?: number | string | null;
  created_at?: string;
  liked?: boolean;
}

const AUTOPLAY_MS = 5200;
const RESUME_DELAY_MS = 3200;

function CameraPhotoIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}

function HeartIcon({ filled = false }: { filled?: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill={filled ? '#FF5A6E' : 'none'} stroke={filled ? '#FF5A6E' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
    </svg>
  );
}

function ChevronIcon({ dir }: { dir: 'left' | 'right' }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d={dir === 'left' ? 'M15 18l-6-6 6-6' : 'M9 18l6-6-6-6'} />
    </svg>
  );
}

function PackageFallbackIcon() {
  return (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className="text-white/40">
      <path d="M16.5 9.4 7.55 4.24a1.8 1.8 0 0 0-1.8 0L2.5 6.1a1.8 1.8 0 0 0-.9 1.56v8.68a1.8 1.8 0 0 0 .9 1.56l3.25 1.86a1.8 1.8 0 0 0 1.8 0l8.95-5.16a1.8 1.8 0 0 0 .9-1.56V9.4z" />
      <polyline points="3.29 7 12 12 20.71 7" />
      <line x1="12" y1="22" x2="12" y2="12" />
    </svg>
  );
}

export default function CustomerGallery() {
  const { t, lang } = useT();
  const supabase = useRef(createClient()).current;
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const [zoomedId, setZoomedId] = useState<number | string | null>(null);
  const [panOrigin, setPanOrigin] = useState('center center');
  const [beatId, setBeatId] = useState<number | string | null>(null);

  const reviewsRef = useRef<Review[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | ReturnType<typeof setTimeout> | null>(null);
  const pausedRef = useRef(false);
  const activeWrapRef = useRef<HTMLDivElement>(null);

  const dragRef = useRef({ startX: 0, startY: 0, isDown: false, dragged: false });

  useEffect(() => { reviewsRef.current = reviews; }, [reviews]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase
          .from('customer_reviews')
          .select('id,image_url,like_count,created_at')
          .order('created_at', { ascending: false })
          .limit(30);
        if (!cancelled && !error && data && data.length > 0) {
          setReviews((data as Review[]).map((r) => ({ ...r, liked: false })));
          setActiveIdx(0);
        }
      } catch {
        // network fallback
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => { cancelled = true; };
  }, [supabase]);

  const resetAutoplay = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (!reviewsRef.current.length) return;
    timerRef.current = setInterval(() => {
      if (pausedRef.current) return;
      const totalCount = reviewsRef.current.length;
      if (!totalCount) return;
      setActiveIdx((cur) => (cur + 1) % totalCount);
    }, AUTOPLAY_MS);
  }, []);

  useEffect(() => {
    resetAutoplay();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [reviews.length, resetAutoplay]);

  const goTo = useCallback((idx: number) => {
    if (!reviewsRef.current.length) return;
    setActiveIdx(idx);
    resetAutoplay();
  }, [resetAutoplay]);

  const slide = useCallback((dir: number) => {
    const totalCount = reviewsRef.current.length;
    if (!totalCount) return;
    goTo((activeIdx + dir + totalCount) % totalCount);
  }, [activeIdx, goTo]);

  const handleMouseEnter = () => { pausedRef.current = true; };
  const handleMouseLeave = () => {
    dragRef.current.isDown = false;
    pausedRef.current = false;
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    pausedRef.current = true;
    if (timerRef.current) clearInterval(timerRef.current);
    dragRef.current.startX = e.touches[0].clientX;
    dragRef.current.startY = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - dragRef.current.startX;
    const dy = e.changedTouches[0].clientY - dragRef.current.startY;
    if (Math.abs(dx) > 35 && Math.abs(dx) > Math.abs(dy)) {
      slide(dx < 0 ? 1 : -1);
    }
    pausedRef.current = false;
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setTimeout(() => {
      resetAutoplay();
    }, RESUME_DELAY_MS);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    dragRef.current.isDown = true;
    dragRef.current.dragged = false;
    dragRef.current.startX = e.clientX;
    pausedRef.current = true;
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragRef.current.isDown) return;
    const dx = e.clientX - dragRef.current.startX;
    if (Math.abs(dx) > 10) {
      dragRef.current.dragged = true;
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (dragRef.current.isDown && dragRef.current.dragged) {
      const dx = e.clientX - dragRef.current.startX;
      if (Math.abs(dx) > 35) {
        slide(dx < 0 ? 1 : -1);
      }
    }
    dragRef.current.isDown = false;
    pausedRef.current = false;
    resetAutoplay();
  };

  const handleCardClick = (idx: number, review: Review) => {
    if (dragRef.current.dragged) return;
    if (idx !== activeIdx) {
      goTo(idx);
      return;
    }
    if (!review.image_url) return;
    setZoomedId((cur) => {
      if (cur === review.id) {
        pausedRef.current = false;
        setPanOrigin('center center');
        resetAutoplay();
        return null;
      }
      pausedRef.current = true;
      if (timerRef.current) clearInterval(timerRef.current);
      return review.id;
    });
  };

  useEffect(() => {
    const wrap = activeWrapRef.current;
    if (!wrap || !zoomedId) return undefined;

    const pan = (clientX: number, clientY: number) => {
      const rect = wrap.getBoundingClientRect();
      const x = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const y = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));
      setPanOrigin(`${(x * 100).toFixed(1)}% ${(y * 100).toFixed(1)}%`);
    };
    const onMouseMove = (e: MouseEvent) => pan(e.clientX, e.clientY);
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        e.preventDefault();
        pan(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    wrap.addEventListener('mousemove', onMouseMove);
    wrap.addEventListener('touchmove', onTouchMove, { passive: false });
    return () => {
      wrap.removeEventListener('mousemove', onMouseMove);
      wrap.removeEventListener('touchmove', onTouchMove);
    };
  }, [zoomedId]);

  const handleHeart = (e: React.MouseEvent, review: Review) => {
    e.stopPropagation();
    if (review.liked) return;
    const newCount = (parseInt(String(review.like_count), 10) || 0) + 1;

    setReviews((prev) => prev.map((r) => (
      r.id === review.id ? { ...r, liked: true, like_count: newCount } : r
    )));
    setBeatId(review.id);
    setTimeout(() => setBeatId((cur) => (cur === review.id ? null : cur)), 400);

    if (review.id) {
      (async () => {
        try {
          const { error } = await supabase
            .from('customer_reviews')
            .update({ like_count: newCount })
            .eq('id', review.id);
          if (error) logWarn('Like update failed:', error);
        } catch (err) {
          logWarn('Like update failed:', err);
        }
      })();
    }
  };

  const totalReviews = reviews.length;

  const headerBlock = (
    <div className="mb-8 text-center">
      <div className="mb-2.5 inline-flex items-center gap-1.5 rounded-full border border-brand-light/40 bg-white/80 px-3.5 py-1 font-body text-[11px] font-bold uppercase tracking-wider text-brand-light shadow-xs backdrop-blur-md">
        <CameraPhotoIcon />
        <span>{lang === 'en' ? 'Customer Unboxing' : 'কাস্টমার আনবক্সিং'}</span>
      </div>
      
      <h2 className="font-body text-2xl font-extrabold text-ink sm:text-[28px]">
        {lang === 'en' ? (
          <>Unboxing <span className="text-brand-light">Gallery</span></>
        ) : (
          <>Unboxing <span className="text-brand-light">গ্যালারি</span></>
        )}
      </h2>
      
      <p className="mt-1.5 font-body text-[13px] text-muted sm:text-[14px]">
        {lang === 'en'
          ? 'Happy moments and authentic unboxing experiences from our customers'
          : 'আমাদের আসল গ্রাহকদের আনন্দময় আনবক্সিং মুহূর্ত ও অভিজ্ঞতা'}
      </p>
    </div>
  );

  if (loaded && totalReviews === 0) {
    return (
      <section className="mx-auto mb-14 max-w-[1300px] px-4 sm:px-5">
        {headerBlock}
        <div className="rounded-[22px] border border-border-base/80 bg-white/70 py-10 text-center font-body text-sm font-semibold text-muted shadow-xs backdrop-blur-sm">
          <p>{t('এখনো কোনো রিভিউ নেই।')}</p>
        </div>
      </section>
    );
  }

  return (
    // রিভিউ Supabase থেকে async লোড হওয়ার আগ পর্যন্ত এই section-টা mount-ই হয় না,
    // তাই ডেটা আসামাত্র এখানে motion.section-এর initial→animate ফায়ার হয়ে
    // পুরনো ওয়েবসাইটের মতো হালকা fade-up দিয়ে গ্যালারিটা দেখা যায় — হুট করে পপ-ইন করে না
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
      className="mx-auto mb-16 max-w-[1300px] px-4 sm:px-5"
    >
      {headerBlock}

      {totalReviews > 0 && (
        <div
          className="relative mx-auto w-full max-w-[960px] select-none"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        >
          {/* ৩D সমান্তরাল কভারফ্লো ভিউপোর্ট — নিখুঁত গ্যাপ সহ */}
          <div className="relative h-[390px] sm:h-[450px] md:h-[490px] w-full flex items-center justify-center">
            {reviews.map((r, i) => {
              let offset = (i - activeIdx + totalReviews) % totalReviews;
              if (offset > totalReviews / 2) offset -= totalReviews;

              const isActive = offset === 0;
              const isLeft = offset === -1;
              const isRight = offset === 1;
              const isFarLeft = offset === -2;
              const isFarRight = offset === 2;
              const isVisible = Math.abs(offset) <= 2;

              if (!isVisible) return null;

              const isZoomed = isActive && zoomedId === r.id;
              const imgUrl = r.image_url && (r.image_url.startsWith('http') || r.image_url.startsWith('//'))
                ? r.image_url : null;
              const likeCount = parseInt(String(r.like_count), 10) || 0;

              // নিখুঁত গ্যাপ নিশ্চিতকারী ট্রান্সফর্ম স্টাইল
              let transformStyle = '';
              let zIndex = 0;
              let opacity = 0;
              let pointerEvents: 'auto' | 'none' = 'none';

              if (isActive) {
                transformStyle = 'translate3d(0, 0, 0) scale(1)';
                zIndex = 20;
                opacity = 1;
                pointerEvents = 'auto';
              } else if (isLeft) {
                transformStyle = 'translate3d(-102%, 0, 0) scale(0.85)';
                zIndex = 10;
                opacity = 0.65;
                pointerEvents = 'auto';
              } else if (isRight) {
                transformStyle = 'translate3d(102%, 0, 0) scale(0.85)';
                zIndex = 10;
                opacity = 0.65;
                pointerEvents = 'auto';
              } else if (isFarLeft) {
                transformStyle = 'translate3d(-180%, 0, 0) scale(0.7)';
                zIndex = 5;
                opacity = 0;
              } else if (isFarRight) {
                transformStyle = 'translate3d(180%, 0, 0) scale(0.7)';
                zIndex = 5;
                opacity = 0;
              }

              return (
                <div
                  key={r.id}
                  className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[360px] w-[220px] min-[400px]:w-[235px] sm:h-[420px] sm:w-[270px] md:h-[460px] md:w-[295px] shrink-0 overflow-hidden rounded-[24px] transition-all duration-[500ms] ease-[cubic-bezier(0.22,1,0.36,1)] [-webkit-tap-highlight-color:transparent] ${
                    isActive
                      ? 'border border-white/90 shadow-[0_8px_25px_rgba(0,0,0,0.10)] ring-1 ring-white/80 cursor-zoom-in'
                      : 'cursor-pointer hover:opacity-80'
                  }`}
                  style={{
                    transform: `translate(-50%, -50%) ${transformStyle}`,
                    zIndex,
                    opacity,
                    pointerEvents,
                    willChange: 'transform, opacity',
                  }}
                  onClick={() => handleCardClick(i, r)}
                >
                  <div
                    className="relative h-full w-full overflow-hidden bg-[#0A0E1A]"
                    ref={isActive ? activeWrapRef : null}
                  >
                    {imgUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        className="block h-full w-full object-cover [will-change:transform]"
                        src={optimizeCloudinaryUrl(imgUrl, 520)}
                        alt="Customer Unboxing"
                        loading="lazy"
                        draggable={false}
                        style={isZoomed ? { transform: 'scale(2.2)', transformOrigin: panOrigin, cursor: 'grab' } : undefined}
                        onError={(e) => { e.currentTarget.style.opacity = '.3'; }}
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-[#0F172A]">
                        <PackageFallbackIcon />
                      </div>
                    )}

                    {/* সফট মসৃণ গ্রেডিয়েন্ট ওভারলে */}
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

                    {/* লাইক কাউন্টার ও হার্ট বাটন */}
                    <div className="absolute bottom-3.5 right-3.5 z-10 flex items-center gap-1.5">
                      {likeCount > 0 && (
                        <span className="font-body text-[11.5px] font-extrabold text-white drop-shadow-md">
                          {likeCount}
                        </span>
                      )}
                      <button
                        type="button"
                        className={`flex h-[36px] w-[36px] items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md transition-transform duration-200 [-webkit-tap-highlight-color:transparent] hover:bg-black/60 active:scale-90 ${
                          beatId === r.id ? 'animate-heartbeat' : ''
                        }`}
                        onClick={(e) => handleHeart(e, r)}
                        aria-label={t('লাইক')}
                      >
                        <HeartIcon filled={r.liked} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* নেভিগেশন অ্যারো বাটন */}
          <button
            type="button"
            className="absolute left-2 top-1/2 z-30 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/80 bg-white/90 text-ink shadow-sh2 backdrop-blur-sm transition-all duration-brand hover:border-brand-light hover:bg-white active:scale-95 sm:flex"
            onClick={() => slide(-1)}
            aria-label={t('আগের')}
          >
            <ChevronIcon dir="left" />
          </button>

          <button
            type="button"
            className="absolute right-2 top-1/2 z-30 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/80 bg-white/90 text-ink shadow-sh2 backdrop-blur-sm transition-all duration-brand hover:border-brand-light hover:bg-white active:scale-95 sm:flex"
            onClick={() => slide(1)}
            aria-label={t('পরের')}
          >
            <ChevronIcon dir="right" />
          </button>
        </div>
      )}

      {/* পেজিনেশন ডটস */}
      {totalReviews > 1 && (
        <div className="mt-4 flex justify-center gap-1.5">
          {reviews.map((r, i) => (
            <button
              key={r.id}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === activeIdx ? 'w-6 bg-brand-light' : 'w-1.5 bg-border-base'
              }`}
              onClick={() => goTo(i)}
              aria-label={`${t('রিভিউ')} ${i + 1}`}
            />
          ))}
        </div>
      )}
    </motion.section>
  );
}
