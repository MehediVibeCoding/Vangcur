import type { Metadata } from 'next';
import { Suspense } from 'react';
import SrpClient from './SrpClient';

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

export default function SrpPage() {
  return (
    <Suspense fallback={null}>
      <SrpClient />
    </Suspense>
  );
}
