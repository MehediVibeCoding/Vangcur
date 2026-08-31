'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
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

const AUTOPLAY_MS = 3200;
const TOUCH_RESUME_MS = 2800;

function getVisibleIndices(activeIdx: number, n: number): number[] {
  if (n === 0) return [];
  if (n === 1) return [activeIdx];
  if (n === 2) return [(activeIdx + n - 1) % n, activeIdx];
  return [(activeIdx + n - 1) % n, activeIdx, (activeIdx + 1) % n];
}

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
        // falls through
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

  const slide = (dir: number) => {
    const totalCount = reviewsRef.current.length;
    if (!totalCount) return;
    goTo((activeIdx + dir + totalCount) % totalCount);
  };

  const handleMouseEnter = () => { pausedRef.current = true; };
  const handleMouseLeave = () => { pausedRef.current = false; };

  const handleTouchStart = () => {
    pausedRef.current = true;
    if (timerRef.current) clearInterval(timerRef.current);
  };
  const handleTouchEnd = () => {
    pausedRef.current = false;
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setTimeout(() => {
      const totalCount = reviewsRef.current.length;
      if (!totalCount) return;
      setActiveIdx((cur) => {
        const next = (cur + 1) % totalCount;
        resetAutoplay();
        return next;
      });
    }, TOUCH_RESUME_MS);
  };

  const handleCardClick = (idx: number, review: Review) => {
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
  const visible = new Set(getVisibleIndices(activeIdx, totalReviews));

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
    <section className="mx-auto mb-14 max-w-[1300px] px-4 sm:px-5 overflow-hidden">
      {headerBlock}

      {totalReviews > 0 && (
        <div
          className="relative mx-auto w-full max-w-[920px] pb-2"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <div className="overflow-hidden py-4 pb-6">
            <div className="relative flex items-center justify-center gap-3 sm:gap-6">
              {reviews.map((r, i) => {
                if (!visible.has(i)) return null;
                const isActive = i === activeIdx;
                const isZoomed = isActive && zoomedId === r.id;
                const order = getVisibleIndices(activeIdx, totalReviews).indexOf(i);
                const imgUrl = r.image_url && (r.image_url.startsWith('http') || r.image_url.startsWith('//'))
                  ? r.image_url : null;
                const likeCount = parseInt(String(r.like_count), 10) || 0;

                return (
                  <div
                    key={r.id}
                    className={`relative h-[330px] w-[210px] shrink-0 select-none overflow-hidden transition-all duration-[400ms] ease-brand [-webkit-tap-highlight-color:transparent] sm:h-[370px] sm:w-[240px] md:h-[410px] md:w-[270px] ${
                      isActive
                        ? 'z-10 scale-105 sm:scale-110 opacity-100 rounded-[24px] border-2 border-white/95 shadow-[0_12px_36px_rgba(0,88,199,0.14)] ring-1 ring-brand-light/30'
                        : 'z-0 scale-[0.84] opacity-60 cursor-pointer hover:opacity-80 rounded-[20px] bg-ink/90'
                    }`}
                    style={{ order }}
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
                          src={optimizeCloudinaryUrl(imgUrl, 480)}
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

                      {/* সফট গ্রেডিয়েন্ট ওভারলে */}
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-black/20" />

                      {/* লাইক কাউন্টার ও হার্ট বাটন */}
                      <div className="absolute bottom-3 right-3 z-10 flex items-center gap-1.5">
                        {likeCount > 0 && (
                          <span className="font-body text-[11px] font-extrabold text-white drop-shadow-md">
                            {likeCount}
                          </span>
                        )}
                        <button
                          type="button"
                          className={`flex h-[34px] w-[34px] items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md transition-transform duration-200 [-webkit-tap-highlight-color:transparent] hover:bg-black/60 active:scale-90 ${
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
          </div>

          {/* নেভিগেশন অ্যারো বাটন */}
          <button
            type="button"
            className="absolute left-2 top-1/2 z-20 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/80 bg-white/90 text-ink shadow-sh2 backdrop-blur-sm transition-all duration-brand hover:border-brand-light hover:bg-white active:scale-95 sm:flex"
            onClick={() => slide(-1)}
            aria-label={t('আগের')}
          >
            <ChevronIcon dir="left" />
          </button>

          <button
            type="button"
            className="absolute right-2 top-1/2 z-20 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/80 bg-white/90 text-ink shadow-sh2 backdrop-blur-sm transition-all duration-brand hover:border-brand-light hover:bg-white active:scale-95 sm:flex"
            onClick={() => slide(1)}
            aria-label={t('পরের')}
          >
            <ChevronIcon dir="right" />
          </button>
        </div>
      )}

      {/* পেজিনেশন ডটস */}
      {totalReviews > 1 && (
        <div className="mt-2 flex justify-center gap-1.5">
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
    </section>
  );
}
