import type { SupabaseClient } from '@supabase/supabase-js';
import type { Product } from '@/types';
import { logWarn, logError } from './logger';

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
  name_bn?: string;
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
  power_info?: string | null;
  info_boxes?: unknown;
  seo_h1?: string | null;
  meta_title?: string | null;
  meta_description?: string | null;
  og_description?: string | null;
  quick_specs_text?: string | null;
  packaging_content?: string | null;
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
    nameBn: p.name_bn || '',
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
    powerInfo: p.power_info || '',
    infoBoxes: Array.isArray(p.info_boxes) ? (p.info_boxes as { title: string; body: string }[]) : parseJsonish(p.info_boxes, []),
    seoH1: p.seo_h1 || '',
    metaTitle: p.meta_title || '',
    metaDescription: p.meta_description || '',
    ogDescription: p.og_description || '',
    quickSpecsText: p.quick_specs_text || '',
    packagingContent: p.packaging_content || '',
    _detailLoaded: !!(p.long_desc || p.features || p.faqs),
  };
}

const GRID_COLS = 'id,cat,cats,name,name_bn,price,old,stock,badge,warranty,rating,imgs,specs';
// 🆕 SEO মেটা ফিল্ড + quick_specs_text + packaging_content শুধু detail
// (single product) query-তে লাগে — grid লিস্টিং-এ না, তাই বাকি bandwidth-
// optimization নীতির (lib/productData.ts-এর ওপরের নোট) সাথে মিলিয়ে শুধু
// DETAIL_COLS-এ যোগ করা হলো।
const DETAIL_COLS = `${GRID_COLS},desc_text,long_desc,features,faqs,closing,power_info,info_boxes,seo_h1,meta_title,meta_description,og_description,quick_specs_text,packaging_content`;

// ⚠️ sync-gap ফিক্স — admin panel-এর প্রোডাক্ট পেজে drag করে সাজানো অর্ডার
// store_settings key 'vc_prod_order'-এ (product id-র একটা JSON অ্যারে,
// ক্রম অনুযায়ী) সেভ হয়। applyProdOrder() ফাংশন আগে থেকেই এখানে ছিল কিন্তু
// কোথাও কল হতো না — admin যতই রিঅর্ডার করুক, storefront সবসময় শুধু
// `id ascending`-এই দেখাত। এখন fetchCustomProducts()-এর ভেতরেই এই order
// fetch করে apply করা হয়, তাই home/category/search — যেখানেই
// fetchCustomProducts() ব্যবহার হয় সবখানে স্বয়ংক্রিয়ভাবে সঠিক অর্ডার আসবে,
// আলাদা করে প্রতিটা call site বদলাতে হয়নি।
async function fetchProdOrder(supabase: SupabaseClient): Promise<unknown> {
  try {
    const { data } = await supabase
      .from('store_settings')
      .select('setting_value')
      .eq('setting_key', 'vc_prod_order')
      .maybeSingle();
    return data?.setting_value ?? null;
  } catch {
    // order fetch ব্যর্থ হলেও প্রোডাক্ট লিস্ট দেখানো বন্ধ হবে না, শুধু
    // ডিফল্ট (id ascending) অর্ডারে থাকবে — applyProdOrder()-ও একই আচরণ করে
    // (খালি/অবৈধ order পেলে ইনপুট অপরিবর্তিত রেখে দেয়)
    return null;
  }
}

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
      const mapped = (sbProds as unknown as RawCustomProduct[]).map(mapCustomProduct);
      const orderArr = await fetchProdOrder(supabase);
      return applyProdOrder(mapped, orderArr);
    } catch (e) {
      logWarn('[Vangcur] custom_products exception (attempt ' + attempt + '):', e);
      if (attempt < MAX_ATTEMPTS) {
        await new Promise((r) => setTimeout(r, 1200 * attempt));
      }
    }
  }
  return [];
}

export async function fetchProductById(supabase: SupabaseClient, id: number | string): Promise<Product | null> {
  try {
    const { data, error } = await supabase
      .from('custom_products')
      .select(DETAIL_COLS)
      .eq('id', id)
      .maybeSingle();
    if (error || !data) return null;
    return mapCustomProduct(data as unknown as RawCustomProduct);
  } catch (e) {
    logWarn('[Vangcur] fetchProductById exception:', e);
    return null;
  }
}

// 🆕 (২০২৬-০৮, খালি-কনটেন্ট বাগ ফিক্স): Product Detail পেজ প্রথমে সম্পূর্ণ
// ডেটা-সহ (DETAIL_COLS) initialProduct নিয়ে render হয়, কিন্তু তারপরেই
// fetchCustomProducts() (শুধু GRID_COLS — desc/features/faqs/power_info/
// info_boxes নেই) চলে related/অন্যান্য প্রোডাক্ট লোড করার জন্য, আর সেই
// ফলাফল আগে এখানে blind spread দিয়ে merge হতো — ফলে সম্পূর্ণ detail object-টা
// একটা আংশিক (grid-only) কপি দিয়ে চাপা পড়ে যেত, description/features/FAQ/
// power info/extra info সব খালি হয়ে যেত, অথচ specs/price/stock ঠিক থাকত
// (কারণ ওগুলো GRID_COLS-এই আছে)। এখন detail-only ফিল্ডগুলো আলাদা করে
// preserve করা হচ্ছে যদি আগের entry-টা আগেই পুরোপুরি লোড হয়ে থাকে।
const DETAIL_ONLY_FIELDS = [
  'desc', 'longDesc', 'features', 'faqs', 'closing', 'powerInfo', 'infoBoxes',
  'seoH1', 'metaTitle', 'metaDescription', 'ogDescription', 'quickSpecsText', 'packagingContent',
] as const;

export function mergeCustomProducts(defaults: Product[], customRows: Product[]): Product[] {
  const list = [...defaults];
  customRows.forEach((mapped) => {
    const idx = list.findIndex((x) => String(x.id) === String(mapped.id));
    if (idx === -1) { list.push(mapped); return; }
    const existing = list[idx];
    if (existing._detailLoaded && !mapped._detailLoaded) {
      // existing-এ আগে থেকেই পূর্ণাঙ্গ detail আছে, mapped একটা partial
      // (grid-only) রিফ্রেশ — তাই বাকি সব ফিল্ড (price/stock/specs/imgs
      // ইত্যাদি) mapped থেকে fresh নেওয়া হচ্ছে, কিন্তু detail-only
      // ফিল্ডগুলো existing থেকেই রাখা হচ্ছে যাতে খালি হয়ে না যায়।
      const preserved = Object.fromEntries(DETAIL_ONLY_FIELDS.map((k) => [k, existing[k]]));
      list[idx] = { ...existing, ...mapped, ...preserved, _detailLoaded: true };
    } else {
      list[idx] = { ...existing, ...mapped };
    }
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

export const QUICK_ORDER_EVENT = 'vc:quickOrder';
export const QUICK_CART_EVENT = 'vc:quickCart';
export const QUICK_ORDER_MODAL_EVENT = 'vc:quickOrderModal';
export const STOCK_NOTIFY_EVENT = 'vc:stockNotify';

export function makeSlug(str: string): string {
  return String(str || '')
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function productHref(prod: { id: number | string; name: string }): string {
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
