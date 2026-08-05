import type { SupabaseClient } from '@supabase/supabase-js';

export const DISTRICTS = [
  'ঢাকা', 'চট্টগ্রাম', 'রাজশাহী', 'খুলনা', 'বরিশাল', 'সিলেট', 'রংপুর', 'ময়মনসিংহ', 'কুমিল্লা', 'ফেনী',
  'নোয়াখালী', 'লক্ষ্মীপুর', 'চাঁদপুর', 'ব্রাহ্মণবাড়িয়া', 'কিশোরগঞ্জ', 'নরসিংদী', 'নারায়ণগঞ্জ', 'মুন্সীগঞ্জ',
  'মানিকগঞ্জ', 'গাজীপুর', 'টাঙ্গাইল', 'ফরিদপুর', 'মাদারীপুর', 'শরীয়তপুর', 'রাজবাড়ী', 'গোপালগঞ্জ', 'বগুড়া',
  'নওগাঁ', 'নাটোর', 'পাবনা', 'সিরাজগঞ্জ', 'জয়পুরহাট', 'চাঁপাইনবাবগঞ্জ', 'যশোর', 'সাতক্ষীরা', 'মেহেরপুর',
  'নড়াইল', 'চুয়াডাঙ্গা', 'কুষ্টিয়া', 'মাগুরা', 'ঝিনাইদহ', 'বাগেরহাট', 'পিরোজপুর', 'ঝালকাঠি', 'পটুয়াখালী',
  'বরগুনা', 'ভোলা', 'সুনামগঞ্জ', 'হবিগঞ্জ', 'মৌলভীবাজার', 'নেত্রকোনা', 'জামালপুর', 'শেরপুর', 'গাইবান্ধা',
  'নীলফামারী', 'লালমনিরহাট', 'কুড়িগ্রাম', 'ঠাকুরগাঁও', 'পঞ্চগড়', 'দিনাজপুর', 'কক্সবাজার', 'বান্দরবান',
  'রাঙ্গামাটি', 'খাগড়াছড়ি',
];

export interface ShipConfig {
  dhaka: number;
  out: number;
  bd: number;
}

export const DEFAULT_SHIP_CFG: ShipConfig = { dhaka: 90, out: 130, bd: 130 };

export type ShipKey = 'dhaka' | 'outside' | 'bangladesh';

export interface ShipOption {
  key: ShipKey;
  name: string;
  sub: string;
}

export function getShipOptions(dist: string): ShipOption[] {
  const isDhaka = dist === 'ঢাকা';
  if (isDhaka) {
    return [
      { key: 'dhaka', name: 'ঢাকা সিটি কর্পোরেশনের আওতাধীন', sub: 'Pathao Courier · Home Delivery 1-2 Days' },
      { key: 'outside', name: 'ঢাকা সিটি কর্পোরেশনের বাইরে', sub: 'Pathao Courier · Home Delivery 1-3 Days' },
    ];
  }
  if (dist) {
    return [{ key: 'bangladesh', name: 'সারা বাংলাদেশ', sub: 'Pathao Courier · Home Delivery 2-4 Days' }];
  }
  return [
    { key: 'dhaka', name: 'ঢাকা সিটি কর্পোরেশনের আওতাধীন', sub: 'Pathao Courier · Home Delivery 1-2 Days' },
    { key: 'bangladesh', name: 'সারা বাংলাদেশ', sub: 'Pathao Courier · Home Delivery 2-4 Days' },
  ];
}

export function shipPrice(shipKey: string, shipCfg: ShipConfig = DEFAULT_SHIP_CFG): number {
  if (shipKey === 'dhaka') return shipCfg.dhaka;
  if (shipKey === 'outside') return shipCfg.out;
  return shipCfg.bd;
}

export function validatePhone(ph: string): boolean {
  const phoneRegex = /^01[3-9]\d{8}$/;
  if (!phoneRegex.test(ph)) return false;
  const last8 = ph.slice(3);
  const allSame = last8.split('').every((c) => c === last8[0]);
  const isSeq = last8 === '12345678' || last8 === '87654321';
  return !(allSame || isSeq);
}

export function validateAddress(addr: string): boolean {
  return addr.length >= 8 && /\s/.test(addr) && !/(.)\1{4,}/.test(addr);
}

export function validateEmail(em: string): boolean {
  if (!em) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(em);
}

export function validateTxnId(txn: string): boolean {
  const txnRegex = /^[A-Z0-9]{10}$/;
  const hasLetter = /[A-Z]/.test(txn);
  const hasDigit = /[0-9]/.test(txn);
  const allSame = /^(.)\1{9}$/.test(txn);
  return txnRegex.test(txn) && hasLetter && hasDigit && !allSame;
}

export async function fetchBkashNumber(supabase: SupabaseClient): Promise<string> {
  try {
    const { data, error } = await supabase
      .from('store_settings')
      .select('setting_value')
      .eq('setting_key', 'vc_contact')
      .maybeSingle();
    if (error || !data) return '01816365504';
    const val = typeof data.setting_value === 'string' ? JSON.parse(data.setting_value) : data.setting_value;
    return (val && (val.bk || val.phone)) || '01816365504';
  } catch {
    return '01816365504';
  }
}

export async function fetchShipConfig(supabase: SupabaseClient): Promise<ShipConfig> {
  try {
    const { data, error } = await supabase
      .from('store_settings')
      .select('setting_value')
      .eq('setting_key', 'vc_shipping')
      .maybeSingle();
    if (error || !data) return DEFAULT_SHIP_CFG;
    const val = typeof data.setting_value === 'string' ? JSON.parse(data.setting_value) : data.setting_value;
    return val || DEFAULT_SHIP_CFG;
  } catch {
    return DEFAULT_SHIP_CFG;
  }
}
