ভাঙচুর (Vangcur) — পারফরম্যান্স + সিকিউরিটি অডিট ফিক্স
GitHub repo: MehediVibeCoding/Vangcur
আপলোড পদ্ধতি: প্রতিটা ফাইল GitHub-এর ওয়েব UI দিয়ে নিচের ঠিক একই পাথে "Upload files" / "Edit" করে রিপ্লেস করো।

=== কোড ফাইল (৯টা) ===
app/(policies)/guide/GuideClient.tsx        → prefetch={true} বাদ (১১টা)
app/account/AccountClient.tsx               → prefetch={true} বাদ (১টা)
app/components/home/ProductCard.tsx         → prefetch={true} বাদ (২টা) + hover/touch prefetch যোগ
app/components/layout/Footer.tsx            → prefetch={true} বাদ (১২টা)
app/components/layout/Navbar.tsx            → prefetch={true} বাদ (২টা)
app/fonts.ts                                → অব্যবহৃত Playfair Display ফন্ট সম্পূর্ণ বাদ
app/layout.tsx                              → Playfair রেফারেন্স বাদ + Supabase preconnect যোগ
app/offers/OffersClient.tsx                 → prefetch={true} বাদ (৫টা)
app/product/[slug]/ProductDetailClient.tsx  → bare prefetch shorthand বাদ (১টা)
app/search/SearchClient.tsx                 → prefetch={true} বাদ (১টা)

=== কনফিগ (৩টা) ===
next.config.js       → experimental.optimizeCss: true যোগ
package.json          → "critters" ডিপেন্ডেন্সি যোগ (optimizeCss-এর জন্য দরকার)
package-lock.json      → উপরেরটার জন্য নিয়মিত npm install দিয়ে regenerate করা, সাথে আপলোড করো

=== ছবি (১৮টা, public/brands/) ===
সবগুলো একই নাম/সাইজ/মাত্রা — শুধু রি-কম্প্রেস (quality=82), ভিজ্যুয়ালি অপরিবর্তিত:
anker.webp, awei-white.webp, awei.webp, baseus-white.webp, baseus.webp,
boya.webp, havit.webp, hoco-white.webp, hoco.webp, jbl.webp, joyroom.webp,
oraimo.webp, qcy-white.webp, qcy.webp, remax-white.webp, remax.webp,
ugreen.webp, xiaomi.webp
→ এই ১৮টা শুধু /public/brands/ ফোল্ডারে একই নামে আপলোড করলেই পুরনোটা রিপ্লেস হয়ে যাবে।

=== ডাটাবেজ (ইতিমধ্যে লাইভে প্রয়োগ করা হয়েছে, কিছু আপলোড করার দরকার নেই) ===
নিচের মাইগ্রেশনগুলো Supabase-এ সরাসরি চালানো হয়ে গেছে, এখানে আলাদা কোনো ফাইল নেই:
1. consolidate_duplicate_rls_policies_perf — customer_reviews/product_questions/product_reviews-এর
   ২৫টা ডুপ্লিকেট RLS policy মার্জ, stock_logs-এর auth_rls_initplan ফিক্স
2. lockdown_stock_rpcs_and_profile_completion — decrement_product_stock/restore_product_stock-এর
   anon/authenticated/PUBLIC EXECUTE REVOKE (P0 stock-manipulation বাগ ফিক্স),
   get_profile_completion_status থেকে anon/PUBLIC EXECUTE REVOKE

=== এখনো বাকি / আমি ইচ্ছাকৃতভাবে ছুঁইনি ===
- pg_trgm এক্সটেনশনের স্কিমা (public) — ৫টা লাইভ সার্চ ইনডেক্স নির্ভরশীল, ঝুঁকি নেওয়া হয়নি
- pg_net এক্সটেনশনের স্কিমা — চেষ্টা করা হয়েছিল, Postgres নিজেই আটকে দিয়েছে (relocatable=false)
- "Leaked password protection" — Supabase Dashboard → Authentication সেটিংস থেকে নিজে এক ক্লিকে অন করতে হবে
- fetchOrderedFilteredIds()-এর SQL-side ক্যাটাগরি-ফিল্টারিং রিফ্যাক্টর — লাইভ catalog-এ মাত্র ১টা
  প্রোডাক্ট থাকায় এখন টেস্ট করার মতো বাস্তব ডেটা নেই; লঞ্চের কাছাকাছি বাস্তব ক্যাটালগ দিয়ে আলাদাভাবে করা উচিত
- নতুন ৪টা loyalty/tier RPC ফাংশন (claim_legendary_reward, get_my_tier_rewards, spin_tier_wheel,
  reactivate_tier_reward) যেগুলো Advisor-এ "SECURITY DEFINER, anon/authenticated-executable" দেখাচ্ছে —
  এই সেশনে আলাদা করে অডিট করা হয়নি, তাই না ছুঁয়ে রাখা হয়েছে
- bkash-scan-hand.png (1.87MB) আর delivery-courier.png (1.03MB) — /public-এ সম্পূর্ণ অব্যবহৃত, মোছা হয়নি

আপলোড শেষে Vercel রিডিপ্লয় হয়ে গেলে PageSpeed Insights আবার চালিয়ে মোবাইল স্কোর/LCP দেখে জানিও।
