import type { Metadata } from 'next';
import { Suspense } from 'react';
import { createClient } from '@supabase/supabase-js';
import { getCachedCatalogIndex } from '@/lib/catalogIndex';
import { fetchCategories } from '@/lib/categoryData';
import { getServerLang } from '@/lib/i18n/getServerLang';
import SearchClient from './SearchClient';

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}): Promise<Metadata> {
  const [{ q }, lang] = await Promise.all([searchParams, getServerLang()]);
  const query = (q || '').trim();
  const title = lang === 'en'
    ? (query ? `Search results for "${query}" - Vangcur` : 'Search Results - Vangcur')
    : (query ? `"${query}" এর সার্চ ফলাফল - Vangcur` : 'সার্চ ফলাফল - Vangcur');
  return {
    title,
    robots: { index: false, follow: true },
  };
}

export default async function SearchPage() {
  // কুকি-ছাড়া anon ক্লায়েন্ট + ৫ মিনিট-ক্যাশ করা হালকা ইনডেক্স (পুরো ক্যাটালগ প্রতিবার আনা হয় না)
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const [initialProducts, initialCategories] = await Promise.all([
    getCachedCatalogIndex(),
    url && key ? fetchCategories(createClient(url, key)) : Promise.resolve([]),
  ]);

  return (
    <Suspense fallback={null}>
      <SearchClient initialProducts={initialProducts} initialCategories={initialCategories} />
    </Suspense>
  );
}
