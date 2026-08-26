import { create } from 'zustand';
import type { CartItem, Product } from '@/types';

const CART_KEY = 'vc_cart';

function loadCart(): CartItem[] {
  if (typeof window === 'undefined') return [];
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

let saveTimer: ReturnType<typeof setTimeout> | null = null;
function persistDebounced(cart: CartItem[]): void {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => persist(cart), 300);
}

interface AddResult {
  ok: boolean;
  reason?: 'stock';
}

interface QtyResult {
  ok: boolean;
  reason?: 'stock';
  maxStock?: number;
}

interface CartState {
  cart: CartItem[];
  addedTick: number;
  setCart: (cart: CartItem[]) => void;
  addToCart: (prods: Product[], id: number | string, qty: number) => AddResult;
  updateQty: (prods: Product[], id: number | string, delta: number) => QtyResult;
  removeItem: (id: number | string) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartState>((set, get) => ({
  cart: loadCart(),
  addedTick: 0,

  setCart: (cart) => {
    persist(cart);
    set({ cart });
  },

  addToCart: (prods, id, qty) => {
    const cart = [...get().cart];
    const p = prods.find((x) => String(x.id) === String(id));
    if (!p) return { ok: false };
    const currentQty = cart.find((x) => String(x.id) === String(id))?.qty || 0;
    const availableStock = p.stock - currentQty;
    if (availableStock <= 0) return { ok: false, reason: 'stock' };
    const addQty = Math.min(qty, availableStock);
    const ex = cart.find((x) => String(x.id) === String(id));
    if (ex) ex.qty += addQty;
    else cart.push({ id: p.id, name: p.name, emoji: p.imgs[0], price: p.price, qty: addQty, cat: p.cat });
    persist(cart);
    set((s) => ({ cart, addedTick: s.addedTick + 1 }));
    return { ok: true };
  },

  updateQty: (prods, id, delta) => {
    let cart = [...get().cart];
    const i = cart.find((x) => String(x.id) === String(id));
    if (i) {
      if (delta > 0) {
        const prod = prods.find((p) => String(p.id) === String(id));
        const maxStock = prod ? prod.stock : 9999;
        if (i.qty >= maxStock) return { ok: false, reason: 'stock', maxStock };
      }
      i.qty += delta;
      if (i.qty <= 0) cart = cart.filter((x) => String(x.id) !== String(id));
    }
    persistDebounced(cart);
    set({ cart });
    return { ok: true };
  },

  removeItem: (id) => {
    const cart = get().cart.filter((x) => String(x.id) !== String(id));
    persistDebounced(cart);
    set({ cart });
  },

  clearCart: () => {
    persist([]);
    set({ cart: [] });
  },
}));

export function cartCount(cart: CartItem[]): number {
  return cart.reduce((s, i) => s + i.qty, 0);
}

export function cartTotal(cart: CartItem[]): number {
  return cart.reduce((s, i) => s + i.price * i.qty, 0);
}
