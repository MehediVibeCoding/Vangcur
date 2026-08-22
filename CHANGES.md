# Phase G — i18n (English toggle) — Session Update (continued)

## Scope reminder (unchanged from original plan)
- Bengali stays exactly as the site is now (mixed Bengali/English) — no changes needed for `lang: 'bn'`.
- Only building the English (`lang: 'en'`) version: `t('বাংলা টেক্সট')` returns the English translation from
  `lib/i18n/dictionary.ts` when `lang === 'en'`, otherwise returns the original text unchanged.
- Core infra (`lib/store/languageStore.ts`, `lib/i18n/useT.ts`, `lib/i18n/dictionary.ts`) unchanged in shape —
  this session only added new dictionary entries and wrapped the two remaining files.

## Files in this delivery (upload these to GitHub, replacing the existing ones at the same paths)

Infra:
- `lib/store/languageStore.ts`
- `lib/i18n/useT.ts`
- `lib/i18n/dictionary.ts` — now has ~180 entries

All component files from the previous delivery (unchanged since then, included again in case not yet
uploaded) — see the full list in the previous CHANGES.md / NEXT_CHAT_PROMPT.md.

Done in **this** session:
- `app/components/cart/TrackOrderModal.tsx` — labels, placeholders, loading/track button text, cancelled/rejected
  status messages, all 4 order-lookup error strings (`lib/orderStatus.ts`'s `lookupOrderByNumberAndPhone` runs
  client-side, so unlike `checkout.ts` its returned error strings CAN be translated — wrapped with `t()` at the
  render site rather than at `setErr()`, so the raw Bengali string stays in state and is translated on display),
  and the `ORDER_TRACK_STEPS` step labels (wrapped with `t(step.label)` at the render site — the labels
  themselves live in `lib/orderStatus.ts` and were not edited there).
- `app/components/modals/InvoiceModal.tsx` — header, print button, loading/not-found states, subtotal/shipping/
  total/due-amount/delivery-address labels, and the status badge.

Verified after every file: `npx tsc --noEmit` across the whole project — zero errors. Full `next build` also run
this session (temporary dummy Supabase/Turnstile env vars + a stubbed `app/fonts.ts` to bypass the sandbox's
network restriction on Google Fonts, both reverted immediately after) — production build succeeded, all routes
compiled, `/` still registers as `ƒ Dynamic`.

## Pattern notes for whoever continues this (unchanged, still apply)

1. **Simple static string** → `{t('বাংলা টেক্সট')}`, add the exact same string as a dictionary key.
2. **Text with an interpolated value where word order differs between languages** → use `lang` from `useT()`
   directly with a ternary, don't force it through the dictionary.
3. **A placeholder in the same relative position** in both languages can go through the dictionary with a literal
   placeholder and `.replace()` afterward.
4. **Loop variable name collisions** with the `t` from `useT()` — rename the loop variable, not the hook's `t`.
5. **Data-level bilingual fields** — check the relevant `lib/*Data.ts` file before writing a dictionary entry.
6. Always `npx tsc --noEmit` after each file, watch for **duplicate dictionary keys** (TS1117).

### New pattern note from this session

7. **The same Bengali word can mean different things in different UI roles**, and the dictionary is a single flat
   map keyed by the Bengali string — so it can't hold two different translations for one exact string. This
   happened with `'বাতিল'`: already mapped to `'Cancel'` (a button label, from `StockNotifyModal`), but
   `InvoiceModal`'s `STATUS_LABEL.cancelled` also uses the bare word `'বাতিল'` to mean the *status* "Cancelled" —
   a different English word for the identical Bengali key. Forcing this through `t('বাতিল')` would have wrongly
   shown "Cancel" as an order status. Fixed by bypassing the dictionary for just that one case and using
   `lang === 'en' ? 'Cancelled' : STATUS_LABEL.cancelled` directly (same escape hatch as pattern #2, applied here
   because of a key collision rather than word order). If this happens again: keep using the dictionary for
   every value that doesn't collide, and only hand-roll the one that does — don't add a second flat dictionary
   or a namespaced key scheme just for one exception.
8. `lookupOrderByNumberAndPhone` (`lib/orderStatus.ts`) is an ordinary client-side function (takes a
   `SupabaseClient` directly), **not** a Server Action — so its returned error strings are fully translatable via
   `t()`, unlike `app/actions/checkout.ts` (see the unresolved item below). Don't assume every `lib/*.ts` helper
   is server-only; check whether it's actually called from a Server Action file before deciding a returned string
   is untranslatable.

## `app/actions/checkout.ts` — also done this session (owner said do it now)

Owner decided: yes, translate checkout's Server Action error messages now.

- `staticDictionary` (from `lib/i18n/dictionary.ts`) turned out to be plain data — no `'use client'`, no Zustand,
  no import that would be unsafe in a `'use server'` file — so it's imported directly into `checkout.ts` rather
  than duplicating it into a separate "server-safe dictionary" file (the duplication the original handoff note
  speculated might be needed wasn't actually necessary).
- `OrderPayload` (`types/index.ts`) gained an optional `lang?: 'bn' | 'en'` field.
- `app/checkout/page.tsx` now passes `lang` (already destructured from `useT()` there) in the `createOrder(...)`
  call.
- `createOrder()` derives `lang` from `payload.lang` (defaults to `'bn'` if missing/invalid, so old clients that
  don't send it still work), and a local `t()` closure (plain `staticDictionary[text] ?? text` lookup, not the
  hook) wraps every `fail(...)` call's message — all ~19 validation/rate-limit/stock/insert error strings.
- All newly-needed error strings added to `lib/i18n/dictionary.ts` (2 were already there from the client-side
  fallback in `checkout/page.tsx`, reused as-is rather than duplicated).
- `npx tsc --noEmit` (whole project) and a full `next build` both verified clean after this change (same
  temporary env/font stub approach, reverted after).

## What's NOT done yet

- Legal/policy content (large, substantive Bengali text — a scope decision, not just wrapping):
  - `app/terms/page.tsx`
  - `app/privacy-policy/page.tsx`
  - `app/refund-policy/page.tsx`
  - `app/components/checkout/PolicyModal.tsx`
  - `lib/warrantyData.ts` (the actual policy title/body/rules content, used by `WarrantyModal.tsx`)
  - `app/components/checkout/PostOrderInfoModal.tsx` (verbatim legacy section-27 content)
  - Owner deferred this decision (2026-08-22): not translating for now, revisit later — don't start on these
    without owner's go-ahead.

With the checkout Server Action now translated too, Phase G's i18n coverage is complete across every
component/modal/flow except the legal/policy content above, which is intentionally on hold pending the owner's
decision.
