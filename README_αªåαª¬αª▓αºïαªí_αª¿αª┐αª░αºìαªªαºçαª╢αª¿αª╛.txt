এই zip-এ যা আছে:

আপডেট হওয়া ফাইল (৫টা — GitHub-এ একই পাথে থাকা পুরনো ফাইলটা replace/overwrite হয়ে যাবে):
  1. lib/uiEvents.ts
  2. app/components/RareOverlays.tsx
  3. app/components/checkout/WaitingOverlay.tsx
  4. app/components/modals/InvoiceModal.tsx
  5. app/checkout/success/SuccessClient.tsx
  6. lib/i18n/dictionary.ts

নতুন ফাইল (১টা):
  7. app/components/checkout/PostReceiveInfoModal.tsx

⚠️ ম্যানুয়ালি একটা কাজ বাকি (zip দিয়ে ফাইল ডিলিট করা যায় না বলে):
  GitHub থেকে এই ফাইলটা ডিলিট করে দিতে হবে:
    app/components/checkout/PostOrderInfoModal.tsx
  (এটা আর কোথাও থেকে ব্যবহার হয় না — নতুন PostReceiveInfoModal.tsx এর
  জায়গা নিয়েছে, আর "এরপর কী হবে?" বাটন দুটোও সরিয়ে ফেলা হয়েছে।)

কী ফিক্স হলো:
- ইনভয়েস মডাল বন্ধ করলে (checkout-success ফ্লো-তে) এখন সঠিকভাবে
  "প্রোডাক্ট পাওয়ার পর করণীয়" (আনবক্সিং ভিডিও রিমাইন্ডার) দেখাবে, আগের
  ভুল "এরপর কী হবে?" (অর্ডার ভেরিফিকেশন স্টেপ) এর বদলে।
- অর্ডার pending/waiting অবস্থায় (WaitingOverlay ও checkout/success পেজে)
  "এরপর কী হবে?" বাটন দুটো সম্পূর্ণ সরিয়ে ফেলা হয়েছে।
- "বিস্তারিত ট্র্যাক করুন" বাটনটাও (দুই ফাইলের মোট ৪টা জায়গা থেকে) সম্পূর্ণ
  সরিয়ে ফেলা হয়েছে। মনে রাখবেন: SuccessClient.tsx পেজে ওপরের Navbar-এ
  ট্র্যাক করার আইকন/বাটন এখনো আছে, সেখান থেকে ট্র্যাক করা যাবে। কিন্তু
  WaitingOverlay (ফ্লোটিং ওভারলে, যেটাতে নিজের কোনো Navbar নেই) থেকে এখন
  সরাসরি ট্র্যাক করার কোনো বাটন নেই — ইউজারকে আগে "ওয়েবসাইটে ফিরে যান" বা
  "বন্ধ করুন" চেপে ওভারলে বন্ধ/মিনিমাইজ করে তারপর সাইটের Navbar থেকে ট্র্যাক
  করতে হবে। এটা ইচ্ছাকৃতভাবেই রাখা হয়েছে যেহেতু আপনি বাটনটা সরাতে বলেছিলেন —
  যদি চান, WaitingOverlay-তেও Navbar-এর মতো কোনো ট্র্যাক অপশন রাখা যায়,
  জানাবেন।

যাচাই করা হয়েছে:
- npx tsc --noEmit → 0 errors
- next build (full production build) → সফল, সব রুট ঠিকভাবে register হয়েছে

