import type { Metadata } from 'next';
import RefundPolicyClient from './RefundPolicyClient';

export const metadata: Metadata = {
  title: 'রিটার্ন ও রিফান্ড পলিসি - Vangcur',
  description: 'Vangcur (ভাঙচুর)-এর প্রোডাক্ট রিটার্ন, এক্সচেঞ্জ, রিপ্লেসমেন্ট ও রিফান্ড সংক্রান্ত পূর্ণাঙ্গ নীতিমালা।',
};

export default function RefundPolicyPage() {
  return <RefundPolicyClient />;
}
