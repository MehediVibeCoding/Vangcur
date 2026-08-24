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

// Cookie mirror of the language preference. localStorage alone can't be
// read by server components/route handlers (title tags, <html lang>,
// generateMetadata, etc.), so we also mirror the choice into a cookie —
// this is what lib/i18n/serverLang.ts reads on the server.
function persistCookie(lang: Language): void {
  try {
    document.cookie = `${LANG_KEY}=${lang}; path=/; max-age=31536000; samesite=lax`;
  } catch {
    // cookies unavailable, ignore
  }
}

function persist(lang: Language): void {
  try {
    localStorage.setItem(LANG_KEY, lang);
  } catch {
    // storage unavailable, ignore
  }
  persistCookie(lang);
}

interface LanguageState {
  lang: Language;
  setLanguage: (lang: Language) => void;
}

const initialLang = loadLanguage();
if (typeof window !== 'undefined') {
  // Keep the cookie in sync even for returning visitors who already had a
  // localStorage preference from before the cookie mirror existed.
  persistCookie(initialLang);
}

export const useLanguageStore = create<LanguageState>((set) => ({
  lang: initialLang,
  setLanguage: (lang) => {
    persist(lang);
    set({ lang });
  },
}));
