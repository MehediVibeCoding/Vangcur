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

interface GalleryCardItem {
  id: string;
  reviewId: number | string;
  userName: string;
  rating: number;
  reviewText: string;
  imageUrl?: string | null;
  likeCount: number;
  isVerifiedBuyer: boolean;
  isApproved: boolean;
  isRejected?: boolean;
  rejectionReason?: string | null;
  createdAt: string;
  userId: string;
}

function StarIcon({ filled = false, className = '' }: { filled?: boolean; className?: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill={filled ? '#D4A853' : 'none'} stroke={filled ? '#D4A853' : '#D1D5DB'} strokeWidth="1.5" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
    </svg>
  );
}

function SolidStarIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="white" className="text-white fill-current">
      <path d="M12 2l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6-5.9-3.3-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8z" />
    </svg>
  );
}

function PlusIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
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
    <svg width="16" height="16" viewBox="0 0 24 24" fill={filled ? '#FF5A6E' : 'none'} stroke={filled ? '#FF5A6E' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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

  // Modals
  const [limitModalOpen, setLimitModalOpen] = useState(false);
  const [rejectedReviewNotice, setRejectedReviewNotice] = useState<ProductReview | null>(null);

  // Lightbox Zoom
  const [zoomImageUrl, setZoomImageUrl] = useState<string | null>(null);

  // Touch Swipe
  const touchRef = useRef({ startX: 0, startY: 0 });

  const loadReviewsData = useCallback(async () => {
    setLoading(true);
    const [data, adminStatus] = await Promise.all([
      fetchProductReviews(supabase, productId, currentUser?.id),
      checkIsUserAdmin(supabase, currentUser?.id),
    ]);
    setReviews(data);
    setIsAdmin(adminStatus);
    setLikedList(getLikedReviews());

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
    try {
      if (currentUser?.id && sessionStorage.getItem('vc_auto_open_review') === '1') {
        sessionStorage.removeItem('vc_auto_open_review');
        setTimeout(() => handleOpenWriteReview(), 400);
      }
    } catch {
      // ignore
    }
  }, [currentUser?.id]);

  useEffect(() => {
    if (writeModalOpen || limitModalOpen || zoomImageUrl || rejectedReviewNotice) {
      lockBody();
    } else {
      unlockBody();
    }
    return () => unlockBody();
  }, [writeModalOpen, limitModalOpen, zoomImageUrl, rejectedReviewNotice]);

  const userExistingReview = useMemo(
    () => (currentUser?.id ? reviews.find((r) => r.user_id === currentUser.id) : null),
    [reviews, currentUser?.id]
  );

  const galleryItems = useMemo<GalleryCardItem[]>(() => {
    const listToProcess = [...reviews].filter(
      (r) => (r.is_approved && !r.is_rejected) || (currentUser?.id && r.user_id === currentUser.id && !r.is_rejected)
    );

    const items: GalleryCardItem[] = [];
    listToProcess.forEach((r) => {
      if (r.image_url && r.image_url.includes(',')) {
        const urls = r.image_url.split(',').map((u) => u.trim()).filter(Boolean);
        urls.forEach((url, i) => {
          items.push({
            id: `${r.id}-${i}`,
            reviewId: r.id,
            userName: r.user_name,
            rating: r.rating,
            reviewText: r.review_text,
            imageUrl: url,
            likeCount: r.like_count || 0,
            isVerifiedBuyer: r.is_verified_buyer,
            isApproved: r.is_approved,
            isRejected: r.is_rejected,
            rejectionReason: r.rejection_reason,
            createdAt: r.created_at,
            userId: r.user_id,
          });
        });
      } else {
        items.push({
          id: String(r.id),
          reviewId: r.id,
          userName: r.user_name,
          rating: r.rating,
          reviewText: r.review_text,
          imageUrl: r.image_url || null,
          likeCount: r.like_count || 0,
          isVerifiedBuyer: r.is_verified_buyer,
          isApproved: r.is_approved,
          isRejected: r.is_rejected,
          rejectionReason: r.rejection_reason,
          createdAt: r.created_at,
          userId: r.user_id,
        });
      }
    });

    return items;
  }, [reviews, currentUser?.id]);

  const slide = (dir: number) => {
    const n = galleryItems.length;
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

  const handleDeleteReview = async (e: React.MouseEvent, reviewId: number | string) => {
    e.stopPropagation();
    if (!window.confirm('আপনি কি নিশ্চিতভাবে এই রিভিউটি মুছে ফেলতে চান?')) return;

    const res = await deleteProductReview(supabase, reviewId, currentUser?.id);
    if (res.ok) {
      setReviews((prev) => prev.filter((r) => r.id !== reviewId));
      showToast(t('রিভিউটি মুছে ফেলা হয়েছে'));
    } else {
      showToast(t('মুছে ফেলা সম্ভব হয়নি'));
    }
  };

  const handleOpenWriteReview = async () => {
    if (!currentUser?.id) {
      try {
        sessionStorage.setItem('vc_auth_redirect', window.location.pathname);
        sessionStorage.setItem('vc_auto_open_review', '1');
      } catch {
        // ignore
      }
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

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser?.id) return;

    setErrorMessage('');
    setSubmitting(true);

    try {
      const uploadedUrls: string[] = [];
      if (selectedFiles.length > 0) {
        for (const file of selectedFiles) {
          try {
            const url = await uploadReviewImageToCloudinary(file);
            if (url) uploadedUrls.push(url);
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
      }

      const res = await submitProductReview(supabase, {
        productId,
        userId: currentUser.id,
        userName: currentUser.name || 'Customer',
        rating: ratingInput,
        reviewText,
        imageUrl: uploadedUrls.length > 0 ? uploadedUrls.join(',') : null,
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
    <div className="py-1">
      {/* Header Block — টু-টোন ব্র্যান্ড হেডার ও স্কাই-ব্লু ব্যাজ আইকন */}
      <div className="mb-5 flex flex-col gap-1">
        <div className="flex items-center gap-2.5 font-display text-lg font-bold text-ink">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-light text-white shadow-xs">
            <SolidStarIcon />
          </span>
          <span>
            {t('কাস্টমার')} <span className="text-brand-light">{t('রিভিউ ও রেটিং')}</span>
          </span>
        </div>
        <p className="font-body text-[12.5px] text-muted">
          {lang === 'en'
            ? `Real unboxing photos and customer reviews of ${productName}.`
            : `${productName}-এর প্রকৃত কাস্টমারদের আনবক্সিং অভিজ্ঞতা ও রিভিউ।`}
        </p>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="py-8 text-center font-body text-[13px] text-muted">
          <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-brand-light/30 border-t-brand-light" />
          {t('রিভিউ লোড হচ্ছে...')}
        </div>
      )}

      {/* Empty State */}
      {!loading && galleryItems.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-[18px] border border-dashed border-border-base bg-surface-muted/50 p-6 text-center">
          <div className="mb-2 flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <StarIcon key={star} filled={star <= Math.round(defaultRating)} />
            ))}
          </div>
          <p className="font-body text-sm font-bold text-ink">
            {lang === 'en' ? 'No customer reviews yet' : 'এই প্রোডাক্টটিতে এখনো কোনো কাস্টমার রিভিউ নেই'}
          </p>
          <p className="mt-1 max-w-sm font-body text-xs text-muted">
            {lang === 'en'
              ? 'Be the first customer to share your unboxing experience with this product!'
              : 'আপনিই প্রথম রিভিউ দিয়ে প্রোডাক্টের কোয়ালিটি সম্পর্কে আপনার অভিজ্ঞতা জানান!'}
          </p>
          {!userExistingReview && (
            <button
              onClick={handleOpenWriteReview}
              className="mt-4 inline-flex h-10 items-center justify-center gap-2 rounded-full bg-brand-light px-6 font-body text-xs font-bold text-white shadow-sh1 transition-brand hover:bg-brand-light-hover"
            >
              <PlusIcon /> {t('আপনার রিভিউ যুক্ত করুন')}
            </button>
          )}
        </div>
      )}

      {/* 3D Coverflow Review Gallery — সফট ও স্মুথ শ্যাডো */}
      {!loading && galleryItems.length > 0 && (
        <div className="mb-1">
          <div
            className="relative mx-auto w-full max-w-[850px] overflow-hidden py-1"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <div className="flex items-center justify-center gap-3 sm:gap-6">
              {galleryItems.map((item, idx) => {
                const isActive = idx === activeCardIdx;
                const isOwnPending = !item.isApproved && item.userId === currentUser?.id;
                const isLiked = likedList.includes(String(item.reviewId));
                const dateStr = item.createdAt
                  ? new Date(item.createdAt).toLocaleDateString(lang === 'en' ? 'en-US' : 'bn-BD', {
                    year: 'numeric', month: 'short', day: 'numeric',
                  })
                  : '';

                const n = galleryItems.length;
                const prevIdx = (activeCardIdx - 1 + n) % n;
                const nextIdx = (activeCardIdx + 1) % n;
                const isVisible = idx === activeCardIdx || idx === prevIdx || idx === nextIdx;

                if (!isVisible && n > 2) return null;

                return (
                  <div
                    key={item.id}
                    onClick={() => setActiveCardIdx(idx)}
                    className={`relative h-[390px] w-[245px] shrink-0 select-none overflow-hidden rounded-[20px] transition-all duration-300 ease-brand [-webkit-tap-highlight-color:transparent] sm:h-[420px] sm:w-[280px] ${
                      isActive
                        ? 'z-10 scale-100 opacity-100 shadow-[0_4px_16px_rgba(0,0,0,0.06)] ring-1 ring-brand-light/30'
                        : 'z-0 scale-[0.85] opacity-60 cursor-pointer'
                    }`}
                  >
                    {/* ফটো রিভিউ বনাম ফ্রস্টেড গ্লাস টেক্সট রিভিউ */}
                    {item.imageUrl ? (
                      <div
                        className="group relative h-full w-full cursor-zoom-in"
                        onClick={(e) => {
                          e.stopPropagation();
                          setZoomImageUrl(item.imageUrl!);
                        }}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={optimizeCloudinaryUrl(item.imageUrl, 500)}
                          alt="Review Unboxing"
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          loading="lazy"
                        />
                        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/75 via-transparent to-black/85" />
                      </div>
                    ) : (
                      <div className="absolute inset-0 flex flex-col justify-between bg-gradient-to-br from-[#E0F2FE]/90 via-white to-[#F0F9FF]/95 p-5 backdrop-blur-md">
                        <div className="flex items-center justify-between">
                          <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <StarIcon key={star} filled={star <= Number(item.rating)} className="h-3.5 w-3.5" />
                            ))}
                          </div>
                          {isOwnPending && (
                            <span className="rounded-full bg-amber-500/90 px-2 py-0.5 font-body text-[9px] font-bold text-white shadow-xs">
                              ⏳ {t('অনুমোদনের অপেক্ষায়')}
                            </span>
                          )}
                        </div>

                        <div className="my-auto px-2 text-center">
                          <p className="line-clamp-6 font-body text-[13.5px] font-semibold leading-relaxed text-slate-800">
                            &quot;{item.reviewText}&quot;
                          </p>
                        </div>

                        <div className="flex items-center justify-between border-t border-sky-100 pt-3">
                          <div className="flex min-w-0 items-center gap-2">
                            <UserAvatar name={item.userName} size="sm" />
                            <div className="min-w-0 text-left">
                              <div className="truncate font-body text-xs font-bold text-ink">
                                {item.userName}
                              </div>
                              <div className="flex items-center gap-1 font-body text-[10px] text-muted">
                                <span>{dateStr}</span>
                                {item.isVerifiedBuyer && <VerifiedCheckIcon />}
                              </div>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={(e) => handleLikeClick(e, item.reviewId)}
                            className={`flex h-7 items-center gap-1 rounded-full px-2 transition-transform active:scale-90 ${isLiked ? 'bg-red-50 text-[#FF5A6E]' : 'bg-surface-muted text-muted'}`}
                          >
                            <HeartIcon filled={isLiked} />
                            <span className="font-body text-[10.5px] font-bold">
                              {item.likeCount || 0}
                            </span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* PHOTO CARD OVERLAYS */}
                    {item.imageUrl && (
                      <>
                        <div className="absolute inset-x-0 top-0 z-10 flex items-start justify-between p-3.5 pt-4">
                          <div>
                            <div className="mb-1 flex gap-0.5">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <StarIcon key={star} filled={star <= Number(item.rating)} className="h-3.5 w-3.5" />
                              ))}
                            </div>
                            <p className="line-clamp-3 font-body text-[12px] font-medium text-white drop-shadow">
                              &quot;{item.reviewText}&quot;
                            </p>
                          </div>
                          {isOwnPending && (
                            <span className="rounded-full bg-amber-500/90 px-2 py-0.5 font-body text-[9px] font-bold text-white shadow-xs">
                              ⏳ {t('অনুমোদনের অপেক্ষায়')}
                            </span>
                          )}
                        </div>

                        <div className="absolute inset-x-0 bottom-0 z-10 flex items-center justify-between p-3.5 pb-4">
                          <div className="flex min-w-0 items-center gap-2">
                            <UserAvatar name={item.userName} size="sm" />
                            <div className="min-w-0 text-left">
                              <div className="truncate font-body text-xs font-bold text-white drop-shadow-sm">
                                {item.userName}
                              </div>
                              <div className="flex items-center gap-1 font-body text-[10px] text-white/75">
                                <span>{dateStr}</span>
                                {item.isVerifiedBuyer && <VerifiedCheckIcon />}
                              </div>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={(e) => handleLikeClick(e, item.reviewId)}
                            className={`flex h-7 items-center gap-1 rounded-full bg-black/40 px-2.5 backdrop-blur-md transition-transform active:scale-90 ${isLiked ? 'text-[#FF5A6E]' : 'text-white'}`}
                          >
                            <HeartIcon filled={isLiked} />
                            <span className="font-body text-[10.5px] font-bold text-white">
                              {item.likeCount || 0}
                            </span>
                          </button>
                        </div>
                      </>
                    )}

                    {/* Moderation Bar */}
                    {(isAdmin || (currentUser?.id && item.userId === currentUser.id)) && (
                      <div className="absolute right-2.5 top-2.5 z-20 flex items-center gap-1 rounded-full bg-black/75 p-1 backdrop-blur-md">
                        {isAdmin && !item.isApproved && (
                          <button
                            onClick={(e) => handleAdminApprove(e, item.reviewId)}
                            title="Approve"
                            className="rounded-full bg-emerald-600 px-2 py-0.5 font-body text-[9.5px] font-bold text-white hover:bg-emerald-500"
                          >
                            ✓
                          </button>
                        )}
                        {isAdmin && !item.isRejected && (
                          <button
                            onClick={(e) => handleAdminReject(e, item.reviewId)}
                            title="Reject"
                            className="rounded-full bg-amber-600 px-2 py-0.5 font-body text-[9.5px] font-bold text-white hover:bg-amber-500"
                          >
                            ✕
                          </button>
                        )}
                        <button
                          onClick={(e) => handleDeleteReview(e, item.reviewId)}
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
            {galleryItems.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => slide(-1)}
                  aria-label="Previous"
                  className="absolute left-1 top-1/2 z-20 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-ink shadow-sh2 hover:bg-white sm:flex"
                >
                  &#8249;
                </button>
                <button
                  type="button"
                  onClick={() => slide(1)}
                  aria-label="Next"
                  className="absolute right-1 top-1/2 z-20 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-ink shadow-sh2 hover:bg-white sm:flex"
                >
                  &#8250;
                </button>
              </>
            )}
          </div>

          {/* Dots Indicator */}
          {galleryItems.length > 1 && (
            <div className="my-2 flex justify-center gap-1.5">
              {galleryItems.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveCardIdx(i)}
                  className={`h-1.5 rounded-full transition-all duration-brand ${i === activeCardIdx ? 'w-5 bg-brand-light' : 'w-1.5 bg-border-base'}`}
                  aria-label={`Slide ${i + 1}`}
                />
              ))}
            </div>
          )}

          {/* Bottom Button */}
          {!userExistingReview && (
            <div className="mt-2.5 flex justify-center pt-1">
              <button
                onClick={handleOpenWriteReview}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-brand-light px-6 font-body text-xs font-bold text-white shadow-sh1 transition-brand duration-brand hover:bg-brand-light-hover"
              >
                <PlusIcon /> {t('আপনার রিভিউ যুক্ত করুন')}
              </button>
            </div>
          )}
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
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-light text-white">
                  <SolidStarIcon />
                </span>
                {t('আপনার রিভিউ যুক্ত করুন')}
              </h3>
              <button
                onClick={() => setWriteModalOpen(false)}
                className="flex h-7 w-7 items-center justify-center rounded-full text-muted hover:bg-surface-muted hover:text-ink"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitReview} className="flex flex-col gap-4">
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

              <div>
                <label className="mb-1.5 block font-body text-xs font-bold text-ink">
                  {t('প্রোডাক্টের ছবি যুক্ত করুন')} <span className="font-normal text-muted">({t('ঐচ্ছিক, সর্বোচ্চ ৩টি ছবি')})</span>
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
                          <img src={url} alt="Preview" className="h-16 w-16 rounded-lg border border-border-base object-cover shadow-sm" />
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

      {/* Rejection Notice Modal */}
      {rejectedReviewNotice && (
        <div
          className="fixed inset-0 z-[1250] flex items-center justify-center bg-ink/60 p-4 backdrop-blur-[2px] animate-section-reveal"
          onClick={() => setRejectedReviewNotice(null)}
        >
          <div className="w-full max-w-[420px] rounded-[24px] bg-white p-6 text-center shadow-sh3">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-2xl text-red-600">
              ⚠️
            </div>
            <h3 className="mb-1 font-display text-base font-bold text-ink">
              {t('আপনার রিভিউটি গ্রহণ করা সম্ভব হয়নি')}
            </h3>
            <p className="mb-2 font-body text-xs font-bold text-brand-primary">
              [{productName}]
            </p>
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
                  setTimeout(() => handleOpenWriteReview(), 200);
                }}
                className="flex-1 rounded-full bg-brand-primary py-2.5 font-body text-xs font-bold text-white shadow-sm hover:bg-brand-light-hover"
              >
                {t('নতুন করে রিভিউ দিন')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Limit Modal */}
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

      {/* Zoom Lightbox */}
      {zoomImageUrl && (
        <div
          className="fixed inset-0 z-[1300] flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm animate-section-reveal"
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
              src={optimizeCloudinaryUrl(zoomImageUrl, 1200)}
              alt="Full Resolution Unboxing"
              className="max-h-[85vh] max-w-[85vw] rounded-xl object-contain shadow-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
}
