import type { Metadata } from 'next';
import StatusClient from './StatusClient';
import { getServerLang } from '@/lib/i18n/getServerLang';

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getServerLang();
  return {
    title: lang === 'en' ? 'Order Status - Vangcur' : 'অর্ডার স্ট্যাটাস - Vangcur',
    robots: { index: false, follow: true },
  };
}

export default function CheckoutStatusPage() {
  return <StatusClient />;
}
