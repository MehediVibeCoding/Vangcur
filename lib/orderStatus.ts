import type { SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import type { Order, OrderStatus } from '@/types';

const MAX_REALTIME_RETRY = 5;

export async function checkOrderStatus(supabase: SupabaseClient, orderId: string | number): Promise<OrderStatus | null> {
  try {
    const { data } = await supabase.from('orders').select('id,status').eq('id', orderId).single();
    if (data) return data.status as OrderStatus;
  } catch {
    // fall through to guest/local fallback
  }
  try {
    const orders: Order[] = JSON.parse(localStorage.getItem('vc_orders') || '[]');
    const o = orders.find((x) => x.id === orderId);
    return o ? o.status : null;
  } catch {
    return null;
  }
}

export async function fetchFullOrder(supabase: SupabaseClient, orderId: string | number): Promise<Order | Record<string, unknown> | null> {
  try {
    const { data } = await supabase.from('orders').select('*').eq('id', orderId).single();
    if (data) return data;
  } catch {
    // fall through
  }
  try {
    const orders: Order[] = JSON.parse(localStorage.getItem('vc_orders') || '[]');
    return orders.find((x) => x.id === orderId) || null;
  } catch {
    return null;
  }
}

export function subscribeOrderRealtime(
  supabase: SupabaseClient,
  orderId: string | number,
  onStatusUpdate: (status: OrderStatus) => void,
): () => void {
  let channel: RealtimeChannel | null = null;
  let retryCount = 0;
  let retryTimer: ReturnType<typeof setTimeout> | null = null;
  let stopped = false;

  function connect() {
    if (stopped) return;
    if (channel) { supabase.removeChannel(channel); channel = null; }
    try {
      channel = supabase
        .channel(`order-status-${orderId}-${Date.now()}`)
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${orderId}` },
          (payload: { new: { status?: OrderStatus } }) => {
            if (payload.new && payload.new.status) {
              retryCount = 0;
              onStatusUpdate(payload.new.status);
            }
          },
        )
        .subscribe((status: string) => {
          if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            if (retryCount < MAX_REALTIME_RETRY && !stopped) {
              retryCount += 1;
              const delay = Math.min(1000 * 2 ** retryCount, 30000);
              retryTimer = setTimeout(connect, delay);
            }
          } else if (status === 'SUBSCRIBED') {
            retryCount = 0;
          }
        });
    } catch {
      // noop, matches legacy try/catch
    }
  }

  connect();

  return function unsubscribe() {
    stopped = true;
    if (retryTimer) clearTimeout(retryTimer);
    if (channel) { supabase.removeChannel(channel); channel = null; }
  };
}
