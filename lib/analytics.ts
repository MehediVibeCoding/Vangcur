'use client';

export interface AnalyticsItem {
  item_id: string | number;
  item_name: string;
  price: number;
  quantity?: number;
  item_category?: string;
}

declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
  }
}

export function pushToDataLayer(event: string, ecommerceData?: Record<string, unknown>): void {
  if (typeof window === 'undefined') return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ ecommerce: null });
  window.dataLayer.push({
    event,
    ...ecommerceData,
  });
}

export function trackViewItem(item: AnalyticsItem): void {
  pushToDataLayer('view_item', {
    ecommerce: {
      currency: 'BDT',
      value: item.price,
      items: [
        {
          item_id: String(item.item_id),
          item_name: item.item_name,
          price: item.price,
          quantity: 1,
          item_category: item.item_category || 'General',
        },
      ],
    },
  });
}

export function trackAddToCart(item: AnalyticsItem, qty = 1): void {
  pushToDataLayer('add_to_cart', {
    ecommerce: {
      currency: 'BDT',
      value: item.price * qty,
      items: [
        {
          item_id: String(item.item_id),
          item_name: item.item_name,
          price: item.price,
          quantity: qty,
          item_category: item.item_category || 'General',
        },
      ],
    },
  });
}

export function trackBeginCheckout(items: AnalyticsItem[], totalValue: number): void {
  pushToDataLayer('begin_checkout', {
    ecommerce: {
      currency: 'BDT',
      value: totalValue,
      items: items.map((i) => ({
        item_id: String(i.item_id),
        item_name: i.item_name,
        price: i.price,
        quantity: i.quantity || 1,
        item_category: i.item_category || 'General',
      })),
    },
  });
}

export function trackPurchase(
  transactionId: string | number,
  totalValue: number,
  shippingCost: number,
  items: AnalyticsItem[],
): void {
  pushToDataLayer('purchase', {
    ecommerce: {
      transaction_id: String(transactionId),
      value: totalValue,
      shipping: shippingCost,
      currency: 'BDT',
      items: items.map((i) => ({
        item_id: String(i.item_id),
        item_name: i.item_name,
        price: i.price,
        quantity: i.quantity || 1,
        item_category: i.item_category || 'General',
      })),
    },
  });
        }
