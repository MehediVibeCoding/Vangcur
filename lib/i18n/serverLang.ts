import { cookies } from 'next/headers';
import { translate, type DictLanguage } from './dictionary';

const LANG_KEY = 'vc_lang';

/**
 * Reads the user's language preference on the server (from the `vc_lang`
 * cookie mirrored by lib/store/languageStore.ts). Use this in
 * `generateMetadata()` and other Server Components so <title>, meta
 * descriptions, OpenGraph tags, and <html lang> can react to the same
 * language toggle used on the client — the client-only localStorage value
 * is invisible to the server, so this cookie is the bridge.
 *
 * Defaults to 'bn' (the site's default language) when no cookie is set,
 * matching lib/store/languageStore.ts's client-side default.
 */
export async function getServerLang(): Promise<DictLanguage> {
  const store = await cookies();
  return store.get(LANG_KEY)?.value === 'en' ? 'en' : 'bn';
}

/** Server-side counterpart to useT()'s `t()` — resolves the language from
 * the cookie itself, so callers don't need to thread `lang` through. */
export async function serverT(text: string): Promise<string> {
  const lang = await getServerLang();
  return translate(text, lang);
}
