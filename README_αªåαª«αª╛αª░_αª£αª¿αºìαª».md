# এই জিপে কী আছে

GitHub রিপো `MehediVibeCoding/Vangcur`-এ এই ফাইলগুলো path অনুযায়ী বসিয়ে দাও
(আগেরটা থাকলে রিপ্লেস হবে, নতুনগুলো (checkout.ts, fingerprint.ts,
serviceClient.ts) নতুন যোগ হবে):

- package.json, package-lock.json → root
- types/index.ts
- lib/authData.ts
- lib/fingerprint.ts  ← নতুন
- lib/supabase/serviceClient.ts  ← নতুন
- app/actions/checkout.ts  ← নতুন (Server Action)
- app/checkout/page.tsx
- app/ClientHome.tsx
- app/components/auth/AccountPage.tsx
- app/components/auth/LoginModal.tsx
- app/product/[slug]/ProductDetailClient.tsx

## Phase D — সব ৫টা কাজ শেষ
1. ✅ **Server Action দিয়ে checkout order creation** (`app/actions/checkout.ts`) —
   এখন থেকে অর্ডার সরাসরি ব্রাউজার থেকে না, service-role সার্ভার অ্যাকশনের
   মাধ্যমে তৈরি হয়। নাম/ফোন/ঠিকানা/ইমেইল/শিপিং/পেমেন্ট সব সার্ভার-সাইডে
   আবার ভ্যালিডেট হয়, প্রোডাক্টের দাম Supabase থেকে authoritative ভাবে
   verify হয় (ক্লায়েন্ট থেকে পাঠানো দাম বিশ্বাস করা হয় না)।
2. ✅ **decrement_product_stock RPC** — পুরো কার্ট এক DB transaction-এ
   atomically check + decrement হয়; একটা আইটেম স্টকে না থাকলে পুরো অর্ডার
   ব্লক হয়ে যায় (partial decrement হয় না)। SQL ফাইলে আছে।
3. ✅ **fingerprint.js ইন্টিগ্রেশন** — `lib/fingerprint.ts` দিয়ে ব্রাউজার
   fingerprint নেওয়া হয়, checkout ফর্মে পাঠানো হয়, ফোন নম্বরের পাশাপাশি
   fingerprint দিয়েও rate-limit (দিনে ৫টা) করা হয়।
4. ✅ **bKash TxnID ইউনিক কনস্ট্রেইন্ট** — একই Transaction ID দিয়ে দুইবার
   অর্ডার করা যাবে না (DB-level unique index)। SQL ফাইলে আছে।
5. ✅ **Multi-account switching সম্পূর্ণ সরানো** — আগের zip-এই হয়ে গিয়েছিল,
   এই zip-এও আছে (একই আপডেটেড ফাইলগুলো)।

## জরুরি — SQL আলাদাভাবে রান করতে হবে
`phase-d-security.sql` ফাইলটা **GitHub-এ যাবে না** — এটা আলাদাভাবে পাঠানো
হয়েছে। Supabase ড্যাশবোর্ডে গিয়ে SQL Editor-এ পুরোটা পেস্ট করে Run চাপো।
এতে আছে:
- `orders` টেবিলে `fingerprint_id` কলাম
- bKash TxnID unique constraint
- `decrement_product_stock` ও `restore_product_stock` RPC ফাংশন
- fingerprint rate-limit টেবিল + ফাংশন

SQL ফাইলের একদম শেষে দুটো লাইন **কমেন্ট করা অবস্থায়** আছে (anon থেকে
orders-এ সরাসরি insert বন্ধ করার জন্য) — এটা optional, চালানোর আগে
নিচের নোটটা পড়ে নিও।

## জেনে রাখা ভালো
- **`custom_products` টেবিলে যেসব প্রোডাক্টের row নেই, সেগুলো অর্ডার করা
  যাবে না** — stock decrement RPC সেই id খুঁজে না পেলে অর্ডার ব্লক করে
  দেবে (নিরাপত্তার জন্য ইচ্ছাকৃত)। অ্যাডমিন প্যানেল দিয়ে সবগুলো প্রোডাক্ট
  (৭টা ডিফল্ট প্রোডাক্টসহ) `custom_products`-এ আছে কিনা একবার
  নিশ্চিত করে নিও।
- Rate-limit/stock/price চেকে কোনো unexpected error হলে এখন অর্ডার
  **আটকে যাবে** ("আবার চেষ্টা করুন" মেসেজ), আগের মতো চুপচাপ allow করবে
  না — এটা security hardening-এর জন্য ইচ্ছাকৃত সিদ্ধান্ত।
- Vercel-এ Environment Variables-এ `SUPABASE_SERVICE_ROLE_KEY` অবশ্যই
  সেট থাকতে হবে (roadmap-এর A.1 ধাপেই এটা যোগ করার কথা ছিল) — নাহলে
  checkout ভেঙে যাবে।
- Turnstile checkout ফর্মে যোগ করা হয়নি (roadmap অনুযায়ী স্কোপের বাইরে,
  ইতিমধ্যে auth ফ্লোতে আছে)।
