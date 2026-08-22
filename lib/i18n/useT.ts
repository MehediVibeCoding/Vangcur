'use client';

import { useLanguageStore } from '@/lib/store/languageStore';
import { staticDictionary } from './dictionary';

export function useT() {
  const lang = useLanguageStore((s) => s.lang);

  const t = (text: string): string => {
    if (lang !== 'en') return text;
    return staticDictionary[text] ?? text;
  };

  return { lang, t };
}
