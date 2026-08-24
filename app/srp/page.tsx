import type { Metadata } from 'next';
import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { fetchCustomProducts } from '@/lib/productData';
import SrpClient from './SrpClient';
import { getServerLang } from '@/lib/i18n/serverLang';

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}): Promise<Metadata> {
  const { q } = await searchParams;
  const query = (q || '').trim();
  const lang = await getServerLang();
  const title = query
    ? (lang === 'en' ? `"${query}" search results - Vangcur` : `"${query}" এর সার্চ ফলাফল - Vangcur`)
    : (lang === 'en' ? 'Search Results - Vangcur' : 'সার্চ ফলাফল - Vangcur');
  return {
    title,
    robots: { index: false, follow: true },
  };
}

export default async function SrpPage() {
  const supabase = await createClient();
  const initialProducts = await fetchCustomProducts(supabase);

  return (
    <Suspense fallback={null}>
      <SrpClient initialProducts={initialProducts} />
    </Suspense>
  );
}
