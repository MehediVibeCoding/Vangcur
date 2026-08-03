import type { SupabaseClient } from '@supabase/supabase-js';
import type { Product, WishlistItem } from '@/types';
import { logWarn, logError } from './logger';
import { showToast } from './toast';

export const DEFAULT_PRODS: Product[] = [
  { id: 1, cat: 'rgb', cats: ['rgb'], name: 'GearUP NRGB50 5M RGB Neon Light with App & Remote Control',
    imgs: ['💡', '🌟', '✨'], price: 1490, old: 1800,
    specs: { 'দৈর্ঘ্য': '৫ মিটার', 'ধরন': 'Neon Flex', 'নিয়ন্ত্রণ': 'App + Remote', 'ভোল্টেজ': 'DC 12V / 220V', 'রং': '16 Million Color' },
    warranty: '৬ মাস রিপ্লেসমেন্ট ওয়ারেন্টি', badge: 'HOT', stock: 20, rating: 4.5, discountColor: '',
    desc: 'GearUP NRGB50 প্রিমিয়াম মানের ৫ মিটার RGB নিয়ন লাইট। অ্যাপ ও রিমোট উভয়ে নিয়ন্ত্রণযোগ্য। ঘরের সাজসজ্জায় অসাধারণ আলোর পরিবেশ তৈরি করে।',
    _detailLoaded: false },
  { id: 4, cat: 'smartwatch', cats: ['smartwatch'], name: 'GearUP GT4 Pro Smartwatch AMOLED Display',
    imgs: ['⌚', '📱'], price: 2490, old: 3200,
    specs: { 'ডিসপ্লে': '1.96" AMOLED', 'ব্যাটারি': '300mAh', 'কল': 'হ্যাঁ', 'স্বাস্থ্য': 'HR + SpO2 + BP', 'ওয়াটার': 'IP68' },
    warranty: '৬ মাস রিপ্লেসমেন্ট ওয়ারেন্টি', badge: 'HOT', stock: 18, rating: 4.5, discountColor: '',
    desc: 'প্রিমিয়াম AMOLED ডিসপ্লে সহ স্মার্টওয়াচ। হার্ট রেট, অক্সিজেন, ব্লাড প্রেশার মনিটরিং।',
    _detailLoaded: false },
  { id: 14, cat: 'powerbank', cats: ['powerbank'], name: 'GearUP PB20K 20000mAh Fast Charge Power Bank',
    imgs: ['🔋'], price: 1690, old: 2200,
    specs: { 'ক্যাপাসিটি': '20000mAh', 'আউটপুট': '22.5W PD', 'পোর্ট': 'USB-A + USB-C', 'ডিসপ্লে': 'LED Indicator', 'ওজন': '450g' },
    warranty: '৬ মাস রিপ্লেসমেন্ট ওয়ারেন্টি', badge: 'HOT', stock: 20, rating: 4.5, discountColor: '',
    desc: 'বড় ক্যাপাসিটির ফাস্ট চার্জ পাওয়ার ব্যাংক। স্মার্টফোন ৪-৫ বার চার্জ।',
    _detailLoaded: false },
  { id: 24, cat: 'tws', cats: ['tws'], name: 'GearUP TWS ANC Pro Noise Cancelling Earbuds',
    imgs: ['🎧'], price: 1890, old: 2500,
    specs: { 'ড্রাইভার': '13mm Dynamic', 'ANC': 'Active Noise Cancelling', 'ব্যাটারি': '6+30h', 'সংযোগ': 'Bluetooth 5.3', 'পানি': 'IPX5' },
    warranty: '৬ মাস রিপ্লেসমেন্ট ওয়ারেন্টি', badge: 'HOT', stock: 20, rating: 4.5, discountColor: '',
    desc: 'ANC ফিচার সহ প্রিমিয়াম TWS ইয়ারবাড। বাইরের শব্দ বন্ধ করে মিউজিক উপভোগ।',
    _detailLoaded: false },
  { id: 34, cat: 'headphone', cats: ['headphone'], name: 'GearUP HP80 Over-Ear ANC Headphone',
    imgs: ['🎵'], price: 2990, old: 3800,
    specs: { 'ড্রাইভার': '40mm', 'ANC': 'Hybrid ANC', 'ব্যাটারি': '30h', 'সংযোগ': 'BT5.3 + 3.5mm', 'ভাঁজ': 'Foldable' },
    warranty: '৬ মাস রিপ্লেসমেন্ট ওয়ারেন্টি', badge: 'HOT', stock: 15, rating: 4.5, discountColor: '',
    desc: 'Hybrid ANC হেডফোন। ৩০ ঘণ্টার ব্যাটারি ব্যাকআপ।',
    _detailLoaded: false },
  { id: 44, cat: 'acrylic', cats: ['acrylic'], name: 'GearUP AL-Love Heart Acrylic LED Lamp',
    imgs: ['🪔', '❤️'], price: 790, old: 1100,
    specs: { 'ডিজাইন': 'Heart Shape', 'আলো': 'RGB 16 Colors', 'নিয়ন্ত্রণ': 'Touch + Remote', 'পাওয়ার': 'USB', 'সাইজ': '15cm' },
    warranty: '১ সপ্তাহ রিপ্লেসমেন্ট ওয়ারেন্টি', badge: 'HOT', stock: 30, rating: 4.5, discountColor: '',
    desc: 'হার্ট শেপের রোমান্টিক অ্যাক্রিলিক ল্যাম্প। উপহার হিসেবে আদর্শ।',
    _detailLoaded: false },
  { id: 54, cat: 'fan', cats: ['fan'], name: 'GearUP RF12 12-Inch Rechargeable Table Fan',
    imgs: ['💨'], price: 1990, old: 2600,
    specs: { 'সাইজ': '12 Inch', 'ব্যাটারি': '8000mAh', 'রানটাইম': '8–12 ঘণ্টা', 'স্পিড': '৩ স্তর', 'চার্জ': 'USB-C' },
    warranty: '৬ মাস রিপ্লেসমেন্ট ওয়ারেন্টি', badge: 'HOT', stock: 0, rating: 4.5, discountColor: '',
    desc: 'লোডশেডিংয়ে আদর্শ রিচার্জেবল টেবিল ফ্যান।',
    _detailLoaded: false },
];

const DEFAULT_IDS = new Set([1, 4, 14, 24, 34, 44, 54]);

export function prodInCat(p: Product, catId: string): boolean {
  if (catId === 'all') return true;
  if (Array.isArray(p.cats) && p.cats.length) return p.cats.includes(catId);
  return p.cat === catId;
}

export function applyProdOrder(prods: Product[], orderArr: unknown): Product[] {
  let order: unknown = orderArr || null;
  if (typeof order === 'string' && (order.startsWith('[') || order.startsWith('{'))) {
    try {
      order = JSON.parse(order);
    } catch {
      order = null;
    }
  }
  if (!Array.isArray(order) || !order.length) return prods;
  const orderMap: Record<string, number> = {};
  order.forEach((id, i) => { orderMap[id] = i; });
  return [...prods].sort((a, b) => {
    const ia = orderMap[String(a.id)] !== undefined ? orderMap[String(a.id)] : 99999;
    const ib = orderMap[String(b.id)] !== undefined ? orderMap[String(b.id)] : 99999;
    return ia - ib;
  });
}

function parseJsonish<T>(val: unknown, fallback: T): T {
  if (val === null || val === undefined) return fallback;
  if (typeof val !== 'string') return val as T;
  try {
    return JSON.parse(val) as T;
  } catch {
    return fallback;
  }
}

interface RawCustomProduct {
  id: number | string;
  cat?: string;
  cats?: string[];
  name?: string;
  price?: number | string;
  old?: number | string;
  stock?: number | string;
  badge?: string;
  warranty?: string;
  rating?: number | string;
  imgs?: unknown;
  specs?: unknown;
  desc_text?: string;
  desc?: string;
  long_desc?: string;
  features?: string[];
  faqs?: { q: string; a: string }[];
  closing?: string;
}

export function mapCustomProduct(p: RawCustomProduct): Product {
  const specs = parseJsonish(p.specs, (p.specs as Record<string, string>) || {});
  let imgs = p.imgs as unknown;
  if (typeof imgs === 'string') imgs = parseJsonish<string[]>(imgs, imgs ? [imgs] : ['📦']);
  if (!Array.isArray(imgs) || !imgs.length) imgs = ['📦'];
  return {
    id: p.id,
    cat: p.cat || 'rgb',
    cats: p.cats || [p.cat || 'rgb'],
    name: p.name || '',
    price: Number(p.price) || 0,
    old: Number(p.old) || Number(p.price) || 0,
    stock: p.stock !== undefined && p.stock !== null ? Number(p.stock) : 0,
    badge: p.badge || '',
    discountColor: (specs as { _discount_color?: string })._discount_color || '',
    warranty: p.warranty || '৭ দিন',
    rating: Number(p.rating) || 4.5,
    imgs: imgs as string[],
    specs: specs as Record<string, string>,
    desc: p.desc_text || p.desc || '',
    longDesc: p.long_desc || p.desc_text || p.desc || '',
    features: Array.isArray(p.features) ? p.features : [],
    faqs: Array.isArray(p.faqs) ? p.faqs : [],
    closing: p.closing || '',
    _detailLoaded: !!(p.long_desc || p.features || p.faqs),
  };
}

const GRID_COLS = 'id,cat,cats,name,price,old,stock,badge,warranty,rating,imgs,specs';

export async function fetchCustomProducts(supabase: SupabaseClient): Promise<Product[]> {
  let attempt = 0;
  const MAX_ATTEMPTS = 3;
  while (attempt < MAX_ATTEMPTS) {
    attempt++;
    try {
      const { data: sbProds, error } = await supabase
        .from('custom_products')
        .select(GRID_COLS)
        .order('id', { ascending: true });

      if (error) {
        logWarn('[Vangcur] custom_products fetch error (attempt ' + attempt + '):', error.message, '| code:', error.code);
        if (error.code === '42501' || error.code === 'PGRST116' || error.message?.includes('permission') || error.message?.includes('policy')) {
          logError('[Vangcur] custom_products টেবিলে anon SELECT access নেই।');
          return [];
        }
        if (attempt < MAX_ATTEMPTS) {
          await new Promise((r) => setTimeout(r, 1200 * attempt));
          continue;
        }
        return [];
      }
      if (!sbProds || !sbProds.length) return [];
      return (sbProds as unknown as RawCustomProduct[]).map(mapCustomProduct);
    } catch (e) {
      logWarn('[Vangcur] custom_products exception (attempt ' + attempt + '):', e);
      if (attempt < MAX_ATTEMPTS) {
        await new Promise((r) => setTimeout(r, 1200 * attempt));
      }
    }
  }
  return [];
}

export function mergeCustomProducts(defaults: Product[], customRows: Product[]): Product[] {
  const list = [...defaults];
  customRows.forEach((mapped) => {
    const idx = list.findIndex((x) => String(x.id) === String(mapped.id));
    if (idx > -1) list[idx] = { ...list[idx], ...mapped };
    else list.push(mapped);
  });
  return list;
}

export function subscribeCustomProducts(
  supabase: SupabaseClient,
  { onInsert, onUpdate, onDelete }: {
    onInsert: (p: Product) => void;
    onUpdate: (p: Product) => void;
    onDelete: (id: number | string) => void;
  },
) {
  const uniqueName = `products-grid-watch-${Math.random().toString(36).slice(2, 9)}`;
  const channel = supabase
    .channel(uniqueName)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'custom_products' }, (payload) => {
      if (payload.new) onInsert(mapCustomProduct(payload.new as RawCustomProduct));
    })
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'custom_products' }, (payload) => {
      if (payload.new && (payload.new as RawCustomProduct).id !== undefined) onUpdate(mapCustomProduct(payload.new as RawCustomProduct));
    })
    .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'custom_products' }, (payload) => {
      const oldRow = payload.old as { id?: number | string };
      if (oldRow && oldRow.id !== undefined) onDelete(oldRow.id);
    })
    .subscribe();
  return channel;
}

export function isDefaultProductId(id: number): boolean {
  return DEFAULT_IDS.has(id);
}

export const WISHLIST_EVENT = 'vc:wishlistChange';
export const WISH_ADD_EVENT = 'vc:wishAdd';
export const QUICK_ORDER_EVENT = 'vc:quickOrder';
export const QUICK_CART_EVENT = 'vc:quickCart';
export const QUICK_ORDER_MODAL_EVENT = 'vc:quickOrderModal';
export const STOCK_NOTIFY_EVENT = 'vc:stockNotify';

export function getWishlist(): WishlistItem[] {
  try {
    return JSON.parse(localStorage.getItem('vc_wish') || '[]');
  } catch {
    return [];
  }
}

export function saveWishlist(w: WishlistItem[]): void {
  try {
    localStorage.setItem('vc_wish', JSON.stringify(w));
  } catch {
    // storage unavailable, ignore
  }
  window.dispatchEvent(new CustomEvent(WISHLIST_EVENT, { detail: { wishlist: w } }));
}

export function isWishlisted(id: number | string): boolean {
  return getWishlist().some((x) => String(x.id) === String(id));
}

export function toggleWish(prod: Product): boolean {
  let w = getWishlist();
  const already = isWishlisted(prod.id);
  if (already) {
    w = w.filter((x) => String(x.id) !== String(prod.id));
    showToast('Wishlist থেকে সরানো হয়েছে');
  } else {
    w.push({ id: prod.id, name: prod.name, emoji: prod.imgs[0], price: prod.price, cat: prod.cat });
    showToast('❤️ Wishlist এ যোগ হয়েছে!');
  }
  saveWishlist(w);
  if (!already) window.dispatchEvent(new CustomEvent(WISH_ADD_EVENT));
  return !already;
}

export function makeSlug(str: string): string {
  return String(str || '')
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function productHref(prod: Product): string {
  return `/product/${makeSlug(prod.name)}-${prod.id}`;
}

export function findProdBySlug(prods: Product[], slug: string): Product | null {
  if (!slug) return null;
  const s = String(slug).toLowerCase();
  let p = prods.find((x) => String(x.id).toLowerCase() === s);
  if (p) return p;
  p = prods.find((x) => makeSlug(x.name) === s);
  if (p) return p;
  p = prods.find((x) => s.endsWith('-' + String(x.id)) || s === String(x.id));
  return p || null;
}

export function idFromSlug(slug: string): string | null {
  if (!slug) return null;
  const s = String(slug);
  if (/^\d+$/.test(s)) return s;
  const m = s.match(/-(\d+)$/);
  return m ? m[1] : s;
}
