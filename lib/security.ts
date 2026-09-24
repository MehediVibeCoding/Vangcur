const SAFE_HREF_PROTOCOLS = ['http:', 'https:', 'tel:', 'mailto:'];

// 🛡️ ফিক্স (audit P2-B13): আগে এখানে `<`/`>` কে `&lt;`/`&gt;` করে সেভ করা হতো
// (ভ্যানিলা JS যুগের রীতি), কিন্তু React JSX-এ `{text}` দিয়ে রেন্ডার করলে
// React নিজেই সব টেক্সট নিরাপদে escape করে — তাই সেভ করা `&lt;` আবার
// escape হয়ে ইউজার আক্ষরিক অর্থেই "&lt;" লেখা দেখত, `<` নয়। এই তিনটে
// কলার (প্রশ্ন/উত্তর/রিভিউ) কোথাও dangerouslySetInnerHTML দিয়ে রেন্ডার হয় না,
// তাই এখানে আর আগে থেকে escape করার দরকার নেই — শুধু ট্রিম যথেষ্ট।
export function sanitizeInput(value: string): string {
  return value.trim();
}

export function sanitizeHref(url: string | null | undefined): string {
  if (!url || typeof url !== 'string') return '#';
  const trimmed = url.trim();
  if (trimmed.startsWith('/') || trimmed.startsWith('#') || trimmed.startsWith('?')) {
    return trimmed;
  }
  try {
    const parsed = new URL(trimmed, 'https://vangcur.com');
    return SAFE_HREF_PROTOCOLS.includes(parsed.protocol) ? trimmed : '#';
  } catch {
    return '#';
  }
}

// 🛡️ ফিক্স (audit P2-B6): আগে এখানে একটা আলাদা, দুর্বল validatePhone ছিল
// (শুধু ফরম্যাট চেক করত, all-same/sequential ফেক প্যাটার্ন ধরত না) —
// checkout.ts যেটা ব্যবহার করে সেটার চেয়ে ভিন্ন নিয়ম, ফলে রেজিস্ট্রেশন/
// প্রোফাইল/স্টক-নোটিফাইতে এমন নম্বর গ্রহণ হতো যা checkout-এ বাতিল হতো।
// এখন একটাই বাস্তবায়ন (lib/checkoutData.ts-এ) ব্যবহার হচ্ছে সব জায়গায়।
export { validatePhone } from './checkoutData';

export const MAX_PHONE_LEN = 11;

// 🛡️ ফোন নম্বর ইনপুট থেকে শুধুমাত্র সংখ্যা রাখা হয় — বাংলাদেশি মোবাইল নম্বর ছাড়া
// আর কিছুই (স্ক্রিপ্ট, চিহ্ন, লেটার) এই ফিল্ডে ঢুকতে পারবে না।
export function sanitizePhoneInput(value: string): string {
  return value.replace(/\D/g, '').slice(0, MAX_PHONE_LEN);
}

export function validateEmail(email: string): boolean {
  const trimmed = email.trim();
  if (!trimmed || trimmed.length > 254) return false;
  return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)*\.[a-zA-Z]{2,}$/.test(trimmed);
}

const PLAIN_NAME_REGEX = /^[\p{L}\p{M}\s]*$/u;
export const MAX_NAME_LEN = 30;

export function sanitizePlainName(value: string): string {
  const lettersOnly = Array.from(value)
    .filter((ch) => /[\p{L}\p{M}\s]/u.test(ch))
    .join('');
  return lettersOnly.replace(/\s{2,}/g, ' ').replace(/^\s+/, '').slice(0, MAX_NAME_LEN);
}

export function validateName(name: string): boolean {
  const trimmed = name.trim();
  return trimmed.length >= 3 && trimmed.length <= MAX_NAME_LEN && PLAIN_NAME_REGEX.test(trimmed);
}

export function sanitizeEmailInput(value: string): string {
  return value.replace(/[^\x21-\x7E]/g, '').slice(0, 254);
}

export function validateAddress(address: string): boolean {
  const trimmed = address.trim();
  return trimmed.length >= 8 && trimmed.length <= 300;
}

export const MAX_ADDR_LEN = 300;

// 🛡️ পূর্ণাঙ্গ সেনিটাইজেশন: HTML/স্ক্রিপ্ট ট্যাগ ডিলিমিটার, কন্ট্রোল ক্যারেক্টার, এবং
// CSV/এক্সেল ফর্মুলা-ইনজেকশন (=, +, -, @ দিয়ে শুরু হওয়া ইনপুট — অ্যাডমিন পরে অর্ডার
// এক্সপোর্ট করে এক্সেলে খুললে ফর্মুলা হিসেবে চালিত হতে পারে) থেকে সুরক্ষিত।
//
// 🛠️ ফিক্স: আগে এখানে শেষে .trim() ছিল, আর এই ফাংশনটাই প্রতিটা কি-স্ট্রোকে
// (onChange-এ) কল হয় — তাই ইউজার যেই মুহূর্তে দুইটা শব্দের মাঝে স্পেস চাপত,
// সেই ট্রেইলিং স্পেসটা পরের অক্ষর টাইপ করার আগেই মুছে যেত, ফলে স্পেস আদৌ
// টাইপ করা যাচ্ছিল না। এখন শুধু শুরুর স্পেস বাদ যায় (যেটা টাইপিং আটকায় না);
// শেষের/মাঝের অতিরিক্ত স্পেস ফাইনাল সাবমিটের সময় (updateMyProfile-এ) trim হয়।
export function sanitizeAddressInput(value: string): string {
  const v = value
    .replace(/[<>`]/g, '')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .replace(/^[=+\-@]+/, '')
    .replace(/^\s+/, '');
  return v.slice(0, MAX_ADDR_LEN);
}
