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
  return supabase
    .channel('float-btns-contact-watch')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'store_settings', filter: 'setting_key=eq.vc_contact' },
      (payload) => {
        if (payload.new) onChange(parseSupabaseVal((payload.new as { setting_value: unknown }).setting_value) as ContactSettings);
      },
    )
    .subscribe();
}
