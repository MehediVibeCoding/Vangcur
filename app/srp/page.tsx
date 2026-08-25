import type { Metadata } from 'next';
import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { fetchCustomProducts } from '@/lib/productData';
import { getServerLang } from '@/lib/i18n/getServerLang';
import SrpClient from './SrpClient';

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

export default async function SrpPage() {
  const supabase = await createClient();
  const initialProducts = await fetchCustomProducts(supabase);

  return (
    <Suspense fallback={null}>
      <SrpClient initialProducts={initialProducts} />
    </Suspense>
  );
}
