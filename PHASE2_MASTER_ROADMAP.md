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

| B | Component TS+Tailwind conversion | 🟡 আংশিক — নিচে বিস্তারিত |
### Phase B বিস্তারিত status (২০২৬-০৮-০৫ পর্যন্ত)

**ক্রম অনুযায়ী অগ্রগতি:**

**✅ Layout — সম্পূর্ণ (GitHub-এ upload হয়ে গেছে, build successful):**
- `app/components/layout/Navbar.tsx`
- `app/components/layout/Footer.tsx`
- সাপোর্টিং lib ফাইল: `lib/searchData.ts`, `lib/categoryData.ts`, `lib/uiEvents.ts`, `lib/logger.ts`, `lib/cartData.ts`, `lib/toast.ts`, `lib/productData.ts`, `lib/footerData.ts`

**🟡 এই session-এ বানানো, কিন্তু এখনো GitHub-এ upload হয়নি (মালিকের কাছে ZIP আকারে আছে, build test বাকি):**
- `app/components/home/HeroSlider.tsx` — [NEW FILE]
- `app/components/home/Categories.tsx` — [NEW FILE]
- `app/components/home/ProductGrid.tsx` — [NEW FILE]
- `app/components/home/ProductCard.tsx` — [NEW FILE]
- `app/components/home/FAQ.tsx` — [NEW FILE]
- `app/components/home/About.tsx` — [NEW FILE]
- `app/components/home/CustomerGallery.tsx` — [NEW FILE] — build error (`.then().catch()` টাইপ এরর) ফিক্স করা ভার্সন
- `app/components/home/TrustStrip.tsx` — [NEW FILE] — নতুন, এই session-এ বানানো
- `app/ClientHome.tsx` — [NEW FILE] — Navbar + সব home section + Footer একসাথে জোড়া লাগানো হয়েছে (cart/wishlist count tracking সহ); CatBar (অদৃশ্য উপাদান), CartSidebar/WishlistDrawer, LoginModal/AccountPage, checkout/order overlays এখনো এখানে যোগ হয়নি (পরের ধাপে component তৈরি হলে যোগ হবে)
- `app/page.tsx` — [REPLACE] — placeholder-এর জায়গায় `<ClientHome/>` render করছে
- `lib/faqData.ts` — [NEW FILE]
- `lib/sanitize.ts` — [NEW FILE] — Categories.tsx/HeroSlider.tsx-এর SVG sanitize করার জন্য
- `tailwind.config.ts` — [REPLACE] — নতুন keyframes/animation (`section-reveal`, `badge-hot-glow`, `heartbeat`, `ripple`)

**⚠️ মালিকের কাজ (upload-এর আগে):** `package.json`-এ `isomorphic-dompurify` dependency যোগ করা (আলাদা ফাইল দেওয়া হয়েছে)।

**✅ Home sections + homepage assembly — GitHub upload ও Vercel build-test দুটোই সফল (owner স্ক্রিনশট দিয়ে কনফার্ম করেছে, ২০২৬-০৮-০৩)।** Live URL-এ Navbar+Hero+Categories+Products+FAQ+About+Gallery+Footer নীল থিমে ঠিকঠাক দেখাচ্ছে।

**🟡 এই session-এ বানানো — Product Detail Page (মালিকের কাছে ZIP আকারে আছে, GitHub upload ও build-test বাকি):**
- `app/product/[slug]/page.tsx` — [NEW FILE] — generateMetadata (SEO/OG/Twitter) + client component mount
- `app/product/[slug]/ProductDetailClient.tsx` — [NEW FILE] — gallery (zoom/swipe/thumbs), quick specs, qty stepper, wishlist, WhatsApp/Messenger/order/cart actions, tabs (বিবরণ/ফিচারস/স্পেসিফিকেশন/FAQ/রিভিউ), related products (ProductCard পুনর্ব্যবহার), sticky bottom order bar
- `app/components/modals/WarrantyModal.tsx` — [NEW FILE]
- `lib/productDetailData.ts` — [NEW FILE]
- `lib/floatButtonsData.ts` — [NEW FILE]
- `lib/visitorTracking.ts` — [NEW FILE]
- `lib/warrantyData.ts` — [NEW FILE]
- `lib/bodyScrollLock.ts` — [NEW FILE]
- `lib/supabase/server.ts` — Phase A-তেই আগে থেকে আছে (`export async function createClient()`), তাই নতুন করে বানানো হয়নি — `page.tsx` সেই existing ফাংশনই `import { createClient } from '@/lib/supabase/server'` দিয়ে ব্যবহার করছে।

**🟡 এই session-এ বানানো — Cart/Wishlist drawer (মালিকের কাছে ZIP আকারে আছে, GitHub upload ও build-test বাকি):**
- `app/components/cart/CartSidebar.tsx` — [NEW FILE]
- `app/components/cart/WishlistDrawer.tsx` — [NEW FILE]
- `app/components/cart/FloatCartBadge.tsx` — [NEW FILE] — জিগল অ্যানিমেশন (`animate-cart-jiggle`, tailwind.config-এ আগে থেকেই আছে)
- `app/components/cart/FloatWishBadge.tsx` — [NEW FILE] — ৩ সেকেন্ড auto-dismiss
- `app/components/GlobalOverlays.tsx` — [NEW FILE] — `#toast` div + Cart/Wishlist drawer-এর open state + float badge দুটো, root layout-এ একবার মাউন্ট হওয়ার জন্য। **⚠️ আপাতত শুধু Cart/Wishlist/Toast আছে — Auth/Checkout/Offer/Membership/Invoice/StockNotify/QuickOrder modal গুলো পরের পর্যায়ে convert হওয়ার সাথে সাথে এই ফাইলে যোগ হবে (পুরনো repo-র `GlobalOverlays.js` পুরোপুরি একসাথে না করে, ধাপে ধাপে)।**
- `lib/cartData.ts` — মালিক আগে থেকেই পাঠিয়েছে, হুবহু মিলে যাওয়ায় নতুন করে ছোঁয়া হয়নি।

**⚠️ মালিকের কাজ (upload-এর আগে, ২টা জিনিস verify করা):**
1. **`app/layout.tsx`-এ `<GlobalOverlays />` মাউন্ট করা আছে কিনা** — root layout-এ একবার বসাতে হবে (পুরনো repo-র `app/layout.js`-এ যেমন ছিল), নইলে toast/cart/wishlist কোনো route-এ কাজ করবে না।
2. **বর্তমান `Navbar.tsx`-এর কার্ট/উইশলিস্ট আইকন `OPEN_CART_EVENT`/`OPEN_WISHLIST_EVENT` dispatch করছে কিনা** (lib/uiEvents.ts থেকে) — যদি Navbar নিজে isOpen state ধরে রাখে (পুরনো প্যাটার্নে), সেটা বদলে GlobalOverlays-কেই state owner বানাতে হবে, Navbar শুধু event dispatch করবে।

**✅ Auth (LoginModal + AccountPage) — সম্পূর্ণ, build test সফল (২০২৬-০৮-০৫):**

দুই session-এ শেষ হয়েছে। উপরের ২টা verification পয়েন্ট চেক করে দেখা গেছে `<GlobalOverlays />` layout.tsx-এ মাউন্ট করা ছিল না — এই ধাপে ঠিক করা হয়েছে (verification পয়েন্ট ২, Navbar-এর event dispatch, আগে থেকেই ঠিক ছিল)।

- `lib/authData.ts` — login/register/Google OAuth/password reset/linked accounts/wishlist sync/guest-order merge
- `lib/passwordStrength.ts` — zxcvbn (dynamic import) ভিত্তিক checker
- `lib/accountData.ts` — celestial weather-card গণিত, Open-Meteo বৃষ্টি চেক (৪০+ জেলা coordinate lookup), অর্ডার fetch/stats, প্রোফাইল নাম আপডেট, স্টক-নোটিফাই, abandoned draft
- `lib/membershipData.ts` — ৫টা tier (Regular→Legendary), crown/tier SVG
- `app/components/auth/PasswordStrengthMeter.tsx`
- `app/components/auth/LoginModal.tsx` — login/register/forgot-password, Google button
- `app/components/auth/AccountPage.tsx` — day/night/rain gradient profile card (sun/moon arc, cloud/rain/lightning/firefly/bird animation), নাম এডিট, multi-account switcher, order history, membership badge, stock-notify list, abandoned-draft card, লগআউট confirm
- `app/reset-password/page.tsx` + `ResetPasswordClient.tsx` — forgot-password লিংক যেখানে ল্যান্ড করে
- `types/index.ts` — [REPLACE] `CurrentUser` expand + `LinkedAccount`/`Order`/`OrderStats`/`DraftOrder`/`StockNotification`/`MembershipTier`/`CelestialState` যোগ
- `app/ClientHome.tsx` — [REPLACE] auth state track, `OPEN_ACCOUNT_EVENT`-এ currentUser থাকলে AccountPage নাহলে LoginModal খোলে
- `app/layout.tsx` — [REPLACE] `<GlobalOverlays />` মাউন্ট
- `app/globals.css` — [REPLACE] celestial card-এর ৬টা `@keyframes` (twinkling, cloudDrift, rainDropFall, fireflyGlow, lightningFlash, birdFly) — per-element random timing দরকার বলে raw CSS + inline `style`, বাকি সব Tailwind
- `package.json` — [REPLACE] `zxcvbn` + `@types/zxcvbn` যোগ

**⏳ এরপর — পরবর্তী ধাপ:**
- Checkout flow (OrderForm/checkout page, WaitingPage, ইত্যাদি)
- বাকি সব modal (OfferPopup, MembershipModal, InvoiceModal, StockNotifyModal, QuickOrderModal, RecoveryToast, BackInStockToast, OfferPageOverlay — এগুলো `GlobalOverlays.tsx`-এ পরে যোগ হবে, নিচের নোট দেখো)

| C | Zustand state migration | ⏳ বাকি |
| D | Server Actions & Security | ⏳ বাকি |
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
