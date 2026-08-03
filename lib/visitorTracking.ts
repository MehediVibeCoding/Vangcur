import type { SupabaseClient } from '@supabase/supabase-js';

const VISITOR_KEY = 'vc_visitor_id';
const LAST_VISIT_KEY = 'vc_last_visit_date';

function getVisitorId(): string | null {
  if (typeof window === 'undefined') return null;
  let id = localStorage.getItem(VISITOR_KEY);
  if (!id) {
    id = 'vis_' + Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
    localStorage.setItem(VISITOR_KEY, id);
  }
  return id;
}

export function trackDailyVisit(supabase: SupabaseClient): void {
  try {
    const visitorId = getVisitorId();
    if (!visitorId || !supabase) return;
    const todayStr = new Date().toLocaleDateString('en-CA');
    const lastVisit = localStorage.getItem(LAST_VISIT_KEY);
    if (lastVisit !== todayStr) {
      supabase.from('page_views').insert({ visitor_id: visitorId }).then(({ error }: { error: unknown }) => {
        if (!error) localStorage.setItem(LAST_VISIT_KEY, todayStr);
      });
    }
  } catch {
    // analytics never blocks the UI
  }
}

export function trackProductView(supabase: SupabaseClient, productId: number | string): void {
  try {
    const visitorId = getVisitorId();
    if (!visitorId || !supabase || productId == null) return;
    supabase.from('page_views').insert({ visitor_id: visitorId, product_id: productId }).then(() => {});
  } catch {
    // analytics never blocks the UI
  }
}
