import type { SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import type { Order, OrderStatus } from '@/types';
import { mapSupabaseOrderRow } from '@/lib/orderMapping';

const MAX_REALTIME_RETRY = 5;

export const PENDING_ORDER_MAX_AGE_MS = 48 * 60 * 60 * 1000;
export const RESOLVED_ORDER_STATUSES: OrderStatus[] = ['confirmed', 'shipped', 'delivered', 'cancelled', 'rejected'];

export const ORDER_TRACK_STEPS: { key: OrderStatus; label: string; icon: string }[] = [
  { key: 'pending', label: 'অর্ডার গ্রহণ করা হয়েছে', icon: '🧾' },
  { key: 'confirmed', label: 'কনফার্ম হয়েছে', icon: '✅' },
  { key: 'shipped', label: 'পাঠানো হয়েছে', icon: '🚚' },
  { key: 'delivered', label: 'ডেলিভারি সম্পন্ন', icon: '📦' },
];

export interface OrderLookupResult {
  ok: boolean;
  order?: Order;
  error?: string;
}

/** অর্ডার নম্বর + মোবাইল নম্বর দিয়ে অর্ডার খোঁজে (guest-friendly ট্র্যাকিং —
 * লগইন ছাড়াই)। TrackOrderModal ও /track-order পেজ দুটোই এই একই লজিক ব্যবহার
 * করে, যাতে ভ্যালিডেশন ও ফোন-নম্বর মিলানোর নিরাপত্তা-চেক দুই জায়গায় আলাদা
 * করে না লিখতে হয়। */
export async function lookupOrderByNumberAndPhone(
  supabase: SupabaseClient,
  orderNumInput: string,
  phoneInput: string,
): Promise<OrderLookupResult> {
  const num = orderNumInput.trim().replace(/^#/, '');
  const ph = phoneInput.trim();
  if (!num) return { ok: false, error: 'অর্ডার নম্বর দিন (যেমন VC-1082)' };
  if (!ph || !/^01[3-9]\d{8}$/.test(ph)) return { ok: false, error: 'সঠিক মোবাইল নম্বর দিন (যে নম্বরে অর্ডার করেছিলেন)' };

  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .ilike('order_num', num)
      .maybeSingle();

    if (error || !data) {
      return { ok: false, error: 'এই অর্ডার নম্বরে কোনো অর্ডার পাওয়া যায়নি। বানান/নম্বর আবার চেক করুন।' };
    }

    const mapped = mapSupabaseOrderRow(data as Record<string, unknown>);
    const orderPhone = (mapped.customer?.phone || '').replace(/\D/g, '');
    if (orderPhone && orderPhone !== ph) {
      return { ok: false, error: 'অর্ডার নম্বর ও মোবাইল নম্বর মিলছে না। যে নম্বরে অর্ডার করেছিলেন সেটি দিন।' };
    }
    return { ok: true, order: mapped };
  } catch {
    return { ok: false, error: 'কিছু একটা সমস্যা হয়েছে, একটু পরে আবার চেষ্টা করুন।' };
  }
}

export function clearPendingOrder(): void {
  try {
    localStorage.removeItem('vc_pending_ls');
    localStorage.removeItem('vc_pending_num_ls');
    localStorage.removeItem('vc_pending_ts');
  } catch {
    // ignore
  }
}

export function readPendingOrder(): { id: string; orderNum: string } | null {
  try {
    const id = localStorage.getItem('vc_pending_ls');
    const num = localStorage.getItem('vc_pending_num_ls');
    const ts = parseInt(localStorage.getItem('vc_pending_ts') || '0', 10);
    if (id && num && ts && Date.now() - ts < PENDING_ORDER_MAX_AGE_MS) return { id, orderNum: num };
    if (id) clearPendingOrder();
    return null;
  } catch {
    return null;
  }
}

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
