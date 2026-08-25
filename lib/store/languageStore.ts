import { create } from 'zustand';

export type Language = 'bn' | 'en';

const LANG_KEY = 'vc_lang';

function loadLanguage(): Language {
  if (typeof window === 'undefined') return 'bn';
  try {
    return localStorage.getItem(LANG_KEY) === 'en' ? 'en' : 'bn';
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
