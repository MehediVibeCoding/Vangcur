import type { Metadata } from 'next';
import AccountOrdersClient from './AccountOrdersClient';
import { serverT } from '@/lib/i18n/serverLang';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: await serverT('আমার অর্ডার সমূহ - Vangcur'),
    robots: { index: false, follow: false },
  };
}

export default function AccountOrdersPage() {
  return <AccountOrdersClient />;
}
