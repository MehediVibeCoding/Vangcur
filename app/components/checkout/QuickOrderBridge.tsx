'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { QUICK_ORDER_EVENT } from '@/lib/productData';
import { showToast } from '@/lib/toast';
import type { CartItem } from '@/types';

export default function QuickOrderBridge() {
  const router = useRouter();

  // ইনস্ট্যান্ট চেকআউট ট্রানজিশনের জন্য প্রি-ফেচ
  useEffect(() => {
    router.prefetch('/checkout');
    router.prefetch('/');
  }, [router]);

  useEffect(() => {
    const onQuickOrder = (e: Event) => {
      const detail = (e as CustomEvent).detail || {};
      const id = detail.id;
      if (id === undefined || !detail.name) return;
      const qty = Math.max(1, Math.min(Number(detail.qty) || 1, 99));
      const item: CartItem = {
        id, name: detail.name, emoji: detail.emoji, price: detail.price, qty, cat: detail.cat,
      };
      try {
        sessionStorage.setItem('vc_quick_order_items', JSON.stringify([item]));
      } catch {
        showToast('একটু সমস্যা হয়েছে, আবার চেষ্টা করুন');
        return;
      }
      router.push('/checkout');
    };
    window.addEventListener(QUICK_ORDER_EVENT, onQuickOrder);
    return () => window.removeEventListener(QUICK_ORDER_EVENT, onQuickOrder);
  }, [router]);

  return null;
}
