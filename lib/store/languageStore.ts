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
