# 🛡️ Vangcur — Code Audit, Security Hardening & Feature Changelog
**তারিখ:** আগস্ট ২০২৬  
**স্ট্যাক:** Next.js 15 (App Router) + React 19 + TypeScript (Strict) + Supabase + Tailwind CSS + Zustand  
**রেপোজিটরি:** `github.com/MehediVibeCoding/Vangcur`

---

## 📌 সংক্ষেপিত পরিবর্তন ও কাজের তালিকা (Executive Summary)

এই সেশনে সাইটের সার্বিক সিকিউরিটি, ডাটাবেজ ফ্রি কোটা অপ্টিমাইজেশন, এসইও (Google Rich Snippets), অ্যানালিটিক্স (GTM & Pixel), টেলিগ্রাম অটোমেশন এবং চেকআউট-ইনভয়েস সংক্রান্ত ক্রিটিক্যাল বাগসমূহ সমাধান করা হয়েছে।

---

## 📂 ১. নতুন তৈরি করা ফাইলসমূহ (New Files)

| ফাইল পাথ | ভূমিকা ও উদ্দেশ্য |
| :--- | :--- |
| `lib/telegram.ts` | নতুন অর্ডার আসা মাত্রই এডমিনের টেলিগ্রাম বোটে অর্ডারের পূর্ণাঙ্গ বিবরণসহ ইনস্ট্যান্ট অ্যালার্ট পাঠানোর মডিউল। |
| `lib/analytics.ts` | GA4, Facebook Pixel এবং TikTok Pixel-এর স্ট্যান্ডার্ড ডাটা লেয়ার ইভেন্ট (`view_item`, `add_to_cart`, `begin_checkout`, `purchase`) ফায়ার করার ইউটিলিটি। |
| `app/robots.ts` | সার্চ ইঞ্জিন ক্রলারদের জন্য পাবলিক পেজ অনুমতি এবং প্রাইভেট রুট (`/checkout`, `/account`, `/api`) ব্লক করার স্ট্যান্ডার্ড ডিরেক্টিভ। |
| `app/sitemap.ts` | ডাটাবেজ থেকে লাইভ প্রোডাক্ট, ক্যাটাগরি এবং পলিসি পেজ দিয়ে প্রতি ১ ঘণ্টায় স্বয়ংক্রিয়ভাবে ফ্রেশ XML সাইটম্যাপ তৈরির রুট। |
| `public/llms.txt` | ChatGPT, Perplexity, Gemini ও Claude-এর মতো AI সার্চ ইঞ্জিনগুলোর জন্য সাইটের নীতিমালা ও পণ্য সংক্রান্ত স্ট্যান্ডার্ড কনটেক্সট ফাইল। |

---

## 🛠️ ২. পরিবর্তিত ও আপডেট করা ফাইলসমূহ (Modified Files)

### 🔒 সিকিউরিটি ও ডাটা ভ্যালিডেশন (Security & Validation)
1. **`app/components/auth/LoginModal.tsx`**:
   - হানিপট ইনপুটের `name` ও `id` পরিবর্তন করা হয়েছে (`b_auth_extra_field`, `autoComplete="new-password"`) যাতে ক্রোম অটোফিল আসল ক্রেতাকে ব্লক না করে।
2. **`app/api/lead/route.ts`**:
   - হার্ডকোডেড Google Apps Script URL সরিয়ে `process.env.GOOGLE_APPS_SCRIPT_LEAD_URL` সাপোর্ট এবং ইনপুট দৈর্ঘ্য/ফোন ফরম্যাট ভ্যালিডেশন যুক্ত করা হয়েছে।
3. **`lib/accountData.ts`**:
   - `deleteDraft()` ফাংশনে `user_id: currentUser.id` ফিল্টার বাধ্যতামূলক করে IDOR ঝুঁকি দূর করা হয়েছে।
4. **`lib/rateLimit.ts`**:
   - ডাটাবেজ বা RPC এরর হলে রেট-লিমিট যেন বাইপাস না হয়, সেজন্য Fail-Closed (`allowed: false`) সিকিউরিটি দেওয়া হয়েছে।
5. **`lib/security.ts` & `lib/checkoutData.ts`**:
   - ঠিকানার সর্বনিম্ন দৈর্ঘ্য ক্লায়েন্ট ও সার্ভার উভয় জায়গায় সমান **৮ অক্ষর** (`length >= 8`) নির্ধারণ করা হয়েছে।
6. **`lib/sanitize.ts`**:
   - পুরনো টেস্ট ডোমেইন সরিয়ে `sanitizeHref` ফাংশনকে সেন্ট্রালাইজড `lib/security.ts` থেকে রি-এক্সপোর্ট করা হয়েছে।
7. **`app/components/modals/OfferPopup.tsx`**:
   - পপআপের রিডাইরেক্ট ফাংশনে (`navigateTo`) `sanitizeHref()` দিয়ে ওপেন রিডাইরেক্ট বা স্ক্রিপ্ট ইনজেকশন ব্লক করা হয়েছে।
8. **`next.config.js`**:
   - গ্লোবাল সিকিউরিটি রেসপন্স হেডার্স (`X-Frame-Options: SAMEORIGIN`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`) যুক্ত করা হয়েছে।

---

### ⚡ ডাটাবেজ কোটা ও পারফরম্যান্স (Database & Quota Optimization)
9. **`lib/orderStatus.ts`**:
   - ফিক্সড ৪ সেকেন্ডের পোলিং সরিয়ে **স্মার্ট ব্যাকঅফ পোলিং** (১ম মিনিটে ৫ সেকেন্ড, ২-৫ মিনিটে ১৫ সেকেন্ড, ৫-৩০ মিনিটে ৩০ সেকেন্ড এবং ৩০ মিনিট পর অটো-স্টপ) যুক্ত করা হয়েছে।
   - গেস্ট অর্ডারের ইনভয়েস রিট্রিভালের জন্য মাল্টি-লেভেল ফোন নম্বর লুকআপ জোরদার করা হয়েছে।
10. **`app/components/modals/BackInStockToast.tsx`**:
    - পেজ লোডে পুরো ডাটাবেজ ফেচের বদলে শুধুমাত্র ইউজারের নোটিফিকেশন আইডির স্টক চেক করার লাইটওয়েট কুয়েরি (`.in('id', targetIds)`) চালু করা হয়েছে।
11. **`app/globals.css`**:
    - Safari ব্রাউজারের অতিরিক্ত ব্লার অপ্টিমাইজ (`blur(20px)` / `blur(22px)`) করে আইফোনে স্ক্রলিং ল্যাগ দূর করা হয়েছে।
    - সব ছবিতে গ্লোবাল ড্র্যাগ ও সিলেক্ট প্রটেকশন (`user-select: none`, `-webkit-user-drag: none`) যুক্ত করা হয়েছে।
12. **`app/components/home/Categories.tsx`**:
    - `gridCols`, `perPage`, এবং `catPage` স্টেট সিঙ্ক্রোনাইজ করে স্ক্রিন রোটেশনে ব্ল্যাঙ্ক কার্ড সমস্যার সমাধান করা হয়েছে।

---

### 🛒 চেকআউট, ইনভয়েস ও বাগ ফিক্স (Bug Fixes & Customer Journey)
13. **`app/components/checkout/BgConfirmPopup.tsx`**:
    - সাউন্ড থ্রোটলিং (`playSoundOnce`) দিয়ে কনফার্মেশনের ডাবল সাউন্ড বন্ধ করা হয়েছে।
    - ইনভয়েস ডাউনলোডের পর পেন্ডিং ডাটা পরিষ্কার করা হয়েছে।
14. **`app/components/checkout/WaitingOverlay.tsx`**:
    - স্ট্যাটাস পেজে থাকা অবস্থায় ব্যাকগ্রাউন্ড ডুপ্লিকেট পোলিং বন্ধ রাখা হয়েছে।
    - কনফার্মেশনের পর পেন্ডিং ডাটা ক্লিয়ার করে পেজ রিফ্রেশে বারবার পপআপ ফিরে আসার লুপ বন্ধ করা হয়েছে।
15. **`app/checkout/status/StatusClient.tsx`**:
    - কনফার্মেশনের সাথে সাথে লোকাল পেন্ডিং ডাটা পরিষ্কার ও ফোন নম্বর হ্যান্ডঅফ নিশ্চিত করা হয়েছে।
16. **`app/components/modals/InvoiceModal.tsx`**:
    - ইনভয়েস ডাউনলোড বাটনে ক্লিক করলে *"❌ অর্ডার তথ্য পাওয়া যাচ্ছে না"* দেখানোর মূল বাগটি সমাধান করা হয়েছে।
17. **`app/checkout/page.tsx`**:
    - স্টেপ ১ ও ৩-এর মেমো টেক্সটগুলো (`YOUR ORDER`, `Subtotal`, `Paid`) দ্বিভাষিক (`t()`) করা হয়েছে।
    - `trackBeginCheckout()` এবং `trackPurchase()` ইভেন্ট ইন্টিগ্রেট করা হয়েছে।
    - অর্ডার সফল হলে ব্যাকগ্রাউন্ডে টেলিগ্রাম অ্যালার্ট পাঠানোর ট্রিগার যুক্ত করা হয়েছে।
18. **`app/components/orders/OrderCard.tsx`**:
    - অর্ডার কার্ডের স্ট্যাটাস ব্যাজে ভাষা অনুযায়ী বাংলা (`⏳ পেন্ডিং`, `✅ কনফার্মড`, `🚚 শিপড`) ও ইংরেজি লেবেল নিশ্চিত করা হয়েছে।

---

### 🚀 এসইও ও ট্র্যাকিং (SEO & Analytics)
19. **`app/product/[slug]/page.tsx`**:
    - গুগল সার্চ রেজাল্টে সরাসরি মূল্য (৳), রিভিউ রেটিং (★) ও স্টক স্ট্যাটাস দেখানোর জন্য ডাইনামিক **JSON-LD Product Schema** যুক্ত করা হয়েছে (ভবিষ্যতের সব নতুন প্রোডাক্টে স্বয়ংক্রিয়ভাবে কার্যকর হবে)।
20. **`app/product/[slug]/ProductDetailClient.tsx`**:
    - প্রোডাক্ট ভিউয়ে `trackViewItem()` এবং কার্টে যোগ করার সময় `trackAddToCart()` ইভেন্ট ফায়ার করার লজিক যুক্ত করা হয়েছে।
21. **`app/layout.tsx`**:
    - `NEXT_PUBLIC_GTM_ID` এনভায়রনমেন্ট ভ্যারিয়েবল থাকলে সাইটের স্পিড অক্ষুণ্ণ রেখে Google Tag Manager লোড করার স্ক্রিপ্ট যুক্ত করা হয়েছে।

---

## 🔑 ৩. প্রয়োজনীয় এনভায়রনমেন্ট ভ্যারিয়েবল তালিকা (Environment Variables)

Vercel ড্যাশবোর্ডে (`Settings` -> `Environment Variables`) নিচের ভ্যারিয়েবলগুলো প্রযোজ্য ক্ষেত্রে সেট করতে হবে:

| Variable Name | Type | Description |
| :--- | :---: | :--- |
| `TELEGRAM_BOT_TOKEN` | Secret | অর্ডার নোটিফিকেশন পাঠানোর টেলিগ্রাম বটের API Token। |
| `TELEGRAM_CHAT_ID` | Secret | এডমিনের টেলিগ্রাম অ্যাকাউন্টের নির্দিষ্ট চ্যাট আইডি (Numeric ID)। |
| `GOOGLE_APPS_SCRIPT_LEAD_URL` | Secret | চেকআউটের লিড ডাটা Google Sheet-এ সংরক্ষণের Apps Script ওয়েব অ্যাপ URL। |
| `NEXT_PUBLIC_GTM_ID` | Public | গুগল ট্যাগ ম্যানেজারের কন্টেইনার আইডি (যেমন: `GTM-XXXXXXX`)। |
| `NEXT_PUBLIC_SUPABASE_URL` | Public | Supabase প্রজেক্ট URL। |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public | Supabase প্রজেক্ট Anon Key। |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret | সার্ভার অ্যাকশনের জন্য সুপাবেস সার্ভিস রোল কী। |

---
**নোট:** ভবিষ্যতে কোনো ফাইলে আপডেট বা পরিবর্তন করার সময় এই ডকুমেন্টের আর্কিটেকচার ও সিকিউরিটি রুলগুলো অনুসরণ করলে সাইটের স্থায়িত্ব ও পারফরম্যান্স অক্ষুণ্ণ থাকবে।
