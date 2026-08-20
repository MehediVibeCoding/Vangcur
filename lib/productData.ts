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
    _detailLoaded: !!(p.long_desc || p.features || p.faqs),
  };
}

const GRID_COLS = 'id,cat,cats,name,name_bn,price,old,stock,badge,warranty,rating,imgs,specs';

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
