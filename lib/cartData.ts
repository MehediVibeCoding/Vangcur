import type { Product, CartItem } from '@/types';

const CART_KEY = 'vc_cart';

export const CART_EVENT = 'vc:cartChange';
export const CART_ADD_EVENT = 'vc:cartAdd';

export function getCart(): CartItem[] {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY) || '[]');
  } catch {
    return [];
  }
}

function persist(cart: CartItem[]): void {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  } catch {
    // storage unavailable, ignore
  }
}

export function saveCart(cart: CartItem[]): void {
  persist(cart);
  window.dispatchEvent(new CustomEvent(CART_EVENT, { detail: { cart } }));
}

let saveTimer: ReturnType<typeof setTimeout> | null = null;
function saveCartDebounced(cart: CartItem[]): void {
  // Notify listeners (floating cart badge, header count, etc.) immediately —
  // only the actual localStorage write is debounced, so rapid +/- clicks
  // don't hammer storage while the UI still stays in sync every time.
  window.dispatchEvent(new CustomEvent(CART_EVENT, { detail: { cart } }));
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => persist(cart), 300);
}

export function cartCount(cart: CartItem[]): number {
  return cart.reduce((s, i) => s + i.qty, 0);
}

export function cartTotal(cart: CartItem[]): number {
  return cart.reduce((s, i) => s + i.price * i.qty, 0);
}

export function addToCart(prods: Product[], id: number | string, qty: number) {
  const cart = getCart();
  const p = prods.find((x) => String(x.id) === String(id));
  if (!p) return { ok: false, cart };
  const currentQty = cart.find((x) => String(x.id) === String(id))?.qty || 0;
  const availableStock = p.stock - currentQty;
  if (availableStock <= 0) return { ok: false, reason: 'stock', cart };
  const addQty = Math.min(qty, availableStock);
  const ex = cart.find((x) => String(x.id) === String(id));
  if (ex) ex.qty += addQty;
  else cart.push({ id: p.id, name: p.name, emoji: p.imgs[0], price: p.price, qty: addQty, cat: p.cat });
  saveCart(cart);
  window.dispatchEvent(new CustomEvent(CART_ADD_EVENT));
  return { ok: true, cart };
}

export function updateQty(prods: Product[], id: number | string, delta: number) {
  let cart = getCart();
  const i = cart.find((x) => String(x.id) === String(id));
  if (i) {
    if (delta > 0) {
      const prod = prods.find((p) => String(p.id) === String(id));
      const maxStock = prod ? prod.stock : 9999;
      if (i.qty >= maxStock) return { ok: false, reason: 'stock', maxStock, cart };
    }
    i.qty += delta;
    if (i.qty <= 0) cart = cart.filter((x) => String(x.id) !== String(id));
  }
  saveCartDebounced(cart);
  return { ok: true, cart };
}

export function removeItem(id: number | string): CartItem[] {
  const cart = getCart().filter((x) => String(x.id) !== String(id));
  saveCartDebounced(cart);
  return cart;
}

export function clearCartOnRealPagehide(): () => void {
  const handler = (e: PageTransitionEvent) => {
    if (!e.persisted) persist([]);
  };
  window.addEventListener('pagehide', handler);
  return () => window.removeEventListener('pagehide', handler);
}
