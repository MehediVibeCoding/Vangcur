import type { Order, OrderItem } from '@/types';

export function mapSupabaseOrderRow(row: Record<string, unknown>): Order {
  let items: OrderItem[] = [];
  try {
    items = typeof row.items === 'string' ? JSON.parse(row.items) : ((row.items as OrderItem[]) || []);
  } catch {
    items = [];
  }
  const customer = (row.customer as Order['customer']) || {
    name: (row.customer_name as string) || '',
    phone: (row.customer_phone as string) || '',
    district: (row.customer_district as string) || '',
    address: (row.customer_address as string) || '',
  };
  return {
    id: row.id as string | number,
    orderNum: (row.order_num as string) || (row.orderNum as string) || '',
    date: (row.created_at as string) || (row.date as string) || new Date().toISOString(),
    status: ((row.status as Order['status']) || 'pending'),
    total: (row.total as number) || 0,
    subtotal: (row.subtotal as number) || 0,
    shippingCost: (row.shipping_cost as number) || (row.shippingCost as number) || 0,
    shipping: (row.shipping as string) || 'bd',
    advancePaid: (row.advance_paid as number) || (row.advancePaid as number) || 200,
    items,
    customer,
    payment: (row.payment as Order['payment']) || {
      txnId: (row.payment_txn as string) || '',
      last4: (row.payment_last4 as string) || '',
    },
  };
}
