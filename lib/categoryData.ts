// ফাইলের পাথ: lib/categoryData.ts
import type { Category } from '@/types';

export const DEFAULT_CATEGORIES: Category[] = [
  // ১. অল প্রোডাক্টস (All Products) — স্মার্ট ডুও-টোন ৪-গ্রিড উইজেট
  {
    id: 'all',
    name: 'অল প্রোডাক্টস',
    icon: `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="5" y="5" width="9.5" height="9.5" rx="3" fill="#44A7FC" stroke="#1E293B" stroke-width="1.8"/>
      <rect x="17.5" y="5" width="9.5" height="9.5" rx="3" fill="#E0F2FE" stroke="#1E293B" stroke-width="1.8"/>
      <rect x="5" y="17.5" width="9.5" height="9.5" rx="3" fill="#E0F2FE" stroke="#1E293B" stroke-width="1.8"/>
      <rect x="17.5" y="17.5" width="9.5" height="9.5" rx="3" fill="#FFFFFF" stroke="#1E293B" stroke-width="1.8"/>
      <circle cx="22.25" cy="22.25" r="1.5" fill="#44A7FC"/>
    </svg>`,
  },

  // ২. টি ডব্লিউ এস (TWS Earbuds) — ওপেন পেবল কেস ও চার্জিং বাডস
  {
    id: 'tws',
    name: 'টি ডব্লিউ এস',
    icon: `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M7 14C7 9.58 10.58 6 15 6H17C21.42 6 25 9.58 25 14" stroke="#1E293B" stroke-width="1.8" stroke-linecap="round"/>
      <rect x="6" y="14" width="20" height="12" rx="6" fill="#E0F2FE" stroke="#1E293B" stroke-width="1.8"/>
      <rect x="10.5" y="10" width="3.5" height="7" rx="1.75" fill="#44A7FC" stroke="#1E293B" stroke-width="1.4"/>
      <rect x="18" y="10" width="3.5" height="7" rx="1.75" fill="#44A7FC" stroke="#1E293B" stroke-width="1.4"/>
      <circle cx="16" cy="20" r="1.2" fill="#44A7FC"/>
    </svg>`,
  },

  // ৩. আরজিবি লাইট (RGB Light) — অ্যারোমা গ্লো স্লিক লাইটবার ও এম্বিয়েন্ট প্রিজম
  {
    id: 'rgb',
    name: 'আরজিবি লাইট',
    icon: `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="12" y="4" width="8" height="21" rx="4" fill="#E0F2FE" stroke="#1E293B" stroke-width="1.8"/>
      <rect x="14" y="7" width="4" height="14" rx="2" fill="#44A7FC"/>
      <path d="M8 27H24" stroke="#1E293B" stroke-width="1.8" stroke-linecap="round"/>
      <path d="M6 10L4 9M6 15L3 15M6 20L4 21" stroke="#44A7FC" stroke-width="1.8" stroke-linecap="round"/>
      <path d="M26 10L28 9M26 15L29 15M26 20L28 21" stroke="#44A7FC" stroke-width="1.8" stroke-linecap="round"/>
    </svg>`,
  },

  // ৪. রিচার্জেবল ফ্যান (Rechargeable Fan) — কিউট অ্যারোডায়নামিক ৩-ব্লেড ফ্যান ও বেস
  {
    id: 'fan',
    name: 'রিচার্জেবল ফ্যান',
    icon: `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="13" r="9.5" fill="#E0F2FE" stroke="#1E293B" stroke-width="1.8"/>
      <circle cx="16" cy="13" r="2.5" fill="#44A7FC" stroke="#1E293B" stroke-width="1.4"/>
      <path d="M16 10.5C16 7.5 18 6.5 18.5 7.5C19 8.5 17.5 11 16 10.5Z" fill="#44A7FC" stroke="#1E293B" stroke-width="1.2"/>
      <path d="M14 14.5C11.5 16 10 14.5 10.5 13.5C11 12.5 14 13 14 14.5Z" fill="#44A7FC" stroke="#1E293B" stroke-width="1.2"/>
      <path d="M17.5 15C19 17.5 18 19 17 18.5C16 18 16.5 15 17.5 15Z" fill="#44A7FC" stroke="#1E293B" stroke-width="1.2"/>
      <path d="M16 22.5V27M11 27H21" stroke="#1E293B" stroke-width="1.8" stroke-linecap="round"/>
    </svg>`,
  },

  // ৫. একরেলিক ল্যাম্প (Acrylic Lamp) — উডেন বেস ও ক্রিস্টাল এচিং আর্চ
  {
    id: 'acrylic',
    name: 'একরেলিক ল্যাম্প',
    icon: `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M9 22V11C9 7.13 12.13 4 16 4C19.87 4 23 7.13 23 11V22" fill="#E0F2FE" stroke="#1E293B" stroke-width="1.8" stroke-linecap="round"/>
      <rect x="6" y="22" width="20" height="6" rx="2.5" fill="#FFFFFF" stroke="#1E293B" stroke-width="1.8"/>
      <path d="M16 9V17M12.5 13H19.5" stroke="#44A7FC" stroke-width="1.6" stroke-linecap="round"/>
      <circle cx="16" cy="13" r="1.2" fill="#44A7FC"/>
      <path d="M11 25H21" stroke="#44A7FC" stroke-width="1.5" stroke-linecap="round"/>
    </svg>`,
  },

  // ৬. হেডফোন (Headphone) — প্রিমিয়াম ওভার-ইয়ার কুশনড হেডসেট
  {
    id: 'headphone',
    name: 'হেডফোন',
    icon: `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M6 16C6 10.48 10.48 6 16 6C21.52 6 26 10.48 26 16" stroke="#1E293B" stroke-width="1.8" stroke-linecap="round"/>
      <rect x="4" y="15" width="5" height="10" rx="2.5" fill="#44A7FC" stroke="#1E293B" stroke-width="1.8"/>
      <rect x="23" y="15" width="5" height="10" rx="2.5" fill="#44A7FC" stroke="#1E293B" stroke-width="1.8"/>
      <path d="M9 17.5V22.5M23 17.5V22.5" stroke="#E0F2FE" stroke-width="1.5" stroke-linecap="round"/>
    </svg>`,
  },

  // ৭. ইউনিক কালেকশন (Unique Collection) — এক্সক্লুসিভ জেম ও স্পার্ক প্রিজম
  {
    id: 'unique',
    name: 'ইউনিক কালেকশন',
    icon: `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M16 3L19.2 11.8L28 15L19.2 18.2L16 27L12.8 18.2L4 15L12.8 11.8L16 3Z" fill="#E0F2FE" stroke="#1E293B" stroke-width="1.8" stroke-linejoin="round"/>
      <circle cx="16" cy="15" r="3" fill="#44A7FC"/>
      <circle cx="26" cy="6" r="1.5" fill="#44A7FC"/>
      <circle cx="6" cy="24" r="1.5" fill="#44A7FC"/>
    </svg>`,
  },

  // ৮. গিম্বল (Gimbal) — ৩-অ্যাক্সিস মোটর আর্ম ও স্মার্টফোন স্ট্যাবিলাইজার
  {
    id: 'gimbal',
    name: 'গিম্বল',
    icon: `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="9" y="4" width="14" height="8" rx="2" fill="#E0F2FE" stroke="#1E293B" stroke-width="1.8"/>
      <path d="M16 12V16M16 16H21V19M16 16H11V19" stroke="#1E293B" stroke-width="1.8" stroke-linecap="round"/>
      <circle cx="16" cy="16" r="2" fill="#44A7FC"/>
      <rect x="13.5" y="19" width="5" height="9" rx="2" fill="#FFFFFF" stroke="#1E293B" stroke-width="1.8"/>
      <circle cx="16" cy="22.5" r="1" fill="#44A7FC"/>
    </svg>`,
  },

  // ৯. ইউনিক টুল (Unique Tool) — স্লিক প্রেসিশন ইলেকট্রিক স্ক্রু-ড্রাইভার
  {
    id: 'tools',
    name: 'ইউনিক টুল',
    icon: `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="12" y="7" width="8" height="17" rx="3" fill="#E0F2FE" stroke="#1E293B" stroke-width="1.8"/>
      <path d="M14 24L15 28H17L18 24" fill="#FFFFFF" stroke="#1E293B" stroke-width="1.6" stroke-linejoin="round"/>
      <line x1="16" y1="28" x2="16" y2="30" stroke="#1E293B" stroke-width="1.8" stroke-linecap="round"/>
      <rect x="14" y="11" width="4" height="4" rx="1" fill="#44A7FC"/>
      <path d="M12 4H20" stroke="#1E293B" stroke-width="1.8" stroke-linecap="round"/>
    </svg>`,
  },

  // ১০. ক্যাবল অ্যান্ড চার্জার (Cable & Charger) — ফাস্ট-চার্জিং অ্যাডাপ্টার ও টাইপ-সি লুপ
  {
    id: 'cable-charger',
    name: 'ক্যাবল অ্যান্ড চার্জার',
    icon: `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="5" y="10" width="12" height="14" rx="3" fill="#E0F2FE" stroke="#1E293B" stroke-width="1.8"/>
      <path d="M8 6V10M14 6V10" stroke="#1E293B" stroke-width="1.8" stroke-linecap="round"/>
      <rect x="9" y="16" width="4" height="3" rx="1" fill="#44A7FC"/>
      <path d="M17 19C21 19 23 16 23 13V10" stroke="#1E293B" stroke-width="1.8" stroke-linecap="round"/>
      <rect x="21" y="5" width="4" height="5" rx="1.5" fill="#44A7FC" stroke="#1E293B" stroke-width="1.5"/>
      <line x1="23" y1="3" x2="23" y2="5" stroke="#1E293B" stroke-width="1.5" stroke-linecap="round"/>
    </svg>`,
  },

  // ১১. টয়েস (Toys / Gadget Toys) — রেট্রো হ্যান্ডহেল্ড পোর্টেবল গেম বয়
  {
    id: 'toys',
    name: 'টয়েস',
    icon: `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="7" y="5" width="18" height="22" rx="4" fill="#E0F2FE" stroke="#1E293B" stroke-width="1.8"/>
      <rect x="10" y="8" width="12" height="8" rx="2" fill="#FFFFFF" stroke="#1E293B" stroke-width="1.6"/>
      <path d="M10 20H14M12 18V22" stroke="#1E293B" stroke-width="1.8" stroke-linecap="round"/>
      <circle cx="19" cy="21" r="1.5" fill="#44A7FC" stroke="#1E293B" stroke-width="1.2"/>
      <circle cx="22" cy="19" r="1.5" fill="#44A7FC" stroke="#1E293B" stroke-width="1.2"/>
    </svg>`,
  },

  // ১২. এক্সেসরিজ (Accessories) — প্রিমিয়াম স্মার্টওয়াচ ও সিলিকন স্ট্র্যাপ
  {
    id: 'accessories',
    name: 'এক্সেসরিজ',
    icon: `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M11 7V4H21V7M11 25V28H21V25" stroke="#1E293B" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
      <rect x="8" y="7" width="16" height="18" rx="5" fill="#E0F2FE" stroke="#1E293B" stroke-width="1.8"/>
      <circle cx="16" cy="16" r="4.5" fill="#FFFFFF" stroke="#1E293B" stroke-width="1.4"/>
      <path d="M16 13.5V16L18 17" stroke="#44A7FC" stroke-width="1.4" stroke-linecap="round"/>
      <circle cx="24.5" cy="14" r="1" fill="#44A7FC"/>
    </svg>`,
  },

  // ১৩. নেকব্যান্ড (Neckband) — আরগোনোমিক কলার ও ম্যাগনেটিক হেডসেট
  {
    id: 'neckband',
    name: 'নেকব্যান্ড',
    icon: `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M7 16C7 10 11 6 16 6C21 6 25 10 25 16V20M7 16V20" stroke="#1E293B" stroke-width="1.8" stroke-linecap="round"/>
      <rect x="5.5" y="19" width="3.5" height="7" rx="1.75" fill="#44A7FC" stroke="#1E293B" stroke-width="1.5"/>
      <rect x="23" y="19" width="3.5" height="7" rx="1.75" fill="#44A7FC" stroke="#1E293B" stroke-width="1.5"/>
      <path d="M9 24C12 24 13 22 13 18M23 24C20 24 19 22 19 18" stroke="#1E293B" stroke-width="1.4" stroke-linecap="round"/>
      <circle cx="13" cy="18" r="1.5" fill="#44A7FC"/>
      <circle cx="19" cy="18" r="1.5" fill="#44A7FC"/>
    </svg>`,
  },

  // ১৪. কিচেন এক্সেসরিজ (Kitchen Accessories) — পোর্টেবল রিচার্জেবল ব্লেন্ডার
  {
    id: 'kitchen',
    name: 'কিচেন এক্সেসরিজ',
    icon: `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M10 9L11 21H21L22 9" fill="#E0F2FE" stroke="#1E293B" stroke-width="1.8" stroke-linejoin="round"/>
      <rect x="9" y="5" width="14" height="4" rx="2" fill="#FFFFFF" stroke="#1E293B" stroke-width="1.8"/>
      <rect x="10" y="21" width="12" height="6" rx="2.5" fill="#FFFFFF" stroke="#1E293B" stroke-width="1.8"/>
      <circle cx="16" cy="24" r="1.5" fill="#44A7FC"/>
      <path d="M14 13L16 15L18 13" stroke="#44A7FC" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`,
  },

  // ১৫. অফার (Offers / Deals) — ক্রিস্প ডিসকাউন্ট ভাউচার ট্যাগ
  {
    id: 'offers',
    name: 'অফার',
    icon: `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M5 16.5V9C5 7.9 5.9 7 7 7H14.5L26.5 19L19 26.5L5 16.5Z" fill="#E0F2FE" stroke="#1E293B" stroke-width="1.8" stroke-linejoin="round"/>
      <circle cx="10" cy="12" r="2" fill="#FFFFFF" stroke="#1E293B" stroke-width="1.5"/>
      <path d="M15 20.5L20.5 15M16 15.5H16.01M19.5 20H19.51" stroke="#44A7FC" stroke-width="1.8" stroke-linecap="round"/>
    </svg>`,
  },
];
