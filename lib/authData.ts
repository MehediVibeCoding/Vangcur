import type { SupabaseClient } from '@supabase/supabase-js';
import type { CurrentUser, WishlistItem } from '@/types';
import { logWarn } from './logger';
import { useAuthStore } from './store/authStore';

export async function logout(supabase: SupabaseClient): Promise<void> {
  try {
    await supabase.auth.signOut();
  } catch {
    // sign-out failure shouldn't block clearing local session state
  }
  useAuthStore.getState().setCurrentUser(null);
}

export async function requestPasswordReset(supabase: SupabaseClient, email: string): Promise<true> {
  try {
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
  } catch (e) {
    logWarn('[Vangcur] requestPasswordReset:', e);
  }
  return true;
}

export async function updatePassword(supabase: SupabaseClient, newPassword: string) {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  return { error };
}

export async function signInWithPassword(supabase: SupabaseClient, email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signUp(
  supabase: SupabaseClient,
  { name, phone, email, password }: { name: string; phone: string; email: string; password: string }
) {
  return supabase.auth.signUp({ email, password, options: { data: { name, phone } } });
}

export async function signInWithGoogle(supabase: SupabaseClient, path = '') {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://vangcur.com';
  const redirectTo = origin + path;
  const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo } });
  return { error };
}

export async function checkOAuthCallback(supabase: SupabaseClient): Promise<CurrentUser | null> {
  const { data, error } = await supabase.auth.getSession();
  const session = data && data.session;
  if (error || !session) return null;
  if (session.user && session.user.is_anonymous) return null;
  const u = session.user;
  const safeUser: CurrentUser = {
    id: u.id,
    email: u.email,
    name: u.user_metadata?.full_name || u.user_metadata?.name || (u.email ? u.email.split('@')[0] : 'Customer'),
    phone: u.user_metadata?.phone || '',
    avatar: u.user_metadata?.avatar_url || '',
    provider: u.app_metadata?.provider || 'google',
  };
  const existing = useAuthStore.getState().currentUser;
  if (existing && existing.id === safeUser.id) return null;
  if (typeof window !== 'undefined' && window.location.hash && window.location.hash.includes('access_token')) {
    window.history.replaceState({}, document.title, window.location.pathname);
  }
  return safeUser;
}

export async function syncWishlistFromSupabase(
  supabase: SupabaseClient,
  userId: string
): Promise<WishlistItem[] | null> {
  try {
    const { data } = await supabase.from('wishlists').select('items').eq('user_id', userId).single();
    return (data && data.items) || null;
  } catch {
    return null;
  }
}

export async function saveWishlistToSupabase(
  supabase: SupabaseClient,
  userId: string,
  items: WishlistItem[]
): Promise<void> {
  try {
    await supabase.from('wishlists').upsert({ user_id: userId, items }, { onConflict: 'user_id' });
  } catch (e) {
    logWarn('[Vangcur] wishlist Supabase sync failed:', e);
  }
}

export async function mergeGuestOrdersToUser(
  supabase: SupabaseClient,
  _userEmail: string,
  _userId: string
): Promise<void> {
  // অডিট ফিক্স — আগে এখানে সরাসরি .update({user_id, customer_email})
  // .in('order_num', orderNums) কল হতো, যেটা localStorage থেকে আসা
  // orderNums-কে কোনো ownership/phone যাচাই ছাড়াই বিশ্বাস করত (console থেকে
  // localStorage বদলে অন্যের অর্ডার claim করা সম্ভব ছিল)। এখন claim_guest_order
  // নামে একটা SECURITY DEFINER RPC ব্যবহার করা হচ্ছে, যেটা order_num + phone
  // দুটো মিললে তবেই merge করে, আর user_id নেয় server-side auth.uid() থেকে
  // (client থেকে পাঠানো userId/userEmail বিশ্বাস করে না)।
  try {
    const guestOrders: { id?: string; orderNum?: string; phone?: string }[] =
      JSON.parse(localStorage.getItem('vc_guest_orders') || '[]');
    if (!guestOrders.length) return;

    let anyMerged = false;
    for (const o of guestOrders) {
      // পুরনো এন্ট্রি (phone সেভ করার আগের) — RPC ছাড়া নিরাপদে merge করা
      // সম্ভব না, তাই স্কিপ করা হচ্ছে।
      if (!o.orderNum || !o.phone) continue;
      try {
        const { data, error } = await supabase.rpc('claim_guest_order', {
          p_order_num: o.orderNum,
          p_phone: o.phone,
        });
        if (!error && data === true) anyMerged = true;
      } catch (e) {
        logWarn('[Vangcur] claim_guest_order RPC failed:', e);
      }
    }
    if (anyMerged) localStorage.removeItem('vc_guest_orders');
  } catch (e) {
    logWarn('[Vangcur] mergeGuestOrdersToUser exception:', e);
  }
}
