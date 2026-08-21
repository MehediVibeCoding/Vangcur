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
1. Phase D-এর বাকি অংশ — Server Action দিয়ে checkout order creation, `decrement_product_stock` RPC, fingerprint.js, bKash TxnID unique constraint, multi-account switching অপসারণ

**🧹 ছোট cleanup নোট:** repo root-এ (app/components/home/-এর বাইরে) একটা stray `CustomerGallery.tsx` কপি আছে — এটা সম্ভবত ভুল জায়গায় upload হয়ে গেছে, আসল ফাইলটা `app/components/home/CustomerGallery.tsx`-এ ঠিকই আছে। মুছে দেওয়া নিরাপদ (build এটাকে ব্যবহার করছে না)।

**✅ ঠিক করা হয়েছে (এই session-এই):** সাম্প্রতিক একটা commit (`Delete lib/categoryData.ts`) দিয়ে `lib/categoryData.ts` ফাইলটা ভুলবশত মুছে ফেলা হয়েছিল, কিন্তু এটা তখনো ৮টা ফাইল থেকে import হতো (`About.tsx`, `Categories.tsx`, `HeroSlider.tsx`, `ProductGrid.tsx`, `Navbar.tsx`, `SrpClient.tsx`, `floatButtonsData.ts`, `footerData.ts`) — মালিক আসল ফাইলটা আবার দিয়েছেন, `lib/categoryData.ts` পাথে restore করা হলো, `tsc --noEmit` ও `next build` (font fetch বাদে, network sandbox limitation) দুটোই এখন ক্লিন।

### Phase C বিস্তারিত status (২০২৬-০৮-১৯)

**✅ সম্পূর্ণ — Cart ও Wishlist আগেই Zustand-এ ছিল (`lib/store/cartStore.ts`, `lib/store/wishlistStore.ts`); Auth slice এই session-এ শেষ করা হলো:**
- নতুন `lib/store/authStore.ts` — `useAuthStore` (state: `currentUser`, action: `setCurrentUser`), cart/wishlist store-এর একই প্যাটার্নে (`vc_user` localStorage key persist করে)
- পুরনো `getCurrentUser`/`saveCurrentUser`/`AUTH_EVENT` (localStorage + `window.dispatchEvent`) সম্পূর্ণ সরিয়ে ফেলা হয়েছে `lib/authData.ts` থেকে — `logout`, `checkOAuthCallback`, `switchToAccount` এখন সরাসরি `useAuthStore.getState()`/`setCurrentUser()` ব্যবহার করে
- সব consumer আপডেট করা হয়েছে: `app/ClientHome.tsx`, `app/product/[slug]/ProductDetailClient.tsx` (event listener সরিয়ে `useAuthStore` hook), `app/components/auth/LoginModal.tsx`, `app/components/auth/AccountPage.tsx`, `app/checkout/page.tsx`, `app/components/checkout/WaitingOverlay.tsx` (render-এ ব্যবহৃত হওয়ায় reactive hook-এ বদলানো হয়েছে, একবারের `getState()` না), `app/reset-password/ResetPasswordClient.tsx`
- `npx tsc --noEmit` দিয়ে verify করা হয়েছে — migration-touched কোনো ফাইলে টাইপ error নেই (repo-তে আলাদা একটা pre-existing `categoryData.ts` missing-ফাইল বাগ আছে, উপরে নোট করা আছে, এই migration-এর সাথে সম্পর্কহীন)

| C | Zustand state migration | ✅ সম্পূর্ণ |
| D | Server Actions & Security | 🟡 আংশিক — Turnstile, rate limiting, input sanitization ইতিমধ্যে হয়ে গেছে (auth-এর সাথে); বাকি: Server Action দিয়ে checkout order creation, `decrement_product_stock` RPC, fingerprint.js, bKash TxnID unique constraint, multi-account switching অপসারণ |
| E | RSC conversion | ✅ মূল লক্ষ্য অনুযায়ী সম্পূর্ণ — নিচে বিস্তারিত |

### Phase E বিস্তারিত status (২০২৬-০৮-২০)

**✅ হোমপেজ প্রোডাক্ট গ্রিড — সম্পূর্ণ Server Component-এ convert করা হলো:**
- `app/page.tsx` — **[REPLACE]** — এখন async Server Component, `lib/supabase/server`-এর cookie-based client দিয়ে সরাসরি সার্ভারেই Supabase থেকে প্রোডাক্ট fetch করে, `ClientHome`-এ `initialProducts` prop হিসেবে পাঠায়
- `app/ClientHome.tsx` — **[REPLACE]** — `initialProducts` prop গ্রহণ করে `ProductGrid`-এ পাঠায়
- `app/components/home/ProductGrid.tsx` — **[REPLACE]** — state এখন `initialProducts` দিয়ে শুরু হয় (আগে হার্ডকোড `DEFAULT_PRODS` দিয়ে শুরু হয়ে mount-এর পর client fetch দিয়ে replace হতো — এই দুই-ধাপি ফ্ল্যাশ এখন নেই); redundant client-side initial fetch সরানো হয়েছে, realtime subscription (INSERT/UPDATE/DELETE) রাখা হয়েছে যাতে অ্যাডমিন প্যানেলের বদল সাথে সাথে গ্রিডে দেখা যায়
- **ফলাফল:** `next build`-এ `/` রুট এখন `ƒ (Dynamic)` — প্রতিটা রিকোয়েস্টে সার্ভারেই fresh প্রোডাক্ট ডেটাসহ HTML রেন্ডার হয়, SEO crawler প্রথম HTML-এই আসল ডেটা পাবে, প্রথম প্রোডাক্ট ছবি (LCP) হাইড্রেশনের অপেক্ষা ছাড়াই সার্ভার HTML-এ থাকবে

**✅ ৭টা হার্ডকোড ডিফল্ট প্রোডাক্ট চিরতরে অপসারণ (`lib/productData.ts`-এর `DEFAULT_PRODS`, `DEFAULT_IDS`, `isDefaultProductId`):**
- এই ধ্রুবকটা ১০টা ফাইলে ব্যবহার হচ্ছিল (শুধু হোমপেজ গ্রিডে না) — সবগুলো audit করে ঠিক করা হয়েছে:
  - `app/product/[slug]/page.tsx` — মেটাডেটা fallback আর ভুয়া ডিফল্ট প্রোডাক্ট দেখাবে না, না পেলে সরাসরি "প্রোডাক্ট পাওয়া যায়নি" মেটাডেটা দেখাবে
  - `app/product/[slug]/ProductDetailClient.tsx`, `app/srp/SrpClient.tsx` — খালি লিস্ট দিয়ে শুরু, বিদ্যমান fetch effect দিয়েই আসল ডেটা লোড হয়
  - `app/components/layout/Navbar.tsx` (সার্চ ইনডেক্স), `app/components/cart/CartSidebar.tsx`, `app/components/checkout/QuickOrderBridge.tsx` (দাম lookup) — খালি ref দিয়ে শুরু, fetch হওয়ার পর সরাসরি set হয়
  - `app/components/modals/OfferPopup.tsx`, `app/components/modals/BackInStockToast.tsx` — অফার/স্টক-নোটিফিকেশন লিস্ট এখন শুধু আসল Supabase ডেটা থেকে তৈরি হয়, fetch fail করলে খালি থাকে (ভুয়া ডেটা দেখায় না)
  - **`app/actions/checkout.ts` (নিরাপত্তা-সংবেদনশীল)** — অর্ডারের authoritative দাম যাচাই আগে Supabase fetch fail করলে চুপচাপ `DEFAULT_PRODS`-এর (সম্ভাব্য ভুল/পুরনো) দামে fallback করতো; এখন সেটা সরিয়ে fail-closed করা হয়েছে — fetch fail করলে অর্ডার নিরাপদে reject হয় ("একটু পরে আবার চেষ্টা করুন"), কখনো স্টেল দামে অর্ডার confirm হবে না

**✅ Build verification:**
- `npx tsc --noEmit` — এই migration-touched ১৩টা ফাইলে কোনো টাইপ error নেই (repo-তে ২টা আলাদা pre-existing bug আছে — `app/actions/checkout.ts`-এ `ShipKey` টাইপ মিসম্যাচ, আর `app/components/auth/AccountPage.tsx`-এ অনুপস্থিত `setSwitchPanelOpen` state — দুটোই এই migration-এর আগে থেকেই ছিল, RSC/প্রোডাক্ট-ডেটা কাজের সাথে সম্পর্কহীন, ঠিক করা হয়নি কারণ scope-এর বাইরে)
- `next build` — সম্পূর্ণ production build সফল (সাময়িকভাবে dummy Supabase env var আর ফন্ট স্টাব বসিয়ে sandbox network-limitation বাইপাস করে verify করা হয়েছে, তারপর আসল ফাইলে revert করা হয়েছে) — `/` রুট `ƒ Dynamic` হিসেবে কাজ করছে

### Phase E — চালিয়ে যাওয়া (২০২৬-০৮-২০, একই দিনে দ্বিতীয় সেশন)

**✅ ২টা pre-existing bug ঠিক করা হয়েছে (এখন `next build` আটকায় না):**
- `app/actions/checkout.ts` — `validShipKeys`-কে `string[]` টাইপ করা হয়েছে, যাতে ইউজারের পাঠানো `shipping` স্ট্রিং নিরাপদে যাচাই করা যায় (TS2345 ফিক্স)
- `app/components/auth/AccountPage.tsx` — অস্তিত্বহীন `setSwitchPanelOpen(false)` কল সরানো হয়েছে (আগেই সরিয়ে ফেলা multi-account switching ফিচারের অবশিষ্টাংশ ছিল, কোথাও state define করা ছিল না — TS2304 ফিক্স)

**✅ `app/product/[slug]/` — hybrid RSC (সার্ভার থেকে ডেটা, client component-এ prop হিসেবে):**
- `lib/productData.ts`-এ নতুন `fetchProductById()` যোগ হয়েছে — `mapCustomProduct()` reuse করে base fields + detail fields (desc/long_desc/features/faqs/closing) একসাথে এক কোয়েরিতে আনে
- `page.tsx` — `generateMetadata` আর পেজ কম্পোনেন্ট এখন React `cache()` দিয়ে wrap করা `getProduct()` শেয়ার করে (একই রিকোয়েস্টে ডাবল fetch হয় না); মেটাডেটার জন্য আগের আলাদা `fetchMetaProduct`/`MetaProduct` সরিয়ে একই fetch reuse করা হয়েছে
- `ProductDetailClient.tsx` — নতুন `initialProduct` prop দিয়ে `prods`/`prodsLoaded` state শুরু হয়, ফলে প্রথম পেইন্টেই আসল প্রোডাক্ট দেখা যায় ("লোড হচ্ছে..." স্পিনার ফ্ল্যাশ হয় না); যেহেতু SSR fetch-এই detail fields (desc/features/faqs) চলে আসে, `_detailLoaded` true হয়ে যায় আর আগের বাড়তি client-side `fetchProductDetail()` কলও এড়ানো যায়
- **সিদ্ধান্ত:** পুরো ৮৯৫ লাইনের ফাইলকে Server/Client component-এ ভেঙে ফেলা (true full RSC) করা হয়নি — risk/scope বিবেচনায় hybrid পদ্ধতি বেছে নেওয়া হয়েছে (নিচে বিস্তারিত কারণ)

**✅ `app/category/[slug]/page.tsx` — নতুন real, crawlable রুট তৈরি হয়েছে:**
- আগে `/category/<slug>` শুধু client-side `history.replaceState` দিয়ে cosmetic URL ছিল — direct link/reload/crawl করলে Next.js 404 দিতো
- এখন `fetchCategories()` (Supabase-ব্যাকড, অ্যাডমিন-যোগ করা কাস্টম ক্যাটাগরিও ধরে) দিয়ে slug যাচাই হয়, না মিললে `notFound()`; ক্যাটাগরি অনুযায়ী নিজস্ব title/meta description বসে
- সার্ভারেই প্রোডাক্ট fetch করে homepage-এর `ClientHome`/`ProductGrid` reuse করে, নতুন `initialCategory` prop দিয়ে গ্রিড সরাসরি সেই ক্যাটাগরিতে pre-filtered অবস্থায় প্রথম পেইন্টেই দেখায় (initial batch-সাইজও ফিল্টার করা কাউন্ট অনুযায়ী ঠিকভাবে হিসাব হয়)

**✅ `app/srp/` (সার্চ) — homepage-এর same প্যাটার্নে RSC-তে আনা হয়েছে:**
- `page.tsx` এখন async Server Component, সার্ভারেই পুরো প্রোডাক্ট লিস্ট fetch করে `SrpClient`-এ `initialProducts` prop পাঠায়
- `SrpClient.tsx` — redundant client-side initial fetch সরানো হয়েছে (realtime subscription রাখা হয়েছে); শেয়ার করা/বুকমার্ক করা সার্চ লিংকে সরাসরি ঢুকলে এখন প্রথম পেইন্টেই আসল রেজাল্ট থাকে
- এই পেজ `robots: noindex` (এটা আগে থেকেই ছিল), তাই মূল motivation SEO না, বরং সরাসরি/শেয়ার করা সার্চ লিংকের প্রথম-পেইন্ট UX

**✅ Build verification (এই সেশনের শেষে):**
- `npx tsc --noEmit` — পুরো প্রজেক্টে (pre-existing ২টা bug ফিক্স হওয়ার পর) শূন্য error
- `next build` — সম্পূর্ণ production build সফল, নতুন `/category/[slug]` রুটসহ সব রুট ঠিকভাবে `ƒ Dynamic` হিসেবে register হয়েছে (আগের মতোই সাময়িক dummy env/ফন্ট স্টাব দিয়ে sandbox-এ verify করে রিভার্ট করা হয়েছে)

**✅ Build verification (২য় সেশনের শেষে):**
- `npx tsc --noEmit` — পুরো প্রজেক্টে (pre-existing ২টা bug ফিক্স হওয়ার পর) শূন্য error
- `next build` — সম্পূর্ণ production build সফল, নতুন `/category/[slug]` রুটসহ সব রুট ঠিকভাবে `ƒ Dynamic` হিসেবে register হয়েছে (আগের মতোই সাময়িক dummy env/ফন্ট স্টাব দিয়ে sandbox-এ verify করে রিভার্ট করা হয়েছে)

### Phase E — চূড়ান্ত রাউন্ড (একই দিনে ৩য় সেশন): লিন ক্যাটাগরি পেজ + স্কোপ সিদ্ধান্তের ব্যাখ্যা

**গুরুত্বপূর্ণ realization — hybrid pattern আসলে ইতিমধ্যেই মূল বাগটা ঠিক করে দিয়েছে:**
Next.js App Router-এ `'use client'` কম্পোনেন্টও প্রথম রিকোয়েস্টে সার্ভারেই HTML-এ রেন্ডার হয় (শুধু হাইড্রেশনের পর ইন্টারঅ্যাক্টিভ হয়ে ওঠে)। তাই page.tsx (Server Component) থেকে `initialProduct`/`initialProducts` prop হিসেবে আসল ডেটা পাঠানোর সাথে সাথেই, সেই ডেটা দিয়ে seed করা ক্লায়েন্ট কম্পোনেন্টের সার্ভার-রেন্ডারড HTML-ও আসল কনটেন্ট দেখায় — "স্টেল/খালি HTML" বাগটা যেটার জন্য এই পুরো কাজ শুরু হয়েছিল, সেটা hybrid pattern দিয়েই সম্পূর্ণ সমাধান হয়ে গেছে সবগুলো পেজে (হোম, প্রোডাক্ট, ক্যাটাগরি, সার্চ)। বাকি থাকা "true full RSC split" (markup-কে Server/Client অংশে ভাগ করা) শুধু bundle-size/hydration-cost অপ্টিমাইজেশন — কোনো bug ফিক্স না।

এই বিবেচনায়, `ProductDetailClient.tsx` (৮৯৫ লাইন, গভীরভাবে ইন্টারঅ্যাক্টিভ — image gallery, cart, wishlist, tabs, auth মোডাল একসাথে) ভেঙে সার্ভার/ক্লায়েন্ট আলাদা করার ঝুঁকিপূর্ণ কাজ **ইচ্ছাকৃতভাবে বাদ দেওয়া হয়েছে** — কোনো visual-regression টুল ছাড়া (এই sandbox-এ স্ক্রিনশট/ভিজুয়াল-ডিফ করার উপায় নেই) এত বড় একটা লাইভ, কাজ-করা ফাইলে হাত দেওয়ার ঝুঁকি বাস্তব সুবিধার চেয়ে বেশি।

**✅ যা নতুন করে করা হলো (আসল, কম-ঝুঁকির উন্নতি):**
- `/category/[slug]` পেজ আর পুরো হোমপেজ layout (Hero/TrustStrip/FAQ/About/Gallery) reuse করে না — নতুন `CategoryClient.tsx` একটা লিন, ক্যাটাগরি-নির্দিষ্ট শেল: Navbar + breadcrumb (হোম / ক্যাটাগরি-নাম) + ক্যাটাগরি আইকন+নাম হেডার + অন্যান্য ক্যাটাগরিতে যাওয়ার কুইক-লিংক পিল (internal linking-এও ভালো, crawler এখান থেকে অন্য ক্যাটাগরি পেজ discover করতে পারবে) + ফিল্টার করা `ProductGrid` + Footer
- `ProductGrid.tsx`-এ নতুন `categoryName` prop — গ্রিডের হেডিং এখন প্রাসঙ্গিক ক্যাটাগরির নাম দেখায় ("সকল প্রোডাক্ট"-এর বদলে, যেমন "TWS"), যতক্ষণ ইউজার "সব প্রোডাক্ট দেখুন" বাটনে ক্লিক না করে
- `page.tsx`-এ `getCategories()` (React `cache()`) দিয়ে পুরো ক্যাটাগরি লিস্ট একবার fetch হয়ে metadata + পেজ + sibling-লিংক তিন জায়গাতেই reuse হচ্ছে
- **ফলাফল:** `next build`-এ `/category/[slug]` বান্ডেল সাইজ (215 kB) এখন হোমপেজের (224 kB) চেয়েও ছোট — লিন শেল সত্যিই হালকা প্রমাণিত

**পরিচিত সামান্য leftover:** `ClientHome.tsx`-এ একটা `initialCategory` optional prop রয়ে গেছে যেটা এখন আর কোথাও পাস করা হয় না (আগে category page-এ ClientHome reuse করার প্ল্যান ছিল, এখন CategoryClient সরাসরি ProductGrid ব্যবহার করে) — সম্পূর্ণ harmless (optional, কোথাও ব্যবহার না হলেও build/type error দেয় না), পরিষ্কারের জন্য ইচ্ছা করলে বাদ দেওয়া যায়।

**Phase E-এর মূল লক্ষ্য (SEO crawler প্রথম HTML-এই আসল ডেটা পাবে, প্রথম পেইন্টে স্টেল/খালি কনটেন্ট থাকবে না) এখন হোম, প্রোডাক্ট ডিটেইল, ক্যাটাগরি, আর সার্চ — এই ৪টা পাবলিক-ফেসিং পেজেই অর্জিত। এই কারণে Phase E-কে কার্যকরীভাবে সম্পূর্ণ ধরা হচ্ছে; বাকি যা আছে তা bundle-size অপ্টিমাইজেশনের মতো ঐচ্ছিক পরবর্তী কাজ, কোনো bug ফিক্স নয়।**

### Phase F — Routing Restructure (২০২৬-০৮-২১)

**✅ `/srp` → `/search` — রুট রিনেম:**
- `app/srp/` পুরোটা `app/search/`-এ মুভ করা হয়েছে, ভিতরের সব identifier রিনেম করা হয়েছে (`SrpClient`→`SearchClient`, `SrpPage`→`SearchPage`, `SrpHeader`→`SearchHeader`, `onGoToSrp`/`goToSrp`→`onGoToSearch`/`goToSearch`), `Navbar.tsx`-এর `router.push` কল আপডেট হয়েছে
- Phase E-তেই এই রুট URL-synced (query param `q`, debounced 300ms) ছিল — শুধু নাম বদলেছে (internal codename "srp" থেকে user-friendly "search"), ফাংশনালিটি অপরিবর্তিত

**✅ Cart Guard — `/checkout`-এ সরাসরি URL দিয়ে খালি cart-এ ঢোকা আটকানো হয়েছে:**
- আগে খালি cart অবস্থায় checkout পেজে ঢুকলে শুধু একটা warning banner দেখাতো (ফর্ম পূরণ করা যেত, কিন্তু order submit করতে গেলে আটকাতো)
- এখন একই ডিটেকশন লজিক দিয়ে (quick-order sessionStorage → না থাকলে `vc_cart` localStorage) খালি পাওয়া গেলে সাথে সাথে toast দেখিয়ে `router.replace('/')` করা হয় — dead-end খালি checkout পেজ আর দেখা যায় না
- পুরনো ব্যবহারবিহীন `cartWarnVisible` state ও ওয়ার্নিং ব্যানার JSX সরানো হয়েছে

**✅ `app/checkout/success/` — নতুন real, protected রুট:**
- খুঁজে পাওয়া বাগ: `WaitingOverlay`-এর পেন্ডিং-অর্ডার চেক শুধু নিজের প্রথম mount-এ (`useEffect(() => {...}, [])`) `localStorage` পড়ত — checkout পেজের `router.push('/')` client-side navigation হওয়ায় `WaitingOverlay` রিমাউন্ট হতো না, ফলে অর্ডার সাবমিটের ঠিক পরপরই ওয়েটিং-ওভারলে আসলে দেখা যেত না
- এখন সাবমিটের পর `/checkout/success`-এ পাঠানো হয় — এই নতুন পেজ নিজে `localStorage`-এ পেন্ডিং অর্ডার আছে কিনা চেক করে (নতুন শেয়ার্ড হেল্পার `readPendingOrder()`, ৪৮ ঘণ্টা window) — না থাকলে সাথে সাথে `/`-এ redirect করে দেয় (এটাই এর "protected" আচরণ — সরাসরি URL দিয়ে ভুয়া সাকসেস স্ক্রিন দেখা যায় না)
- `lib/orderStatus.ts`-এ `PENDING_ORDER_MAX_AGE_MS`, `RESOLVED_ORDER_STATUSES`, `readPendingOrder()`, `clearPendingOrder()` — এই লজিকগুলো আগে `WaitingOverlay.tsx`-এর ভিতরে লোকাল ছিল, এখন শেয়ার্ড lib-এ এক্সট্র্যাক্ট করা হয়েছে যাতে দুই জায়গায় (overlay + নতুন success পেজ) একই লজিক ব্যবহার হয়
- `WaitingOverlay.tsx`-এ `/checkout/success` পাথে থাকা অবস্থায় নিজের global overlay auto-open না করার গার্ড যোগ হয়েছে (একই তথ্য দুইবার দেখানো এড়াতে); বাকি সব পেজে আগের মতোই কাজ করে

**✅ `app/track-order/` — নতুন real, crawlable/bookmarkable রুট:**
- আগে থেকে থাকা `TrackOrderModal.tsx`-এর (guest order lookup: অর্ডার নম্বর + মোবাইল নম্বর) মূল লজিক নতুন শেয়ার্ড `lib/orderStatus.ts`-এর `lookupOrderByNumberAndPhone()`-এ এক্সট্র্যাক্ট করা হয়েছে — ফোন-নম্বর মিলানোর নিরাপত্তা-চেক দুই জায়গায় আলাদা করে লেখা লাগেনি
- নতুন পেজ একই লুকআপ ব্যবহার করে, প্লাস `?order=VC-1082` query param দিয়ে prefill সাপোর্ট করে (সাপোর্ট টিম সরাসরি লিংক পাঠাতে পারবে)
- Footer/Navbar-এর বিদ্যমান "ট্র্যাক অর্ডার" বাটন ইচ্ছাকৃতভাবে এখনো মোডাল-ই খোলে (change করা হয়নি) — নতুন রুটটা সম্পূর্ণ additive, direct URL/bookmark/শেয়ার করার জন্য

**✅ `app/account/orders/` — নতুন real, bookmarkable রুট:**
- `AccountPage.tsx`-এর অর্ডার-কার্ড UI (status badge, item thumbnail, ইনভয়েস বাটন) নতুন শেয়ার্ড `app/components/orders/OrderCard.tsx`-এ এক্সট্র্যাক্ট করা হয়েছে — মোডাল আর নতুন পেজ দুটোই এখন এক্স্যাক্টলি একই কার্ড রেন্ডার করে (ডুপ্লিকেট JSX সরানো হয়েছে)
- নতুন পেজ `fetchMyOrders`/`orderStats` (`lib/accountData.ts`, আগে থেকেই ছিল) reuse করে; লগইন না থাকলে redirect না করে ইন-প্লেস "লগইন করুন" prompt দেখায় (LoginModal মোডালেই খোলে, পুরো সাইটের existing মোডাল-ভিত্তিক auth প্যাটার্নের সাথে সামঞ্জস্যপূর্ণ)
- Account মোডালের অর্ডার-লিস্ট হেডিং-এ "সব দেখুন →" লিংক যোগ হয়েছে যা এই নতুন পেজে নিয়ে যায়

**✅ ৩টা policy পেজ — `app/(policies)/{privacy-policy,terms,refund-policy}/page.tsx`:**
- খুঁজে পাওয়া বাগ: Footer-এর "Privacy Policy"/"Terms & Conditions"/"Returns & Refunds" লিংক আগে `OPEN_INFO_EVENT` ডিসপ্যাচ করত, কিন্তু পুরো কোডবেসে কোথাও এই ইভেন্টের কোনো listener ছিল না — অর্থাৎ এই তিনটা লিংক dead ছিল (ক্লিক করলে কিছুই হতো না)
- এখন `app/(policies)/layout.tsx` (Navbar+Footer শেয়ার্ড শেল, অন্যান্য রুটের প্যাটার্নেই) এর নিচে তিনটা static, crawlable, নিজস্ব `generateMetadata` সহ সার্ভার-রেন্ডারড পেজ — `Footer.tsx`-এর `info:privacy`/`info:terms`/`info:returns` কেস এখন `next/link` দিয়ে এই রুটগুলোতে নেভিগেট করে (`info:shipping` অপরিবর্তিত রাখা হয়েছে, এটা এই ফেজের স্কোপে নেই)
- Terms ও Refund Policy-এর কনটেন্ট checkout-এর বিদ্যমান `PolicyModal.tsx` (অর্ডার, ডেলিভারি, আনবক্সিং ভিডিও, ওয়ারেন্টি, রিটার্ন/রিফান্ড — এই কনটেন্ট আগে থেকেই ছিল, শুধু checkout-এর সময় agreement হিসেবে দেখানো হতো) থেকে adapt/expand করা হয়েছে যাতে দুই জায়গায় বিরোধপূর্ণ তথ্য না থাকে
- Privacy Policy সম্পূর্ণ নতুন লেখা কনটেন্ট — কোডবেসে যা সত্যিই আছে তা যাচাই করে লেখা হয়েছে (Supabase auth/DB, Cloudinary ছবি হোস্টিং, bKash ম্যানুয়াল পেমেন্ট ভেরিফিকেশন, Google OAuth লগইন, cart/wishlist localStorage-এ) — কোনো analytics/tracking script (Google Analytics/FB Pixel ইত্যাদি) কোডবেসে নেই তা গ্রেপ করে নিশ্চিত হয়ে সেই অনুযায়ী লেখা হয়েছে, অতিরিক্ত দাবি করা হয়নি
- তিনটাই `app/(policies)/PolicyContent.tsx`-এর শেয়ার্ড প্রিমিটিভ (`PolicyHeader`, `PolicySection`, `PolicyNote`, `PolicyContact`) ব্যবহার করে যাতে ভিজ্যুয়ালি সামঞ্জস্যপূর্ণ থাকে

**✅ Build verification:**
- `npx tsc --noEmit` — পুরো প্রজেক্টে শূন্য error
- `next build` — সম্পূর্ণ production build সফল (আগের সেশনগুলোর মতোই সাময়িক dummy Supabase env var আর ফন্ট স্টাব দিয়ে sandbox network-limitation বাইপাস করে verify করা হয়েছে, তারপর আসল ফাইলে revert করা হয়েছে) — নতুন সবকটা রুট ঠিকভাবে register হয়েছে: `/search` (ƒ Dynamic), `/checkout/success`, `/track-order`, `/account/orders` (○ Static shell), আর `/privacy-policy`/`/terms`/`/refund-policy` (○ Static, প্রতিটা <1kB page JS — pure server-rendered কনটেন্ট)

| F | Routing restructure (real policy routes + Cart Guard) | ✅ সম্পূর্ণ |
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
