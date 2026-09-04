# 🗺️ Vangcur — Module Dependency Map & Shared Utilities Registry
**সর্বশেষ অডিট তারিখ:** সেপ্টেম্বর ২০২৬  
**আওতাভুক্ত ডিরেক্টরি:** `lib/`, `types/`, `app/actions/`, `app/api/`

---

## 📌 ১. ওভারভিউ (Overview)

Vangcur প্ল্যাটফর্মের আর্কিটেকচারে কোড ডুপ্লিকেশন রোধ এবং জিরো-বাগ ডিপ্লয়মেন্ট নিশ্চিত করতে `lib/` ডিরেক্টরিতে মোট ৩৭টি শেয়ার্ড ইউটিলিটি, স্টেট স্টোর ও ডাটা ইঞ্জিন তৈরি করা হয়েছে। 

এই ডকুমেন্টটিতে প্রতিটি মডিউলের দায়িত্ব, এক্সপোর্ট, কনজিউমার ফাইল তালিকা এবং **উচ্চ-ঝুঁকিপূর্ণ শেয়ার্ড ফাইলসমূহ (High-Risk Shared Modules)** বিস্তারিতভাবে নথিভুক্ত করা হয়েছে।

---

## 🚨 ২. উচ্চ-ঝুঁকিপূর্ণ শেয়ার্ড মডিউল (High-Risk Shared Files)

নিচের মডিউলগুলোতে কোনো পরিবর্তন বা রিফ্যাক্টরিং করার আগে অত্যন্ত সতর্কতা অবলম্বন করতে হবে, কারণ এদের সামান্য পরিবর্তন পুরো ওয়েবসাইটের একাধিক কোর ফ্লো (চেকআউট, ইনভেন্টরি, নেভিগেশন, সিকিউরিটি) ভেঙে দিতে পারে:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       HIGH-RISK CRITICAL MODULES                            │
├──────────────────────┬──────────────────────────────────────────────────────┤
│ lib/checkoutData.ts  │ ৩-টায়ার পেমেন্ট, জেলা, শিপিং ও ২০k বাল্ক লিমিট।    │
│ lib/productData.ts   │ ক্যাটালগ ফেচ, ১-ক্লিক কুইক অর্ডার ও ২০k আর্লি গার্ড। │
│ lib/security.ts      │ নাম, ফোন, ঠিকানা ও ইমেইল রিজেক্স ভ্যালিডেশন/স্যানিটাইজ।│
│ lib/useHistoryModal.ts│ ব্রাউজার পপস্টেট রেস-কন্ডিশন ফিক্স ও ব্যাক বাটন।    │
│ lib/couponData.ts    │ লাইভ কুপন ভ্যালিডেশন ও ডিসকাউন্ট রিক্যালকুলেটর।     │
│ lib/orderStatus.ts   │ রিয়েল-টাইম অর্ডার স্ট্যাটাস চ্যানেল ও পোলিং ইঞ্জিন।  │
│ lib/toast.ts         │ সেন্ট্রালাইজড ডাইনামিক টোস্ট ইঞ্জিন (রং ও আইকন)।     │
│ lib/store/*.ts       │ Zustand পারসিস্টেড স্টোরস (Cart, Wishlist, Auth)।   │
│ lib/supabase/*.ts    │ SSR Cookies, Server Client ও Service Role Client।    │
└──────────────────────┴──────────────────────────────────────────────────────┘
```

---

## 📊 ৩. সম্পূর্ণ মডিউল ডিপেন্ডেন্সি ও কনজিউমার ম্যাট্রিক্স (Full Matrix)

### ১. ই-কমার্স ও অর্ডার ইঞ্জিন (E-Commerce & Order Pipeline)

#### `lib/checkoutData.ts` ⚠️ [HIGH RISK]
- **দায়িত্ব:** ৩-টায়ার ডায়নামিক অগ্রিম পেমেন্ট ক্যালকুলেটর (টায়ার ১: ফিক্সড ২০০, টায়ার ২: ৫%+১.৫% বিকাশ ফি, টায়ার ৩: ২০k+ বাল্ক), জেলা লিস্ট (`DISTRICTS`), ডিস্ট্রিক্ট ইংরেজি ম্যাপিং, শিপিং রেট কনফিগ এবং ফোন/ঠিকানা/TxnID রিজেক্স ভ্যালিডেশন।
- **প্রধান এক্সপোর্ট:** `calculateAdvancePayment()`, `getShipOptions()`, `shipPrice()`, `validatePhone()`, `validateAddress()`, `validateTxnId()`, `MAX_ONLINE_ORDER_TOTAL`।
- **কনজিউমার ফাইলসমূহ:**
  - `app/actions/checkout.ts` (সার্ভার অ্যাকশন)
  - `app/checkout/page.tsx` (চেকআউট ফর্ম)
  - `app/components/cart/CartSidebar.tsx` (কার্ট ড্রয়ার)
  - `app/components/cart/QuickOrderModal.tsx` (কুইক কার্ট)
  - `app/components/modals/BulkOrderModal.tsx` (বাল্ক মডাল)
  - `lib/productData.ts` (কুইক অর্ডার আর্লি গার্ড)

#### `lib/productData.ts` ⚠️ [HIGH RISK]
- **দায়িত্ব:** সুপাবেস থেকে ক্যাটালগ ফেচ (`fetchCustomProducts`, `fetchProductById`), প্রোডাক্ট ক্যাশিং, স্লাগ জেনারেটর (`productHref`, `findProdBySlug`), ১-ক্লিক কুইক অর্ডার ডিসপ্যাচার (`startQuickOrder`) এবং ২০k বাল্ক গার্ড।
- **প্রধান এক্সপোর্ট:** `fetchCustomProducts()`, `fetchProductById()`, `startQuickOrder()`, `productHref()`, `findProdBySlug()`, `hasExceededLocalOrderLimit()`, `recordLocalOrderTimestamp()`।
- **কনজিউমার ফাইলসমূহ:**
  - `app/page.tsx` & `app/ClientHome.tsx` (হোমপেজ)
  - `app/product/[slug]/page.tsx` & `ProductDetailClient.tsx` (প্রোডাক্ট ডিটেইল)
  - `app/category/[slug]/page.tsx` (ক্যাটাগরি পেজ)
  - `app/search/page.tsx` & `SearchClient.tsx` (সার্চ পেজ)
  - `app/offers/OffersClient.tsx` (অফার পেজ)
  - `app/components/home/ProductCard.tsx` (প্রোডাক্ট কার্ড)
  - `app/components/home/ProductGrid.tsx` (গ্রিড)
  - `app/components/cart/CartSidebar.tsx` (কার্ট)
  - `app/components/cart/QuickOrderModal.tsx` (কুইক কার্ট)
  - `app/components/cart/WishlistDrawer.tsx` (উইশলিস্ট)
  - `app/sitemap.ts` (সাইটম্যাপ)

#### `lib/couponData.ts` ⚠️ [HIGH RISK]
- **দায়িত্ব:** কুপন কোড ভ্যালিডেশন RPC কল (`validate_and_apply_coupon`), কার্টে পণ্যের পরিমাণ বাড়লে/কমলে স্বয়ংক্রিয় ডিসকাউন্ট রিক্যালকুলেশন (`recalculateDiscount`) এবং সেশন স্টোরেজ সিঙ্ক।
- **প্রধান এক্সপোর্ট:** `validateCoupon()`, `recalculateDiscount()`, `getAppliedCoupon()`, `saveAppliedCoupon()`, `removeAppliedCoupon()`, `COUPON_CHANGE_EVENT`।
- **কনজিউমার ফাইলসমূহ:**
  - `app/checkout/page.tsx`
  - `app/components/cart/CartSidebar.tsx`
  - `app/components/cart/QuickOrderModal.tsx`

#### `lib/orderStatus.ts` ⚠️ [HIGH RISK]
- **দায়িত্ব:** সুপাবেস অর্ডার রিয়েল-টাইম চ্যানেল সাবস্ক্রিপশন (`watchOrderStatus`), স্মার্ট পোলিং ব্যাকঅফ, গেস্ট অর্ডার সিকিউর লুকআপ (`fetchFullOrder`, `get_guest_order` RPC) এবং পেন্ডিং অর্ডার লোকাল ট্র্যাকার।
- **প্রধান এক্সপোর্ট:** `fetchFullOrder()`, `watchOrderStatus()`, `readPendingOrder()`, `clearPendingOrder()`, `readLatestGuestOrder()`, `RESOLVED_ORDER_STATUSES`।
- **কনজিউমার ফাইলসমূহ:**
  - `app/checkout/invoice/InvoiceClient.tsx`
  - `app/checkout/status/StatusClient.tsx`
  - `app/components/checkout/WaitingOverlay.tsx`
  - `app/components/checkout/BgConfirmPopup.tsx`
  - `app/components/cart/TrackOrderModal.tsx`
  - `app/track-order/TrackOrderClient.tsx`

#### `lib/orderMapping.ts`
- **দায়িত্ব:** সুপাবেস ডাটাবেজের কাঁচা রো অবজেক্টকে টাইপড `Order` অবজেক্টে রূপান্তর করা।
- **কনজিউমার ফাইলসমূহ:**
  - `app/checkout/invoice/InvoiceClient.tsx`
  - `app/checkout/status/StatusClient.tsx`
  - `app/components/checkout/WaitingOverlay.tsx`
  - `app/components/checkout/BgConfirmPopup.tsx`
  - `app/track-order/TrackOrderClient.tsx`

#### `lib/draftRecovery.ts` & `lib/leadCapture.ts`
- **দায়িত্ব:** অসম্পূর্ণ চেকআউটের ড্রাফট ব্রাউজারে সংরক্ষণ (`saveDraft`), রিকভারি টোস্ট প্রদর্শন এবং ব্যাকগ্রাউন্ডে গুগল শিটে লিড পাঠানো।
- **কনজিউমার ফাইলসমূহ:**
  - `app/checkout/page.tsx`
  - `app/components/modals/RecoveryToast.tsx`
  - `app/components/modals/BackInStockToast.tsx`

---

### ২. নিরাপত্তা, স্যানিটাইজেশন ও অথেনটিকেশন (Security & Auth)

#### `lib/security.ts` ⚠️ [HIGH RISK]
- **দায়িত্ব:** এক্সএসএস (XSS) প্রতিরোধে ইনপুট স্যানিটাইজেশন, নিরাপদ এইচরেফ প্রোটোকল ফিল্টার (`sanitizeHref`), প্লেইন নাম ভ্যালিডেশন (`sanitizePlainName`, `validateName`), এবং ইমেইল/ঠিকানা স্যানিটাইজার।
- **কনজিউমার ফাইলসমূহ:**
  - `app/actions/checkout.ts`
  - `app/checkout/page.tsx`
  - `app/account/AccountClient.tsx`
  - `app/components/auth/LoginModal.tsx`
  - `app/components/modals/StockNotifyModal.tsx`
  - `app/components/layout/Footer.tsx`
  - `lib/accountData.ts`
  - `lib/productQnaData.ts`
  - `lib/productReviewData.ts`
  - `lib/sanitize.ts`

#### `lib/authData.ts`
- **দায়িত্ব:** সুপাবেস অথ মেথড (ইমেইল/পাসওয়ার্ড লগইন, রেজিস্ট্রেশন, গুগল OAuth, পাসওয়ার্ড রিসেট), গেস্ট অর্ডার অ্যাকাউন্ট মার্জিং এবং উইশলিস্ট ক্লাউড সিঙ্ক।
- **কনজিউমার ফাইলসমূহ:**
  - `app/components/auth/LoginModal.tsx`
  - `app/checkout/page.tsx`
  - `app/account/AccountClient.tsx`
  - `app/reset-password/ResetPasswordClient.tsx`

#### `lib/useHistoryModal.ts` ⚠️ [HIGH RISK]
- **দায়িত্ব:** ব্রাউজার পপস্টেট হিস্ট্রি ম্যানেজমেন্ট। ফিজিক্যাল ব্যাক বাটনে মডাল বন্ধ করা এবং `suppressHistoryCleanup()` দিয়ে `router.push` নেভিগেশন উল্টে যাওয়া প্রতিরোধ।
- **কনজিউমার ফাইলসমূহ:**
  - সাইটের সকল ড্রয়ার, মডাল ও পপআপ কম্পোনেন্ট (মোট ১৪টি ফাইল)।

#### `lib/turnstile.ts` & `lib/rateLimit.ts`
- **দায়িত্ব:** ক্লাউডফ্লেয়ার টার্নস্টাইল স্ক্রিপ্ট লোডার ও সুপাবেস আরপিসি রেট লিমিট ভেরিফায়ার।
- **কনজিউমার ফাইলসমূহ:**
  - `app/components/auth/LoginModal.tsx`
  - `app/components/auth/TurnstileWidget.tsx`
  - `app/account/AccountClient.tsx`

---

### ৩. স্টেট ম্যানেজমেন্ট ও দ্বিভাষিক ইঞ্জিন (Stores & i18n)

#### `lib/store/` (`cartStore.ts`, `wishlistStore.ts`, `authStore.ts`, `languageStore.ts`) ⚠️ [HIGH RISK]
- **দায়িত্ব:** Zustand পারসিস্টেড স্টেট ম্যানেজমেন্ট ও সিঙ্ক্রোনাইজেশন।
- **কনজিউমার ফাইলসমূহ:** পুরো অ্যাপ্লিকেশনের প্রতিটি লেআউট, ন্যাভবার, পেজ ও ইন্টারেক্টিভ মডাল।

#### `lib/i18n/` (`dictionary.ts`, `useT.ts`, `translate.ts`, `getServerLang.ts`) ⚠️ [HIGH RISK]
- **দায়িত্ব:** ৪১০+ কি সম্বলিত দ্বিভাষিক ডিকশনারি, রিঅ্যাক্টিভ `useT()` হুক এবং সার্ভার-সাইড মেটাডেটা ল্যাঙ্গুয়েজ ডিটেক্টর (`getServerLang()`)।
- **কনজিউমার ফাইলসমূহ:** প্ল্যাটফর্মের প্রতিটি সার্ভার ও ক্লায়েন্ট ফাইল।

---

### ৪. মিডিয়া, ইমেজ ও নোটিফিকেশন ইঞ্জিন (Media & Alerts)

#### `lib/cloudinaryUrl.ts` & `lib/cloudinaryUpload.ts`
- **দায়িত্ব:** ক্লাউডিনারি অন-দ্য-ফ্লাই ইমেজ রিসাইজিং/অপটিমাইজেশন (`w_auto,q_auto,f_auto`) এবং ক্লায়েন্ট ক্যানভাসে ছবি WebP-তে রূপান্তর করে আপলোড।
- **কনজিউমার ফাইলসমূহ:**
  - `app/components/product/ProductReviews.tsx`
  - `app/components/home/ProductCard.tsx`
  - `app/components/home/HeroSlider.tsx`
  - `app/components/home/CustomerGallery.tsx`
  - `app/checkout/invoice/InvoiceClient.tsx`
  - `app/page.tsx`

#### `lib/toast.ts` ⚠️ [HIGH RISK]
- **দায়িত্ব:** সেন্ট্রালাইজড ডায়নামিক টোস্ট ইঞ্জিন (`showToast`)। স্বয়ংক্রিয়ভাবে মেসেজের ধরন শনাক্ত করে সঠিক রঙ (`success`, `error`, `warning`, `info`) এবং আইকন নির্ধারণ করে।
- **কনজিউমার ফাইলসমূহ:** সমগ্র অ্যাপ্লিকেশনের সমস্ত স্টোর, অ্যাকশন ও ইউজার ইন্টারেকশন।

#### `lib/telegram.ts`
- **দায়িত্ব:** সার্ভার অ্যাকশনে অর্ডার হওয়ামাত্র ব্যাকগ্রাউন্ডে টেলিগ্রাম বটের মাধ্যমে অ্যাডমিনকে বিস্তারিত মেসেজ পাঠানো।
- **কনজিউমার ফাইলসমূহ:** `app/actions/checkout.ts` (Next.js 15 `after()` টাস্ক)।

---

## 🚫 ৪. সাইক্লিক ডিপেন্ডেন্সি রোধের নিয়মাবলী (Anti-Cycle Rules)

1. **স্টোর বনাম ইউটিলিটি রুল:** কোনো `lib/store/*.ts` ফাইল সরাসরি কোনো UI কম্পোনেন্ট ইমপোর্ট করতে পারবে না।
2. **ডাটা হেল্পার রুল:** `lib/*Data.ts` ফাইলগুলো ডেটা প্রসেসিংয়ের জন্য শুধু `types/` এবং পিওর ইউটিলিটি (`lib/security.ts`, `lib/logger.ts`) ইমপোর্ট করবে — অন্য কোনো হাই-লেভেল কম্পোনেন্ট বা সার্ভার অ্যাকশন নয়।
3. **সার্ভার অ্যাকশন রুল:** `app/actions/checkout.ts` শুধুমাত্র পিওর সার্ভার-সেফ ফাংশন এবং `lib/supabase/serviceClient.ts` ব্যবহার করবে (কখনো ক্লায়েন্ট হুক বা Zustand স্টোর ব্যবহার করবে না)।
