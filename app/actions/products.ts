'use server';

import { createClient } from '@/lib/supabase/server';
import { fetchProductsPage, type ProductsPageResult } from '@/lib/productData';

/**
 * হোমপেজের প্রোডাক্ট-গ্রিডের জন্য পেজিনেটেড ফেচ (audit P1-16)।
 * ক্যাটাগরি বদলানো বা স্ক্রল করে "আরও দেখুন"-এর সময় ProductGrid এটা কল করে —
 * প্রতিবার পুরো ক্যাটালগ না এনে শুধু দরকারি পেজটুকু আনে।
 */
export async function fetchProductsPageAction(
  category: string,
  offset: number,
  limit: number,
): Promise<ProductsPageResult> {
  const supabase = await createClient();
  return fetchProductsPage(supabase, category, offset, limit);
}
