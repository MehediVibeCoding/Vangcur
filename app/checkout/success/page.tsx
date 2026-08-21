import type { Metadata } from 'next';
import SuccessClient from './SuccessClient';

export const metadata: Metadata = {
  title: 'অর্ডার স্ট্যাটাস - Vangcur',
  robots: { index: false, follow: true },
};

export default function CheckoutSuccessPage() {
  return <SuccessClient />;
}
