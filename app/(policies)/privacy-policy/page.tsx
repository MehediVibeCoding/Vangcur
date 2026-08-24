import type { Metadata } from 'next';
import PrivacyPolicyClient from './PrivacyPolicyClient';
import { serverT } from '@/lib/i18n/serverLang';

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: await serverT('প্রাইভেসি পলিসি - Vangcur'),
    description: await serverT('Vangcur (ভাঙচুর) আপনার কী তথ্য সংগ্রহ করে, কীভাবে ব্যবহার করে এবং কীভাবে সুরক্ষিত রাখে তা জানুন।'),
  };
}

export default function PrivacyPolicyPage() {
  return <PrivacyPolicyClient />;
}
