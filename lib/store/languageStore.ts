import { create } from 'zustand';

export type Language = 'bn' | 'en';

const LANG_KEY = 'vc_lang';

// 🔒 ফিক্স (audit P1-17, hydration #418 সন্দেহ): আগে এখানে localStorage থেকে
// ভাষা পড়া হতো — কিন্তু সার্ভার (generateMetadata/layout, দ্রষ্টব্য:
// lib/i18n/getServerLang.ts) ভাষা ঠিক করে `vc_lang` কুকি থেকে, localStorage
// থেকে না। localStorage আর কুকি আলাদা হয়ে গেলে (browser storage-clear
// আচরণ ভিন্ন, বা প্রথমবার সেট হওয়ার টাইমিং) ক্লায়েন্টের প্রথম রেন্ডার সার্ভারের
// সাথে না মিলে হাইড্রেশন এরর দিত। এখন ক্লায়েন্টও ঠিক একই কুকি পড়ে — সার্ভার
// যা রেন্ডার করেছে, ক্লায়েন্টের প্রথম পাসও ঠিক সেটাই পড়বে, mismatch হবে না।
function loadLanguage(): Language {
  if (typeof document === 'undefined') return 'bn';
  try {
    const match = document.cookie.match(/(?:^|;\s*)vc_lang=([^;]*)/);
    return match && decodeURIComponent(match[1]) === 'en' ? 'en' : 'bn';
  } catch {
    return 'bn';
  }
}

function persist(lang: Language): void {
  try {
    localStorage.setItem(LANG_KEY, lang);
  } catch {
    // storage unavailable, ignore
  }
  try {
    // Mirrored into a cookie (1 year) so server components / generateMetadata
    // can read the same preference via lib/i18n/getServerLang.ts — the
    // page title, meta description, and <html lang> need this on the very
    // first server-rendered response, before any client JS has run.
    document.cookie = `${LANG_KEY}=${lang}; path=/; max-age=31536000; samesite=lax`;
  } catch {
    // cookies unavailable, ignore — client-side language switching still works
  }
}

interface LanguageState {
  lang: Language;
  setLanguage: (lang: Language) => void;
}

export const useLanguageStore = create<LanguageState>((set) => ({
  lang: loadLanguage(),
  setLanguage: (lang) => {
    persist(lang);
    set({ lang });
  },
}));
