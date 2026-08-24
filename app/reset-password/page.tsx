import { Suspense } from 'react';
import type { Metadata } from 'next';
import ResetPasswordClient from './ResetPasswordClient';
import { serverT } from '@/lib/i18n/serverLang';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: await serverT('পাসওয়ার্ড রিসেট - Vangcur'),
    robots: { index: false, follow: false },
  };
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordClient />
    </Suspense>
  );
}
