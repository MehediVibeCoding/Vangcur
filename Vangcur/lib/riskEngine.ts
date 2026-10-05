// [NEW FILE] ফাইলের পাথ: lib/riskEngine.ts
//
// অর্ডার ট্রাস্ট স্কোর — ১০০ নম্বরের হিসাব। শুধুমাত্র অ্যাডমিনের জন্য নীরব মার্কিং;
// এখানকার যাচাই-নিয়ম চেকআউটে কাস্টমারকে কখনো আটকায় না বা কোনো বার্তা দেখায় না।
// ফাইলটা পিওর (ডাটাবেজ/নেটওয়ার্ক কল নেই), তাই আলাদাভাবে টেস্ট করা যায়।
//
// স্কোর ≥ ৭৫ → green (High) · ৪৫–৭৪ → yellow (Medium) · < ৪৫ → red (Low)
// কোনো "হার্ড" লিমিট ছুঁয়ে থাকলে (ফোন/ডিভাইসের ২৪ ঘণ্টার সীমা ইত্যাদি) সরাসরি red।

import { DISTRICT_MAP_EN } from '@/lib/checkoutData';

export type RiskLevel = 'green' | 'yellow' | 'red';
export type FactorTone = 'good' | 'warn' | 'bad';

export interface RiskFactor {
  key: string;
  label: string;
  points: number;
  max: number;
  tone: FactorTone;
  note: string;
}

export interface RiskLimitHit {
  type: string;
  severity: 'hard' | 'soft';
  /** ফোন / ডিভাইস / লগইন-আইডির সাথে সরাসরি মিলেছে (শুধু আইপি মিললে false) */
  strong: boolean;
}

export interface RiskGeo {
  city: string;
  country: string;
}

export interface RiskInput {
  total: number;
  items: { id: string | number; qty: number }[];
  phone: string;
  email: string;
  district: string;
  address: string;
  isLoggedIn: boolean;
  loginEmail: string | null;
  loginPhone: string | null;
  hasDeliveredBefore: boolean;
  limitHits: RiskLimitHit[];
  geo: RiskGeo;
}

export interface RiskResult {
  score: number;
  level: RiskLevel;
  hardLimit: boolean;
  factors: RiskFactor[];
  reasons: string[];
}

export const GREEN_MIN_SCORE = 75;
export const YELLOW_MIN_SCORE = 45;
export const HARD_LIMIT_PENALTY = 50;

const BN_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
const bn = (n: number): string => String(n).replace(/\d/g, (d) => BN_DIGITS[Number(d)]);

// ───────────────────────── ফোন ─────────────────────────

function isDummyPhone(phone: string): boolean {
  if (/(\d)\1{5,}/.test(phone)) return true;
  let run = 1;
  let dir = 0;
  for (let i = 1; i < phone.length; i++) {
    const diff = Number(phone[i]) - Number(phone[i - 1]);
    if ((diff === 1 || diff === -1) && (dir === 0 || diff === dir)) {
      dir = diff;
      run += 1;
      if (run >= 6) return true;
    } else {
      dir = diff === 1 || diff === -1 ? diff : 0;
      run = dir === 0 ? 1 : 2;
    }
  }
  return false;
}

function normalizePhone(p: string | null | undefined): string {
  let d = String(p || '').replace(/\D/g, '');
  if (d.startsWith('880')) d = d.slice(2);
  if (d.length === 10 && d.startsWith('1')) d = '0' + d;
  return d;
}

// ───────────────────────── ইমেইল ─────────────────────────

const EMAIL_TYPO_DOMAINS: Record<string, string> = {
  'gmai.com': 'gmail.com',
  'gamil.com': 'gmail.com',
  'gmial.com': 'gmail.com',
  'gmail.co': 'gmail.com',
  'gmail.con': 'gmail.com',
  'gmil.com': 'gmail.com',
  'gmaill.com': 'gmail.com',
  'gnail.com': 'gmail.com',
  'gmal.com': 'gmail.com',
  'yaho.com': 'yahoo.com',
  'yahooo.com': 'yahoo.com',
  'yahoo.co': 'yahoo.com',
  'yhoo.com': 'yahoo.com',
  'hotmial.com': 'hotmail.com',
  'hotmal.com': 'hotmail.com',
  'outlok.com': 'outlook.com',
  'outllook.com': 'outlook.com',
};

const DISPOSABLE_DOMAINS = new Set([
  'temp-mail.org', 'tempmail.com', '10minutemail.com', 'guerrillamail.com', 'mailinator.com',
  'yopmail.com', 'trashmail.com', 'throwawaymail.com', 'sharklasers.com', 'getnada.com',
  'dispostable.com', 'maildrop.cc', 'fakeinbox.com', 'tempmailo.com', 'emailondeck.com',
]);

type EmailGrade = 'none' | 'invalid' | 'typo' | 'disposable' | 'ok';

function gradeEmail(email: string): { grade: EmailGrade; clean: string; hint?: string } {
  const clean = String(email || '').trim().toLowerCase();
  if (!clean) return { grade: 'none', clean };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(clean)) return { grade: 'invalid', clean };
  const domain = clean.split('@')[1];
  if (EMAIL_TYPO_DOMAINS[domain]) return { grade: 'typo', clean, hint: domain };
  if (DISPOSABLE_DOMAINS.has(domain)) return { grade: 'disposable', clean, hint: domain };
  return { grade: 'ok', clean };
}

// ───────────────────────── ঠিকানা ─────────────────────────

const ADDRESS_KEYWORDS_BN = [
  'বাসা', 'বাড়ি', 'বাড়ী', 'রোড', 'রাস্তা', 'সড়ক', 'লেন', 'গলি', 'সেক্টর', 'ব্লক', 'হোল্ডিং',
  'ফ্ল্যাট', 'তলা', 'গ্রাম', 'পাড়া', 'মহল্লা', 'এলাকা', 'বাজার', 'থানা', 'উপজেলা', 'ডাকঘর',
  'পোস্ট', 'পাশে', 'মোড়', 'মোড়', 'মসজিদ', 'মাদ্রাসা', 'মাদরাসা', 'স্কুল', 'কলেজ', 'হাট',
  'ওয়ার্ড', 'ইউনিয়ন', 'এভিনিউ', 'মার্কেট', 'ভবন', 'বিল্ডিং', 'টাওয়ার', 'কলোনি', 'নম্বর', 'নং',
  'স্ট্যান্ড', 'সদর',
];

const ADDRESS_KEYWORDS_EN = new Set([
  'house', 'home', 'road', 'rd', 'lane', 'goli', 'sector', 'block', 'flat', 'floor', 'holding',
  'village', 'gram', 'para', 'bazar', 'bazaar', 'thana', 'upazila', 'upazilla', 'post', 'po',
  'near', 'beside', 'opposite', 'mor', 'bari', 'basha', 'ward', 'union', 'market', 'building',
  'tower', 'colony', 'avenue', 'sarak', 'school', 'college', 'mosque', 'masjid', 'madrasa',
  'madrasha', 'area', 'mohalla', 'stand', 'sadar', 'no', 'level', 'apartment', 'apt',
]);

const KEYBOARD_SMASH = /(asdf|sdfg|dfgh|fghj|ghjk|hjkl|qwer|wert|erty|rtyu|tyui|yuio|uiop|zxcv|xcvb|cvbn|vbnm|qazw|wsxe|12345|23456|34567|45678|56789|98765|87654|76543)/;

type AddressGrade = 'good' | 'fair' | 'poor';

function gradeAddress(address: string, district: string): { grade: AddressGrade; note: string } {
  const text = String(address || '').trim();
  const lower = text.toLowerCase();
  const compact = lower.replace(/[\s,.\-_/#:;()]+/g, ' ').trim();

  if (compact.length < 10) return { grade: 'poor', note: 'ঠিকানা খুবই ছোট' };

  const districtEn = (DISTRICT_MAP_EN[district] || '').toLowerCase();
  const onlyDistrict = [district, districtEn, `${districtEn} city`, `${districtEn} sadar`, `${district} সদর`, `${district} শহর`]
    .filter(Boolean)
    .map((s) => s.toLowerCase());
  if (onlyDistrict.includes(compact)) return { grade: 'poor', note: 'শুধু জেলার নাম লেখা, বাসা/রাস্তার কিছু নেই' };

  if (!/[a-z\u0980-\u09ff]/i.test(text)) return { grade: 'poor', note: 'ঠিকানায় কোনো অক্ষর নেই, শুধু সংখ্যা/চিহ্ন' };

  // একই অক্ষর ৪+ বার টানা (aaaa, ভভভভ)
  if (/([a-z\u0980-\u09ff])\1{3,}/i.test(text)) return { grade: 'poor', note: 'একই অক্ষর বারবার লেখা' };

  // কিবোর্ড স্ম্যাশ/জিবরিশ — শুধু ইংরেজি শব্দে: স্বরবর্ণহীন ৪+ অক্ষরের শব্দ, অথবা টানা ৬+ ব্যঞ্জন
  const latinWords = compact.match(/[a-z]{4,}/g) || [];
  for (const w of latinWords) {
    if (!/[aeiouy]/.test(w)) return { grade: 'poor', note: `অর্থহীন লেখা ("${w}")` };
    if (/[bcdfghjklmnpqrstvwxz]{6,}/.test(w)) return { grade: 'poor', note: `অর্থহীন লেখা ("${w}")` };
  }
  if (KEYBOARD_SMASH.test(compact.replace(/\s/g, ''))) return { grade: 'poor', note: 'কিবোর্ড চাপাচাপির মতো লেখা' };

  const tokens = compact.split(' ').filter(Boolean);
  const latinTokens = new Set(compact.split(/[^a-z]+/).filter(Boolean));
  let keywordHits = 0;
  for (const kw of ADDRESS_KEYWORDS_BN) if (text.includes(kw)) keywordHits += 1;
  latinTokens.forEach((t) => {
    if (ADDRESS_KEYWORDS_EN.has(t)) keywordHits += 1;
  });
  const hasNumber = /[0-9\u09e6-\u09ef]/.test(text);

  if (tokens.length >= 3 && text.length >= 15 && (keywordHits >= 2 || (keywordHits >= 1 && hasNumber))) {
    return { grade: 'good', note: 'বাসা/রাস্তা/এলাকার স্পষ্ট তথ্য আছে' };
  }
  if (keywordHits === 0 && !hasNumber) return { grade: 'fair', note: 'বাসা/রাস্তা/এলাকার কোনো চেনা শব্দ বা নম্বর নেই' };
  return { grade: 'fair', note: 'ঠিকানা আছে কিন্তু বিস্তারিত কম' };
}

// ───────────────────────── আইপি বনাম জেলা ─────────────────────────

const EXTRA_CITY_ALIASES: Record<string, string[]> = {
  'ঢাকা': ['dacca'],
  'চট্টগ্রাম': ['chittagong', 'chattagram', 'chittagram'],
  'কুমিল্লা': ['comilla', 'kumilla'],
  'বরিশাল': ['barisal'],
  'বগুড়া': ['bogra'],
  'যশোর': ['jessore'],
  'নারায়ণগঞ্জ': ['narayangonj', 'narayanganj'],
  'কক্সবাজার': ["cox's bazar", 'coxs bazar', 'cox bazar', "cox's bazaar"],
  'মৌলভীবাজার': ['maulvibazar', 'moulvibazar', 'maulavibazar'],
  'চাঁপাইনবাবগঞ্জ': ['nawabganj', 'chapai nawabganj', 'chapainawabganj'],
  'ব্রাহ্মণবাড়িয়া': ['brahmanbaria', 'brahmanbariya'],
  'রাঙ্গামাটি': ['rangamati', 'rangamati hill'],
  'খাগড়াছড়ি': ['khagrachari', 'khagrachhari'],
  'ময়মনসিংহ': ['mymensingh', 'mymensing'],
  'সিলেট': ['sylhet', 'sileth'],
  'জয়পুরহাট': ['joypurhat', 'jaipurhat'],
  'পটুয়াখালী': ['patuakhali'],
  'লক্ষ্মীপুর': ['laxmipur', 'lakshmipur'],
  'নেত্রকোনা': ['netrokona', 'netrakona'],
  'ঝিনাইদহ': ['jhenaidah', 'jhenidah'],
  'ঠাকুরগাঁও': ['thakurgaon'],
};

// ঢাকার আশপাশের জেলাগুলোতে আইপি প্রায়ই ঢাকা দেখায় (বা উল্টো) — এগুলোকে "কাছাকাছি" ধরে মিল ধরা হয়
const DHAKA_AREA = new Set(['ঢাকা', 'গাজীপুর', 'নারায়ণগঞ্জ', 'মুন্সীগঞ্জ', 'মানিকগঞ্জ', 'নরসিংদী']);

function normCity(s: string): string {
  return String(s || '')
    .toLowerCase()
    .replace(/\b(city|division|district|sadar|metropolitan)\b/g, '')
    .replace(/[^a-z' ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

let cityIndex: Map<string, string> | null = null;
function getCityIndex(): Map<string, string> {
  if (cityIndex) return cityIndex;
  const idx = new Map<string, string>();
  for (const [bnName, en] of Object.entries(DISTRICT_MAP_EN)) {
    idx.set(normCity(en), bnName);
  }
  for (const [bnName, list] of Object.entries(EXTRA_CITY_ALIASES)) {
    for (const a of list) idx.set(normCity(a), bnName);
  }
  cityIndex = idx;
  return idx;
}

type IpGrade = 'match' | 'mismatch' | 'unknown' | 'foreign';

function gradeIp(geo: RiskGeo, district: string): { grade: IpGrade; city: string } {
  const city = String(geo.city || '').trim();
  const country = String(geo.country || '').trim().toUpperCase();
  if (country && country !== 'BD') return { grade: 'foreign', city: country };
  if (!city) return { grade: 'unknown', city: '' };
  const ipDistrict = getCityIndex().get(normCity(city));
  if (!ipDistrict) return { grade: 'unknown', city };
  if (ipDistrict === district) return { grade: 'match', city };
  if (DHAKA_AREA.has(ipDistrict) && DHAKA_AREA.has(district)) return { grade: 'match', city };
  return { grade: 'mismatch', city };
}

// ───────────────────────── লিমিট ─────────────────────────

const LIMIT_LABELS: Record<string, string> = {
  phone_daily: 'একই ফোনে ২৪ ঘণ্টার অর্ডার-সীমা ছুঁয়েছে',
  fingerprint_daily: 'একই ডিভাইসে ২৪ ঘণ্টার অর্ডার-সীমা ছুঁয়েছে',
  coupon_fail_hourly: 'কুপনে ঘণ্টায় অতিরিক্ত ভুল চেষ্টা করেছে',
  phone_cooldown: 'দ্রুত পরপর অর্ডারের চেষ্টা করেছে',
  pending_lock: 'আগের অর্ডার পেন্ডিং থাকতে নতুন অর্ডার চেষ্টা করেছে',
  ip_daily: 'একই আইপিতে ২৪ ঘণ্টার অর্ডার-সীমা ছুঁয়েছে',
  coupon_burst: 'কুপন দ্রুত বারবার চেষ্টা করেছে',
};

function summarizeHits(hits: RiskLimitHit[]): string {
  const counts = new Map<string, number>();
  for (const h of hits) counts.set(h.type, (counts.get(h.type) || 0) + 1);
  return Array.from(counts.entries())
    .map(([type, n]) => `${LIMIT_LABELS[type] || type}${n > 1 ? ` (${bn(n)} বার)` : ''}`)
    .join('; ');
}

// ───────────────────────── মূল হিসাব ─────────────────────────

function toneOf(points: number, max: number): FactorTone {
  if (points >= max) return 'good';
  if (points <= 0) return 'bad';
  return 'warn';
}

/** যে ফ্যাক্টরে সবচেয়ে বেশি নম্বর কেটেছে, তার কারণগুলো (বড় থেকে ছোট) — Telegram মেসেজের জন্য */
export function topRiskReasons(result: RiskResult, count = 2): string[] {
  return result.factors
    .filter((f) => f.tone !== 'good')
    .sort((a, b) => b.max - b.points - (a.max - a.points))
    .slice(0, count)
    .map((f) => `${f.label}: ${f.note}`);
}

export function calculateOrderRisk(input: RiskInput): RiskResult {
  const factors: RiskFactor[] = [];
  const add = (key: string, label: string, points: number, max: number, note: string, tone?: FactorTone) => {
    factors.push({ key, label, points, max, tone: tone ?? toneOf(points, max), note });
  };

  // ১. আগের অর্ডার (১৫)
  if (input.hasDeliveredBefore) {
    add('history', 'আগের অর্ডার', 15, 15, 'আগে সফলভাবে ডেলিভারি হওয়া অর্ডার আছে');
  } else {
    add('history', 'আগের অর্ডার', 7, 15, 'নতুন কাস্টমার — আগে কোনো ডেলিভার্ড অর্ডার নেই', 'warn');
  }

  // ২. ফোন (১৫) — এখানে লাল নেই
  const phone = normalizePhone(input.phone);
  const loginPhone = normalizePhone(input.loginPhone);
  const dummy = isDummyPhone(phone);
  if (!dummy && input.isLoggedIn && loginPhone && loginPhone === phone) {
    add('phone', 'ফোন নম্বর', 15, 15, 'লগইন অ্যাকাউন্টের নম্বরের সাথে মিলেছে');
  } else if (dummy) {
    add('phone', 'ফোন নম্বর', 8, 15, 'নম্বরে পুনরাবৃত্ত/ক্রমিক অঙ্কের সন্দেহজনক ধরন আছে', 'warn');
  } else if (input.isLoggedIn && loginPhone) {
    add('phone', 'ফোন নম্বর', 8, 15, 'লগইন অ্যাকাউন্টের নম্বর থেকে আলাদা নম্বর দেওয়া হয়েছে', 'warn');
  } else {
    add('phone', 'ফোন নম্বর', 8, 15, 'নম্বর যাচাই করা যায়নি (লগইন ছাড়া বা প্রোফাইলে নম্বর নেই)', 'warn');
  }

  // ৩. ইমেইল (১০)
  const em = gradeEmail(input.email);
  const loginEmail = String(input.loginEmail || '').trim().toLowerCase();
  if (em.grade === 'none') {
    add('email', 'ইমেইল', 0, 10, 'কোনো ইমেইল দেওয়া হয়নি');
  } else if (em.grade === 'invalid') {
    add('email', 'ইমেইল', 0, 10, 'ইমেইলের গঠন সঠিক নয়');
  } else if (em.grade === 'disposable') {
    add('email', 'ইমেইল', 0, 10, `সাময়িক/ফেক মেইল সার্ভিসের ইমেইল (${em.hint})`);
  } else if (em.grade === 'typo') {
    add('email', 'ইমেইল', 2, 10, `ডোমেইনে বানান ভুল (${em.hint}) — ইমেইলটি কাজ করবে না`, 'warn');
  } else if (input.isLoggedIn && loginEmail && em.clean === loginEmail) {
    add('email', 'ইমেইল', 10, 10, 'লগইন অ্যাকাউন্টের ইমেইল');
  } else {
    add('email', 'ইমেইল', 5, 10, 'সঠিক ফরম্যাটের ইমেইল, কিন্তু লগইন করা অ্যাকাউন্টের না', 'warn');
  }

  // ৪. ঠিকানা (১৫)
  const addr = gradeAddress(input.address, input.district);
  if (addr.grade === 'good') add('address', 'ডেলিভারি ঠিকানা', 15, 15, addr.note);
  else if (addr.grade === 'fair') add('address', 'ডেলিভারি ঠিকানা', 8, 15, addr.note, 'warn');
  else add('address', 'ডেলিভারি ঠিকানা', 0, 15, addr.note);

  // ৫. আইপি বনাম ঠিকানা (১০) — না মিললে লাল নয়, হলুদ
  const ip = gradeIp(input.geo, input.district);
  if (ip.grade === 'match') add('ip', 'আইপি বনাম ঠিকানা', 10, 10, `আইপি লোকেশন (${ip.city}) ডেলিভারি জেলার সাথে মিলেছে`);
  else if (ip.grade === 'mismatch') add('ip', 'আইপি বনাম ঠিকানা', 5, 10, `আইপি লোকেশন (${ip.city}) ডেলিভারি জেলা থেকে আলাদা`, 'warn');
  else if (ip.grade === 'foreign') add('ip', 'আইপি বনাম ঠিকানা', 5, 10, `বাংলাদেশের বাইরের আইপি (${ip.city})`, 'warn');
  else add('ip', 'আইপি বনাম ঠিকানা', 5, 10, ip.city ? `আইপির শহর (${ip.city}) জেলার সাথে মেলানো যায়নি` : 'আইপি লোকেশন জানা যায়নি', 'warn');

  // ৬. একই পণ্য কতবার (১০)
  const maxQty = input.items.reduce((m, i) => Math.max(m, Number(i.qty) || 0), 0);
  if (maxQty <= 2) add('quantity', 'একই পণ্যের পরিমাণ', 10, 10, `একই পণ্য সর্বোচ্চ ${bn(maxQty)} পিস`);
  else if (maxQty === 3) add('quantity', 'একই পণ্যের পরিমাণ', 5, 10, 'একই পণ্য ৩ পিস', 'warn');
  else add('quantity', 'একই পণ্যের পরিমাণ', 0, 10, `একই পণ্য ${bn(maxQty)} পিস — অস্বাভাবিক বেশি`);

  // ৭. অর্ডার এমাউন্ট (১৫)
  const total = Number(input.total) || 0;
  if (total < 5000) add('amount', 'অর্ডার এমাউন্ট', 15, 15, '৫,০০০ টাকার নিচে');
  else if (total <= 10000) add('amount', 'অর্ডার এমাউন্ট', 8, 15, '৫,০০০–১০,০০০ টাকার মাঝারি অর্ডার', 'warn');
  else add('amount', 'অর্ডার এমাউন্ট', 0, 15, '১০,০০০ টাকার বেশি — অগ্রিম নিশ্চিত করা ভালো', 'bad');

  // ৮. লিমিট (১০) — হার্ড লিমিট ছুঁলে -৫০ ও সরাসরি লাল
  const hardHits = input.limitHits.filter((h) => h.severity === 'hard' && h.strong);
  const hardLimit = hardHits.length > 0;
  if (hardLimit) {
    add('limit', 'লিমিট ও কুপন', 0, 10, summarizeHits(hardHits), 'bad');
  } else if (input.limitHits.length > 0) {
    add('limit', 'লিমিট ও কুপন', 4, 10, summarizeHits(input.limitHits), 'warn');
  } else {
    add('limit', 'লিমিট ও কুপন', 10, 10, 'কোনো লিমিট ছোঁয়নি');
  }

  const raw = factors.reduce((s, f) => s + f.points, 0);
  const score = Math.max(0, Math.min(100, raw - (hardLimit ? HARD_LIMIT_PENALTY : 0)));

  let level: RiskLevel = 'red';
  if (hardLimit) level = 'red';
  else if (score >= GREEN_MIN_SCORE) level = 'green';
  else if (score >= YELLOW_MIN_SCORE) level = 'yellow';

  const reasons = factors.filter((f) => f.tone !== 'good').map((f) => `${f.label}: ${f.note}`);

  return { score, level, hardLimit, factors, reasons };
}
