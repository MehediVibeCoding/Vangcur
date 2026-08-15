'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { logWarn } from '@/lib/logger';
import { optimizeCloudinaryUrl } from '@/lib/cloudinaryUrl';

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

export default function CustomerGallery() {
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
        // falls through to empty state
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
      const n = reviewsRef.current.length;
      if (!n) return;
      setActiveIdx((cur) => (cur + 1) % n);
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
    const n = reviewsRef.current.length;
    if (!n) return;
    goTo((activeIdx + dir + n) % n);
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
      const n = reviewsRef.current.length;
      if (!n) return;
      setActiveIdx((cur) => {
        const next = (cur + 1) % n;
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

  const n = reviews.length;
  const visible = new Set(getVisibleIndices(activeIdx, n));

  const headerBlock = (
    <div className="mb-8 px-5 text-center">
      <div className="mb-2.5 inline-block rounded-full border border-brand-light/20 bg-brand-light/10 px-3.5 py-1 text-[11px] font-bold uppercase tracking-[1px] text-brand-light-hover">
        ❤️ Customer Love
      </div>
      <h2 className="mb-1.5 font-display text-[28px] font-extrabold leading-tight text-ink">
        Unboxing <span className="text-brand-light">গ্যালারি</span>
      </h2>
      <p className="text-[13.5px] text-muted">আমাদের কাস্টমারদের আনন্দময় মুহূর্ত</p>
    </div>
  );

  if (loaded && n === 0) {
    return (
      <section className="overflow-hidden bg-brand-bg py-12">
        {headerBlock}
        <div className="px-6 py-6 text-center text-sm text-muted">
          <p>এখনো কোনো রিভিউ নেই।</p>
        </div>
      </section>
    );
  }

  return (
    <section className="overflow-hidden bg-brand-bg py-12">
      {headerBlock}

      {n > 0 && (
        <div
          className="relative mx-auto w-full max-w-[900px] pb-2.5"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <div className="overflow-hidden py-5 pb-6">
            <div className="relative flex items-center justify-center gap-4">
              {reviews.map((r, i) => {
                if (!visible.has(i)) return null;
                const isActive = i === activeIdx;
                const isZoomed = isActive && zoomedId === r.id;
                const order = getVisibleIndices(activeIdx, n).indexOf(i);
                const imgUrl = r.image_url && (r.image_url.startsWith('http') || r.image_url.startsWith('//'))
                  ? r.image_url : null;
                const likeCount = parseInt(String(r.like_count), 10) || 0;

                return (
                  <div
                    key={r.id}
                    className={`relative h-[320px] w-[200px] shrink-0 select-none overflow-hidden rounded-[20px] bg-[#111] transition-[transform,opacity,box-shadow] duration-[450ms] ease-brand [-webkit-tap-highlight-color:transparent] sm:h-[360px] sm:w-[220px] md:h-[400px] md:w-[260px] ${isActive ? 'z-[2] scale-[1.15] opacity-100 shadow-[0_16px_48px_rgba(0,0,0,.28),0_4px_12px_rgba(0,0,0,.12)]' : 'z-[1] scale-[.85] opacity-60'}`}
                    style={{ order }}
                    onClick={() => handleCardClick(i, r)}
                  >
                    <div
                      className="relative h-full w-full overflow-hidden"
                      ref={isActive ? activeWrapRef : null}
                    >
                      {imgUrl ? (
                        <img
                          className="block h-full w-full object-cover [will-change:transform]"
                          src={optimizeCloudinaryUrl(imgUrl, 450)}
                          alt="Review"
                          loading="lazy"
                          draggable={false}
                          style={isZoomed ? { transform: 'scale(2.2)', transformOrigin: panOrigin, cursor: 'grab' } : undefined}
                          onError={(e) => { e.currentTarget.style.opacity = '.3'; }}
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-[#222] text-[64px]">
                          📦
                        </div>
                      )}
                      <span className="pointer-events-none absolute bottom-3 right-11 text-[11px] font-bold text-white/85 [text-shadow:0_1px_3px_rgba(0,0,0,.6)]">
                        {likeCount > 0 ? likeCount : ''}
                      </span>
                      <button
                        className={`absolute bottom-2.5 right-2.5 z-10 flex h-[34px] w-[34px] items-center justify-center rounded-full bg-black/35 text-base backdrop-blur-[4px] transition-transform duration-200 [-webkit-tap-highlight-color:transparent] active:scale-90 ${beatId === r.id ? 'animate-heartbeat' : ''}`}
                        onClick={(e) => handleHeart(e, r)}
                        aria-label="লাইক"
                      >
                        {r.liked ? '❤️' : '🤍'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <button
            className="absolute left-2 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-ink text-xl leading-none text-white shadow-[0_4px_14px_rgba(0,0,0,.2)] transition-brand duration-brand hover:bg-brand-light sm:flex"
            onClick={() => slide(-1)}
            aria-label="আগের"
          >
            ‹
          </button>
          <button
            className="absolute right-2 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-ink text-xl leading-none text-white shadow-[0_4px_14px_rgba(0,0,0,.2)] transition-brand duration-brand hover:bg-brand-light sm:flex"
            onClick={() => slide(1)}
            aria-label="পরের"
          >
            ›
          </button>
        </div>
      )}

      {n > 0 && (
        <div className="mt-1.5 flex justify-center gap-[7px]">
          {reviews.map((r, i) => (
            <button
              key={r.id}
              className={`h-2 w-2 rounded-full transition-brand duration-brand ${i === activeIdx ? 'scale-[1.25] bg-brand-light' : 'bg-border-base'}`}
              onClick={() => goTo(i)}
              aria-label={`রিভিউ ${i + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
