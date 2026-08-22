import type { Metadata } from 'next';
import TermsClient from './TermsClient';

export const metadata: Metadata = {
  title: 'শর্তাবলী (Terms & Conditions) - Vangcur',
  description: 'Vangcur (ভাঙচুর) থেকে কেনাকাটার আগে আমাদের অর্ডার, ডেলিভারি, আনবক্সিং ভিডিও, ওয়ারেন্টি ও ব্যবহারের শর্তাবলী পড়ে নিন।',
};

export default function TermsPage() {
  return <TermsClient />;
}
