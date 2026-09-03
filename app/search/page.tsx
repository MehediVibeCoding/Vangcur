import type { Metadata } from 'next';
import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { fetchCustomProducts } from '@/lib/productData';
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
  const supabase = await createClient();
  const [initialProducts, initialCategories] = await Promise.all([
    fetchCustomProducts(supabase),
    fetchCategories(supabase),
  ]);

  return (
    <Suspense fallback={null}>
      <SearchClient initialProducts={initialProducts} initialCategories={initialCategories} />
    </Suspense>
  );
}
