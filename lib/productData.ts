import type { SupabaseClient } from '@supabase/supabase-js';
import type { Product, CartItem } from '@/types';
import { logWarn, logError } from './logger';
import { useCartStore } from './store/cartStore';
import { OPEN_QUICK_CART_MODAL_EVENT } from './uiEvents';

interface MinimalRouter {
  push: (href: string) => void;
}

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
const DETAIL_COLS = `${GRID_COLS},desc_text,long_desc,features,faqs,closing,power_info,info_boxes,seo_h1,meta_title,meta_description,og_description,quick_specs_text,packaging_content`;

const QUERY_TIMEOUT_MS = 3500;
const RETRY_DELAY_MS = 400;

async function fetchProdOrder(supabase: SupabaseClient): Promise<unknown> {
  try {
    const { data } = await supabase
      .from('store_settings')
      .select('setting_value')
      .eq('setting_key', 'vc_prod_order')
      .abortSignal(AbortSignal.timeout(QUERY_TIMEOUT_MS))
      .maybeSingle();
    return data?.setting_value ?? null;
  } catch {
    return null;
  }
}

export async function fetchCustomProducts(supabase: SupabaseClient): Promise<Product[]> {
  const orderPromise = fetchProdOrder(supabase);
  let attempt = 0;
  const MAX_ATTEMPTS = 2;
  while (attempt < MAX_ATTEMPTS) {
    attempt++;
    try {
      const { data: sbProds, error } = await supabase
        .from('custom_products')
        .select(GRID_COLS)
        .order('id', { ascending: true })
        .abortSignal(AbortSignal.timeout(QUERY_TIMEOUT_MS));

      if (error) {
        logWarn('[Vangcur] custom_products fetch error (attempt ' + attempt + '):', error.message, '| code:', error.code);
        if (error.code === '42501' || error.code === 'PGRST116' || error.message?.includes('permission') || error.message?.includes('policy')) {
          logError('[Vangcur] custom_products টেবিলে anon SELECT access নেই।');
          return [];
        }
        if (attempt < MAX_ATTEMPTS) {
          await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
          continue;
        }
        return [];
      }
      if (!sbProds || !sbProds.length) return [];
      const mapped = (sbProds as unknown as RawCustomProduct[]).map(mapCustomProduct);
      const orderArr = await orderPromise;
      return applyProdOrder(mapped, orderArr);
    } catch (e) {
      logWarn('[Vangcur] custom_products exception (attempt ' + attempt + '):', e);
      if (attempt < MAX_ATTEMPTS) {
        await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
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

export function startQuickOrder(router: MinimalRouter, prod: Product, qty = 1): void {
  if (!prod || prod.stock <= 0) return;

  const currentCart = useCartStore.getState().cart;
  const safeQty = Math.max(1, Math.min(qty, prod.stock, 99));

  // কেস ১: কার্ট খালি থাকলে সরাসরি সিঙ্গেল প্রোডাক্ট চেকআউট
  if (!currentCart || currentCart.length === 0) {
    const item: CartItem = {
      id: prod.id,
      name: prod.name,
      emoji: (prod.imgs || ['📦'])[0],
      price: prod.price,
      qty: safeQty,
      cat: prod.cat,
    };
    try {
      sessionStorage.setItem('vc_quick_order_items', JSON.stringify([item]));
    } catch {
      // storage unavailable, ignore
    }
    router.push('/checkout');
    return;
  }

  // কেস ২: কার্টে ইতিমধ্যে পণ্য থাকলে এটিকে কার্টে যুক্ত করে ফ্লোটিং শপিং কার্ট মডাল ওপেন করা
  useCartStore.getState().addToCart([prod], prod.id, safeQty);
  try {
    sessionStorage.removeItem('vc_quick_order_items');
  } catch {
    // ignore
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(OPEN_QUICK_CART_MODAL_EVENT));
  }
}

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
