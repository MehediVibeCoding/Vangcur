import type { SupabaseClient } from '@supabase/supabase-js';
import type { ProductReview, ReviewRatingSummary } from '@/types';
import { sanitizeInput, sanitizePlainName, MAX_NAME_LEN } from './security';
import { logWarn } from './logger';

const MIN_REVIEW_LEN = 20;
const MAX_REVIEW_LEN = 500;
const MAX_UNVERIFIED_REVIEWS_PER_DAY = 2;
const LIKED_REVIEWS_KEY = 'vc_liked_reviews';

const MODERATOR_EMAIL = 'mehedivibecoding@gmail.com';

export async function checkIsReviewAdminOrMod(
  supabase: SupabaseClient,
  userId?: string | null,
): Promise<boolean> {
  let targetId = userId;
  let userEmail: string | null = null;

  try {
    const { data } = await supabase.auth.getSession();
    if (!targetId) targetId = data?.session?.user?.id || null;
    userEmail = data?.session?.user?.email || null;
  } catch {
    // fallback
  }

  // ১. সরাসরি অথরাইজড মডারেটর জিমেইল যাচাই
  if (userEmail && userEmail.toLowerCase() === MODERATOR_EMAIL.toLowerCase()) {
    return true;
  }

  if (!targetId) return false;

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('is_admin, role, email')
      .eq('id', targetId)
      .maybeSingle();

    if (error || !data) return false;

    if (data.email && data.email.toLowerCase() === MODERATOR_EMAIL.toLowerCase()) return true;
    if (data.role && ['admin', 'super_admin', 'moderator'].includes(data.role)) return true;
    return !!data.is_admin;
  } catch {
    return false;
  }
}

export async function fetchProductReviews(
  supabase: SupabaseClient,
  productId: number | string,
  currentUserId?: string | null,
): Promise<ProductReview[]> {
  try {
    const { data, error } = await supabase
      .from('product_reviews')
      .select('id, product_id, user_id, user_name, rating, review_text, image_url, like_count, is_verified_buyer, is_approved, is_rejected, rejection_reason, created_at')
      .eq('product_id', productId)
      .order('created_at', { ascending: false });

    if (error || !data) return [];

    const reviews = data as ProductReview[];

    if (currentUserId) {
      reviews.sort((a, b) => {
        const aIsOwn = a.user_id === currentUserId && (!a.is_approved || a.is_rejected) ? 1 : 0;
        const bIsOwn = b.user_id === currentUserId && (!b.is_approved || b.is_rejected) ? 1 : 0;
        return bIsOwn - aIsOwn;
      });
    }

    return reviews;
  } catch (e) {
    logWarn('[Review] fetchProductReviews error:', e);
    return [];
  }
}

export async function checkIsVerifiedBuyer(
  supabase: SupabaseClient,
  productId: number | string,
  userId: string,
): Promise<boolean> {
  if (!userId) return false;
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('items, status')
      .eq('user_id', userId)
      .in('status', ['confirmed', 'shipped', 'delivered']);

    if (error || !data || !data.length) return false;

    const prodStrId = String(productId);
    return data.some((order) => {
      let items = order.items;
      if (typeof items === 'string') {
        try { items = JSON.parse(items); } catch { items = []; }
      }
      if (!Array.isArray(items)) return false;
      return items.some((item: { id?: string | number }) => String(item.id) === prodStrId);
    });
  } catch (e) {
    logWarn('[Review] checkIsVerifiedBuyer error:', e);
    return false;
  }
}

export async function checkUnverifiedReviewDailyLimit(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ allowed: boolean; countToday: number }> {
  if (!userId) return { allowed: false, countToday: 0 };
  try {
    const todayMidnight = new Date();
    todayMidnight.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
      .from('product_reviews')
      .select('id')
      .eq('user_id', userId)
      .eq('is_verified_buyer', false)
      .gte('created_at', todayMidnight.toISOString());

    if (error || !data) return { allowed: true, countToday: 0 };

    const countToday = data.length;
    return {
      allowed: countToday < MAX_UNVERIFIED_REVIEWS_PER_DAY,
      countToday,
    };
  } catch {
    return { allowed: true, countToday: 0 };
  }
}

export interface SubmitReviewPayload {
  productId: number | string;
  userId: string;
  userName: string;
  rating: number;
  reviewText: string;
  imageUrl?: string | null;
}

export async function submitProductReview(
  supabase: SupabaseClient,
  payload: SubmitReviewPayload,
): Promise<{ ok: boolean; data?: ProductReview; error?: string; limitExceeded?: boolean }> {
  if (!payload.userId) {
    return { ok: false, error: 'রিভিউ দেওয়ার জন্য লগইন করা আবশ্যক।' };
  }

  const name = sanitizePlainName(payload.userName || '').trim();
  const text = sanitizeInput(payload.reviewText || '').trim();
  const rating = Math.max(1, Math.min(5, Math.round(Number(payload.rating) || 5)));

  if (!name || name.length < 2 || name.length > MAX_NAME_LEN) {
    return { ok: false, error: 'অনুগ্রহ করে সঠিক নাম দিন (২-৩০ অক্ষর)' };
  }

  if (!text || text.length < MIN_REVIEW_LEN || text.length > MAX_REVIEW_LEN) {
    return { ok: false, error: `রিভিউটি কমপক্ষে ${MIN_REVIEW_LEN} এবং সর্বোচ্চ ${MAX_REVIEW_LEN} অক্ষরের হতে হবে` };
  }

  // এডমিন বা অথরাইজড মডারেটর কি না যাচাই
  const isPrivileged = await checkIsReviewAdminOrMod(supabase, payload.userId);

  if (!isPrivileged) {
    const isVerified = await checkIsVerifiedBuyer(supabase, payload.productId, payload.userId);
    if (!isVerified) {
      const limitCheck = await checkUnverifiedReviewDailyLimit(supabase, payload.userId);
      if (!limitCheck.allowed) {
        return {
          ok: false,
          limitExceeded: true,
          error: 'আপনি ইতিমধ্যে আজকের জন্য সর্বোচ্চ ২টি আন-অর্ডারড প্রোডাক্টে রিভিউ দিয়েছেন।',
        };
      }
    }
  }

  try {
    const { data, error } = await supabase
      .from('product_reviews')
      .insert({
        product_id: payload.productId,
        user_id: payload.userId,
        user_name: name,
        rating,
        review_text: text,
        image_url: payload.imageUrl || null,
        like_count: 0,
        is_verified_buyer: isPrivileged,
        is_approved: isPrivileged, // এডমিন বা মডারেটর রিভিউ দিলে সাথে সাথে লাইভ হবে
        is_rejected: false,
      })
      .select('id, product_id, user_id, user_name, rating, review_text, image_url, like_count, is_verified_buyer, is_approved, is_rejected, rejection_reason, created_at')
      .single();

    if (error) {
      if (error.code === '23505') {
        return { ok: false, error: 'আপনি ইতিমধ্যে এই প্রোডাক্টটিতে একটি রিভিউ দিয়েছেন।' };
      }
      logWarn('[Review] submitProductReview error:', error);
      return { ok: false, error: 'রিভিউ জমা দেওয়া সম্ভব হয়নি। আবার চেষ্টা করুন।' };
    }

    return { ok: true, data: data as ProductReview };
  } catch (e) {
    logWarn('[Review] submitProductReview exception:', e);
    return { ok: false, error: 'নেটওয়ার্ক সমস্যা। আবার চেষ্টা করুন।' };
  }
}

export async function deleteProductReview(
  supabase: SupabaseClient,
  reviewId: number | string,
  userId?: string | null,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const isPrivileged = await checkIsReviewAdminOrMod(supabase, userId);

    let q = supabase.from('product_reviews').delete().eq('id', reviewId);
    if (!isPrivileged && userId) {
      q = q.eq('user_id', userId);
    }

    const { error } = await q;
    if (error) {
      logWarn('[Review] deleteProductReview error:', error);
      return { ok: false, error: 'রিভিউটি মুছে ফেলা সম্ভব হয়নি।' };
    }
    return { ok: true };
  } catch (e) {
    logWarn('[Review] deleteProductReview exception:', e);
    return { ok: false, error: 'নেটওয়ার্ক সমস্যা।' };
  }
}

export function getLikedReviews(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(LIKED_REVIEWS_KEY) || '[]');
  } catch {
    return [];
  }
}

export async function toggleReviewLike(
  supabase: SupabaseClient,
  reviewId: number | string,
): Promise<{ ok: boolean; newCount?: number }> {
  const idStr = String(reviewId);
  const liked = getLikedReviews();
  if (liked.includes(idStr)) {
    return { ok: false };
  }

  try {
    const { data, error } = await supabase.rpc('increment_review_like', {
      p_review_id: Number(reviewId),
    });

    if (error) {
      logWarn('[Review] toggleReviewLike RPC error:', error);
      return { ok: false };
    }

    try {
      localStorage.setItem(LIKED_REVIEWS_KEY, JSON.stringify([...liked, idStr]));
    } catch {
      // ignore
    }

    return { ok: true, newCount: Number(data) };
  } catch (e) {
    logWarn('[Review] toggleReviewLike exception:', e);
    return { ok: false };
  }
}

export function calculateReviewSummary(
  reviews: ProductReview[],
  defaultRating = 4.8,
): ReviewRatingSummary {
  const approvedReviews = reviews.filter((r) => r.is_approved && !r.is_rejected);
  const count = approvedReviews.length;

  if (count === 0) {
    return {
      average: defaultRating,
      count: 0,
      breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      hasReviews: false,
    };
  }

  const totalStars = approvedReviews.reduce((sum, r) => sum + (Number(r.rating) || 5), 0);
  const average = Number((totalStars / count).toFixed(1));

  const starCounts: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  approvedReviews.forEach((r) => {
    const star = Math.max(1, Math.min(5, Math.round(Number(r.rating) || 5)));
    starCounts[star] = (starCounts[star] || 0) + 1;
  });

  const breakdown: Record<number, number> = {
    5: Math.round((starCounts[5] / count) * 100),
    4: Math.round((starCounts[4] / count) * 100),
    3: Math.round((starCounts[3] / count) * 100),
    2: Math.round((starCounts[2] / count) * 100),
    1: Math.round((starCounts[1] / count) * 100),
  };

  return {
    average,
    count,
    breakdown,
    hasReviews: true,
  };
}
