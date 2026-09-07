# Vangcur — আপডেট করা ফাইলগুলো

এই ZIP-এর ভেতরের ফোল্ডার স্ট্রাকচারটা তোমার রিপোর পাথ অনুযায়ীই সাজানো।
শুধু এই ফাইলগুলো তোমার রিপোতে (একই পাথে) কপি-পেস্ট/ওভাররাইট করে দিলেই হবে।

## ⚠️ বসানোর আগে অবশ্যই করতে হবে — Supabase SQL Editor-এ রান করো:

```sql
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS district TEXT;
```

এটা না করলে প্রোফাইল সেভ করার সময় এরর আসবে।

## ফাইল লিস্ট ও কী ঠিক হয়েছে

- `app/(policies)/privacy-policy/PrivacyPolicyClient.tsx` — ব্যাকএন্ড/ডাটাবেজ প্রযুক্তির নাম (Supabase, PostgreSQL, RLS, Cloudinary) সরানো হয়েছে
- `middleware.ts` — CSP ও HSTS সিকিউরিটি হেডার যোগ করা হয়েছে
- `app/components/cart/TrackOrderModal.tsx` — গেস্ট অর্ডার ট্র্যাকিং থেকে arbitrary ফোন-নম্বর সার্চ সরিয়ে নিরাপদ ডিভাইস-ভিত্তিক ফিল্টার বসানো হয়েছে
- `app/components/product/UserAvatar.tsx` — টিমের অ্যাভাটারে আসল লোগো বসানো হয়েছে
- `app/components/product/VerifiedBadges.tsx` (নতুন) — টিমের নীল ব্যাজ ও কাস্টমারের সবুজ ব্যাজ
- `app/components/product/ProductQnA.tsx` — কালার ফিক্স, ব্যাজ ডুপ্লিকেশন ফিক্স, রিপ্লাই-টার্গেট বাগ ফিক্স, সবুজ ব্যাজ যোগ
- `app/components/product/ProductReviews.tsx` — সবুজ ভেরিফিকেশন ব্যাজ যোগ করা হয়েছে
- `app/components/account/CompleteProfileModal.tsx` (নতুন) — নাম/ফোন/জেলা/ঠিকানা ফর্ম, ফুল sanitization সহ
- `app/account/AccountClient.tsx` — প্রোফাইল-অসম্পূর্ণ ব্যানার যোগ
- `app/checkout/page.tsx` — সেভ করা প্রোফাইল থেকে অটো-ফিল যোগ করা হয়েছে
- `lib/profileData.ts` (নতুন) — প্রোফাইল fetch/update লজিক, দৈনিক ৫ বার এডিট-লিমিট
- `lib/security.ts` — নতুন sanitizePhoneInput + আরও শক্ত sanitizeAddressInput
- `public/vangcur-team-avatar.png` (নতুন) — গোল করে ক্রপ করা লোগো
- `DATABASE_SCHEMA.md` — নতুন address/district কলাম ডকুমেন্ট করা হয়েছে

## এখনো বাকি (আলোচনা সাপেক্ষ, এখনো কাজ শুরু হয়নি)
- Gmail হার্ডকোড + is_admin (ক্রিটিকাল, আলাদাভাবে গভীর বিশ্লেষণ দরকার — তোমার নির্দেশ অনুযায়ী মুলতবি)
