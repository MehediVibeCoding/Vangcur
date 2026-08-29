// [REPLACE] ফাইলের পাথ: lib/checkoutData.ts
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

export const DISTRICT_MAP_EN: Record<string, string> = {
  'ঢাকা': 'Dhaka',
  'চট্টগ্রাম': 'Chattogram',
  'রাজশাহী': 'Rajshahi',
  'খুলনা': 'Khulna',
  'বরিশাল': 'Barishal',
  'সিলেট': 'Sylhet',
  'রংপুর': 'Rangpur',
  'ময়মনসিংহ': 'Mymensingh',
  'কুমিল্লা': 'Cumilla',
  'ফেনী': 'Feni',
  'নোয়াখালী': 'Noakhali',
  'লক্ষ্মীপুর': 'Lakshmipur',
  'চাঁদপুর': 'Chandpur',
  'ব্রাহ্মণবাড়িয়া': 'Brahmanbaria',
  'কিশোরগঞ্জ': 'Kishoreganj',
  'নরসিংদী': 'Narsingdi',
  'নারায়ণগঞ্জ': 'Narayanganj',
  'মুন্সীগঞ্জ': 'Munshiganj',
  'মানিকগঞ্জ': 'Manikganj',
  'গাজীপুর': 'Gazipur',
  'টাঙ্গাইল': 'Tangail',
  'ফরিদপুর': 'Faridpur',
  'মাদারীপুর': 'Madaripur',
  'শরীয়তপুর': 'Shariatpur',
  'রাজবাড়ী': 'Rajbari',
  'গোপালগঞ্জ': 'Gopalganj',
  'বগুড়া': 'Bogura',
  'নওগাঁ': 'Naogaon',
  'নাটোর': 'Natore',
  'পাবনা': 'Pabna',
  'সিরাজগঞ্জ': 'Sirajganj',
  'জয়পুরহাট': 'Joypurhat',
  'চাঁপাইনবাবগঞ্জ': 'Chapainawabganj',
  'যশোর': 'Jashore',
  'সাতক্ষীরা': 'Satkhira',
  'মেহেরপুর': 'Meherpur',
  'নড়াইল': 'Narail',
  'চুয়াডাঙ্গা': 'Chuadanga',
  'কুষ্টিয়া': 'Kushtia',
  'মাগুরা': 'Magura',
  'ঝিনাইদহ': 'Jhenaidah',
  'বাগেরহাট': 'Bagerhat',
  'পিরোজপুর': 'Pirojpur',
  'ঝালকাঠি': 'Jhalakathi',
  'পটুয়াখালী': 'Patuakhali',
  'বরগুনা': 'Barguna',
  'ভোলা': 'Bhola',
  'সুনামগঞ্জ': 'Sunamganj',
  'হবিগঞ্জ': 'Habiganj',
  'মৌলভীবাজার': 'Moulvibazar',
  'নেত্রকোনা': 'Netrokona',
  'জামালপুর': 'Jamalpur',
  'শেরপুর': 'Sherpur',
  'গাইবান্ধা': 'Gaibandha',
  'নীলফামারী': 'Nilphamari',
  'লালমনিরহাট': 'Lalmonirhat',
  'কুড়িগ্রাম': 'Kurigram',
  'ঠাকুরগাঁও': 'Thakurgaon',
  'পঞ্চগড়': 'Panchagarh',
  'দিনাজপুর': 'Dinajpur',
  'কক্সবাজার': 'Cox\'s Bazar',
  'বান্দরবান': 'Bandarban',
  'রাঙ্গামাটি': 'Rangamati',
  'খাগড়াছড়ি': 'Khagrachhari',
};

export function getDistrictLabel(dist: string, lang: 'bn' | 'en' = 'bn'): string {
  if (lang === 'en') {
    return DISTRICT_MAP_EN[dist] || dist;
  }
  return dist;
}

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
  nameEn: string;
  sub: string;
  subEn: string;
}

export function getShipOptions(dist: string): ShipOption[] {
  const isDhaka = dist === 'ঢাকা' || dist === 'Dhaka';
  if (isDhaka) {
    return [
      {
        key: 'dhaka',
        name: 'ঢাকা সিটি কর্পোরেশনের আওতাধীন',
        nameEn: 'Inside Dhaka City Corporation',
        sub: 'Pathao Courier · হোম ডেলিভারি ১-২ দিন',
        subEn: 'Pathao Courier · Home Delivery 1-2 Days',
      },
      {
        key: 'outside',
        name: 'ঢাকা সিটি কর্পোরেশনের বাইরে / সাভার / গাজীপুর',
        nameEn: 'Outside Dhaka City / Suburb',
        sub: 'Pathao Courier · হোম ডেলিভারি ১-৩ দিন',
        subEn: 'Pathao Courier · Home Delivery 1-3 Days',
      },
    ];
  }
  if (dist) {
    return [
      {
        key: 'bangladesh',
        name: 'সারা বাংলাদেশ',
        nameEn: 'All Over Bangladesh',
        sub: 'Pathao Courier · হোম ডেলিভারি ২-৪ দিন',
        subEn: 'Pathao Courier · Home Delivery 2-4 Days',
      },
    ];
  }
  return [];
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
  return addr.length >= 8 && addr.length <= 300 && /\s/.test(addr) && !/(.)\1{4,}/.test(addr);
}

export function validateEmail(em: string): boolean {
  if (!em) return true;
  return em.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(em);
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
