import type { Metadata } from 'next';
import TermsClient from './TermsClient';
import { serverT } from '@/lib/i18n/serverLang';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: await serverT('শর্তাবলী (Terms & Conditions) - Vangcur'),
    description: await serverT('Vangcur (ভাঙচুর) থেকে কেনাকাটার আগে আমাদের অর্ডার, ডেলিভারি, আনবক্সিং ভিডিও, ওয়ারেন্টি ও ব্যবহারের শর্তাবলী পড়ে নিন।'),
  };
}

export default function TermsPage() {
  return <TermsClient />;
}
