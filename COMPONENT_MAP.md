# 🗺️ Vangcur — Component Architecture & Route Mapping Guide
**সর্বশেষ অডিট তারিখ:** সেপ্টেম্বর ২০২৬  
**ফ্রেমওয়ার্ক:** Next.js 15 (App Router) + React 19 + TypeScript (Strict)  
**স্টাইলিং ও অ্যানিমেশন:** Tailwind CSS v3 + Motion (v13) + Custom Design Tokens

---

## 📌 ১. ওভারভিউ ও আর্কিটেকচারাল প্যাটার্ন (Overview)

Vangcur প্ল্যাটফর্মের ফ্রন্টএন্ড আর্কিটেকচারটি সার্ভার-ফার্স্ট হাইব্রিড রেন্ডারিং মডেল (Server-First Hybrid RSC Architecture) মেনে চলে।

[ Root Layout (app/layout.tsx) ]
  ├── [ Page Routes (RSC) ]
  │     ├── app/page.tsx
  │     ├── app/product/[slug]/page.tsx
  │     ├── app/category/[slug]/page.tsx
  │     ├── app/search/page.tsx
  │     ├── app/account/page.tsx
  │     ├── app/checkout/page.tsx
  │     ├── app/offers/page.tsx
  │     └── app/(policies)/*
  └── [ GlobalOverlays.tsx ]
        ├── CartSidebar.tsx
        ├── WishlistDrawer.tsx
        ├── TrackOrderModal.tsx
        ├── FloatCartBadge.tsx
        ├── FloatContactButtons.tsx
        ├── BackToTopButton.tsx
        ├── WishlistFlyOverlay.tsx
        └── RareOverlays.tsx
              ├── BulkOrderModal.tsx
              ├── QuickOrderModal.tsx
              ├── OrderRateLimitModal.tsx
              ├── MembershipModal.tsx
              ├── StockNotifyModal.tsx
              ├── BackInStockToast.tsx
              ├── RecoveryToast.tsx
              ├── WaitingOverlay.tsx
              ├── BgConfirmPopup.tsx
              └── PostReceiveInfoModal.tsx

### রেন্ডারিং নীতি ও দায়িত্ব বণ্টন:
1. **Server Component (RSC):** প্রতিটি রুটের page.tsx ফাইল ডাটাবেজ থেকে ডেটা ফেচ করে, React cache() ও Edge ISR দিয়ে ক্যাশ করে, এসইও মেটাডেটা (generateMetadata) এবং JSON-LD স্কিমা ইনজেক্ট করে ক্লায়েন্ট শেলের কাছে প্রপস হিসেবে পাঠায়।
2. **Client Leaf Components ('use client'):** ইউজার ইন্টারঅ্যাকশন, কার্ট/উইশলিস্ট অ্যানিমেশন, জেস্টার হ্যান্ডলিং, এবং Zustand স্টোরের লাইভ সিঙ্ক পরিচালনা করে।

---

## 🧭 ২. রাউট ও কম্পোনেন্ট হায়ারার্কি ম্যাপিং (Route-to-Component Map)

### ১. হোমপেজ (/)
- **সার্ভার এন্ট্রি:** app/page.tsx (Edge ISR: revalidate = 120)
- **প্রধান ক্লায়েন্ট শেল:** app/ClientHome.tsx
- **সাব-কম্পোনেন্টসমূহ:**
  1. app/components/layout/Navbar.tsx — ফ্রস্টেড গ্লাস ন্যাভবার, সার্চ ড্রপডাউন, কার্ট ও উইশলিস্ট কাউন্টার ব্যাজ।
  2. app/components/home/HeroSlider.tsx — ৯:১৬ অ্যাসপেক্ট রেশিও স্টোরি কার্ড স্লাইডার, ইনফিনিট লুপ ও স্ক্রিন-আউট অটো-পজ।
  3. app/components/home/TrustStrip.tsx — ৫-ফিচার ব্র্যান্ড ট্রাস্ট ও ওয়ারেন্টি বার।
  4. app/components/home/Categories.tsx — ক্যাটাগরি ক্যারোসেল ও ইনস্ট্যান্ট ফিল্টারিং।
  5. app/components/home/ProductGrid.tsx — রেস্পন্সিভ প্রোডাক্ট গ্রিড, লেডার ব্যাচ ইনফিনিট স্ক্রোল।
     - app/components/home/ProductCard.tsx — ক্রিস্টাল লিকুইড গ্লাস বাটন, ১-ক্লিক কুইক অর্ডার, ফ্রস্টেড কার্ট ও উইশলিস্ট ফ্লাই।
  6. app/components/home/CustomerGallery.tsx — ৩D কভারফ্লো কার্ড স্লাইডার, প্যানিং লাইটবক্স ও লাইভ লাইক কাউন্টার।
  7. app/components/home/FAQ.tsx — কাস্টমার সহায়তা ড্রপডাউন অ্যাকর্ডিয়ন।
  8. app/components/home/About.tsx — ব্র্যান্ড পরিচিতি ও কোয়ালিটি প্রতিশ্রুতি।
  9. app/components/layout/Footer.tsx — ভেক্টর ওয়েভ, ফুটপ্রিন্ট ইলাস্ট্রেশন, পলিসি লিঙ্কস ও সোশ্যাল হাব।
  10. app/components/auth/LoginModal.tsx — পাসওয়ার্ড ও গুগল সাইন-ইন মডাল।

---

### ২. প্রোডাক্ট ডিটেইল পেজ (/product/[slug])
- **সার্ভার এন্ট্রি:** app/product/[slug]/page.tsx (Edge ISR: revalidate = 300)
  - ডায়নামিক মেটাডেটা, ক্যানোনিক্যাল স্লাগ এবং গুগল প্রোডাক্ট রিভিউ JSON-LD স্কিমা ইনজেকশন।
- **প্রধান ক্লায়েন্ট শেল:** app/product/[slug]/ProductDetailClient.tsx
- **সাব-কম্পোনেন্টসমূহ:**
  1. Navbar.tsx (showHomeButton ভ্যারিয়েন্ট)।
  2. **ইমেজ গ্যালারি ও পিঞ্চ-জুম ভিউয়ার:** ফুল-রেজোলিউশন ক্লাউডিনারি অপটিমাইজড ইমেজ, থাম্বনেইল স্ট্রিপ।
  3. **কুইক স্পেক পিলস ও ওয়ারেন্টি ট্রিগার:** WarrantyModal.tsx ওপেনার।
  4. **ইন্টারঅ্যাক্টিভ বটম জাম্পিং পান্ডা কার্ট বাটন:** VangcurPandaIcon অ্যানিমেশন।
  5. **ট্যাব সেকশনস:**
     - ppSecDesc (বিস্তারিত বর্ণনা)
     - ppSecFeatures (প্রধান ফিচারস বুলেট)
     - ppSecSpecs (অ্যাপল-স্টাইল মিনিমাল স্পেকস টেবিল ও প্যাকেজিং বক্স)
     - ppSecExtra (অতিরিক্ত তথ্য)
     - ppSecFaq & app/components/product/ProductQnA.tsx (কমিউনিটি Q&A ও মডারেটর রিপ্লাই)
     - ppSecReviews & app/components/product/ProductReviews.tsx (কভারফ্লো আনবক্সিং গ্যালারি, ক্যানভাস WebP আপলোডার ও পিঞ্চ-জুম লাইটবক্স)
  6. **স্টিকি বটম বার:** স্ক্রোল ট্র্যাকিং অনুযায়ী h-[42px] ও rounded-[12px] লকড "অর্ডার করুন" ও "কার্ট" বার।
  7. **একই ক্যাটাগরির আরও পণ্য গ্রিড:** ProductCard.tsx রিইউজ।

---

### ৩. ক্যাটাগরি পেজ (/category/[slug])
- **সার্ভার এন্ট্রি:** app/category/[slug]/page.tsx (Edge ISR: revalidate = 300)
- **ক্লায়েন্ট শেল:** app/ClientHome.tsx (initialCategory প্রপস সহ গ্রিড প্রাক-ফিল্টার্ড অবস্থায় প্রদর্শন)।

---

### ৪. ৩-ধাপের চেকআউট পেজ (/checkout)
- **সার্ভার এন্ট্রি:** app/checkout/page.tsx ('use client')
- **সাব-কম্পোনেন্ট ও ফ্লো:**
  1. **স্টেপার বার:** ধাপ ১ (তথ্য) -> ধাপ ২ (পেমেন্ট) -> ধাপ ৩ (নিশ্চিত)।
  2. **ধাপ ১:** নাম, ১১ ডিজিটের ফোন, জেলা ড্রপডাউন, ঠিকানা, শিপিং জোন এবং কুপন অটো-অ্যাপ্লাই ফর্ম।
  3. **ধাপ ২:** ৩-টায়ার বিকাশ সেন্ড মানি (৳২০০ বা ৫%+১.৫% বিকাশ ফি), বিকাশ কিউআর কোড গাইড ও TxnID/Last4 ইনপুট।
  4. **ধাপ ৩:** অর্ডার মেমো ইনভয়েস প্রিভিউ ও আইনি শর্তাবলীতে সম্মতি চেকবক্স।
  5. **সহায়ক মডালসমূহ:**
     - app/components/checkout/PreConfirmLoginModal.tsx (গেস্ট অর্ডার অ্যাকাউন্ট লিঙ্কিং)।
     - app/components/checkout/PolicyModal.tsx (চেকআউট ইন-লাইন টার্মস এগ্রিমেন্ট)।
     - app/components/auth/LoginModal.tsx (অর্ডার ফ্লো রিজুম সাইন-ইন)।

---

### ৫. লাইভ অর্ডার স্ট্যাটাস ও ওয়েটিং স্ক্রিন (/checkout/status)
- **সার্ভার এন্ট্রি:** app/checkout/status/page.tsx
- **প্রধান ক্লায়েন্ট শেল:** app/checkout/status/StatusClient.tsx
- **সাব-কম্পোনেন্টসমূহ:**
  1. AnimatedLiveHourglass — রিয়েল-টাইম লাইভ স্যান্ড-ফল এসভিজি অ্যানিমেশন।
  2. ৩-ধাপের ভেরিফিকেশন টাইমলাইন (অর্ডার রিসিভড -> পেমেন্ট ভেরিফিকেশন -> অর্ডার কনফার্ম)।
  3. সুপাবেস রিয়েল-টাইম চ্যানেল ও পোলিং ব্যাকঅফ (watchOrderStatus)।
  4. রিজেক্টেড বা বাতিল অর্ডারের ক্ষেত্রে সরাসরি WhatsApp সাপোর্ট বাটন।

---

### ৬. ডিজিটাল ইনভয়েস মেমো জেনারেটর (/checkout/invoice)
- **সার্ভার এন্ট্রি:** app/checkout/invoice/page.tsx
- **প্রধান ক্লায়েন্ট শেল:** app/checkout/invoice/InvoiceClient.tsx
- **সাব-কম্পোনেন্টসমূহ:**
  1. InvoiceCardBody — ৩x রেজোলিউশন ক্যানভাস উপযোগী সিঙ্গেল-সোর্স অফ ট্রুথ ইনভয়েস ডিজাইন।
  2. InvoiceSubtleWatermark — ব্র্যান্ডেড গ্যাজেট লাইন-আর্ট জলছাপ।
  3. html2canvas — ক্লায়েন্ট-সাইড ডিজিটাল পিএনজি মেমো ডাউনলোড ও লিমিট ট্র্যাকার।

---

### ৭. কাস্টমার অ্যাকাউন্ট ও প্রোফাইল ড্যাশবোর্ড (/account)
- **সার্ভার এন্ট্রি:** app/account/page.tsx
- **প্রধান ক্লায়েন্ট শেল:** app/account/AccountClient.tsx
- **সাব-কম্পোনেন্টসমূহ:**
  1. **লাইভ ওয়েদার ও সেলেস্টিয়াল কার্ড:** ওপেন-মেটিও লাইভ রেইন ডিটেকশন, ডানা ঝাপটানো পাখি, তারা, সূর্য/চাঁদ এবং সিনারি ল্যান্ডস্কেপ।
  2. **৩-স্ট্যাটাস চিপস:** মোট অর্ডার, থিম মোড এবং মেম্বারশিপ লেভেল।
  3. **ভাষা পরিবর্তন উইজেট:** বাংলা ও ইংরেজি টগল।
  4. **ড্রাফট রিকভারি কার্ড:** অসম্পূর্ণ চেকআউট ড্রাফট রিজুম বা ডিলিট।
  5. **স্টক নোটিফিকেশন কার্ড:** ইন-স্টক অ্যালার্টস ও ১-ক্লিক অর্ডার।
  6. **আমার অর্ডার সমূহ:** app/components/orders/OrderCard.tsx (সর্বোচ্চ ৫টি রিসেন্ট অর্ডার)।
  7. app/components/modals/MembershipModal.tsx — মেম্বারশিপ স্পিন হুইল ও ভিআইপি রিওয়ার্ডস।

---

### ৮. সম্পূর্ণ অর্ডার হিস্টোরি পেজ (/account/orders)
- **সার্ভার এন্ট্রি:** app/account/orders/page.tsx
- **প্রধান ক্লায়েন্ট শেল:** app/account/orders/AccountOrdersClient.tsx
- **সাব-কম্পোনেন্টসমূহ:**
  1. Navbar.tsx ও Footer.tsx।
  2. অর্ডার নম্বর সার্চ ও ফিল্টার ইনপুট (MAX_ORDER_QUERY_LEN = 20)।
  3. OrderCard.tsx লিস্ট এবং স্ট্যাটাস ব্যাজ ফিল্টারিং (চলমান, সম্পন্ন, বাতিল)।

---

### ৯. সার্চ ও ফিল্টার পেজ (/search)
- **সার্ভার এন্ট্রি:** app/search/page.tsx (RSC + Client Sync)
- **প্রধান ক্লায়েন্ট শেল:** app/search/SearchClient.tsx
- **সাব-কম্পোনেন্টসমূহ:**
  1. SearchHeader — ৬০ ক্যারেক্টার লিমিট লকড debounced (300ms) সার্চ বার।
  2. ম্যাচিং ক্যাটাগরি চিপস ও সাজেশন্স।
  3. ফিল্টার্ড ProductCard.tsx গ্রিড ও অটো-লোডমোর বাটন।

---

### ১০. অফার ও প্রমোশনাল হাব (/offers)
- **সার্ভার এন্ট্রি:** app/offers/page.tsx (Edge ISR: revalidate = 120)
- **প্রধান ক্লায়েন্ট শেল:** app/offers/OffersClient.tsx
- **মডেল রেন্ডারার:**
  - Model 1: টাইটেল, বডি ও অ্যাকশন বাটন সহ প্রমোশনাল টেক্সট ক্যাম্পেইন।
  - Model 2: ফুল-উইডথ ব্যানার ইমেজ ক্যাম্পেইন।
  - Model 3: সপ্তাহের সেরা হট ডিল প্রোডাক্ট কার্ড (সরাসরি ১-ক্লিক কুইক অর্ডার সহ)।

---

### ১১. গেস্ট অর্ডার ট্র্যাকিং পেজ (/track-order)
- **সার্ভার এন্ট্রি:** app/track-order/page.tsx
- **প্রধান ক্লায়েন্ট শেল:** app/track-order/TrackOrderClient.tsx
- **সাব-কম্পোনেন্টসমূহ:** গেস্ট অর্ডার লোকাল স্টোরেজ লুকআপ, অর্ডার নম্বর ও ফোন নম্বর ম্যাচিং এবং OrderCard.tsx রেন্ডারিং।

---

### ১২. আইনি ও পলিসি পেজসমূহ (app/(policies)/*)
- **শেয়ার্ড লেআউট:** app/(policies)/layout.tsx (ডেস্কটপ গ্যাজেট সাইড ডেকোরেশন ও শেয়ার্ড ন্যাভ/ফুটার)।
- **শেয়ার্ড প্রিমিটিভ:** app/(policies)/PolicyContent.tsx (PolicyHeader, PolicySection, PolicyNote, PolicyContact, PolicyBulletPoint)।
- **রাউটসমূহ:**
  - /guide -> app/(policies)/guide/GuideClient.tsx (পূর্ণাঙ্গ ইউজার গাইড ও অর্ডার সহায়িকা)।
  - /shipping -> app/(policies)/shipping/ShippingClient.tsx (ডেলিভারি এলাকা, সময় ও চার্জ)।
  - /terms -> app/(policies)/terms/TermsClient.tsx (ডিজিটাল কমার্স শর্তাবলী ও বিক্রয় চুক্তি)।
  - /refund-policy -> app/(policies)/refund-policy/RefundPolicyClient.tsx (রিটার্ন, ১০০% ফ্রি রিপ্লেসমেন্ট ও আনবক্সিং ভিডিও নির্দেশিকা)।
  - /privacy-policy -> app/(policies)/privacy-policy/PrivacyPolicyClient.tsx (ব্যক্তিগত তথ্যের নিরাপত্তা ও ডেটা সুরক্ষা)।

---

## 🌐 ৩. সেন্ট্রালাইজড গ্লোবাল ওভারলেস রেজিস্ট্রি

অ্যাপ্লিকেশনের যেকোনো পেজ বা কম্পোনেন্ট থেকে ইভেন্ট ট্রিগার হওয়া মাত্রই app/components/GlobalOverlays.tsx এবং RareOverlays.tsx-এর মাধ্যমে নিচের মডাল ও ড্রয়ারগুলো সার্বজনীনভাবে মাউন্ট হয়:

| কম্পোনেন্ট ফাইল | মাউন্ট লেয়ার | ট্রিগার ইভেন্ট / সোর্স | প্রধান দায়িত্ব |
| :--- | :--- | :--- | :--- |
| CartSidebar.tsx | GlobalOverlays | OPEN_CART_EVENT | ডানদিক থেকে স্লাইড-ইন শপিং কার্ট ড্রয়ার, কুপন প্রয়োগ ও চেকআউট বাটন। |
| WishlistDrawer.tsx | GlobalOverlays | OPEN_WISHLIST_EVENT | গ্রাহকের পছন্দের পণ্য তালিকা, ১-ক্লিক অর্ডার ও কার্টে যোগ। |
| TrackOrderModal.tsx | GlobalOverlays | OPEN_TRACK_ORDER_EVENT | যেকোনো পেজে ভাসমান গেস্ট অর্ডার লুকআপ ও ট্র্যাকিং মডাল। |
| FloatCartBadge.tsx | GlobalOverlays | কার্ট আইটেম কাউন্টার | ডানপাশে ভাসমান কার্ট বাটন ও জিগল জাম্প অ্যানিমেশন। |
| FloatContactButtons.tsx | GlobalOverlays | সার্বজনীন লেআউট | ডানপাশে ভাসমান WhatsApp ও Messenger চ্যাট হাব। |
| BackToTopButton.tsx | GlobalOverlays | স্ক্রোল > ৮৫০px | স্ক্রিনের শীর্ষে মসৃণভাবে ফিরে যাওয়ার বাটন। |
| WishlistFlyOverlay.tsx | GlobalOverlays | WISHLIST_FLY_EVENT | প্রোডাক্ট বাটন থেকে ন্যাভবার পর্যন্ত উড়ে যাওয়া হার্ট অ্যানিমেশন। |
| BulkOrderModal.tsx | RareOverlays | OPEN_BULK_ORDER_EVENT | ২০,০০০ টাকার বেশি অর্ডারে স্বয়ংক্রিয় WhatsApp বাল্ক উইন্ডো। |
| QuickOrderModal.tsx | RareOverlays | OPEN_QUICK_CART_MODAL_EVENT | একাধিক পণ্য থাকা অবস্থায় ১-ক্লিক কুইক শপিং কার্ট মডাল। |
| OrderRateLimitModal.tsx | RareOverlays | OPEN_ORDER_LIMIT_EVENT | একই ডিভাইস থেকে ২৪ ঘণ্টায় ৩টির বেশি অর্ডার হলে সতর্কতা উইন্ডো। |
| MembershipModal.tsx | RareOverlays | OPEN_MEMBERSHIP_EVENT | ভিআইপি মেম্বারশিপ স্পিন হুইল ও ক্যাশব্যাক কুপন জেনারেটর। |
| StockNotifyModal.tsx | RareOverlays | STOCK_NOTIFY_EVENT | আউট-অব-স্টক প্রোডাক্টে কাস্টমার নোটিফিকেশন সাবমিশন ফর্ম। |
| BackInStockToast.tsx | RareOverlays | হোমপেজ ব্যাকগ্রাউন্ড চেক | পূর্বে অনুরোধ করা পণ্য স্টকে আসামাত্র নিচের ভাসমান টোস্ট কার্ড। |
| RecoveryToast.tsx | RareOverlays | হোমপেজ ড্রাফট ডিটেক্টর | অসম্পূর্ণ চেকআউট ড্রাফট ১-ক্লিকে উদ্ধার করার টোস্ট। |
| WaitingOverlay.tsx | RareOverlays | OPEN_WAIT_OVERLAY_EVENT | পেন্ডিং অর্ডারের লাইভ অনুমোদন পর্যবেক্ষণ overlay। |
| BgConfirmPopup.tsx | RareOverlays | SHOW_BG_CONFIRM_EVENT | ব্যাকগ্রাউন্ডে অর্ডার কনফার্ম হওয়ামাত্র সাউন্ড ও কনফার্মেশন পপআপ। |
| PostReceiveInfoModal.tsx | RareOverlays | ইনভয়েস পেজ থেকে রিটার্ন | পার্সেল গ্রহণের পর করণীয় আনবক্সিং ভিডিও নির্দেশিকা মডাল। |

---

## 🧩 ৪. শেয়ার্ড UI প্রিমিটিভস (app/components/ui/)

1. **PremiumButton.tsx:**  
   মৃদু স্প্রিং বাউন্স (whileTap={{ scale: 0.96 }}), শিমার বিম এবং idle -> loading -> success স্টেট মেশিন সম্বলিত সার্বজনীন CTA বাটন।
2. **SkeletonTransition.tsx:**  
   স্কেলেটন থেকে আসল ডেটায় রূপান্তরের সময় লেআউট জাম্প বা ফ্লিকার রোধে AnimatePresence ক্রসফেড র্যাপার।
3. **Skeletons.tsx:**  
   OrderListSkeleton, CompactOrderListSkeleton, ReviewGallerySkeleton, QnAListSkeleton, এবং InvoiceLoadingSkeleton কঙ্কাল প্লেসহোল্ডার।
4. **ScrollReveal.tsx:**  
   ভিউসার্ফেসে স্ক্রোল করার সাথে সাথে কম্পোনেন্ট স্মুথভাবে দৃশ্যমান করার মোশন কম্পোনেন্ট।
5. **UserAvatar.tsx:**  
   কাস্টমার ও অ্যাডমিনের নামের আদ্যক্ষর (Initials) ভিত্তিক ডায়নামিক গ্রেডিয়েন্ট প্রোফাইল অবতার।
