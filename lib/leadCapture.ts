import type { CartItem } from '@/types';

const GAS_ENDPOINT =
  'https://script.google.com/macros/s/AKfycbyQOHCmm_HnucXSwAWej6K_UCsNxeiJlWljyH2nlmd_gcC1xmbcudzy30hUaQIrOqon/exec';

function itemsSummary(items: CartItem[]): string {
  if (!Array.isArray(items)) return '';
  return items.map((i) => `${i.name} x${i.qty}`).join(', ');
}

function itemsTotal(items: CartItem[]): number {
  if (!Array.isArray(items)) return 0;
  return items.reduce((s, i) => s + (i.price || 0) * (i.qty || 0), 0);
}

interface SendLeadInput {
  leadId: string;
  name: string;
  phone: string;
  dist: string;
  addr: string;
  email: string;
  items: CartItem[];
}

export function sendLead({ leadId, name, phone, dist, addr, email, items }: SendLeadInput): void {
  if (typeof window === 'undefined') return;
  if (!phone) return;

  const payload = {
    action: 'addLead',
    leadId: leadId || `LD-${Date.now()}`,
    date: new Date().toLocaleString('bn-BD'),
    name: name || '',
    phone: phone || '',
    dist: dist || '',
    addr: addr || '',
    email: email || '',
    items: itemsSummary(items),
    total: itemsTotal(items),
  };

  try {
    const body = JSON.stringify(payload);
    if (navigator.sendBeacon) {
      navigator.sendBeacon(GAS_ENDPOINT, new Blob([body], { type: 'text/plain;charset=UTF-8' }));
    } else {
      fetch(GAS_ENDPOINT, { method: 'POST', mode: 'no-cors', body });
    }
  } catch {
    // best-effort only — never block or interrupt the customer over this
  }
}
