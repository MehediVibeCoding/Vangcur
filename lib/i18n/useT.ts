'use client';

import { useLanguageStore } from '@/lib/store/languageStore';
import { translate } from './dictionary';

export function useT() {
  const lang = useLanguageStore((s) => s.lang);

  const t = (text: string): string => translate(text, lang);

  return { lang, t };
}
