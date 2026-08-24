import type { Metadata } from 'next';
import RefundPolicyClient from './RefundPolicyClient';
import { serverT } from '@/lib/i18n/serverLang';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: await serverT('রিটার্ন ও রিফান্ড পলিসি - Vangcur'),
    description: await serverT('Vangcur (ভাঙচুর)-এর প্রোডাক্ট রিটার্ন, এক্সচেঞ্জ, রিপ্লেসমেন্ট ও রিফান্ড সংক্রান্ত পূর্ণাঙ্গ নীতিমালা।'),
  };
}

export default function RefundPolicyPage() {
  return <RefundPolicyClient />;
}
