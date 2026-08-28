'use client';

import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/lib/store/authStore';
import { useT } from '@/lib/i18n/useT';
import { showToast } from '@/lib/toast';
import { lockBody, unlockBody } from '@/lib/bodyScrollLock';
import { optimizeCloudinaryUrl } from '@/lib/cloudinaryUrl';
import { uploadReviewImageToCloudinary } from '@/lib/cloudinaryUpload';
import { checkIsUserAdmin } from '@/lib/productQnaData';
import UserAvatar from './UserAvatar';
import {
  fetchProductReviews,
  submitProductReview,
  deleteProductReview,
  toggleReviewLike,
  getLikedReviews,
  calculateReviewSummary,
  checkIsVerifiedBuyer,
  checkUnverifiedReviewDailyLimit,
} from '@/lib/productReviewData';
import type { ProductReview, ReviewRatingSummary } from '@/types';

interface ProductReviewsProps {
  productId: number | string;
  productName: string;
  defaultRating?: number;
  onSummaryChange?: (summary: ReviewRatingSummary) => void;
  onOpenLogin?: () => void;
}

function StarIcon({ filled = false, className = '' }: { filled?: boolean; className?: string }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill={filled ? '#D4A853' : 'none'} stroke={filled ? '#D4A853' : '#D1D5DB'} strokeWidth="1.5" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
    </svg>
  );
}

function StarBadgeIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6-5.9-3.3-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8Z" />
    </svg>
  );
}

function PlusIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

function VerifiedCheckIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="#10B981" className="shrink-0">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}

function HeartIcon({ filled = false }: { filled?: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill={filled ? '#FF5A6E' : 'none'} stroke={filled ? '#FF5A6E' : 'white'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
    </svg>
  );
}

export default function ProductReviews({
  productId,
  productName,
  defaultRating = 4.8,
  onSummaryChange,
  onOpenLogin,
}: ProductReviewsProps) {
  const { t, lang } = useT();
  const supabase = useRef(createClient()).current;
  const currentUser = useAuthStore((s) => s.currentUser);

  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [likedList, setLikedList] = useState<string[]>([]);
  const [activeCardIdx, setActiveCardIdx] = useState(0);

  // Write Review Modal State
  const [writeModalOpen, setWriteModalOpen] = useState(false);
  const [ratingInput, setRatingInput] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Modals: 2-Review Limit & Rejection Notice
  const [limitModalOpen, setLimitModalOpen] = useState(false);
  const [rejectedReviewNotice, setRejectedReviewNotice] = useState<ProductReview | null>(null);

  // Lightbox Zoom
  const [zoomImageUrl, setZoomImageUrl] = useState<string | null>(null);

  // Touch Swipe Ref
  const touchRef = useRef({ startX: 0, startY: 0 });

  // Fetch reviews, likes & admin status
  const loadReviewsData = useCallback(async () => {
    setLoading(true);
    const [data, adminStatus] = await Promise.all([
      fetchProductReviews(supabase, productId, currentUser?.id),
      checkIsUserAdmin(supabase, currentUser?.id),
    ]);
    setReviews(data);
    setIsAdmin(adminStatus);
    setLikedList(getLikedReviews());

    // চেক: বর্তমান ইউজারের রিভিউ কি রিজেক্ট হয়েছে?
    if (currentUser?.id) {
      const rejected = data.find((r) => r.user_id === currentUser.id && r.is_rejected);
      if (rejected) {
        setRejectedReviewNotice(rejected);
      }
    }

    const sum = calculateReviewSummary(data, defaultRating);
    if (onSummaryChange) onSummaryChange(sum);
    setLoading(false);
  }, [productId, currentUser?.id, defaultRating, onSummaryChange, supabase]);

  useEffect(() => {
    loadReviewsData();
  }, [loadReviewsData]);

  useEffect(() => {
    if (writeModalOpen || limitModalOpen || zoomImageUrl || rejectedReviewNotice) {
      lockBody();
    } else {
      unlockBody();
    }
    return () => unlockBody();
  }, [writeModalOpen, limitModalOpen, zoomImageUrl, rejectedReviewNotice]);

  const summary = useMemo(() => calculateReviewSummary(reviews, defaultRating), [reviews, defaultRating]);
  
  // ব্যবহারকারী কি ইতিমধ্যে রিভিউ দিয়েছেন?
  const userExistingReview = useMemo(
    () => (currentUser?.id ? reviews.find((r) => r.user_id === currentUser.id) : null),
    [reviews, currentUser?.id]
  );

  const approvedReviews = useMemo(
    () => reviews.filter((r) => r.is_approved && !r.is_rejected),
    [reviews]
  );

  const displayReviews = useMemo(() => {
    // লেখকের পেন্ডিং রিভিউ থাকলে সবার আগে দেখাবে
    if (userExistingReview && !userExistingReview.is_approved && !userExistingReview.is_rejected) {
      return [userExistingReview, ...approvedReviews.filter((r) => r.id !== userExistingReview.id)];
    }
    return approvedReviews;
  }, [userExistingReview, approvedReviews]);

  // 3D Carousel Navigation
  const slide = (dir: number) => {
    const n = displayReviews.length;
    if (n <= 1) return;
    setActiveCardIdx((cur) => (cur + dir + n) % n);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchRef.current.startX = e.touches[0].clientX;
    touchRef.current.startY = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const dx = e.changedTouches[0].clientX - touchRef.current.startX;
    const dy = e.changedTouches[0].clientY - touchRef.current.startY;
    if (Math.abs(dx) > 35 && Math.abs(dx) > Math.abs(dy)) {
      slide(dx < 0 ? 1 : -1);
    }
  };

  // Like Toggle
  const handleLikeClick = async (e: React.MouseEvent, reviewId: number | string) => {
    e.stopPropagation();
    const idStr = String(reviewId);
    if (likedList.includes(idStr)) return;

    setLikedList((prev) => [...prev, idStr]);
    setReviews((prev) => prev.map((r) => (
      String(r.id) === idStr ? { ...r, like_count: (r.like_count || 0) + 1 } : r
    )));

    await toggleReviewLike(supabase, reviewId);
  };

  // On-Site Admin Moderation
  const handleAdminApprove = async (e: React.MouseEvent, reviewId: number | string) => {
    e.stopPropagation();
    try {
      const { error } = await supabase
        .from('product_reviews')
        .update({ is_approved: true, is_rejected: false })
        .eq('id', reviewId);

      if (error) throw error;
      setReviews((prev) => prev.map((r) => (r.id === reviewId ? { ...r, is_approved: true, is_rejected: false } : r)));
      showToast(t('✅ রিভিউটি লাইভ করা হয়েছে!'));
    } catch {
      showToast(t('এরর: অনুমোদন করা যায়নি'));
    }
  };

  const handleAdminReject = async (e: React.MouseEvent, reviewId: number | string) => {
    e.stopPropagation();
    const reason = window.prompt('রিজেক্ট করার কারণ লিখুন (কাস্টমার দেখতে পাবেন):', 'কমিউনিটি গাইডলাইন বহির্ভূত');
    if (reason === null) return;

    try {
      const { error } = await supabase
        .from('product_reviews')
        .update({ is_approved: false, is_rejected: true, rejection_reason: reason })
        .eq('id', reviewId);

      if (error) throw error;
      setReviews((prev) => prev.map((r) => (r.id === reviewId ? { ...r, is_approved: false, is_rejected: true, rejection_reason: reason } : r)));
      showToast(t('রিভিউটি রিজেক্ট করা হয়েছে'));
    } catch {
      showToast(t('এরর: রিজেক্ট করা যায়নি'));
    }
  };

  const handleDeleteReview = async (e: React.MouseEvent, review: ProductReview) => {
    e.stopPropagation();
    if (!window.confirm('আপনি কি নিশ্চিতভাবে এই রিভিউটি মুছে ফেলতে চান?')) return;

    const res = await deleteProductReview(supabase, review.id, currentUser?.id);
    if (res.ok) {
      setReviews((prev) => prev.filter((r) => r.id !== review.id));
      showToast(t('রিভিউটি মুছে ফেলা হয়েছে'));
    } else {
      showToast(t('মুছে ফেলা সম্ভব হয়নি'));
    }
  };

  // Open Write Modal
  const handleOpenWriteReview = async () => {
    if (!currentUser?.id) {
      showToast(t('রিভিউ দেওয়ার জন্য অনুগ্রহ করে আগে লগইন করুন'));
      if (onOpenLogin) onOpenLogin();
      return;
    }

    if (userExistingReview) {
      if (userExistingReview.is_rejected) {
        setRejectedReviewNotice(userExistingReview);
        return;
      }
      showToast(t('আপনি ইতিমধ্যে এই প্রোডাক্টটিতে একটি রিভিউ দিয়েছেন'));
      return;
    }

    const isVerified = await checkIsVerifiedBuyer(supabase, productId, currentUser.id);
    if (!isVerified) {
      const limitCheck = await checkUnverifiedReviewDailyLimit(supabase, currentUser.id);
      if (!limitCheck.allowed) {
        setLimitModalOpen(true);
        return;
      }
    }

    setRatingInput(5);
    setHoverRating(0);
    setReviewText('');
    setSelectedFiles([]);
    setPreviews([]);
    setErrorMessage('');
    setWriteModalOpen(true);
  };

  // Drag & Drop / File Change
  const processFiles = (files: FileList | File[]) => {
    const valid = Array.from(files).filter((f) => ['image/jpeg', 'image/png', 'image/webp'].includes(f.type));
    if (valid.length === 0) {
      showToast(t('শুধুমাত্র JPG, PNG বা WEBP ছবি গ্রহণযোগ্য'));
      return;
    }
    const combined = [...selectedFiles, ...valid].slice(0, 3);
    setSelectedFiles(combined);
    setPreviews(combined.map((f) => URL.createObjectURL(f)));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) processFiles(e.target.files);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) processFiles(e.dataTransfer.files);
  };

  const handleRemoveFile = (index: number) => {
    const nextF = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(nextF);
    setPreviews(nextF.map((f) => URL.createObjectURL(f)));
  };

  // Submit Review
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser?.id) return;

    setErrorMessage('');
    setSubmitting(true);

    try {
      let uploadedUrl: string | null = null;
      if (selectedFiles.length > 0) {
        try {
          uploadedUrl = await uploadReviewImageToCloudinary(selectedFiles[0]);
        } catch (uploadErr: any) {
          setSubmitting(false);
          setErrorMessage(
            uploadErr?.message?.includes('preset')
              ? t('ক্লাউডিনারি প্রিসেট সেট করা হয়নি। ছবি ছাড়া রিভিউ সাবমিট করতে পারেন।')
              : (uploadErr?.message || t('ছবি আপলোড ব্যর্থ হয়েছে'))
          );
          return;
        }
      }

      const res = await submitProductReview(supabase, {
        productId,
        userId: currentUser.id,
        userName: currentUser.name || 'Customer',
        rating: ratingInput,
        reviewText,
        imageUrl: uploadedUrl,
      });

      setSubmitting(false);

      if (!res.ok || !res.data) {
        if (res.limitExceeded) {
          setWriteModalOpen(false);
          setLimitModalOpen(true);
          return;
        }
        setErrorMessage(res.error || t('রিভিউ জমা দেওয়া যায়নি'));
        return;
      }

      setReviews((prev) => [res.data!, ...prev]);
      setWriteModalOpen(false);
      showToast(t('🎉 আপনার রিভিউটি জমা হয়েছে! অনুমোদনের পর লাইভ হবে।'));
    } catch (err: any) {
      setSubmitting(false);
      setErrorMessage(err?.message || t('রিভিউ সাবমিশনে সমস্যা হয়েছে'));
    }
  };

  return (
    <div className="py-2">
      {/* Header Block — ক্লিন টু-টোন ব্র্যান্ড হেডার */}
      <div className="mb-6 flex flex-col gap-1 border-b border-border-base pb-4">
        <div className="flex items-center gap-2.5 font-display text-lg font-bold text-ink">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-primary text-white shadow-xs">
            <StarBadgeIcon className="text-white fill-current" />
          </span>
          <span>
            {t('কাস্টমার')} <span className="text-brand-light">{t('রিভিউ ও রেটিং')}</span>
          </span>
        </div>
        <p className="font-body text-[12.5px] text-muted">
          {lang === 'en'
            ? `Real unboxing photos, ratings and feedback from customers of ${productName}.`
            : `${productName}-এর প্রকৃত কাস্টমারদের আনবক্সিং অভিজ্ঞতা ও রিভিউ।`}
        </p>
      </div>

      {/* Top Rating Summary Breakdown */}
      <div className="mb-7 rounded-brand border border-border-base bg-white p-5 shadow-sh1">
        {summary.hasReviews ? (
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
            {/* Left Score */}
            <div className="flex shrink-0 flex-col items-center justify-center gap-1 sm:border-r sm:border-border-base sm:pr-8">
              <div className="font-display text-4xl font-extrabold text-ink">{summary.average.toFixed(1)}</div>
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <StarIcon key={star} filled={star <= Math.round(summary.average)} />
                ))}
              </div>
              <div className="mt-1 font-body text-xs font-semibold text-muted">
                {lang === 'en' ? `Based on ${summary.count} reviews` : `${summary.count}টি রিভিউয়ের ভিত্তিতে`}
              </div>
            </div>

            {/* Right Bars */}
            <div className="flex flex-1 flex-col gap-2">
              {[5, 4, 3, 2, 1].map((star) => {
                const pct = summary.breakdown[star] || 0;
                return (
                  <div key={star} className="flex items-center gap-2.5 font-body text-xs">
                    <span className="w-6 text-right font-bold text-ink">{star}★</span>
                    <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-muted">
                      <div
                        className="h-full rounded-full bg-gold transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="w-9 text-right font-medium text-muted">{pct}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* Empty State — যদি ইউজার ইতিমধ্যে রিভিউ না দিয়ে থাকেন কেবল তখনই ইনভাইটেশন কার্ড দেখাবে */
          <div className="flex flex-col items-center justify-center py-4 text-center">
            <div className="mb-2 flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <StarIcon key={star} filled={star <= Math.round(defaultRating)} />
              ))}
            </div>
            <p className="font-body text-sm font-bold text-ink">
              {lang === 'en' ? 'No customer reviews yet' : 'এই প্রোডাক্টটিতে এখনো কোনো কাস্টমার রিভিউ নেই'}
            </p>
            <p className="mt-1 max-w-md font-body text-xs text-muted">
              {lang === 'en'
                ? 'Be the first customer to share your unboxing experience with this product!'
                : 'আপনিই প্রথম রিভিউ দিয়ে প্রোডাক্টের কোয়ালিটি সম্পর্কে আপনার অভিজ্ঞতা জানান!'}
            </p>
            {!userExistingReview && (
              <button
                onClick={handleOpenWriteReview}
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-brand-light px-6 py-2.5 font-body text-xs font-bold text-white shadow-sh1 transition-brand hover:bg-brand-light-hover"
              >
                <PlusIcon /> {t('আপনার রিভিউ যুক্ত করুন')}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="py-8 text-center font-body text-[13px] text-muted">
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-brand-light/30 border-t-brand-light mr-2" />
          {t('রিভিউ লোড হচ্ছে...')}
        </div>
      )}

      {/* 3D Coverflow Swipeable Review Gallery (স্ক্রিনশট ২ অনুযায়ী) */}
      {!loading && displayReviews.length > 0 && (
        <div className="mb-4">
          <div
            className="relative mx-auto w-full max-w-[850px] overflow-hidden py-4"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <div className="flex items-center justify-center gap-3 sm:gap-6">
              {displayReviews.map((r, idx) => {
                const isActive = idx === activeCardIdx;
                const isOwnPending = !r.is_approved && r.user_id === currentUser?.id;
                const isLiked = likedList.includes(String(r.id));
                const dateStr = r.created_at
                  ? new Date(r.created_at).toLocaleDateString(lang === 'en' ? 'en-US' : 'bn-BD', {
                    year: 'numeric', month: 'short', day: 'numeric',
                  })
                  : '';

                // শুধু সক্রিয় এবং তার পাশের কার্ডগুলো প্রদর্শন
                const n = displayReviews.length;
                const prevIdx = (activeCardIdx - 1 + n) % n;
                const nextIdx = (activeCardIdx + 1) % n;
                const isVisible = idx === activeCardIdx || idx === prevIdx || idx === nextIdx;

                if (!isVisible && n > 2) return null;

                return (
                  <div
                    key={r.id}
                    onClick={() => setActiveCardIdx(idx)}
                    className={`relative h-[380px] w-[240px] shrink-0 select-none overflow-hidden rounded-[20px] bg-[#111] transition-all duration-300 ease-brand [-webkit-tap-highlight-color:transparent] sm:h-[420px] sm:w-[280px] ${
                      isActive
                        ? 'z-10 scale-100 opacity-100 shadow-[0_16px_40px_rgba(0,0,0,0.3)] ring-2 ring-brand-light/50'
                        : 'z-0 scale-90 opacity-60'
                    }`}
                  >
                    {/* Review Image / Fallback Ambient Background */}
                    {r.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={optimizeCloudinaryUrl(r.image_url, 450)}
                        alt="Customer Unboxing"
                        className="absolute inset-0 h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-[#1E293B] via-[#0F172A] to-[#020617] p-4 text-center">
                        <span className="text-3xl opacity-40">⭐</span>
                      </div>
                    )}

                    {/* Dark Gradients for Text Readability */}
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/85 via-black/30 to-black/90" />

                    {/* TOP: Review Text & Pending Badge */}
                    <div className="relative z-10 p-3.5 pt-4">
                      {isOwnPending && (
                        <div className="mb-2 inline-flex items-center gap-1 rounded-full bg-amber-500/90 px-2 py-0.5 font-body text-[9.5px] font-bold text-white shadow-xs">
                          ⏳ {t('অনুমোদনের অপেক্ষায়')}
                        </div>
                      )}
                      <div className="flex gap-0.5 mb-1.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <StarIcon key={star} filled={star <= Number(r.rating)} className="h-3.5 w-3.5" />
                        ))}
                      </div>
                      <p className="line-clamp-4 font-body text-[12.5px] leading-relaxed text-white drop-shadow-sm">
                        &quot;{r.review_text}&quot;
                      </p>
                    </div>

                    {/* BOTTOM: Avatar, Name, Date & Like Button (❤️) */}
                    <div className="absolute inset-x-0 bottom-0 z-10 flex items-center justify-between p-3.5 pb-4">
                      <div className="flex items-center gap-2 min-w-0">
                        <UserAvatar name={r.user_name} size="sm" />
                        <div className="min-w-0">
                          <div className="truncate font-body text-xs font-bold text-white drop-shadow-sm">
                            {r.user_name}
                          </div>
                          <div className="flex items-center gap-1 font-body text-[10px] text-white/70">
                            <span>{dateStr}</span>
                            {r.is_verified_buyer && <VerifiedCheckIcon />}
                          </div>
                        </div>
                      </div>

                      {/* Interactive Like (❤️) Button */}
                      <button
                        type="button"
                        onClick={(e) => handleLikeClick(e, r.id)}
                        className={`flex h-8 items-center gap-1 rounded-full bg-black/40 px-2.5 backdrop-blur-md transition-transform active:scale-90 ${isLiked ? 'text-[#FF5A6E]' : 'text-white'}`}
                      >
                        <HeartIcon filled={isLiked} />
                        <span className="font-body text-[11px] font-bold text-white">
                          {r.like_count || 0}
                        </span>
                      </button>
                    </div>

                    {/* In-Place On-Site Admin / Author Moderation Bar */}
                    {(isAdmin || (currentUser?.id && r.user_id === currentUser.id)) && (
                      <div className="absolute top-2.5 right-2.5 z-20 flex items-center gap-1 rounded-full bg-black/70 p-1 backdrop-blur-md">
                        {isAdmin && !r.is_approved && (
                          <button
                            onClick={(e) => handleAdminApprove(e, r.id)}
                            title="Approve"
                            className="rounded-full bg-emerald-600 px-2 py-0.5 font-body text-[10px] font-bold text-white hover:bg-emerald-500"
                          >
                            ✓
                          </button>
                        )}
                        {isAdmin && !r.is_rejected && (
                          <button
                            onClick={(e) => handleAdminReject(e, r.id)}
                            title="Reject"
                            className="rounded-full bg-amber-600 px-2 py-0.5 font-body text-[10px] font-bold text-white hover:bg-amber-500"
                          >
                            ✕
                          </button>
                        )}
                        <button
                          onClick={(e) => handleDeleteReview(e, r)}
                          title="Delete"
                          className="flex h-5 w-5 items-center justify-center rounded-full text-red-400 hover:bg-red-500/30 hover:text-red-200"
                        >
                          <TrashIcon />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Desktop Navigation Arrows */}
            {displayReviews.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => slide(-1)}
                  aria-label="Previous"
                  className="absolute left-1 top-1/2 -translate-y-1/2 z-20 hidden sm:flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-ink shadow-sh2 hover:bg-white"
                >
                  &#8249;
                </button>
                <button
                  type="button"
                  onClick={() => slide(1)}
                  aria-label="Next"
                  className="absolute right-1 top-1/2 -translate-y-1/2 z-20 hidden sm:flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-ink shadow-sh2 hover:bg-white"
                >
                  &#8250;
                </button>
              </>
            )}
          </div>

          {/* Dots Indicator */}
          {displayReviews.length > 1 && (
            <div className="flex justify-center gap-1.5 my-2">
              {displayReviews.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveCardIdx(i)}
                  className={`h-1.5 rounded-full transition-all duration-brand ${i === activeCardIdx ? 'w-5 bg-brand-light' : 'w-1.5 bg-border-base'}`}
                  aria-label={`Slide ${i + 1}`}
                />
              ))}
            </div>
          )}

          {/* Bottom Centered "আপনার রিভিউ যুক্ত করুন" Button */}
          {!userExistingReview && (
            <div className="mt-4 flex justify-center pt-2">
              <button
                onClick={handleOpenWriteReview}
                className="inline-flex items-center gap-2 rounded-full bg-brand-light px-7 py-3 font-body text-sm font-bold text-white shadow-sh1 transition-brand duration-brand hover:bg-brand-light-hover hover:shadow-sh2"
              >
                <PlusIcon /> {t('আপনার রিভিউ যুক্ত করুন')}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Write Review Modal (Drag & Drop + Canvas WebP Compression) */}
      {writeModalOpen && (
        <div
          className="fixed inset-0 z-[1100] flex items-center justify-center bg-ink/50 p-4 backdrop-blur-[2px] animate-section-reveal"
          onClick={(e) => { if (e.target === e.currentTarget) setWriteModalOpen(false); }}
        >
          <div className="w-full max-w-[460px] rounded-[22px] bg-white p-6 shadow-sh3">
            <div className="mb-4 flex items-center justify-between border-b border-border-base pb-3">
              <h3 className="flex items-center gap-2 font-display text-base font-bold text-ink">
                <StarBadgeIcon className="text-gold" /> {t('আপনার রিভিউ যুক্ত করুন')}
              </h3>
              <button
                onClick={() => setWriteModalOpen(false)}
                className="flex h-7 w-7 items-center justify-center rounded-full text-muted hover:bg-surface-muted hover:text-ink"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitReview} className="flex flex-col gap-4">
              {/* Star Rating Selector */}
              <div>
                <label className="mb-1.5 block font-body text-xs font-bold text-ink">{t('রেটিং সিলেক্ট করুন')}</label>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const isHovered = hoverRating >= star;
                    const isSelected = !hoverRating && ratingInput >= star;
                    return (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setRatingInput(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="p-1 transition-transform hover:scale-125 focus:outline-none"
                      >
                        <StarIcon filled={isHovered || isSelected} className="h-7 w-7" />
                      </button>
                    );
                  })}
                  <span className="ml-2 font-body text-xs font-bold text-gold">
                    {ratingInput} / 5
                  </span>
                </div>
              </div>

              {/* Review Text */}
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <label className="font-body text-xs font-bold text-ink">{t('আপনার মূল্যবান মতামত')}</label>
                  <span className="font-body text-[11px] text-muted">{reviewText.length}/500</span>
                </div>
                <textarea
                  required
                  rows={4}
                  maxLength={500}
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder={t('প্রোডাক্টের কোয়ালিটি ও ব্যবহারিক অভিজ্ঞতা বিস্তারিত লিখুন (কমপক্ষে ২০ অক্ষর)...')}
                  className="w-full rounded-xl border border-border-base bg-white p-3 font-body text-[13.5px] text-ink outline-none transition-brand focus:border-brand-light"
                />
              </div>

              {/* Multi-Image Desktop Drag & Drop Upload Zone */}
              <div>
                <label className="mb-1.5 block font-body text-xs font-bold text-ink">
                  {t('প্রোডাক্টের ছবি যুক্ত করুন')} <span className="font-normal text-muted">({t('ঐচ্ছিক, ড্র্যাগ বা সিলেক্ট করুন')})</span>
                </label>

                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-4 transition-colors ${
                    isDragging ? 'border-brand-light bg-brand-bg/20' : 'border-border-base bg-surface-muted/40'
                  }`}
                >
                  {previews.length > 0 ? (
                    <div className="flex flex-wrap gap-2.5">
                      {previews.map((url, i) => (
                        <div key={i} className="relative">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={url} alt="Preview" className="h-16 w-16 rounded-lg object-cover shadow-sm border border-border-base" />
                          <button
                            type="button"
                            onClick={() => handleRemoveFile(i)}
                            className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white shadow"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <label className="flex cursor-pointer flex-col items-center gap-1 text-center font-body text-xs text-muted hover:text-brand-light">
                      <span className="text-xl">📷</span>
                      <span className="font-semibold">{t('ছবি ড্র্যাগ করে আনুন অথবা ব্রাউজ করুন')}</span>
                      <span className="text-[10.5px] text-muted/70">(JPG, PNG, WEBP — সর্বোচ্চ ৫MB)</span>
                      <input
                        type="file"
                        multiple
                        accept="image/jpeg,image/png,image/webp"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>

              {errorMessage && (
                <div className="rounded-lg bg-red-50 p-2.5 font-body text-xs font-semibold text-red-600">
                  {errorMessage}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting || reviewText.trim().length < 20}
                className="mt-1 w-full rounded-full bg-brand-light py-3 font-body text-sm font-bold text-white shadow-sh1 transition-brand hover:bg-brand-light-hover disabled:opacity-50"
              >
                {submitting ? t('প্রসেসিং ও আপলোড হচ্ছে...') : t('রিভিউ সাবমিট করুন')}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Rejection Notice Modal (যদি অ্যাডমিন কাস্টমারের রিভিউ রিজেক্ট করে থাকে) */}
      {rejectedReviewNotice && (
        <div
          className="fixed inset-0 z-[1250] flex items-center justify-center bg-ink/60 p-4 backdrop-blur-[2px] animate-section-reveal"
          onClick={() => setRejectedReviewNotice(null)}
        >
          <div className="w-full max-w-[420px] rounded-[24px] bg-white p-6 text-center shadow-sh3">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-2xl text-red-600">
              ⚠️
            </div>
            <h3 className="mb-1.5 font-display text-base font-bold text-ink">
              {t('আপনার রিভিউটি গ্রহণ করা সম্ভব হয়নি')}
            </h3>
            <p className="mb-3 font-body text-xs leading-relaxed text-muted">
              {t('দুঃখিত, আপনার সাবমিট করা রিভিউটি আমাদের রিভিউ নীতিমালা ও গাইডলাইনের সাথে সামঞ্জস্যপূর্ণ না হওয়ায় অ্যাডমিন কর্তৃক প্রত্যাখ্যাত হয়েছে।')}
            </p>
            {rejectedReviewNotice.rejection_reason && (
              <div className="mb-4 rounded-xl border border-red-200 bg-red-50/60 p-3 text-left font-body text-xs text-red-800">
                <strong>{t('কারণ')}:</strong> {rejectedReviewNotice.rejection_reason}
              </div>
            )}
            <div className="flex gap-2">
              <button
                onClick={() => setRejectedReviewNotice(null)}
                className="flex-1 rounded-full border border-border-base py-2.5 font-body text-xs font-semibold text-muted hover:bg-surface-muted"
              >
                {t('বন্ধ করুন')}
              </button>
              <button
                onClick={async () => {
                  await deleteProductReview(supabase, rejectedReviewNotice.id, currentUser?.id);
                  setReviews((prev) => prev.filter((r) => r.id !== rejectedReviewNotice.id));
                  setRejectedReviewNotice(null);
                  handleOpenWriteReview();
                }}
                className="flex-1 rounded-full bg-brand-primary py-2.5 font-body text-xs font-bold text-white shadow-sm hover:bg-brand-light-hover"
              >
                {t('নতুন করে রিভিউ দিন')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2-Review Limit Warning Modal */}
      {limitModalOpen && (
        <div
          className="fixed inset-0 z-[1200] flex items-center justify-center bg-ink/60 p-4 backdrop-blur-[2px] animate-section-reveal"
          onClick={() => setLimitModalOpen(false)}
        >
          <div className="w-full max-w-[400px] rounded-[24px] bg-white p-6 text-center shadow-sh3">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-2xl text-amber-700">
              🚫
            </div>
            <h3 className="mb-2 font-display text-base font-bold text-ink">
              {t('রিভিউ সীমা অতিক্রম করেছে')}
            </h3>
            <p className="mb-5 font-body text-xs leading-relaxed text-muted">
              {t('আপনি ইতিমধ্যে আজকের জন্য সর্বোচ্চ ২টি আন-অর্ডারড প্রোডাক্টে রিভিউ দিয়েছেন এবং আপনি এই প্রোডাক্টটি আমাদের থেকে অর্ডারও করেননি। প্রতারণা ও ফেক রিভিউ রোধে এই মুহূর্তে নতুন রিভিউ দেওয়া সম্ভব নয়।')}
            </p>
            <button
              onClick={() => setLimitModalOpen(false)}
              className="w-full rounded-full bg-ink py-2.5 font-body text-sm font-bold text-white shadow-sm transition-brand hover:bg-brand-primary"
            >
              {t('ঠিক আছে')}
            </button>
          </div>
        </div>
      )}

      {/* Lightbox Zoom Modal */}
      {zoomImageUrl && (
        <div
          className="fixed inset-0 z-[1300] flex items-center justify-center bg-black/80 p-4 backdrop-blur-[4px] animate-section-reveal"
          onClick={() => setZoomImageUrl(null)}
        >
          <div className="relative max-h-[90vh] max-w-[90vw]">
            <button
              onClick={() => setZoomImageUrl(null)}
              className="absolute -right-3 -top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white text-ink shadow-md"
            >
              ✕
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={optimizeCloudinaryUrl(zoomImageUrl, 1000)}
              alt="Review Zoomed"
              className="max-h-[85vh] max-w-[85vw] rounded-xl object-contain shadow-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
}
