'use client';

import { useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { fetchCustomProducts } from '@/lib/productData';
import { getStockNotifications, removeStockNotification } from '@/lib/accountData';
import { showToast } from '@/lib/toast';
import { useT } from '@/lib/i18n/useT';
import type { Product } from '@/types';

export default function BackInStockToast() {
  const { lang } = useT();
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
          const label = n.prodName || prod.name;
          const msg = lang === 'en' ? `🎉 ${label} is back in stock!` : `🎉 ${label} আবার স্টকে এসেছে!`;
          setTimeout(() => showToast(msg), idx * 2800);
        }
      });
    })();
  }, [lang]);

  return null;
}
