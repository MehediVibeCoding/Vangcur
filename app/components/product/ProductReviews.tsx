'use client';

import { useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/lib/store/authStore';
import { useT } from '@/lib/i18n/useT';
import { showToast } from '@/lib/toast';
import { lockBody, unlockBody } from '@/lib/bodyScrollLock';
import { optimizeCloudinaryUrl } from '@/lib/cloudinaryUrl';
import { uploadReviewImageToCloudinary } from '@/lib/cloudinaryUpload';
import UserAvatar from './UserAvatar';
import {
  fetchProductReviews,
  submitProductReview,
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
    <svg width="16" height="16" viewBox="0 0 24 24" fill={filled ? '#D4A853' : 'none'} stroke={filled ? '#D4A853' : '#D1D5DB'} strokeWidth="1.5" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
    </svg>
  );
}

function StarFillBadgeIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6-5.9-3.3-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8Z" />
    </svg>
  );
}

function EditPencilIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  );
}

function CameraUploadIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}

function VerifiedBadgeIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} width="13" height="13" viewBox="0 0 24 24" fill="#10B981">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
    </svg>
  );
}

function BanShieldIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
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

  // Write Review Modal State
  const [writeModalOpen, setWriteModalOpen] = useState(false);
  const [ratingInput, setRatingInput] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // 2-Review Limit Warning Modal
  const [limitModalOpen, setLimitModalOpen] = useState(false);

  // Lightbox Image Zoom Modal
  const [zoomImageUrl, setZoomImageUrl] = useState<string | null>(null);

  // Fetch reviews & recalculate summary
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const data = await fetchProductReviews(supabase, productId, currentUser?.id);
      if (!cancelled) {
        setReviews(data);
        const sum = calculateReviewSummary(data, defaultRating);
        if (onSummaryChange) onSummaryChange(sum);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [productId, currentUser?.id, defaultRating, onSummaryChange, supabase]);

  useEffect(() => {
    if (writeModalOpen || limitModalOpen || zoomImageUrl) {
      lockBody();
    } else {
      unlockBody();
    }
    return () => unlockBody();
  }, [writeModalOpen, limitModalOpen, zoomImageUrl]);

  const summary = calculateReviewSummary(reviews, defaultRating);
  const hasApprovedReviews = reviews.some((r) => r.is_approved);

  const handleOpenWriteReview = async () => {
    if (!currentUser?.id) {
      showToast(t('রিভিউ দেওয়ার জন্য অনুগ্রহ করে আগে লগইন করুন'));
      if (onOpenLogin) onOpenLogin();
      return;
    }

    // চেক: ইউজার কি ইতিমধ্যে রিভিউ দিয়েছেন?
    const alreadyReviewed = reviews.some((r) => r.user_id === currentUser.id);
    if (alreadyReviewed) {
      showToast(t('আপনি ইতিমধ্যে এই প্রোডাক্টটিতে একটি রিভিউ দিয়েছেন'));
      return;
    }

    // চেক: ইউজার যদি প্রোডাক্টটি না কিনে থাকেন, তবে আজকের ২-রিভিউ লিমিট চেক
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
    setSelectedFile(null);
    setPreviewUrl(null);
    setErrorMessage('');
    setWriteModalOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      showToast(t('শুধুমাত্র JPG, PNG বা WEBP ছবি সাপোর্ট করে'));
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast(t('ছবির সাইজ সর্বোচ্চ ৫ মেগাবাইট হতে পারবে'));
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser?.id) return;

    setErrorMessage('');
    setSubmitting(true);

    try {
      let uploadedCloudinaryUrl: string | null = null;
      if (selectedFile) {
        try {
          uploadedCloudinaryUrl = await uploadReviewImageToCloudinary(selectedFile);
        } catch (uploadErr: any) {
          setSubmitting(false);
          setErrorMessage(
            uploadErr?.message?.includes('preset')
              ? t('ক্লাউডিনারি প্রিসেট তৈরি করা হয়নি। ছবি ছাড়া শুধু টেক্সট রিভিউ জমা দিতে পারেন।')
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
        imageUrl: uploadedCloudinaryUrl,
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
      showToast(t('✅ আপনার রিভিউটি জমা হয়েছে! অনুমোদনের পর লাইভ হবে।'));
    } catch (err: any) {
      setSubmitting(false);
      setErrorMessage(err?.message || t('রিভিউ সাবমিশনে সমস্যা হয়েছে'));
    }
  };

  return (
    <div className="py-2">
      {/* Header Block — খালি থাকলে ডিভাইডার লাইন ও টপ বাটন ছাড়া কমপ্যাক্ট লুক */}
      <div className={`flex flex-col gap-1 ${hasApprovedReviews || reviews.length > 0 ? 'mb-6 border-b border-border-base pb-4' : 'mb-4'}`}>
        <div className="flex items-center gap-2.5 font-display text-lg font-bold text-ink">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-bg text-brand-light">
            <StarFillBadgeIcon className="text-gold" />
          </span>
          {t('কাস্টমার রিভিউ ও রেটিং')}
        </div>
        <p className="font-body text-[12.5px] text-muted">
          {lang === 'en'
            ? `Real ratings and reviews from customers of ${productName}.`
            : `${productName}-এর প্রকৃত কাস্টমারদের রিভিউ ও রেটিং।`}
        </p>
      </div>

      {/* Top Rating Summary Card */}
      <div className="mb-7 rounded-brand border border-border-base bg-white p-5 shadow-sh1">
        {summary.hasReviews ? (
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
            {/* Left: Big Score & Stars */}
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

            {/* Right: 5-Star Breakdown Bars */}
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
          /* Smart Hybrid Fallback Invitation Card (স্ক্রিনশট ৩ অনুযায়ী কার্ডের ভেতরে লাল বৃত্তের বাটন) */
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
                ? 'Be the first customer to share your experience with this product!'
                : 'আপনিই প্রথম রিভিউ দিয়ে প্রোডাক্টের অভিজ্ঞতা ও কোয়ালিটি সম্পর্কে অন্যদের জানান!'}
            </p>
            <button
              onClick={handleOpenWriteReview}
              className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-brand-light px-5 py-2.5 font-body text-xs font-bold text-white shadow-sh1 transition-brand hover:bg-brand-light-hover"
            >
              <EditPencilIcon /> {t('প্রথম রিভিউটি লিখুন')}
            </button>
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

      {/* Reviews List & Bottom Button (যখন রিভিউ রয়েছে — সব রিভিউর নিচে বাটন প্লেসমেন্ট) */}
      {!loading && reviews.length > 0 && (
        <div className="flex flex-col gap-4">
          {reviews.map((r) => {
            const dateStr = r.created_at
              ? new Date(r.created_at).toLocaleDateString(lang === 'en' ? 'en-US' : 'bn-BD', {
                year: 'numeric', month: 'short', day: 'numeric',
              })
              : '';

            const isOwnPending = !r.is_approved && r.user_id === currentUser?.id;

            return (
              <div
                key={r.id}
                className={`rounded-brand border p-4 shadow-sh1 transition-brand duration-brand ${
                  isOwnPending
                    ? 'border-amber-200/90 bg-amber-50/40 opacity-90'
                    : 'border-border-base bg-white hover:border-brand-light/30'
                }`}
              >
                {/* Header: Avatar, Name, Rating & Badges */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <UserAvatar name={r.user_name} size="md" />
                    <div>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-body text-[13.5px] font-bold text-ink">{r.user_name}</span>
                        {r.is_verified_buyer && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 font-body text-[10.5px] font-semibold text-emerald-700">
                            <VerifiedBadgeIcon /> {t('Verified Purchase')}
                          </span>
                        )}
                      </div>
                      <div className="mt-0.5 flex items-center gap-2">
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <StarIcon key={star} filled={star <= Number(r.rating)} className="h-3.5 w-3.5" />
                          ))}
                        </div>
                        <span className="font-body text-[11px] text-muted">{dateStr}</span>
                      </div>
                    </div>
                  </div>

                  {/* Facebook Style "Pending Approval" Ghost Badge */}
                  {isOwnPending && (
                    <span className="rounded-full border border-amber-300 bg-amber-100 px-2.5 py-1 font-body text-[10.5px] font-bold text-amber-800 shadow-xs">
                      ⏳ {t('অনুমোদনের অপেক্ষায়')}
                    </span>
                  )}
                </div>

                {/* Review Text */}
                <p className="mt-3 font-body text-[13.5px] leading-relaxed text-ink/90">
                  {r.review_text}
                </p>

                {/* Review Photo (if attached) */}
                {r.image_url && (
                  <div className="mt-3">
                    <button
                      type="button"
                      onClick={() => setZoomImageUrl(r.image_url!)}
                      className="group relative block h-20 w-20 overflow-hidden rounded-[10px] border border-border-base transition-transform hover:scale-105"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={optimizeCloudinaryUrl(r.image_url, 200)}
                        alt="Customer Review"
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                      <span className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity group-hover:opacity-100 text-white text-xs">
                        🔍
                      </span>
                    </button>
                  </div>
                )}

                {/* Author Feedback Note */}
                {isOwnPending && (
                  <p className="mt-2.5 font-body text-[11.5px] italic text-amber-700/90">
                    💡 {t('আপনার রিভিউটি সফলভাবে জমা হয়েছে। এডমিন অনুমোদনের পর এটি সবার জন্য লাইভ হবে।')}
                  </p>
                )}
              </div>
            );
          })}

          {/* Bottom "নতুন রিভিউ লিখুন" Button (যখন রিভিউ রয়েছে — নিচে প্লেসমেন্ট) */}
          <div className="mt-2 flex justify-center pt-2">
            <button
              onClick={handleOpenWriteReview}
              className="inline-flex items-center gap-2 rounded-full border border-brand-light/50 bg-brand-bg/40 px-6 py-2.5 font-body text-[13px] font-bold text-brand-primary shadow-sm transition-brand duration-brand hover:border-brand-light hover:bg-brand-bg hover:shadow-sh1"
            >
              <EditPencilIcon /> {t('নতুন রিভিউ লিখুন')}
            </button>
          </div>
        </div>
      )}

      {/* Write Review Modal */}
      {writeModalOpen && (
        <div
          className="fixed inset-0 z-[1100] flex items-center justify-center bg-ink/50 p-4 backdrop-blur-[2px] animate-section-reveal"
          onClick={(e) => { if (e.target === e.currentTarget) setWriteModalOpen(false); }}
        >
          <div className="w-full max-w-[460px] rounded-[22px] bg-white p-6 shadow-sh3">
            <div className="mb-4 flex items-center justify-between border-b border-border-base pb-3">
              <h3 className="flex items-center gap-2 font-display text-base font-bold text-ink">
                <StarFillBadgeIcon className="text-gold" /> {t('রিভিউ লিখুন')}
              </h3>
              <button
                onClick={() => setWriteModalOpen(false)}
                className="flex h-7 w-7 items-center justify-center rounded-full text-muted hover:bg-surface-muted hover:text-ink"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitReview} className="flex flex-col gap-4">
              {/* Star Selector */}
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

              {/* Review Textarea */}
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

              {/* Optional Image Upload with Browser Canvas WebP Compression */}
              <div>
                <label className="mb-1.5 block font-body text-xs font-bold text-ink">
                  {t('প্রোডাক্টের ছবি যুক্ত করুন')} <span className="font-normal text-muted">({t('ঐচ্ছিক, সর্বোচ্চ ৫MB')})</span>
                </label>
                
                {previewUrl ? (
                  <div className="relative inline-block">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="h-20 w-20 rounded-xl border border-border-base object-cover shadow-sm"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveFile}
                      className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white shadow-sm hover:bg-red-600"
                      title={t('ছবি মুছুন')}
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-border-base bg-surface-muted/50 p-3.5 font-body text-xs font-semibold text-muted transition-brand hover:border-brand-light hover:text-brand-light">
                    <CameraUploadIcon className="h-4 w-4" /> {t('ছবি আপলোড করুন (JPG/PNG/WEBP)')}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                )}
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

      {/* 2-Review Limit Warning Modal (আন-অর্ডারড ফেক রিভিউ ব্লকিং) */}
      {limitModalOpen && (
        <div
          className="fixed inset-0 z-[1200] flex items-center justify-center bg-ink/60 p-4 backdrop-blur-[2px] animate-section-reveal"
          onClick={() => setLimitModalOpen(false)}
        >
          <div className="w-full max-w-[400px] rounded-[24px] bg-white p-6 text-center shadow-sh3">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-700">
              <BanShieldIcon />
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

      {/* Lightbox Fullscreen Image Zoom Modal */}
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
