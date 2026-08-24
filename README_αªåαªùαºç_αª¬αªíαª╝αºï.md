# শুধু পরিবর্তিত ফাইল (এই সেশনের সবশেষ ফিক্সসহ)

তোমার GitHub রিপোতে (MehediVibeCoding/Vangcur) নিচের path অনুযায়ী বসিয়ে/ওভাররাইট করে দাও:

## এডিট হয়েছে (ওভাররাইট করবে):
- app/checkout/page.tsx
- app/checkout/status/StatusClient.tsx
- app/checkout/success/page.tsx
- app/components/checkout/WaitingOverlay.tsx
- app/components/checkout/BgConfirmPopup.tsx
- app/components/checkout/PostReceiveInfoModal.tsx
- app/components/modals/InvoiceModal.tsx

## মুছে ফেলতে হবে (ডুপ্লিকেট বাগযুক্ত ফাইল, রিপো থেকে ডিলিট করে দাও):
- app/checkout/success/SuccessClient.tsx

বাকি প্রজেক্টের কোনো ফাইলে হাত দেওয়া হয়নি।

## এই রাউন্ডে যা ঠিক হয়েছে:
1. কনফার্ম/রিজেক্ট হলে কিছু না দেখানোর বাগ — /checkout/status পেজের নিজস্ব
   আলাদা (ডুপ্লিকেট) কনফার্ম-লজিক ছিল যেটা কখনো ঠিক করা হয়নি, এখন সেটাও
   একই BgConfirmPopup-এ হ্যান্ডঅফ করে। কর্নার badge-এ থাকা অবস্থায় রিজেক্ট
   হলে badge "প্রসেস হচ্ছে..." তেই আটকে থাকত — এখন রিজেক্ট হলে badge
   অটোমেটিক পুরো প্যানেলে খুলে ফলাফল দেখায়।
2. ওয়েটিং ওভারলের সাদা ব্যাকগ্রাউন্ড বদলে সাইটের আসল sky-gradient ব্যাকগ্রাউন্ড
   বসানো হয়েছে (layout.tsx-এর গ্র্যাডিয়েন্টের সাথে মিলিয়ে)।
3. নতুন লজিক: অর্ডার সাবমিট করার পরে সরাসরি প্রথমবার এলে পুরো ওয়েটিং পেজ
   দেখাবে, কিন্তু রিফ্রেশ/বন্ধ করে আবার ঢুকলে সরাসরি হোমে + কর্নারে ছোট্ট
   badge দেখাবে (sessionStorage মার্কার দিয়ে প্রথমবার-বনাম-রিফ্রেশ আলাদা
   করা হয়েছে)।
