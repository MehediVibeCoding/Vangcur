'use client';

import { useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { getStockNotifications, removeStockNotification } from '@/lib/accountData';
import { showToast } from '@/lib/toast';
import { useT } from '@/lib/i18n/useT';

export default function BackInStockToast() {
  const { lang } = useT();
  const checkedRef = useRef(false);

  useEffect(() => {
    if (checkedRef.current) return;
    checkedRef.current = true;

    const notifs = getStockNotifications();
    if (notifs.length === 0) return;

    const targetIds = notifs.map((n) => n.prodId).filter(Boolean);
    if (targetIds.length === 0) return;

    (async () => {
      const supabase = createClient();
      try {
        const { data, error } = await supabase
          .from('custom_products')
          .select('id, name, stock')
          .in('id', targetIds);

        if (error || !data || data.length === 0) return;

        notifs.forEach((n, idx) => {
          const prod = data.find((p) => String(p.id) === String(n.prodId));
          if (prod && Number(prod.stock) > 0) {
            removeStockNotification(n.key);
            const label = n.prodName || prod.name;
            const msg = lang === 'en' ? `🎉 ${label} is back in stock!` : `🎉 ${label} আবার স্টকে এসেছে!`;
            setTimeout(() => showToast(msg), idx * 2800);
          }
        });
      } catch {
        // network/Supabase সমস্যায় এই রাউন্ডে চেক স্কিপ হবে
      }
    })();
  }, [lang]);

  return null;
}
