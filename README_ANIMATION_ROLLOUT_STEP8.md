# Vangcur — Premium Animation Rollout (Step 1–8, একসাথে)

এই zip-এ Step 1–7 (আগের সেশনগুলোর কাজ) + Step 8 (ফিক্সড-টাইম বাটন-অ্যানিমেশন বনাম prefetch race) — সব ফাইল একসাথে আছে। সব ফাইল রিপোতে হুবহু এই পাথেই বসাবে (replace/নতুন), তারপর push করলেই Vercel-এ লাইভ হয়ে যাবে।

## Step 8 — ফিক্সড-টাইম বাটন-অ্যানিমেশন বনাম prefetch race

### `Categories.tsx` — কোনো পরিবর্তন করা হয়নি
প্রথমে ভেরিফাই করে দেখা গেছে `handleSelect` আসলে কোনো Next.js route navigation করে না — এটা `window.history.replaceState` দিয়ে URL কসমেটিকভাবে বদলায় আর `CATEGORY_FILTER_EVENT` ডিসপ্যাচ করে, যেটা `ProductGrid.tsx` সিঙ্ক্রোনাসলি ধরে ফিল্টার করে ফেলে — সবটাই একই হোমপেজে, রেন্ডার ইনস্ট্যান্ট। যেহেতু এখানে prefetch/navigation race করার মতো কোনো async কাজ নেই, ব্যবহারকারীর সিদ্ধান্ত অনুযায়ী এই ফাইলে হাত দেওয়া হয়নি।

### `ProductCard.tsx` + `lib/productData.ts` — ফিক্সড-টাইম নেভিগেশন যোগ হয়েছে

**নতুন প্যাটার্ন (`NAV_ANIM_MS = 300`, `ProductCard.tsx`-এ):**
- ক্লিক করামাত্র ফিক্সড ৩০০ms ধরে একটা "প্রেস" ভিজ্যুয়াল ফিডব্যাক চলে (স্কেল-ডাউন + সামান্য ডিম) — নেট/ডিভাইস স্পিড অনুযায়ী এই সময় কখনো বদলায় না।
- ৩০০ms শেষ হলে `router.push()` কল হয়। ততক্ষণে Next.js-এর prefetch cache-এ যদি টার্গেট পেজের ডেটা রেডি থাকে (যেটা `<Link prefetch={true}>`-এর viewport-based auto-prefetch থেকেই সাধারণত হয়ে যায়), নেভিগেশন ইনস্ট্যান্ট হয় — কোনো স্কেলেটন দেখা যায় না। রেডি না থাকলে, টার্গেট রুটের নিজস্ব `loading.tsx` (Suspense fallback) স্বাভাবিকভাবেই বাকিটা দেখায়।
- **কোনো কাস্টম "prefetch শেষ হয়েছে কিনা" ডিটেকশন লজিক লাগেনি** — Next.js App Router-এর prefetch cache + streaming built-in ভাবেই এই race হ্যান্ডেল করে। শুধু navigation-টা ফিক্সড সময়ের জন্য পিছিয়ে দেওয়া হয়েছে।
- `prefers-reduced-motion: reduce` থাকলে এই ডিলে সম্পূর্ণ স্কিপ হয়ে যায় — সরাসরি ইনস্ট্যান্ট নেভিগেট করে।
- Modified click (ctrl/cmd/shift/alt/মিডল-ক্লিক) ধরা পড়লে ব্রাউজারের ডিফল্ট `<Link>` আচরণ (নতুন ট্যাব ইত্যাদি) অক্ষুণ্ন থাকে — কাস্টম হ্যান্ডলার সেখানে হস্তক্ষেপ করে না।

**কোথায় প্রযোজ্য:**
- প্রোডাক্ট ছবি ও নামের `<Link>` (`productHref(p)`-এ যাওয়ার পথ) — `pendingNav === 'product'`।
- "Order Now" বাটন (`handleOrderNowDirect`) — **শুধুমাত্র সেই ব্র্যাঞ্চে যেখানে `startQuickOrder` সিদ্ধান্ত নেয় কার্ট খালি + মোট ২০k-এর নিচে, ফলে সরাসরি `/checkout`-এ পুশ হয়** (`pendingNav === 'checkout'`)। অন্য দুই ব্র্যাঞ্চে (বাল্ক-অর্ডার গার্ড মডাল, বা কার্টে যোগ করে quick-cart মডাল ওপেন) কোনো নেভিগেশনই হয় না, তাই ওগুলো আগের মতোই সম্পূর্ণ instant থেকে গেছে — কোনো ডিলে যোগ হয়নি।

**`lib/productData.ts`-এ যে ছোট রিফ্যাক্টর করা হয়েছে:**
`startQuickOrder()`-এ একটা ঐচ্ছিক ৪র্থ প্যারামিটার (`navigate`) যোগ করা হয়েছে, ডিফল্ট মান `(href) => router.push(href)` (আগের আচরণ অপরিবর্তিত)। `ProductCard.tsx` এই প্যারামিটারে একটা কাস্টম ফাংশন পাস করে যেটা ৩০০ms ডিলে দিয়ে তারপর নেভিগেট করে। এভাবে branch-decision লজিক (`startQuickOrder`-এর ভেতরেই) ডুপ্লিকেট করতে হয়নি — শুধু checkout-navigation-এর টাইমিং কন্ট্রোল করা হয়েছে।
`app/product/[slug]/ProductDetailClient.tsx`-এর `startQuickOrder(router, prod, qty)` কলটা এই প্যারামিটার পাস করে না, তাই সেখানকার "Order Now" বাটন আগের মতোই সম্পূর্ণ instant থেকে গেছে (এই ধাপের স্কোপের বাইরে)।

## যা টেস্ট করা হয়েছে
পুরো প্রজেক্ট `npx tsc --noEmit` দিয়ে চেক করা হয়েছে — **০টা টাইপ এরর**।
