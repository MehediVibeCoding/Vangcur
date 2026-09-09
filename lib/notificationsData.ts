import type { SupabaseClient } from '@supabase/supabase-js';
import { fetchProductById, productHref } from './productData';
import { getStockNotifications } from './accountData';
import type { Order } from '@/types';

export interface NotificationItem {
  id: string;
  type: 'offer' | 'stock' | 'order';
  title: string;
  subtitle?: string;
  href: string;
}

interface OfferModel1 {
  title: string;
  body: string;
  btn_text: string;
  btn_url: string;
}
interface OfferModel2 {
  img: string;
  url: string;
}
interface OfferModel3 {
  product_id: string;
  badge_text: string;
}
type OfferActiveModel = 'none' | 'model1' | 'model2' | 'model3';
interface OfferConfig {
  active_model: OfferActiveModel;
  model1: OfferModel1;
  model2: OfferModel2;
  model3: OfferModel3;
}

/**
 * এডমিন প্যানেল থেকে চালু করা লাইভ অফার (store_settings.vc_offer_popup) —
 * সক্রিয় থাকলে নোটিফিকেশন লিস্টে দেখানো হবে, ক্লিক করলে /offers পেজে নিয়ে যাবে।
 */
export async function fetchLiveOfferNotification(
  supabase: SupabaseClient,
  lang: 'bn' | 'en',
): Promise<NotificationItem | null> {
  try {
    const { data, error } = await supabase
      .from('store_settings')
      .select('setting_value')
      .eq('setting_key', 'vc_offer_popup')
      .maybeSingle();
    if (error || !data?.setting_value) return null;

    const raw = data.setting_value;
    const cfg: OfferConfig = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (!cfg || !cfg.active_model || cfg.active_model === 'none') return null;

    let title = '';
    if (cfg.active_model === 'model1' && cfg.model1?.title?.trim()) {
      title = cfg.model1.title.trim();
    } else if (cfg.active_model === 'model3' && cfg.model3?.badge_text?.trim()) {
      title = cfg.model3.badge_text.trim();
    } else if (cfg.active_model === 'model2' && cfg.model2?.img?.trim()) {
      title = lang === 'en' ? 'A special offer is live!' : 'একটি বিশেষ অফার চলছে!';
    }
    if (!title) return null;

    return {
      id: `offer:${cfg.active_model}:${title}`,
      type: 'offer',
      title,
      subtitle: lang === 'en' ? 'Tap to view the offer' : 'অফারটি দেখতে ট্যাপ করুন',
      href: '/offers',
    };
  } catch {
    return null;
  }
}

/**
 * "স্টকে আসলে জানান" — যেসব প্রোডাক্টে ইউজার নোটিফাই চেয়েছিল এবং এখন স্টকে এসেছে।
 */
export async function fetchStockBackNotifications(
  supabase: SupabaseClient,
  lang: 'bn' | 'en',
): Promise<NotificationItem[]> {
  const saved = getStockNotifications();
  if (!saved.length) return [];

  const results = await Promise.all(
    saved.map(async (item): Promise<NotificationItem | null> => {
      try {
        const product = await fetchProductById(supabase, item.prodId);
        if (!product || (product.stock || 0) <= 0) return null;
        const notification: NotificationItem = {
          id: `stock:${item.key}`,
          type: 'stock',
          title: item.prodName || product.name || (lang === 'en' ? 'Product' : 'প্রোডাক্ট'),
          subtitle: lang === 'en' ? 'Back in stock!' : 'স্টকে এসেছে!',
          href: productHref(product),
        };
        return notification;
      } catch {
        return null;
      }
    }),
  );

  return results.filter((x): x is NotificationItem => !!x);
}

/**
 * পেন্ডিং অর্ডার — অ্যাডমিন এখনো কনফার্ম করেননি এমন অর্ডারসমূহ।
 */
export function buildPendingOrderNotifications(orders: Order[], lang: 'bn' | 'en'): NotificationItem[] {
  return orders
    .filter((o) => o.status === 'pending')
    .slice(0, 5)
    .map((o) => ({
      id: `order:${o.id}`,
      type: 'order' as const,
      title: lang === 'en' ? `Order #${o.orderNum} is pending` : `অর্ডার #${o.orderNum} পেন্ডিং আছে`,
      subtitle: lang === 'en' ? 'Tap to view order details' : 'অর্ডারের বিস্তারিত দেখতে ট্যাপ করুন',
      href: '/account/orders',
    }));
}

const SEEN_SIG_KEY = 'vc_notif_seen_sig';

export function buildNotifSignature(items: NotificationItem[]): string {
  return items.map((i) => i.id).sort().join('|');
}

export function getNotifSeenSignature(): string {
  try {
    return localStorage.getItem(SEEN_SIG_KEY) || '';
  } catch {
    return '';
  }
}

export function setNotifSeenSignature(sig: string): void {
  try {
    localStorage.setItem(SEEN_SIG_KEY, sig);
  } catch {
    // storage unavailable — নীরবে উপেক্ষা করা হচ্ছে
  }
  }
