import type { SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import { parseSupabaseVal } from './categoryData';

export interface ContactSettings {
  wa?: string;
  messenger?: string;
}

export const DEFAULT_WA_LINK = 'https://wa.me/8801816365504';
export const DEFAULT_MSG_LINK = 'https://m.me/vangcurbdofficial';

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

export async function fetchContactSettings(supabase: SupabaseClient): Promise<ContactSettings | null> {
  try {
    const { data, error } = await supabase
      .from('store_settings')
      .select('setting_value')
      .eq('setting_key', 'vc_contact')
      .maybeSingle();
    if (error || !data) return null;
    return parseSupabaseVal(data.setting_value) as ContactSettings;
  } catch {
    return null;
  }
}

export function subscribeContactSettings(
  supabase: SupabaseClient,
  onChange: (contact: ContactSettings) => void,
): RealtimeChannel {
  // Unique per-call channel name — this function is called from BOTH the
  // site-wide FloatContactButtons (mounted in every page's layout) and
  // ProductDetailClient (mounted on top of it on product pages). A fixed
  // channel name meant both calls fought over the same Realtime topic:
  // the 2nd .subscribe() on an already-subscribed topic throws "cannot add
  // postgres_changes callbacks ... after subscribe()", which crashed the
  // whole product page. Matches the same fix already used in
  // subscribeCustomProducts() (lib/productData.ts) for this exact class of bug.
  const uniqueName = `float-btns-contact-watch-${Math.random().toString(36).slice(2, 9)}`;
  return supabase
    .channel(uniqueName)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'store_settings', filter: 'setting_key=eq.vc_contact' },
      (payload) => {
        if (payload.new) onChange(parseSupabaseVal((payload.new as { setting_value: unknown }).setting_value) as ContactSettings);
      },
    )
    .subscribe();
}
