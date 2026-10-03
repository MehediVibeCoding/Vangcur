// ফাইলের পাথ: lib/catalogIndex.ts
// [NEW] সার্ভার-সাইডে হালকা ক্যাটালগ ইনডেক্স (৫ মিনিট ক্যাশ, কুকি ছাড়া anon ক্লায়েন্ট)।
// /search পেজ ও /api/search-index দুটোই এটা ব্যবহার করে — ফলে প্রতিটা সার্চ-ভিজিটে ডাটাবেস
// থেকে পুরো ক্যাটালগ আনা হয় না। অ্যাডমিন প্রোডাক্ট বদলালে revalidateTag('catalog') ক্যাশ মুছে দেয়
// (app/api/revalidate-catalog/route.ts)।

import { unstable_cache } from 'next/cache';
import { createClient } from '@supabase/supabase-js';
import { fetchCustomProducts } from '@/lib/productData';
import { fetchCategories } from '@/lib/categoryData';
import type { Category, Product } from '@/types';

export const getCachedCatalogIndex = unstable_cache(
  async (): Promise<Product[]> => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return [];
    const supabase = createClient(url, key);
    const all = await fetchCustomProducts(supabase);
    return all.map((p) => ({
      ...p,
      // বড় টেক্সট ছাঁটা — সার্চ ও কার্টে এতটুকুই লাগে
      desc: (p.desc || '').slice(0, 160),
      longDesc: '',
    }));
  },
  ['catalog-index-v1'],
  { revalidate: 300, tags: ['catalog'] },
);

// সার্চ পেজের ক্যাটাগরি তালিকা — আগে প্রতিটা সার্চ-ভিজিটে সরাসরি ডাটাবেস থেকে আনা হতো।
// এখন একই ৫ মিনিটের ক্যাশ + একই 'catalog' ট্যাগ (অ্যাডমিন বদলালে একসাথে মুছে যায়)।
export const getCachedCategories = unstable_cache(
  async (): Promise<Category[]> => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return [];
    return fetchCategories(createClient(url, key));
  },
  ['catalog-categories-v1'],
  { revalidate: 300, tags: ['catalog'] },
);
