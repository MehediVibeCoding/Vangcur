import type { Metadata } from 'next';
import { Suspense } from 'react';
import TrackOrderClient from './TrackOrderClient';

export const metadata: Metadata = {
  title: 'অর্ডার ট্র্যাক করুন - Vangcur',
  description: 'অর্ডার নম্বর ও মোবাইল নম্বর দিয়ে আপনার Vangcur অর্ডারের সর্বশেষ অবস্থা দেখুন।',
};

export default function TrackOrderPage() {
  return (
    <Suspense fallback={null}>
      <TrackOrderClient />
    </Suspense>
  );
}
