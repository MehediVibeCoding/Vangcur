guide-pages-fix.zip — আপলোড ম্যাপ (GitHub রিপো: MehediVibeCoding/Vangcur)
প্রতিটা ফাইল GitHub-এ ঠিক এই একই পাথে গিয়ে "Upload files" / "Edit" দিয়ে replace করবেন
(zip-এর ভেতরের ফোল্ডার স্ট্রাকচারটাই আসল রিপোর পাথ)।

1) app/[...segments]/GuidePageClient.tsx   → REPLACE (আগের ফাইলটা মুছে এটা বসবে)
2) app/[...segments]/loading.tsx            → NEW (নতুন ফাইল, এই পাথে আগে ছিল না)
3) app/components/guides/GuideBlocks.tsx    → REPLACE
4) app/components/GlobalOverlays.tsx        → REPLACE

আপলোডের পর Vercel-এ redeploy করলেই এই ৫টা টেমপ্লেট পেজে (পিলার, কম্প্যারিজন,
ইনস্টল, অ্যাপ ও রিমোট, ডিজাইন সিস্টেম — সবগুলোই এই একই ৪টা ফাইল দিয়ে চলে) সব
ফিক্সগুলো একসাথে লাইভ হয়ে যাবে। কোনো ফাইল ডিলিট করার দরকার নেই।
