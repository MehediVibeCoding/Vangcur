import type { Metadata } from 'next';
import { Suspense } from 'react';
import TrackOrderClient from './TrackOrderClient';
import { serverT } from '@/lib/i18n/serverLang';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: await serverT('অর্ডার ট্র্যাক করুন - Vangcur'),
    description: await serverT('অর্ডার নম্বর ও মোবাইল নম্বর দিয়ে আপনার Vangcur অর্ডারের সর্বশেষ অবস্থা দেখুন।'),
  };
}

export default function TrackOrderPage() {
  return (
    <Suspense fallback={null}>
      <TrackOrderClient />
    </Suspense>
  );
}
