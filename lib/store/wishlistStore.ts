import { create } from 'zustand';
import type { Product, WishlistItem } from '@/types';
import { showToast } from '@/lib/toast';

const WISH_KEY = 'vc_wish';

function loadWishlist(): WishlistItem[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(WISH_KEY) || '[]');
  } catch {
    return [];
  }
}

function persist(w: WishlistItem[]): void {
  try {
    localStorage.setItem(WISH_KEY, JSON.stringify(w));
  } catch {
    // storage unavailable, ignore
  }
}

interface WishlistState {
  wishlist: WishlistItem[];
  addedTick: number;
  setWishlist: (w: WishlistItem[]) => void;
  isWishlisted: (id: number | string) => boolean;
  toggleWish: (prod: Product) => boolean;
  removeItem: (id: number | string) => void;
  clearWishlist: () => void;
}

export const useWishlistStore = create<WishlistState>((set, get) => ({
  wishlist: loadWishlist(),
  addedTick: 0,

  setWishlist: (wishlist) => {
    persist(wishlist);
    set({ wishlist });
  },

  isWishlisted: (id) => get().wishlist.some((x) => String(x.id) === String(id)),

  toggleWish: (prod) => {
    let w = get().wishlist;
    const already = w.some((x) => String(x.id) === String(prod.id));
    if (already) {
      w = w.filter((x) => String(x.id) !== String(prod.id));
      showToast('Wishlist থেকে সরানো হয়েছে');
      persist(w);
      set({ wishlist: w });
    } else {
      w = [...w, { id: prod.id, name: prod.name, emoji: prod.imgs[0], price: prod.price, cat: prod.cat }];
      showToast('❤️ Wishlist এ যোগ হয়েছে!');
      persist(w);
      set((s) => ({ wishlist: w, addedTick: s.addedTick + 1 }));
    }
    return !already;
  },

  removeItem: (id) => {
    const wishlist = get().wishlist.filter((x) => String(x.id) !== String(id));
    persist(wishlist);
    set({ wishlist });
  },

  clearWishlist: () => {
    persist([]);
    set({ wishlist: [] });
  },
}));
