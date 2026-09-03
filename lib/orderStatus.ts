import type { SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import type { OrderStatus } from '@/types';

export const PENDING_ORDER_MAX_AGE_MS = 48 * 60 * 60 * 1000;
export const RESOLVED_ORDER_STATUSES: OrderStatus[] = ['confirmed', 'shipped', 'delivered', 'cancelled', 'rejected'];

export const ORDER_TRACK_STEPS: { key: OrderStatus; label: string; icon: string }[] = [
  { key: 'pending', label: 'অর্ডার গ্রহণ করা হয়েছে', icon: '🧾' },
  { key: 'confirmed', label: 'কনফার্ম হয়েছে', icon: '✅' },
  { key: 'shipped', label: 'পাঠানো হয়েছে', icon: '🚚' },
  { key: 'delivered', label: 'ডেলিভারি সম্পন্ন', icon: '📦' },
];

function getTimeoutSignal(ms: number): AbortSignal | undefined {
  if (typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function') {
    return AbortSignal.timeout(ms);
  }
  if (typeof AbortController !== 'undefined') {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), ms);
    return controller.signal;
  }
  return undefined;
}

export function clearPendingOrder(): void {
  try {
    localStorage.removeItem('vc_pending_ls');
    localStorage.removeItem('vc_pending_num_ls');
    localStorage.removeItem('vc_pending_ts');
    localStorage.removeItem('vc_pending_phone_ls');
  } catch {
    // ignore
  }
}

export function readPendingOrder(): { id: string; orderNum: string; phone: string } | null {
  try {
    const id = localStorage.getItem('vc_pending_ls');
    const num = localStorage.getItem('vc_pending_num_ls');
    const phone = localStorage.getItem('vc_pending_phone_ls') || '';
    const ts = parseInt(localStorage.getItem('vc_pending_ts') || '0', 10);
    if (id && num && ts && Date.now() - ts < PENDING_ORDER_MAX_AGE_MS) return { id, orderNum: num, phone };
    if (id) clearPendingOrder();
    return null;
  } catch {
    return null;
  }
}

export function readLatestGuestOrder(): { id: string; orderNum: string; phone: string } | null {
  try {
    const list = JSON.parse(localStorage.getItem('vc_guest_orders') || '[]') as
      { id?: string; orderNum?: string; phone?: string }[];
    if (!list.length) return null;
    const last = list[list.length - 1];
    if (!last?.id || !last?.orderNum || !last?.phone) return null;
    return { id: last.id, orderNum: last.orderNum, phone: last.phone };
  } catch {
    return null;
  }
}

export async function fetchFullOrder(
  supabase: SupabaseClient,
  orderId: string,
  phone?: string,
): Promise<Record<string, unknown> | null> {
  try {
    let hasLiveSession = false;
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      hasLiveSession = !!sessionData?.session;
    } catch {
      hasLiveSession = false;
    }

    const signal = getTimeoutSignal(5000);

    if (hasLiveSession) {
      try {
        const { data, error } = await supabase
          .from('orders')
          .select('*')
          .eq('id', orderId)
          .abortSignal(signal as any)
          .single();
        if (!error && data) return data as Record<string, unknown>;
      } catch {
        // fall through to phone fallback
      }
    }

    const fallbackPhone = phone
      || (typeof window !== 'undefined'
        ? (localStorage.getItem('vc_pending_phone_ls') || readLatestGuestOrder()?.phone || undefined)
        : undefined);

    if (fallbackPhone) {
      const cleanPhone = String(fallbackPhone).trim();
      const { data, error } = await supabase
        .rpc('get_guest_order', { p_id: String(orderId), p_phone: cleanPhone })
        .abortSignal(signal as any);
      if (!error && data && data.length) return data[0] as Record<string, unknown>;
    }
    return null;
  } catch {
    return null;
  }
}

export function watchOrderStatus(
  supabase: SupabaseClient,
  orderId: string,
  phone: string | undefined,
  onUpdate: (status: OrderStatus) => void,
): () => void {
  let stopped = false;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let channel: RealtimeChannel | null = null;
  const startTime = Date.now();
  const MAX_POLL_DURATION_MS = 30 * 60 * 1000;

  function getNextInterval(): number {
    const elapsed = Date.now() - startTime;
    if (elapsed < 60 * 1000) return 6000;
    if (elapsed < 5 * 60 * 1000) return 15000;
    return 30000;
  }

  async function checkStatus() {
    if (stopped) return;

    if (Date.now() - startTime >= MAX_POLL_DURATION_MS) {
      stop();
      return;
    }

    if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
      return;
    }

    const row = await fetchFullOrder(supabase, orderId, phone);
    if (row && row.status) {
      const st = row.status as OrderStatus;
      onUpdate(st);
      if (RESOLVED_ORDER_STATUSES.includes(st)) {
        stop();
        return;
      }
    }

    if (!stopped) {
      scheduleNext(getNextInterval());
    }
  }

  function scheduleNext(delayMs: number) {
    if (stopped) return;
    if (timer) clearTimeout(timer);
    timer = setTimeout(checkStatus, delayMs);
  }

  try {
    const uniqueChannelName = `order-status-${orderId}-${Math.random().toString(36).slice(2, 7)}`;
    channel = supabase
      .channel(uniqueChannelName)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${orderId}` },
        (payload) => {
          if (stopped) return;
          const updatedRow = payload.new as { status?: OrderStatus };
          if (updatedRow?.status) {
            onUpdate(updatedRow.status);
            if (RESOLVED_ORDER_STATUSES.includes(updatedRow.status)) {
              stop();
            }
          }
        }
      )
      .subscribe();
  } catch {
    // fallback to polling
  }

  const onVisibilityChange = () => {
    if (stopped) return;
    if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
      checkStatus();
    }
  };

  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', onVisibilityChange);
  }

  scheduleNext(5000);

  function stop() {
    stopped = true;
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', onVisibilityChange);
    }
    if (channel) {
      supabase.removeChannel(channel);
      channel = null;
    }
  }

  return stop;
}
