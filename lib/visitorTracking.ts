import type { SupabaseClient } from '@supabase/supabase-js';

// Supabase ডাটাবেজ কোটা ও রাইট লিমিট বাঁচাতে সরাসরি ডাটাবেজে পেজ ভিউ ইনসার্ট
// বন্ধ রাখা হয়েছে। ক্লাউডফ্লেয়ার / GA4 অ্যানালিটিক্স ব্যবহারই ১০০% নিরাপদ ও সাশ্রয়ী।
export function trackDailyVisit(_supabase: SupabaseClient): void {
  // Safe no-op to protect database quota
}

export function trackProductView(_supabase: SupabaseClient, _productId: number | string): void {
  // Safe no-op to protect database quota
}
