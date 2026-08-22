import type { Metadata } from 'next';
import PrivacyPolicyClient from './PrivacyPolicyClient';

export const metadata: Metadata = {
  title: 'প্রাইভেসি পলিসি - Vangcur',
  description: 'Vangcur (ভাঙচুর) আপনার কী তথ্য সংগ্রহ করে, কীভাবে ব্যবহার করে এবং কীভাবে সুরক্ষিত রাখে তা জানুন।',
};

export default function PrivacyPolicyPage() {
  return <PrivacyPolicyClient />;
}
