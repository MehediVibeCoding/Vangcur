import { cookies } from 'next/headers';
import type { Language } from '@/lib/store/languageStore';

export const LANG_COOKIE = 'vc_lang';

/**
 * Reads the user's language preference on the SERVER, from the `vc_lang`
 * cookie (written client-side by `useLanguageStore` whenever the person
 * toggles the language — see lib/store/languageStore.ts).
 *
 * Used in `generateMetadata()` and the root layout so that page titles,
 * descriptions, and `<html lang>` are correct even before any client-side
 * JavaScript runs (important for SEO crawlers and social-share previews).
 *
 * Calling this opts the route into dynamic rendering, which is expected —
 * this app already personalizes nearly every page (auth, cart, wishlist).
 */
export async function getServerLang(): Promise<Language> {
  const store = await cookies();
  return store.get(LANG_COOKIE)?.value === 'en' ? 'en' : 'bn';
}

/** Small helper for building a bn/en pair inline in metadata exports. */
export function pickLang<T>(lang: Language, bn: T, en: T): T {
  return lang === 'en' ? en : bn;
}
