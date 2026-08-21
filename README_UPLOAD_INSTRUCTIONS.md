# Phase F — Routing Restructure — যা যা করতে হবে GitHub-এ

এই ZIP-এ ২৫টা ফাইল আছে (নতুন + পরিবর্তিত), প্রতিটা তার আসল repo path বজায় রেখে।
সরাসরি এই ফোল্ডারের কনটেন্ট GitHub-এর "Upload files" পেজে ড্র্যাগ-ড্রপ করলে সঠিক
path-এই বসে যাবে (নতুন ফাইল হলে তৈরি হবে, পুরনো ফাইল হলে ওভাররাইট হবে)।

## ⚠️ এই ২টা পুরনো ফাইল ম্যানুয়ালি ডিলিট করতে হবে (আপলোড এটা করতে পারে না)

`/srp` রুট রিনেম করে `/search` করা হয়েছে, তাই এই দুটো পুরনো ফাইল GitHub থেকে
আলাদাভাবে ডিলিট করা লাগবে:

- `app/srp/page.tsx`  → এখন `app/search/page.tsx`
- `app/srp/SrpClient.tsx` → এখন `app/search/SearchClient.tsx`

(GitHub-এর ওয়েব UI-তে ফাইলটা খুলে ট্র্যাশ আইকনে ক্লিক করে ডিলিট করা যায়, অথবা
Vercel/GitHub-এ deploy করার আগে local clone-এ `git pull` করে `rm -r app/srp`
করে commit দেওয়া যায়।)

## ফাইল লিস্ট (২৫টা)

- `.gitignore` — build artifact (`tsconfig.tsbuildinfo`) ignore যোগ হয়েছে
- `PHASE2_MASTER_ROADMAP.md` — Phase F progress tracker আপডেট
- `app/(policies)/PolicyContent.tsx` — নতুন শেয়ার্ড policy-page primitives
- `app/(policies)/layout.tsx` — নতুন policies route group layout
- `app/(policies)/privacy-policy/page.tsx` — নতুন
- `app/(policies)/refund-policy/page.tsx` — নতুন
- `app/(policies)/terms/page.tsx` — নতুন
- `app/account/orders/AccountOrdersClient.tsx` — নতুন
- `app/account/orders/page.tsx` — নতুন
- `app/checkout/page.tsx` — Cart Guard, `/checkout/success`-এ রিডাইরেক্ট
- `app/checkout/success/SuccessClient.tsx` — নতুন
- `app/checkout/success/page.tsx` — নতুন
- `app/components/GlobalOverlays.tsx` — কমেন্ট আপডেট (SRP→সার্চ)
- `app/components/auth/AccountPage.tsx` — শেয়ার্ড `OrderCard` ব্যবহার, "সব দেখুন" লিংক
- `app/components/cart/TrackOrderModal.tsx` — শেয়ার্ড lookup হেল্পার ব্যবহার
- `app/components/checkout/WaitingOverlay.tsx` — শেয়ার্ড pending-order হেল্পার, success-পেজ গার্ড
- `app/components/home/ProductGrid.tsx` — কমেন্ট আপডেট (SRP→সার্চ)
- `app/components/layout/Footer.tsx` — Privacy/Terms/Returns লিংক এখন real route-এ যায়
- `app/components/layout/Navbar.tsx` — `/search` রুট + রিনেমড identifier
- `app/components/orders/OrderCard.tsx` — নতুন শেয়ার্ড কম্পোনেন্ট
- `app/search/SearchClient.tsx` — (আগের `app/srp/SrpClient.tsx`)
- `app/search/page.tsx` — (আগের `app/srp/page.tsx`)
- `app/track-order/TrackOrderClient.tsx` — নতুন
- `app/track-order/page.tsx` — নতুন
- `lib/orderStatus.ts` — নতুন শেয়ার্ড হেল্পার (pending order, order lookup)

## Verify করা হয়েছে

- `npx tsc --noEmit` — শূন্য error
- `next build` — সম্পূর্ণ প্রোডাকশন বিল্ড সফল, সব নতুন রুট ঠিকভাবে register হয়েছে
