import type { SupabaseClient } from '@supabase/supabase-js';
import type { CurrentUser, WishlistItem } from '@/types';
import { useAuthStore } from '@/lib/store/authStore';

export async function signInWithPassword(supabase: SupabaseClient, email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signUp(
  supabase: SupabaseClient,
  { name, phone, email, password }: { name: string; phone: string; email: string; password: string }
) {
  return supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name, phone },
    },
  });
}

export async function signInWithGoogle(supabase: SupabaseClient, redirectTo = '/') {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://vangcur.com';
  return supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${origin}${redirectTo.startsWith('/') ? redirectTo : `/${redirectTo}`}`,
    },
  });
}

export async function logout(supabase: SupabaseClient): Promise<void> {
  try {
    await supabase.auth.signOut();
  } catch {
    // ignore
  }
  useAuthStore.getState().setCurrentUser(null);
}

export async function checkOAuthCallback(supabase: SupabaseClient): Promise<CurrentUser | null> {
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data?.user) return null;
    const user = data.user;
    const meta = user.user_metadata || {};
    const safeUser: CurrentUser = {
      id: user.id,
      email: user.email,
      name: meta.full_name || meta.name || user.email?.split('@')[0] || 'Customer',
      phone: meta.phone || '',
      avatar: meta.avatar_url || meta.picture || '',
      provider: user.app_metadata?.provider || 'email',
      createdAt: user.created_at,
    };
    useAuthStore.getState().setCurrentUser(safeUser);
    return safeUser;
  } catch {
    return null;
  }
}

export async function syncWishlistFromSupabase(supabase: SupabaseClient, userId: string): Promise<WishlistItem[] | null> {
  if (!userId) return null;
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('wishlist')
      .eq('id', userId)
      .maybeSingle();
    if (error || !data || !data.wishlist) return null;
    const raw = data.wishlist;
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export async function saveWishlistToSupabase(supabase: SupabaseClient, userId: string, wishlist: WishlistItem[]): Promise<void> {
  if (!userId) return;
  try {
    await supabase
      .from('profiles')
      .upsert({
        id: userId,
        wishlist: wishlist,
        updated_at: new Date().toISOString(),
      });
  } catch {
    // ignore
  }
}

export async function mergeGuestOrdersToUser(supabase: SupabaseClient, email: string, userId: string): Promise<void> {
  if (!email || !userId) return;
  try {
    await supabase
      .from('orders')
      .update({ user_id: userId })
      .eq('customer_email', email.trim().toLowerCase())
      .is('user_id', null);
  } catch {
    // ignore
  }
}

export async function requestPasswordReset(supabase: SupabaseClient, email: string) {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://vangcur.com';
  return supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/reset-password`,
  });
}

export async function updatePassword(supabase: SupabaseClient, password: string) {
  return supabase.auth.updateUser({ password });
}
