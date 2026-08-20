'use client';

import { useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { fetchCustomProducts } from '@/lib/productData';
import { getStockNotifications, removeStockNotification } from '@/lib/accountData';
import { showToast } from '@/lib/toast';
import type { Product } from '@/types';

export default function BackInStockToast() {
  const checkedRef = useRef(false);

  useEffect(() => {
    if (checkedRef.current) return;
    checkedRef.current = true;

    const notifs = getStockNotifications();
    if (notifs.length === 0) return;

    (async () => {
      const supabase = createClient();
      let prods: Product[] = [];
      try {
        prods = await fetchCustomProducts(supabase);
      } catch {
        // network/Supabase সমস্যায় এই রাউন্ডে চেক স্কিপ হবে
      }

      notifs.forEach((n, idx) => {
        const prod = prods.find((p) => String(p.id) === String(n.prodId));
        if (prod && prod.stock > 0) {
          removeStockNotification(n.key);
          setTimeout(() => showToast(`🎉 ${n.prodName || prod.name} আবার স্টকে এসেছে!`), idx * 2800);
        }
      });
    })();
  }, []);

  return null;
}
