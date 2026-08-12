# Vangcur-Next — Phase 2 Master Roadmap
## (TypeScript + Tailwind + RSC + Security Hardening — Full Rewrite)

(নতুন Claude চ্যাটে এই পুরো ফাইলটা paste করো)

---

## প্রেক্ষাপট

Phase 1 migration (vanilla JS/HTML → Next.js JS) সম্পন্ন হয়েছে এবং কাজ করছে।
এখন Phase 2 শুরু হচ্ছে — Google AI Studio (Gemini)-এর দেওয়া একটা "Master Blueprint" অনুযায়ী প্রজেক্টকে আরও production-grade করা হবে।

- **নতুন GitHub রেপো:** https://github.com/MehediVibeCoding/Vangcur (Private)
- **নতুন Vercel project:** vangcurweb — Live URL: https://vangcurweb.vercel.app
- **নতুন Supabase:** fresh project তৈরি, Vercel-এর সাথে integrated, `NEXT_PUBLIC_SUPABASE_URL` ও `NEXT_PUBLIC_SUPABASE_ANON_KEY` Vercel-এ automatic set হয়ে গেছে (মালিক নিজে confirm করেছে)
- **Google OAuth:** Supabase Auth-এ Google provider configured (Client ID/Secret সহ)
- **⚠️ Security — Service Role Key কখনো GitHub-এ commit হবে না**, শুধু Vercel Environment Variables-এ থাকবে। Anon key public থাকা normal (RLS security দেয়), কিন্তু service_role key leak হলে critical।
- **প্রজেক্ট এখনো live না** — vangcur.com এ deploy হয়নি, তাই experiment করার ঝুঁকি কম
- **Database schema strategy** — migration চলাকালীন বার বার edit না করে, Phase D (Security)-এর প্রয়োজন (stock RPC, bKash txn unique constraint, fingerprint_id column, RLS policies) মাথায় রেখে **শুরুতেই একবারে সম্পূর্ণ schema** design করে SQL script দিয়ে একবারে বসানো হবে
- **মালিকের সিদ্ধান্ত:** Blueprint-এর সবকিছু করা হবে, ১টা exception বাদে

## বাদ দেওয়া হয়েছে (এবং কেন)

❌ **DevTools blocking (F12/Ctrl+U disable)** — এটা trivially bypass করা যায় (browser menu দিয়ে devtools খোলা যায়), legitimate user বিরক্ত হয়, প্রকৃত security কিছুই দেয় না। Blueprint-এর এই অংশ **implement করা হবে না।**

বাকি সবকিছু blueprint অনুযায়ী হবে — TypeScript, Tailwind, RSC, Zustand, i18n, dark mode, AI chatbot, anti-spam, SEO, ইত্যাদি।

---

## Privacy & Key Rule (কঠোরভাবে মানতে হবে)

- পুরনো Supabase project-এর কোনো URL/anon key/service_role key **কখনো নতুন প্রজেক্টে reuse/copy করা যাবে না** — নতুন Supabase project মানে সম্পূর্ণ নতুন key, আলাদা credential
- পুরনো কোনো `.env` ফাইল, API key, secret কোনো ফাইলে **আবার লেখা/paste করা যাবে না**, এমনকি reference হিসেবেও না
- Claude কখনো কোনো actual key/secret চ্যাটে চাইবে না বা দেখাবে না — শুধু ফাঁকা `process.env.VARIABLE_NAME` reference কোডে থাকবে
- সব secret শুধু Vercel Environment Variables-এ (মালিক নিজে বসাবে), কখনো GitHub-এ commit না
- `.gitignore` প্রথম ফাইল হিসেবে থাকতে হবে যাতে `.env*` কখনো ভুলে commit না হয়ে যায়

---

- কোনো ফাইলে migration/phase-history নিয়ে comment লেখা যাবে না — যেমন "Phase D-তে ব্যবহার হবে", "Legacy-তে এটা ছিল", "audit fix", "pixel-sample করা হয়েছে" — এই ধরনের **কোনো narration নেই**
- কোড শুধু **কী করে** সেটা বলবে (প্রয়োজনে), **কেন/কবে লেখা হয়েছে** তার ইতিহাস না
- Dead code, commented-out পুরনো code block, অপ্রয়োজনীয় ফাঁকা লাইন/space থাকবে না
- প্রতিটা ফাইল এমনভাবে লেখা হবে যেন এটা প্রথম থেকেই এভাবে লেখা হয়েছিল — migration-এর কোনো চিহ্ন থাকবে না
- Master roadmap/PROGRESS.md-এ migration history থাকবে (এটা ঠিক আছে, এটা তো ট্র্যাকিং ফাইল) — কিন্তু **actual app code-এ কখনো না**

---

**পুরনো repo (`vangcur-next`) delete হচ্ছে না — এটা reference/source হিসেবে থেকে যাবে।** নতুন repo (`vangcurweb`) আলাদা, fresh।

Claude প্রতিটা ফাইল দেওয়ার সময় স্পষ্ট করে বলবে:
- **[NEW FILE]** — নতুন repo-তে GitHub "Create new file" দিয়ে exact path সহ বানাতে হবে (আগে ছিল না)
- **[REPLACE]** — পুরনো repo-তে একই নামে ফাইল ছিল, কিন্তু এখন **নতুন repo-তে নতুন করে বসাতে হবে** (পুরনো repo থেকে copy-paste করার দরকার নেই — Claude সবসময় fresh, updated content দেবে)

মালিক কখনো পুরনো repo থেকে সরাসরি কোনো ফাইল copy করে নতুনটায় বসাবে না — কারণ পুরনো ফাইলে exposed key থাকার ঝুঁকি ছিল, আর Phase 2-এ প্রায় সব ফাইলই (TS+Tailwind conversion) পরিবর্তিত হবে। প্রতিটা ফাইল Claude নতুন করে বানিয়ে দেবে, exact path বলে দেবে।

---

TypeScript আর Tailwind conversion **একসাথে, ফাইল-ধরে-ধরে** করা হবে — প্রতিটা component একবারে TS+Tailwind দুটোই পাবে। এতে প্রতিটা ফাইল দুইবার touch করতে হবে না।

---

## PHASE A — Foundation (একবারই করতে হবে)

1. `tsconfig.json` setup
2. `types/index.ts` — central type definitions (Product, OrderPayload, ActionResponse ইত্যাদি)
3. Tailwind install + config (`tailwind.config.ts`, `postcss.config.js`)
4. `DESIGN_SYSTEM.md` তৈরি — **ব্র্যান্ড কালার পরিবর্তন হয়েছে: লাল থেকে নীল (স্থায়ী, website সহ পুরো ব্র্যান্ডে)।**

   Logo থেকে সরাসরি pixel-sample করে পাওয়া exact color, প্রতিটার role সহ (মালিকের নির্দেশনা অনুযায়ী):

   | Role | Hex | ব্যবহার |
   |------|-----|---------|
   | **Main/Background** (fresh light sky blue) | `#C3DEFC` | পুরো সাইটের base background color — এটাই primary, লাল যেমন আগে সব জায়গায় base ছিল |
   | **Contrast/Accent** (wordmark blue) | `#0058C7` | Button, link, heading, যেখানে emphasis/contrast দরকার — আগে যেখানে `--red` ব্যবহার হতো |
   | **Secondary accent** ("gadgets" script blue) | `#005EFC` | Selective highlight — badge, hover state, ছোট accent touch (কম ব্যবহার হবে, বেশি জায়গায় না) |

   এই ৩টা ভিত্তি করে Tailwind config-এ color scale বানানো হবে। globals.css-এর `--cream`/`--white` background base color-টা light sky blue (`#C3DEFC`)-এর tint দিয়ে replace হবে, আর `--red`/`--red2`/`--hover`/`--hover2` wordmark blue (`#0058C7`) দিয়ে। বাকি token (spacing, typography, radius) legacy CSS থেকেই exact নেওয়া হবে — শুধু color scheme বদলাচ্ছে, layout/spacing না।

   **নোট:** Logo-টা gradient effect (3D look), তাই এই hex value logo-র mid-tone থেকে sample করা approximation। যদি designer থেকে exact canonical hex পাওয়া যায় ভবিষ্যতে, সেটা দিয়ে replace করা যাবে।
5. `@supabase/ssr` install + httpOnly cookie setup
6. `lib/security.ts` — sanitizeInput, validatePhone, validateName, validateAddress functions

## PHASE A.1 — মালিকের External Setup Checklist

কোডিং শুরুর আগে/চলাকালীন এই account গুলো ফ্রিতে সেটআপ করতে হবে (মালিকের কাজ):

1. **Cloudflare CDN** — vangcur.com domain যোগ করা, SSL "Full (strict)" অন করা
2. **Telegram Bot** — `@BotFather` দিয়ে bot বানিয়ে `TELEGRAM_BOT_TOKEN`, `@userinfobot` দিয়ে `TELEGRAM_CHAT_ID` নেওয়া
3. **Google Gemini API Key** — aistudio.google.com থেকে
4. **Tawk.to** — ফ্রি account, Property ID + Widget ID, মোবাইল app install
5. **UptimeRobot** — 5-minute monitor + Telegram alert connect
6. **Supabase SQL RPCs** — 3টা SQL command run করা (stock decrement RPC, fingerprint_id column, bKash txn unique lock) — Claude script দেবে, মালিক Supabase SQL Editor-এ paste করবে
7. **Vercel Environment Variables** — নতুন key যোগ: `SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, `NEXT_PUBLIC_TAWK_PROPERTY_ID`, `NEXT_PUBLIC_TAWK_WIDGET_ID`, `NEXT_PUBLIC_GTM_ID`
8. **Google Tag Manager** — Container ID নেওয়া
9. **DBID Registration** — dbid.gov.bd (ব্যবসায়িক, কোডের সাথে সম্পর্কহীন কিন্তু ভালো practice)
10. **প্যাকেজিং স্টিকার** — "আনবক্সিং ভিডিও বাধ্যতামূলক" স্টিকার প্রিন্ট (physical, কোড না)

## PHASE A.2 — নতুন Supabase Database Schema (একবারে সম্পূর্ণ)

**কে করবে:** Claude সম্পূর্ণ SQL script বানাবে, মালিক Supabase SQL Editor-এ একবারে run করবে।

Migration চলাকালীন বার বার schema edit না করে, শুরুতেই সম্পূর্ণ final structure বসানো হবে:
- Core table গুলো (products, orders, customers, store_settings, ইত্যাদি — পুরানো structure রেফারেন্স করে)
- Phase D-এর security প্রয়োজন থেকে আগেভাগে যোগ: `fingerprint_id` column, bKash TxnID-তে UNIQUE constraint, `decrement_product_stock` RPC function
- RLS policies শুরু থেকেই সঠিকভাবে সেট (পরে patch করা লাগবে না)
- Index/foreign key সব একবারে

**মালিকের কাজ:**
- নতুন Supabase project তৈরি করা
- Claude-এর দেওয়া SQL script Supabase SQL Editor-এ paste করে run করা
- নতুন URL/anon key/service_role key নিরাপদে রাখা (GitHub-এ কখনো না)

## PHASE B — Component-by-Component TS+Tailwind Conversion

প্রতিটা component ফাইল একবারে দুটো কাজ করে convert হবে:
1. `.js` → `.tsx`, proper types যোগ
2. Inline `style={{}}` / CSS class → Tailwind utility class (exact legacy visual output বজায় রেখে, DESIGN_SYSTEM.md রেফারেন্স করে)

**ক্রম (আগে যেভাবে করেছিলাম সেই priority অনুসরণ করে):**
- Layout (Navbar, Footer)
- Home sections (HeroSlider, Categories, ProductGrid, FAQ, About, CustomerGallery)
- Product detail
- Cart/Wishlist drawers
- Auth (LoginModal, AccountPage)
- Checkout flow (OrderForm/checkout page, WaitingPage, ইত্যাদি)
- বাকি সব modal

**প্রতিটা component convert করার পর:**
- `npm run build` — TypeScript error check
- Visual diff — Tailwind conversion-এর পর সাইটে legacy-র মতোই দেখাচ্ছে কিনা verify

## PHASE C — State Management Migration

- `window.dispatchEvent` custom event system → Zustand store-এ migrate
- Cart, Wishlist, Auth state → Zustand store
- একটা একটা করে event সরিয়ে Zustand-এ নেওয়া, প্রতিবার build+test

## PHASE D — Server Actions & Security

1. `app/actions/checkout.ts` — Server Action দিয়ে order creation, price/stock DB verification
2. `decrement_product_stock` Postgres RPC function (Supabase-এ বানাতে হবে)
3. Input sanitization + regex validation সব form-এ
4. Rate limiting — phone (5/day) + fingerprint
5. `@fingerprintjs/fingerprintjs` install + integrate
6. Cloudflare Turnstile setup
7. bKash TxnID-তে Supabase-এ UNIQUE constraint (SQL migration)
8. `lib/authData.js`-এর multi-account switching feature সম্পূর্ণ অপসারণ

## PHASE E — RSC Conversion

- `app/page.tsx`, `app/product/[slug]/page.tsx`, `app/category/[slug]/page.tsx` — Server Component-এ convert
- Client Component শুধু leaf-level interactive element-এ (button, input, modal)

## PHASE F — Routing Restructure

Blueprint-এর route structure অনুযায়ী:
```
app/category/[slug]/page.tsx
app/search/page.tsx (client URL-synced, debounced)
app/checkout/success/page.tsx (protected)
app/account/orders/page.tsx
app/track-order/page.tsx
app/(policies)/privacy-policy/page.tsx   ← আগে modal ছিল, এখন real route (SEO + crawlable)
app/(policies)/terms/page.tsx
app/(policies)/refund-policy/page.tsx
```

**Cart Guard** — `/checkout`-এ cart খালি থাকলে `router.replace('/')` দিয়ে auto-redirect (সরাসরি URL দিয়ে খালি checkout-এ ঢোকা আটকানো)।

## PHASE G — i18n & Dark Mode

- `LanguageContext` setup (bn/en)
- Price সবসময় English digit-এ রেন্ডার (`formatPrice` function)
- `next-themes` দিয়ে dark mode

## PHASE H — Advanced Integrations

1. `app/api/chat/route.ts` — Gemini 1.5 Flash chatbot (account page-এ)
2. Tawk.to live chat widget
3. `lib/telegram.ts` — instant order notification
4. UptimeRobot setup (মালিক নিজে করবে, কোড লাগবে না)

## PHASE I — SEO & Machine-Readable Files

1. GTM integration (`@next/third-parties/google`) — view_item, add_to_cart, begin_checkout, purchase events
2. `app/robots.ts`, `app/sitemap.ts`
3. `public/llms.txt`
4. JSON-LD schema প্রোডাক্ট পেজে

## PHASE J — Anti-Tampering (DevTools blocking বাদে)

1. Image drag/select block CSS
2. Image right-click context menu block
3. (DevTools shortcut block — **বাদ**, কারণ উপরে বলা হয়েছে)

## PHASE L — Infrastructure & Scaling (Documentation — future consideration)

এখন implement করার দরকার নেই (traffic কম, pre-launch), কিন্তু ভবিষ্যতের জন্য নোট রাখা:
- Cloudflare CDN — bandwidth + DDoS protection (ফ্রি)
- Next.js ISR — product page-এ `export const revalidate = 60;` (Phase 1-এই homepage-এ আছে)
- Supabase Pro Plan ($25/mo) — ভবিষ্যতে traffic বাড়লে connection pooling দরকার হতে পারে, এখন না
- Cloudinary — ইতিমধ্যে ব্যবহার হচ্ছে

## PHASE M — Documentation

1. `ARCHITECTURE.md`
2. `DESIGN_SYSTEM.md` (Phase A-তেই শুরু হবে, এখানে finalize)
3. `MIGRATION_NOTES.md`

---

## প্রতিটা session-এ Claude-এর কাজের নিয়ম

1. এই roadmap পড়ো, GitHub রেপো clone করো
2. এই ফাইলের নিচে থাকা Progress Tracker দেখো — কোন Phase/অংশ শেষ হয়েছে
3. পরবর্তী অসম্পূর্ণ অংশ ধরে কাজ করো
4. প্রতিটা component convert করার পর অবশ্যই sandbox-এ build test করো
5. Legacy visual output-এর সাথে Tailwind conversion মিলিয়ে দেখা — অনুমান না করে DESIGN_SYSTEM.md-এর exact value ব্যবহার করা
6. কাজ শেষে এই ফাইলের Progress Tracker আপডেট করে দেওয়া

---

## Progress Tracker

| Phase | কাজ | অবস্থা |
|-------|-----|--------|
| A | Foundation (tsconfig, Tailwind config, types, DESIGN_SYSTEM.md — blue brand, ssr cookies) | ✅ সম্পূর্ণ |
| A.1 | মালিকের External Setup Checklist (Cloudflare, Telegram, Gemini key, Tawk.to, ইত্যাদি) | 🟡 আংশিক — GitHub/Vercel/Supabase/Google OAuth ✅, বাকিগুলো ⏳ |
| A.2 | নতুন Supabase Database — সম্পূর্ণ schema একবারে | ✅ SQL script দেওয়া হয়েছে, মালিক run করছে |

### Phase A বিস্তারিত status (২০২৬-০৮-০৩ পর্যন্ত)

**✅ সম্পূর্ণ (GitHub-এ upload হয়ে গেছে, build successful):**
- `.gitignore`
- `tsconfig.json`
- `tailwind.config.ts` (নীল brand color সহ, clean code)
- `postcss.config.js`
- `types/index.ts`
- `lib/security.ts`
- `DESIGN_SYSTEM.md`
- `database-setup.sql` (Supabase-এ সরাসরি run করা হয়েছে/হচ্ছে, GitHub-এ যাবে না)
- `package.json`, `next.config.js`
- `@supabase/ssr` setup + `lib/supabase/client.ts` (httpOnly cookie logic) — Navbar/Footer এটা ব্যবহার করছে
- Vercel-এ প্রথম build test — ✅ successful

| B | Component TS+Tailwind conversion | ✅ সম্পূর্ণ — নিচে বিস্তারিত |
### Phase B বিস্তারিত status (২০২৬-০৮-০৬ পর্যন্ত — GitHub repo সরাসরি audit করে যাচাই করা)

**ক্রম অনুযায়ী অগ্রগতি:**

**✅ Layout — সম্পূর্ণ:**
- `app/components/layout/Navbar.tsx`, `app/components/layout/Footer.tsx`

**✅ Home sections — সম্পূর্ণ:**
- `HeroSlider.tsx`, `Categories.tsx`, `ProductGrid.tsx`, `ProductCard.tsx`, `FAQ.tsx`, `About.tsx`, `CustomerGallery.tsx`, `TrustStrip.tsx`
- সাপোর্টিং lib: `searchData.ts`, `categoryData.ts`, `uiEvents.ts`, `logger.ts`, `cartData.ts`, `toast.ts`, `productData.ts`, `footerData.ts`, `faqData.ts`

**✅ Product detail page — সম্পূর্ণ:**
- `app/product/[slug]/page.tsx`, `app/product/[slug]/ProductDetailClient.tsx`, `lib/productDetailData.ts`

**✅ Cart/Wishlist drawers — সম্পূর্ণ:**
- `CartSidebar.tsx`, `WishlistDrawer.tsx`, `FloatCartBadge.tsx`, `FloatWishBadge.tsx`, `TrackOrderModal.tsx`
- `app/components/GlobalOverlays.tsx`-এ সব মাউন্ট করা আছে, `layout.tsx`-এ `<GlobalOverlays />` মাউন্ট করা আছে (আগের একটা bug ছিল, ঠিক হয়ে গেছে)

**✅ Global floating buttons (WhatsApp, Messenger, Back-to-top, persistent Wishlist) — এই session-এ সম্পূর্ণ করা হলো, `tsc --noEmit` clean:**
- `app/components/layout/FloatContactButtons.tsx` — **[NEW FILE]** — bottom-left, WhatsApp (নিচে) + Messenger (উপরে, `bottom-[86px]`), `lib/floatButtonsData.ts`-এর আগে থেকে বানানো কিন্তু কোথাও ব্যবহার না-হওয়া `computeWaLink`/`computeMsgLink`/`fetchContactSettings`/`subscribeContactSettings` এখন এখানে কাজে লাগছে
- `app/components/layout/BackToTopButton.tsx` — **[NEW FILE]** — bottom-right, cart badge-এর ঠিক উপরে (`bottom-[86px] right-5`), ৪০০px স্ক্রল করার পর দেখা যায়
- `app/components/cart/FloatWishBadge.tsx` — **[REPLACE]** — আগে শুধু wishlist-এ item যোগ করলে ৩ সেকেন্ডের toast হিসেবে দেখাত; এখন `FloatCartBadge`-এর মতোই persistent (wishlist-এ item থাকলে সবসময় দেখা যায়, count badge সহ), item যোগ হলে heartbeat animation চলে
- `app/components/GlobalOverlays.tsx` — **[REPLACE]** — উপরের দুটো নতুন component মাউন্ট করা হয়েছে, checkout পেজে cart/wishlist badge-এর মতোই hide হয়
- **পজিশন রুল:** ডান পাশে আগে থেকে established rhythm (`right-5` cart, `right-[86px]` wishlist — ৫৬px বাটনের মাঝে ১০px গ্যাপ) সেটাই back-to-top-এর জন্য bottom-অ্যাক্সিসে (`bottom-[86px]`) এবং contact বাটনের জন্য বাম পাশে reuse করা হয়েছে — নতুন কোনো spacing scale বানানো হয়নি
- **কালার রুল:** WhatsApp (`#25D366`) ও Messenger (`#0084FF`) নিজেদের অফিসিয়াল ব্র্যান্ড কালারেই রাখা হয়েছে — কারণ এই একই repo-র `ProductDetailClient.tsx`-এ (Phase B-তে আগেই ✅ সম্পূর্ণ হওয়া কোড) ঠিক এই একই hex value দিয়ে WhatsApp/Messenger অর্ডার বাটন আগে থেকেই আছে, তাই এটাই এই repo-র established precedent — প্ল্যাটফর্মের নিজস্ব রঙ বদলালে বরং inconsistency তৈরি হতো। যা কিছু সম্পূর্ণ আমাদের নিজস্ব (back-to-top, wishlist badge) সেগুলো `brand-primary`/সাদা/`shadow-sh3`/`rounded-full` টোকেন দিয়েই বানানো হয়েছে
- ⚠️ **নোট:** পুরনো `vangcur-next` repo প্রাইভেট হওয়ায় (auth ছাড়া clone করা যায়নি) legacy Phase-1 সাইটের exact পজিশন সরাসরি verify করা যায়নি — উপরের পজিশন/কালার সিদ্ধান্ত এই repo-র নিজস্ব established convention (cart/wishlist spacing rhythm + product-page WA/Messenger কালার) থেকে reconstruct করা

**✅ Auth — সম্পূর্ণ (roadmap-এর তালিকার চেয়ে বেশি করা হয়ে গেছে):**
- `LoginModal.tsx`, `AccountPage.tsx`, `PasswordStrengthMeter.tsx`, `app/reset-password/` (page + client)
- Phase D-এর কিছু কাজ auth-এর সাথেই আগেভাগে হয়ে গেছে: `TurnstileWidget.tsx`, `lib/turnstile.ts`, `app/api/verify-turnstile/route.ts`, `lib/rateLimit.ts`, `lib/sanitize.ts`, `lib/security.ts` (validation/sanitization + password-reset rate limit + Cloudflare Turnstile ইতিমধ্যে LoginModal-এ ব্যবহার হচ্ছে)

**✅ Checkout flow — সম্পূর্ণ, build-tested (ওয়েটিং/ট্র্যাকিং overlay সহ):**
- `app/checkout/page.tsx` — ৩-ধাপ ফর্ম (তথ্য → bKash পেমেন্ট → নিশ্চিত), guest pre-confirm login flow, Google OAuth return-trip resume, rate-limit + authoritative price re-verification সহ order insert, এবং `lib/draftRecovery.ts`-এর persistent draft থেকে ফর্ম রিস্টোর
- `app/components/checkout/PreConfirmLoginModal.tsx`, `PolicyModal.tsx`
- `app/components/checkout/WaitingOverlay.tsx`, `BgConfirmPopup.tsx`, `PostOrderInfoModal.tsx`, `QuickOrderBridge.tsx` — অর্ডার submit-এর পর realtime approve/reject waiting screen + কনফার্মেশন ফ্লো, `app/components/GlobalOverlays.tsx`-এ মাউন্ট করা (আগের নোটে এগুলো "বাকি" লেখা ছিল, ভুলবশত tracker আপডেট হয়নি — আসলে আগেই তৈরি হয়ে গিয়েছিল)
- `lib/checkoutData.ts` — জেলা লিস্ট, শিপিং লজিক, ভ্যালিডেশন, bKash/শিপিং কনফিগ fetch
- `lib/orderMapping.ts`, `lib/orderStatus.ts` — Supabase row mapping, status poll + realtime subscription
- `lib/draftRecovery.ts`, `lib/leadCapture.ts` — abandoned-checkout draft + Leads sheet capture
- `types/index.ts` — `Order` টাইপে `subtotal`/`shippingCost`/`shipping`/`advancePaid`/`payment` যোগ হয়েছে

**✅ বাকি সব modal — এই session-এ সম্পূর্ণ করা হলো, build-tested:**
- `app/components/modals/MembershipModal.tsx` — `lib/membershipData.ts`-এর tier/crown ডেটা ব্যবহার করে, `OPEN_MEMBERSHIP_EVENT` শোনে
- `app/components/modals/InvoiceModal.tsx` — `lib/orderStatus.ts`-এর `fetchFullOrder` দিয়ে অর্ডার আনে, `GENERATE_INVOICE_EVENT` শোনে, প্রিন্ট বাটন সহ
- `app/components/modals/StockNotifyModal.tsx` — `STOCK_NOTIFY_EVENT` শোনে, `vc_sn_<id>` localStorage key-তে সেভ করে (AccountPage-এর stock-notification list এই একই key ব্যবহার করে)
- `app/components/modals/BackInStockToast.tsx` — সেভ করা notification-গুলো লাইভ প্রোডাক্ট স্টকের সাথে মিলিয়ে toast দেখায়
- `app/components/modals/OfferPopup.tsx` — `old > price` থাকা প্রোডাক্টগুলো ডিসকাউন্ট% অনুযায়ী সাজিয়ে দেখায়, Footer-এর `OPEN_OFFER_PAGE_EVENT` শোনে
- `app/components/modals/RecoveryToast.tsx` — persistent draft থাকলে (checkout পেজ ছাড়া অন্য যেকোনো পেজে) resume করার toast দেখায়
- সবগুলো `app/components/GlobalOverlays.tsx`-এ মাউন্ট করা হয়েছে

**⏳ এরপর — পরবর্তী ধাপ:**
1. Phase C — Zustand state migration
2. Phase D-এর বাকি অংশ — Server Action দিয়ে checkout order creation, `decrement_product_stock` RPC, fingerprint.js, bKash TxnID unique constraint, multi-account switching অপসারণ

**🧹 ছোট cleanup নোট:** repo root-এ (app/components/home/-এর বাইরে) একটা stray `CustomerGallery.tsx` কপি আছে — এটা সম্ভবত ভুল জায়গায় upload হয়ে গেছে, আসল ফাইলটা `app/components/home/CustomerGallery.tsx`-এ ঠিকই আছে। মুছে দেওয়া নিরাপদ (build এটাকে ব্যবহার করছে না)।

| C | Zustand state migration | ⏳ বাকি |
| D | Server Actions & Security | 🟡 আংশিক — Turnstile, rate limiting, input sanitization ইতিমধ্যে হয়ে গেছে (auth-এর সাথে); বাকি: Server Action দিয়ে checkout order creation, `decrement_product_stock` RPC, fingerprint.js, bKash TxnID unique constraint, multi-account switching অপসারণ |
| E | RSC conversion | ⏳ বাকি |
| F | Routing restructure (real policy routes + Cart Guard) | ⏳ বাকি |
| G | i18n & Dark mode | ⏳ বাকি |
| H | AI chatbot, Telegram, Tawk.to | ⏳ বাকি |
| I | SEO/GTM/sitemap | ⏳ বাকি |
| J | Anti-tampering (partial — devtools block বাদে, সবসময়) | ⏳ বাকি |
| L | Infrastructure/Scaling (documentation only) | ⏳ বাকি |
| M | Documentation | ⏳ বাকি |

---

## মালিকের কাজ (প্রতিটা phase শেষে)

- ZIP download করে GitHub-এ upload
- Build সফল হয়েছে কিনা Vercel-এ দেখা
- সাইট visually legacy-র মতোই আছে কিনা check করা (Phase B-তে critical)
- পরের phase-এর জন্য "চালিয়ে যাও" বলা

## গুরুত্বপূর্ণ নোট

- Supabase database structure change হবে না (শুধু নতুন column/table Phase D-তে যোগ হতে পারে — fingerprint_id, stock RPC ইত্যাদি)
- Phase B (TS+Tailwind conversion) সবচেয়ে বড় এবং সবচেয়ে ঝুঁকিপূর্ণ ধাপ — এটা ধীরে, একটা একটা component ধরে হবে
- প্রতিটা Phase independent — কোনোটা আটকে থাকলে অন্যটা নিয়ে এগোনো যায় (যেমন Phase H/I আলাদা করে যেকোনো সময় করা যায়)
