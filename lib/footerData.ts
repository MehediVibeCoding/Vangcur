import type { SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import type { FooterContact, FooterLogo, ServiceLink } from '@/types';
import { sanitizeHref } from './security';

export const DEFAULT_FOOTER = {
  logo: { mode: 'text' as const, main: 'Vangcur', sub: 'ভাঙচুর', img: null, alt: 'Vangcur Logo', height: 50 },
  desc: 'Vangcur - ভাঙচুর বাংলাদেশের একটি আধুনিক Gadget & Accessories ভিত্তিক E-commerce Brand। Official ও Unofficial সব ধরনের গ্যাজেট পাবেন Warranty Support সহ। সারা বাংলাদেশে Fast Home Delivery।',
  copy: '© 2026 Vangcur - ভাঙচুর. All rights reserved.',
  social: {
    fb: 'https://facebook.com/vangcurgadgets',
    ig: 'https://instagram.com/vangcurgadgets',
    tk: 'https://tiktok.com/@vangcur.com',
    wa: 'https://wa.me/8801897804055',
    yt: 'https://youtube.com/@vangcurgadgets',
  },
  contact: {
    phoneLabel: '01897-804055',
    phoneHref: 'tel:01897804055',
    waHref: 'https://wa.me/8801897804055',
    email: 'vangcurgadgets@gmail.com',
    fb: 'https://facebook.com/vangcurgadgets',
    addr: 'Dhaka, Bangladesh',
  },
};

export const DEFAULT_SERVICE_LINKS: ServiceLink[] = [
  { label: 'FAQ', action: 'faq' },
  { label: 'Shipping Info', action: 'info:shipping' },
  { label: 'Returns & Refunds', action: 'info:returns' },
  { label: 'Privacy Policy', action: 'info:privacy' },
  { label: 'Terms & Conditions', action: 'info:terms' },
];

export function resolveServiceLink(lnk: { url?: string; label?: string }): ServiceLink {
  const url = lnk.url || '#';
  const label = lnk.label || '';
  if (url.startsWith('#') || url === '') {
    const lower = url.toLowerCase();
    if (url === '#faqSec' || lower.includes('faq')) return { label, action: 'faq' };
    if (url === 'shipping' || url === '#shipping') return { label, action: 'info:shipping' };
    if (url === 'returns' || url === '#returns') return { label, action: 'info:returns' };
    if (url === 'privacy' || url === '#privacy') return { label, action: 'info:privacy' };
    if (url === 'terms' || url === '#terms') return { label, action: 'info:terms' };
    return { label, action: 'scroll', target: url };
  }
  return { label, action: 'external', href: sanitizeHref(url) };
}

export interface FooterSettingsRaw {
  vc_logo?: FooterLogo;
  vc_contact?: Partial<FooterContact> & { phone?: string; wa?: string; email?: string; fb?: string; addr?: string };
  vc_footer?: { desc?: string; copy?: string; fb?: string; ig?: string; tk?: string; yt?: string; wa?: string };
  vc_footer_links?: { url?: string; label?: string }[];
}

// vc_logo, vc_contact, vc_footer, vc_footer_links — এই সেটিংসগুলো এখন অ্যাডমিন
// প্যানেল থেকে এডিট করার কোনো উপায় নেই (ফিচার সরানো হয়েছে), তাই Supabase-এ
// বারবার খুঁজে দেখার দরকার নেই — সবসময় খালি অবজেক্ট রিটার্ন হবে, ফলে
// Footer কম্পোনেন্ট উপরের DEFAULT_FOOTER-ই ব্যবহার করবে।
export async function fetchFooterSettings(_supabase: SupabaseClient): Promise<FooterSettingsRaw> {
  return {};
}

// আসল ডাটা কখনো বদলাবে না (এডিট করার পথ নেই), তাই postgres_changes লিসেনার
// লাগানো হয়নি। 🛡️ ফিক্স (audit P1-15): আগে এখানে .subscribe() কল করে একটা
// আসল Realtime WebSocket খোলা হতো — অথচ কোনো ইভেন্ট কখনোই আসত না (fetch সবসময়
// {} রিটার্ন করে)। Footer প্রায় সব পেজে থাকায় এতে প্রতিটি ভিজিটর অকারণে একটা
// সকেট ধরে রাখত। এখন .subscribe() না করে শুধু একটা খালি চ্যানেল-হ্যান্ডেল
// রিটার্ন করা হচ্ছে — কলারের supabase.removeChannel(channel) ক্লিনআপ কোড
// অপরিবর্তিত/নিরাপদ থাকে, কিন্তু কোনো নেটওয়ার্ক সংযোগ খোলে না।
export function subscribeFooterSettings(
  supabase: SupabaseClient,
  _onChange: (key: 'vc_logo' | 'vc_contact', val: unknown) => void,
): RealtimeChannel {
  const uniqueName = `footer-settings-watch-${Math.random().toString(36).slice(2, 9)}`;
  return supabase.channel(uniqueName);
}
