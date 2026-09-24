import type { SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';

export interface ContactSettings {
  wa?: string;
  messenger?: string;
}

export const DEFAULT_WA_LINK = 'https://wa.me/8801897804055';
export const DEFAULT_MSG_LINK = 'https://m.me/vangcurgadgets';

export function computeWaLink(contact: ContactSettings | null): string {
  if (contact && contact.wa) {
    const num = '88' + contact.wa.replace(/^88/, '').replace(/\D/g, '');
    return `https://wa.me/${num}`;
  }
  return DEFAULT_WA_LINK;
}

export function computeMsgLink(contact: ContactSettings | null): string {
  return (contact && contact.messenger) || DEFAULT_MSG_LINK;
}

// vc_contact সেটিংটা এখন অ্যাডমিন প্যানেল থেকে এডিট করার কোনো উপায় নেই (ফিচার
// সরানো হয়েছে), তাই Supabase-এ বারবার খুঁজে দেখার দরকার নেই — সবসময় null
// রিটার্ন হবে, আর উপরের computeWaLink/computeMsgLink এমনিতেই ডিফল্ট লিংক
// ব্যবহার করবে।
export async function fetchContactSettings(_supabase: SupabaseClient): Promise<ContactSettings | null> {
  return null;
}

// আসল ডাটা কখনো বদলাবে না (এডিট করার পথ নেই), তাই postgres_changes লিসেনার
// লাগানো হয়নি। 🛡️ ফিক্স (audit P1-15): আগে .subscribe() কল করে একটা আসল
// Realtime WebSocket খোলা হতো যদিও কোনো ইভেন্ট কখনো আসে না (fetch সবসময় null
// রিটার্ন করে)। এই কম্পোনেন্টগুলো (Footer-এর মতোই) প্রায় সব পেজে থাকায় প্রতিটি
// ভিজিটর অকারণে সকেট ধরে রাখত। এখন .subscribe() ছাড়া শুধু একটা খালি
// চ্যানেল-হ্যান্ডেল রিটার্ন করা হচ্ছে — কলারের supabase.removeChannel(channel)
// ক্লিনআপ কোড অপরিবর্তিত/নিরাপদ থাকে, কিন্তু নেটওয়ার্ক সংযোগ খোলে না।
export function subscribeContactSettings(
  supabase: SupabaseClient,
  _onChange: (contact: ContactSettings) => void,
): RealtimeChannel {
  const uniqueName = `float-btns-contact-watch-${Math.random().toString(36).slice(2, 9)}`;
  return supabase.channel(uniqueName);
}
