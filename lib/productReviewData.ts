import type { SupabaseClient } from '@supabase/supabase-js';
import type { ProductReview, ReviewRatingSummary } from '@/types';
import { sanitizeInput, sanitizePlainName, MAX_NAME_LEN } from './security';
import { logWarn } from './logger';

const MIN_REVIEW_LEN = 20;
const MAX_REVIEW_LEN = 500;
const MAX_UNVERIFIED_REVIEWS_PER_DAY = 2;

export async function fetchProductReviews(
  supabase: SupabaseClient,
  productId: number | string,
  currentUserId?: string | null,
): Promise<ProductReview[]> {
  try {
    const { data, error } = await supabase
      .from('product_reviews')
      .select('id, product_id, user_id, user_name, rating, review_text, image_url, is_verified_buyer, is_approved, created_at')
      .eq('product_id', productId)
      .order('created_at', { ascending: false });

    if (error || !data) return [];

    const reviews = data as ProductReview[];

    // যদি বর্তমান ইউজারের নিজস্ব পেন্ডিং রিভিউ থাকে, সেটিকে লিস্টের সবার উপরে আনা
    if (currentUserId) {
      reviews.sort((a, b) => {
        const aIsOwnPending = a.user_id === currentUserId && !a.is_approved ? 1 : 0;
        const bIsOwnPending = b.user_id === currentUserId && !b.is_approved ? 1 : 0;
        return bIsOwnPending - aIsOwnPending;
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

  // ১. ভেরিফায়েড বায়ার চেক
  const isVerified = await checkIsVerifiedBuyer(supabase, payload.productId, payload.userId);

  // ২. যদি না কেনা থাকে, তবে আজকের ২-রিভিউ লিমিট চেক
  if (!isVerified) {
    const limitCheck = await checkUnverifiedReviewDailyLimit(supabase, payload.userId);
    if (!limitCheck.allowed) {
      return {
        ok: false,
        limitExceeded: true,
        error: 'আপনি ইতিমধ্যে আজকের জন্য সর্বোচ্চ ২টি আন-অর্ডারড প্রোডাক্টে রিভিউ দিয়েছেন এবং আপনি এই প্রোডাক্টটি অর্ডারও করেননি। প্রতারণা রোধে এই মুহূর্তে নতুন রিভিউ দেওয়া সম্ভব নয়।',
      };
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
        is_verified_buyer: isVerified,
        is_approved: false, // ডিফল্টভাবে এডমিন অ্যাপ্রুভালের জন্য ওয়েটিংয়ে থাকবে
      })
      .select('id, product_id, user_id, user_name, rating, review_text, image_url, is_verified_buyer, is_approved, created_at')
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

/**
 * স্মার্ট হাইব্রিড রেটিং ক্যালকুলেটর:
 * - যদি কোনো এপ্রুভড রিভিউ না থাকে: ডাটাবেজের ডিফল্ট রেটিং (যেমন ৪.৮) রিটার্ন করে।
 * - যদি এপ্রুভড রিভিউ থাকে: লাইভ এভারেজ ও ৫-স্টার পার্সেন্টেজ হিসাব করে।
 */
export function calculateReviewSummary(
  reviews: ProductReview[],
  defaultRating = 4.8,
): ReviewRatingSummary {
  const approvedReviews = reviews.filter((r) => r.is_approved);
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
