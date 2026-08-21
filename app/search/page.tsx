import type { Metadata } from 'next';
import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { fetchCustomProducts } from '@/lib/productData';
import SearchClient from './SearchClient';

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}): Promise<Metadata> {
  const { q } = await searchParams;
  const query = (q || '').trim();
  return {
    title: query ? `"${query}" এর সার্চ ফলাফল - Vangcur` : 'সার্চ ফলাফল - Vangcur',
    robots: { index: false, follow: true },
  };
}

export default async function SearchPage() {
  const supabase = await createClient();
  const initialProducts = await fetchCustomProducts(supabase);

  return (
    <Suspense fallback={null}>
      <SearchClient initialProducts={initialProducts} />
    </Suspense>
  );
}
