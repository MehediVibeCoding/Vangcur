import type { Metadata } from 'next';
import StatusClient from './StatusClient';
import { serverT } from '@/lib/i18n/serverLang';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: await serverT('অর্ডার স্ট্যাটাস - Vangcur'),
    robots: { index: false, follow: true },
  };
}

export default function CheckoutStatusPage() {
  return <StatusClient />;
}
