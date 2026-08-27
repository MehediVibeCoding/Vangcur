import type { SupabaseClient } from '@supabase/supabase-js';
import type { OrderStatus } from '@/types';

export const PENDING_ORDER_MAX_AGE_MS = 48 * 60 * 60 * 1000;
export const RESOLVED_ORDER_STATUSES: OrderStatus[] = ['confirmed', 'shipped', 'delivered', 'cancelled', 'rejected'];

export const ORDER_TRACK_STEPS: { key: OrderStatus; label: string; icon: string }[] = [
  { key: 'pending', label: 'অর্ডার গ্রহণ করা হয়েছে', icon: '🧾' },
  { key: 'confirmed', label: 'কনফার্ম হয়েছে', icon: '✅' },
  { key: 'shipped', label: 'পাঠানো হয়েছে', icon: '🚚' },
  { key: 'delivered', label: 'ডেলিভারি সম্পন্ন', icon: '📦' },
];

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

/** localStorage-এ রাখা গেস্ট-অর্ডার আর্কাইভ (vc_guest_orders) থেকে সবচেয়ে
 * সাম্প্রতিক অর্ডারটা পড়ে — "Track" বাটনে ক্লিক করলে (checkout ফ্লো ছাড়াও)
 * guest-এর নিজের অর্ডার automatic দেখানোর জন্য ব্যবহৃত হয়। */
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

/** নির্দিষ্ট id-এর পুরো অর্ডার row আনে। */
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

    if (hasLiveSession) {
      try {
        const { data, error } = await supabase.from('orders').select('*').eq('id', orderId).single();
        if (!error && data) return data as Record<string, unknown>;
      } catch {
        // নিচে phone fallback চেষ্টা করা হবে
      }
    }

    if (phone) {
      const { data, error } = await supabase.rpc('get_guest_order', { p_id: orderId, p_phone: phone });
      if (!error && data && data.length) return data[0] as Record<string, unknown>;
    }
    return null;
  } catch {
    return null;
  }
}

/** স্মার্ট ব্যাকঅফ পোলিং:
 * - ১ম মিনিট: প্রতি ৫ সেকেন্ড
 * - ২য়-৫ম মিনিট: প্রতি ১৫ সেকেন্ড
 * - ৫ম-৩০তম মিনিট: প্রতি ৩০ সেকেন্ড
 * - ৩০ মিনিট পার হলে পোলিং স্বয়ংক্রিয়ভাবে বন্ধ (ডাটাবেজ কোটা সুরক্ষা) */
export function watchOrderStatus(
  supabase: SupabaseClient,
  orderId: string,
  phone: string | undefined,
  onUpdate: (status: OrderStatus) => void,
): () => void {
  let stopped = false;
  let timer: ReturnType<typeof setTimeout> | null = null;
  const startTime = Date.now();
  const MAX_POLL_DURATION_MS = 30 * 60 * 1000; // ৩০ মিনিট

  function getNextInterval(): number {
    const elapsed = Date.now() - startTime;
    if (elapsed < 60 * 1000) return 5000; // ১ম মিনিট: ৫ সেকেন্ড
    if (elapsed < 5 * 60 * 1000) return 15000; // ২য় থেকে ৫ম মিনিট: ১৫ সেকেন্ড
    return 30000; // ৫ম থেকে ৩০তম মিনিট: ৩০ সেকেন্ড
  }

  async function tick() {
    if (stopped) return;

    if (Date.now() - startTime >= MAX_POLL_DURATION_MS) {
      stopped = true;
      return;
    }

    const row = await fetchFullOrder(supabase, orderId, phone);
    if (row && row.status) {
      const st = row.status as OrderStatus;
      onUpdate(st);
      if (RESOLVED_ORDER_STATUSES.includes(st)) return;
    }

    if (!stopped) {
      timer = setTimeout(tick, getNextInterval());
    }
  }

  timer = setTimeout(tick, 5000);

  return function stop() {
    stopped = true;
    if (timer) clearTimeout(timer);
  };
}
