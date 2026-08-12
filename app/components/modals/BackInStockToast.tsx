'use client';

import { useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { DEFAULT_PRODS, fetchCustomProducts, mergeCustomProducts } from '@/lib/productData';
import { getStockNotifications, removeStockNotification } from '@/lib/accountData';
import { showToast } from '@/lib/toast';

export default function BackInStockToast() {
  const checkedRef = useRef(false);

  useEffect(() => {
    if (checkedRef.current) return;
    checkedRef.current = true;

    const notifs = getStockNotifications();
    if (notifs.length === 0) return;

    (async () => {
      const supabase = createClient();
      let prods = DEFAULT_PRODS;
      try {
        const customRows = await fetchCustomProducts(supabase);
        if (customRows.length) prods = mergeCustomProducts(DEFAULT_PRODS, customRows);
      } catch {
        // fall back to defaults
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
