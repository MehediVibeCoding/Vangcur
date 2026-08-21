import type { Metadata } from 'next';
import AccountOrdersClient from './AccountOrdersClient';

export const metadata: Metadata = {
  title: 'আমার অর্ডার সমূহ - Vangcur',
  robots: { index: false, follow: false },
};

export default function AccountOrdersPage() {
  return <AccountOrdersClient />;
}
