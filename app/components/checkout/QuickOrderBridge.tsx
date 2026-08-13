'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  DEFAULT_PRODS, fetchCustomProducts, mergeCustomProducts, QUICK_ORDER_EVENT,
} from '@/lib/productData';
import { showToast } from '@/lib/toast';
import type { Product, CartItem } from '@/types';

export default function QuickOrderBridge() {
  const router = useRouter();
  const supabase = useRef(createClient()).current;
  const prodsRef = useRef<Product[]>(DEFAULT_PRODS);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const customRows = await fetchCustomProducts(supabase);
      if (!cancelled && customRows.length) {
        prodsRef.current = mergeCustomProducts(DEFAULT_PRODS, customRows);
      }
    })();
    return () => { cancelled = true; };
  }, [supabase]);

  useEffect(() => {
    const onQuickOrder = (e: Event) => {
      const detail = (e as CustomEvent).detail || {};
      const id = detail.id;
      if (id === undefined) return;
      const p = prodsRef.current.find((x) => String(x.id) === String(id));
      if (!p) return;
      if (p.stock <= 0) {
        showToast('স্টক শেষ!');
        return;
      }
      const qty = Math.max(1, Math.min(Number(detail.qty) || 1, p.stock, 99));
      const item: CartItem = {
        id: p.id, name: p.name, emoji: p.imgs[0], price: p.price, qty, cat: p.cat,
      };
      try {
        sessionStorage.setItem('vc_quick_order_items', JSON.stringify([item]));
      } catch {
        // storage unavailable, ignore
      }
      router.push('/checkout');
    };
    window.addEventListener(QUICK_ORDER_EVENT, onQuickOrder);
    return () => window.removeEventListener(QUICK_ORDER_EVENT, onQuickOrder);
  }, [router]);

  return null;
}
