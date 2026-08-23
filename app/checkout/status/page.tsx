import type { Metadata } from 'next';
import StatusClient from './StatusClient';

export const metadata: Metadata = {
  title: 'অর্ডার স্ট্যাটাস - Vangcur',
  robots: { index: false, follow: true },
};

export default function CheckoutStatusPage() {
  return <StatusClient />;
}
