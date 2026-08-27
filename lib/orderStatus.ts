import type { SupabaseClient } from '@supabase/supabase-js';
import type { OrderStatus } from '@/types';

export const PENDING_ORDER_MAX_AGE_MS = 48 * 60 * 60 * 1000;
export const RESOLVED_ORDER_STATUSES: OrderStatus[] = ['confirmed', 'shipped', 'delivered', 'cancelled', 'rejected'];
const STATUS_POLL_INTERVAL_MS = 4000;

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

/** নির্দিষ্ট id-এর পুরো অর্ডার row আনে।
 *
 * ⚠️ আগে এখানে কল করার সময় caller নিজে ঠিক করে দিত phone পাঠাবে কিনা,
 * ভিত্তি ছিল অ্যাপের নিজস্ব `currentUser` (Zustand স্টোর, যেটা শুধু
 * localStorage-এর `vc_user` মিরর করে)। সমস্যা হলো — Supabase-এর আসল লগইন
 * সেশন (JWT) এর সাথে এই লোকাল মিররের কোনো নিশ্চয়তামূলক সম্পর্ক নেই:
 * অ্যাক্সেস টোকেন সময়ের সাথে expire হয়ে যেতে পারে, বা রিফ্রেশ ফেইল হতে
 * পারে, অথচ `vc_user` তখনও localStorage-এ থেকে যায়। ফলে অ্যাপ ভাবত ইউজার
 * "লগইন করা আছে" আর সরাসরি RLS-scoped select() চালাত — কিন্তু আসল সেশন
 * অবৈধ থাকায় PostgREST 401 Unauthorized রিটার্ন করত, আর কনফার্ম স্ট্যাটাস
 * পোলিং করে কখনো ডেটা পেতোই না (এডমিন কনফার্ম করলেও UI আপডেট হতো না)।
 *
 * এখন থেকে caller-নির্ভর অনুমানের বদলে এখানেই Supabase-এর *আসল লাইভ
 * সেশন* যাচাই করা হয় (supabase.auth.getSession())। সেশন সত্যিই বৈধ থাকলে
 * প্রথমে RLS-scoped select() চেষ্টা হয়; সেটা ব্যর্থ হলে (বা সেশন না
 * থাকলে) phone দেওয়া থাকলে সবসময় phone-verified secure RPC
 * (get_guest_order)-এ fallback করা হয় — এটাই guest checkout-এর একমাত্র
 * নিরাপদ পথ এবং এটা কখনো ভুল করে বাদ পড়বে না। */
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

/** প্রতি কয়েক সেকেন্ডে status চেক করে — Realtime-এর বদলে এই পোলিং ব্যবহার
 * করা হচ্ছে যাতে RLS/Realtime-এর কোনো বিশেষ কনফিগারেশনের উপর নির্ভর করতে না
 * হয়, সবসময় predictable ভাবে কাজ করে। status resolve (confirmed/rejected
 * ইত্যাদি) হয়ে গেলে নিজে থেকেই থেমে যায়। */
export function watchOrderStatus(
  supabase: SupabaseClient,
  orderId: string,
  phone: string | undefined,
  onUpdate: (status: OrderStatus) => void,
): () => void {
  let stopped = false;
  let timer: ReturnType<typeof setTimeout> | null = null;

  async function tick() {
    if (stopped) return;
    const row = await fetchFullOrder(supabase, orderId, phone);
    if (row && row.status) {
      const st = row.status as OrderStatus;
      onUpdate(st);
      if (RESOLVED_ORDER_STATUSES.includes(st)) return;
    }
    if (!stopped) timer = setTimeout(tick, STATUS_POLL_INTERVAL_MS);
  }

  timer = setTimeout(tick, STATUS_POLL_INTERVAL_MS);

  return function stop() {
    stopped = true;
    if (timer) clearTimeout(timer);
  };
}
