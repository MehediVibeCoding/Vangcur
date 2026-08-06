import type { CartItem } from '@/types';

const DRAFT_KEY = 'vc_abandoned_draft';

export interface CheckoutDraft {
  id: string;
  name: string;
  phone: string;
  dist: string;
  addr: string;
  email: string;
  items: CartItem[];
  ship?: string;
  createdAt: number;
}

export function getDraft(): CheckoutDraft | null {
  if (typeof window === 'undefined') return null;
  try {
    return JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null');
  } catch {
    return null;
  }
}

interface SaveDraftInput {
  name: string;
  phone: string;
  dist: string;
  addr: string;
  email: string;
  items: CartItem[];
  ship?: string;
}

export function saveDraft({ name, phone, dist, addr, email, items, ship }: SaveDraftInput): void {
  if (typeof window === 'undefined') return;
  if (!phone || !Array.isArray(items) || items.length === 0) return;
  try {
    const existing = getDraft();
    const id = existing?.id || `dr_${Date.now()}`;
    const createdAt = existing?.createdAt || Date.now();
    localStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({ id, name, phone, dist, addr, email, items, ship, createdAt }),
    );
  } catch {
    // best effort
  }
}

export function clearDraft(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch {
    // ignore
  }
}

export function eligibleDraft(): CheckoutDraft | null {
  const draft = getDraft();
  if (!draft) return null;

  const FIFTEEN_DAYS = 15 * 24 * 60 * 60 * 1000;
  if (Date.now() - draft.createdAt > FIFTEEN_DAYS) {
    clearDraft();
    return null;
  }

  const createdHour = new Date(draft.createdAt).getHours();
  const nextDay = new Date(draft.createdAt);
  nextDay.setDate(nextDay.getDate() + 1);
  nextDay.setSeconds(0);
  nextDay.setMinutes(0);
  nextDay.setHours(createdHour < 18 ? 1 : 13);
  if (Date.now() < nextDay.getTime()) return null;

  try {
    if (localStorage.getItem(`vc_popup_dismissed_${draft.id}`)) return null;
  } catch {
    // ignore
  }

  return draft;
}

export function dismissDraft(draftId: string, isUserDismiss: boolean): void {
  if (typeof window === 'undefined' || !isUserDismiss) return;
  clearDraft();
}
