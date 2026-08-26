import type { SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import type { Category } from '@/types';
import { logWarn } from './logger';

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'all', name: 'All Products', icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6.5 8h11l-.9 11.2a1 1 0 0 1-1 .8H8.4a1 1 0 0 1-1-.8L6.5 8z"/><path d="M9.5 8V6.5a2.5 2.5 0 0 1 5 0V8"/></svg>' },
  { id: 'tws', name: 'TWS', icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="7.5" cy="8" r="2.3"/><path d="M7.5 10.3V15a2.7 2.7 0 0 0 2.7 2.7"/><circle cx="16.5" cy="8" r="2.3"/><path d="M16.5 10.3V15a2.7 2.7 0 0 1-2.7 2.7"/></svg>' },
  { id: 'powerbank', name: 'Power Bank', icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="4" width="11" height="16" rx="2.5"/><path d="M9 2.5h3"/><path d="M12.5 8.5 9.8 12.3h2.6L10 16.5"/></svg>' },
  { id: 'rgb', name: 'RGB Light', icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6"/><path d="M10 21h4"/><path d="M12 3a6 6 0 0 0-3.6 10.8c.6.5 1.1 1.3 1.2 2.2h4.8c.1-.9.6-1.7 1.2-2.2A6 6 0 0 0 12 3z"/><path d="M12 8v3"/><path d="M9.8 9.2l1.6 1.6"/><path d="M14.2 9.2l-1.6 1.6"/></svg>' },
  { id: 'smartwatch', name: 'Smart Watch', icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="7" y="7" width="10" height="10" rx="2.5"/><path d="M9 7 8.3 3.6A1.5 1.5 0 0 1 9.8 2h4.4a1.5 1.5 0 0 1 1.5 1.6L15 7"/><path d="M9 17l-.7 3.4A1.5 1.5 0 0 0 9.8 22h4.4a1.5 1.5 0 0 0 1.5-1.6L15 17"/><path d="M12 10v2.2l1.5 1"/></svg>' },
  { id: 'acrylic', name: 'Acrylic Lamp', icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3 4.5 9l3 10h9l3-10L12 3z"/><path d="M4.5 9h15"/><path d="M8.5 9 12 3l3.5 6"/><path d="M9.5 19 12 9l2.5 10"/></svg>' },
  { id: 'headphone', name: 'Headphone', icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15v-3a8 8 0 0 1 16 0v3"/><rect x="3" y="14" width="4" height="6" rx="1.5"/><rect x="17" y="14" width="4" height="6" rx="1.5"/></svg>' },
  { id: 'fan', name: 'Rechargeable Fan', icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1.6"/><path d="M12 10.6c-1.4-1.6-1.6-3.6-1.1-5.4 1.6-.4 3.3.2 4.4 1.5.9 1.1 1 2.6.6 3.9"/><path d="M13.2 12.9c2 .6 3.6 1.9 4.5 3.6-.9 1.4-2.5 2.2-4.3 2.1-1.4-.1-2.6-.9-3.4-2"/><path d="M10.6 13.3c-1.9.9-3.1 2.5-3.5 4.4 1.2 1.1 2.9 1.5 4.6 1 1.3-.4 2.3-1.4 2.8-2.6"/></svg>' },
  { id: 'unique', name: 'Unique Collection', icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6L12 3z"/><path d="M18.5 15l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2z"/></svg>' },
  { id: 'crystalball', name: 'Crystal Ball', icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="10.5" r="6.5"/><path d="M8.5 8.3c.5-1.4 1.9-2.3 3.5-2.3"/><path d="M7 19.5h10"/><path d="M9 17l-1.3 2.5M15 17l1.3 2.5"/></svg>' },
  { id: 'waterbottle', name: 'Water Bottle', icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="2.5" width="6" height="3" rx="1"/><path d="M8.5 5.5h7l1 3v11a2 2 0 0 1-2 2H9.5a2 2 0 0 1-2-2v-11l1-3z"/><path d="M7.5 12h9"/></svg>' },
  { id: 'wifiups', name: 'Wifi UPS', icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 9.5a11 11 0 0 1 15 0"/><path d="M7.5 12.8a7 7 0 0 1 9 0"/><path d="M10.3 16a3 3 0 0 1 3.4 0"/><circle cx="12" cy="19" r="1"/></svg>' },
  { id: 'humidifier', name: 'Humidifier', icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3c2.2 3 4 5.7 4 8.3A4 4 0 0 1 8 11.3C8 8.7 9.8 6 12 3z"/><path d="M6.5 19.5h11"/><path d="M8 19.5v-3a4 4 0 0 1 8 0v3"/></svg>' },
  { id: 'keyboard', name: 'Keyboard', icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="6.5" width="18" height="11" rx="2"/><path d="M6.5 10h.01M9.5 10h.01M12.5 10h.01M15.5 10h.01M17.5 10h.01"/><path d="M6.5 13.5h11"/></svg>' },
  { id: 'gimbal', name: 'Gimbal', icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="8" width="12" height="9" rx="2"/><path d="M16 11l4-2.3v8.6L16 15"/><circle cx="10" cy="12.5" r="2.3"/></svg>' },
  { id: 'light', name: 'Light', icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4.2"/><path d="M12 3v2.3M12 18.7V21M4.9 4.9l1.6 1.6M17.5 17.5l1.6 1.6M3 12h2.3M18.7 12H21M4.9 19.1l1.6-1.6M17.5 6.5l1.6-1.6"/></svg>' },
  { id: 'mouse', name: 'Mouse', icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="7" y="3.5" width="10" height="17" rx="5"/><path d="M12 3.5v6"/></svg>' },
  { id: 'cable', name: 'Cable And Charges', icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M7 4.5h4v4H7z"/><path d="M9 8.5v3.5c0 2.2 1.5 3 3 3.8s3 1.6 3 3.7v1"/><circle cx="15" cy="19.5" r="1.4"/><path d="M7.7 5.5h2.6M7.7 7.5h2.6"/></svg>' },
  { id: 'unique-tools', name: 'Unique Tools', icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a4 4 0 0 0-5.4 4.7L3.5 16.8a1.8 1.8 0 0 0 2.5 2.5l5.8-5.8a4 4 0 0 0 4.7-5.4l-2.6 2.6-2-2 2.6-2.6z"/></svg>' },
  { id: 'hairdryer', name: 'Hair Dryer', icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8a6 6 0 0 1 6-4c3 0 5.5 2.2 6 5l4 1.6c.7.3.7 1.3 0 1.6L16 13.8"/><path d="M10 4a6 6 0 0 0 0 8h1.5a1.5 1.5 0 0 0 1.5-1.5V9"/><path d="M9 12l1.3 6.5a1.5 1.5 0 0 0 1.5 1.2h.4a1.5 1.5 0 0 0 1.5-1.8L13 12"/></svg>' },
  { id: 'toys', name: 'Toys', icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><circle cx="16.5" cy="16.5" r="3.5"/></svg>' },
  { id: 'alarmclock', name: 'Alarm Clock', icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="13" r="7.5"/><path d="M12 9v4l2.5 1.5"/><path d="M5.5 3.5 3 6M18.5 3.5 21 6"/><path d="M9 3h6"/></svg>' },
  { id: 'lamp', name: 'Lamp', icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3h8l2.5 7h-13L8 3z"/><path d="M12 10v6"/><path d="M8.5 21h7"/><path d="M9.5 16.5h5l.7 4.5H8.8l.7-4.5z"/></svg>' },
  { id: 'usbhub', name: 'USB HUB', icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="9" width="7" height="6" rx="1.5"/><path d="M11 12h2.5"/><path d="M13.5 8.5v7l4 1.5V7l-4 1.5z"/></svg>' },
  { id: 'accessories', name: 'Accessories', icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="8" width="16" height="12" rx="2.5"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/><path d="M4 13h16"/></svg>' },
  { id: 'powerstrip', name: 'Power Strip', icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="2.5" y="8" width="19" height="8" rx="3"/><path d="M7 11v2M7 11h.01M11 11v2M11 11h.01M15 11v2M15 11h.01"/><circle cx="19" cy="12" r="1"/></svg>' },
  { id: 'projector', name: 'Projector', icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="2.5" y="7" width="14" height="9" rx="2"/><circle cx="7.5" cy="11.5" r="2.6"/><circle cx="14" cy="9.5" r="0.7"/><path d="M16.5 10l4.5-2.5v9L16.5 14"/></svg>' },
  { id: 'neckband', name: 'Neckband', icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 8a7 7 0 0 1 14 0"/><rect x="3" y="7.5" width="4" height="6.5" rx="2"/><rect x="17" y="7.5" width="4" height="6.5" rx="2"/><path d="M5 14v4.5a1.5 1.5 0 0 0 3 0V16M19 14v4.5a1.5 1.5 0 0 1-3 0V16"/></svg>' },
  { id: 'kitchenaccessories', name: 'Kitchen Accessories', icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M7 2.5v8a2 2 0 0 0 2 2v9"/><path d="M7 2.5v5M9.5 2.5v5"/><path d="M16.5 2.5c-1.4 0-2.5 1.8-2.5 4s1.1 3.6 2.5 3.6V21.5"/></svg>' },
  { id: 'offer', name: 'Offers', icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M11.5 3H5.5A1.5 1.5 0 0 0 4 4.5v6L13 19.5a1.5 1.5 0 0 0 2.1 0l5.4-5.4a1.5 1.5 0 0 0 0-2.1L11.5 3z"/><circle cx="8.2" cy="7.7" r="1.3"/></svg>' },
  { id: 'btspeaker', name: 'BT Speaker', icon: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="3" width="16" height="18" rx="3"/><circle cx="12" cy="13" r="4"/><circle cx="12" cy="13" r="1.3"/><circle cx="12" cy="7" r="1"/></svg>' },
];

export function makeCatSlug(catId: string): string {
  return String(catId || '').toLowerCase().replace(/[^\w-]/g, '');
}

export function parseSupabaseVal<T = unknown>(val: unknown): T {
  if (val === null || val === undefined) return val as T;
  if (typeof val !== 'string') return val as T;
  const t = val.trim();
  if (t.startsWith('[') || t.startsWith('{') || t.startsWith('"')) {
    try {
      return JSON.parse(t) as T;
    } catch {
      return val as unknown as T;
    }
  }
  return val as unknown as T;
}

export async function fetchCategories(supabase: SupabaseClient): Promise<Category[]> {
  try {
    const { data, error } = await supabase
      .from('store_settings')
      .select('setting_value')
      .eq('setting_key', 'vc_categories')
      .maybeSingle();
    if (error || !data) return DEFAULT_CATEGORIES;
    const parsed = parseSupabaseVal<Category[]>(data.setting_value);
    if (Array.isArray(parsed) && parsed.length) return parsed;
    return DEFAULT_CATEGORIES;
  } catch (e) {
    logWarn('Category fetch failed:', e);
    return DEFAULT_CATEGORIES;
  }
}

export function subscribeCategories(
  supabase: SupabaseClient,
  onChange: (cats: Category[]) => void,
): RealtimeChannel {
  // Categories.tsx-এর মতোই একই টেবিল/কী শোনে, কিন্তু এই ফাংশন অন্য
  // component (ProductGrid.tsx) থেকেও কল হয় — তাই একটা fixed channel
  // নামের বদলে ইউনিক নাম ব্যবহার করা হচ্ছে, subscribeContactSettings-এ
  // (lib/floatButtonsData.ts) যে একই ক্লাসের বাগের জন্য এই fix করা হয়েছিল,
  // ঠিক সেই কারণেই।
  const uniqueName = `categories-watch-${Math.random().toString(36).slice(2, 9)}`;
  return supabase
    .channel(uniqueName)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'store_settings', filter: 'setting_key=eq.vc_categories' },
      (payload) => {
        const row = payload.new as { setting_value?: unknown } | null;
        if (!row) return;
        const parsed = parseSupabaseVal<Category[]>(row.setting_value);
        if (Array.isArray(parsed) && parsed.length) onChange(parsed);
      },
    )
    .subscribe();
}

export const CATEGORY_FILTER_EVENT = 'vc:categoryFilter';
