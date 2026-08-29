import type { SupabaseClient } from '@supabase/supabase-js';
import type { FooterContact, FooterLogo, ServiceLink } from '@/types';
import { parseSupabaseVal } from './categoryData';
import { sanitizeHref } from './security';

export const DEFAULT_FOOTER = {
  logo: { mode: 'text' as const, main: 'Vangcur', sub: 'ভাঙচুর', img: null, alt: 'Vangcur Logo', height: 50 },
  desc: 'Vangcur - ভাঙচুর বাংলাদেশের একটি আধুনিক Gadget & Accessories ভিত্তিক E-commerce Brand। Official ও Unofficial সব ধরনের গ্যাজেট পাবেন Warranty Support সহ। সারা বাংলাদেশে Fast Home Delivery।',
  copy: '© 2026 Vangcur - ভাঙচুর. All rights reserved.',
  social: {
    fb: 'https://facebook.com/vangcurbdofficial',
    ig: 'https://instagram.com/vangcur_official',
    tk: 'https://tiktok.com/@vangcur.com',
    wa: 'https://wa.me/8801816365504',
    yt: 'https://youtube.com/@vangcur',
  },
  contact: {
    phoneLabel: '01816-365504',
    phoneHref: 'tel:01816365504',
    waHref: 'https://wa.me/8801816365504',
    email: 'vangcurbd@gmail.com',
    fb: 'https://facebook.com/vangcurbdofficial',
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

export async function fetchFooterSettings(supabase: SupabaseClient): Promise<FooterSettingsRaw> {
  try {
    const { data, error } = await supabase
      .from('store_settings')
      .select('setting_key,setting_value')
      .in('setting_key', ['vc_logo', 'vc_contact', 'vc_footer', 'vc_footer_links']);
    if (error || !data) return {};
    const out: Record<string, unknown> = {};
    data.forEach((row: { setting_key: string; setting_value: unknown }) => {
      out[row.setting_key] = parseSupabaseVal(row.setting_value);
    });
    return out as FooterSettingsRaw;
  } catch {
    return {};
  }
}

export function subscribeFooterSettings(
  supabase: SupabaseClient,
  onChange: (key: 'vc_logo' | 'vc_contact', val: unknown) => void,
) {
  const uniqueName = `footer-settings-watch-${Math.random().toString(36).slice(2, 9)}`;
  return supabase
    .channel(uniqueName)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'store_settings', filter: 'setting_key=eq.vc_logo' },
      (payload) => payload.new && onChange('vc_logo', parseSupabaseVal((payload.new as { setting_value: unknown }).setting_value)),
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'store_settings', filter: 'setting_key=eq.vc_contact' },
      (payload) => payload.new && onChange('vc_contact', parseSupabaseVal((payload.new as { setting_value: unknown }).setting_value)),
    )
    .subscribe();
}
