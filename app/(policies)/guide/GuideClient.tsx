'use client';

import Link from 'next/link';
import { useT } from '@/lib/i18n/useT';
import {
  PolicyHeader,
  PolicySection,
  PolicyNote,
  PolicyBulletPoint,
  policyPClass,
  policyUlClass,
  policySubheadingClass,
} from '../PolicyContent';

function CompassNavIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
    </svg>
  );
}

function SearchMagnifyIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function CartBagIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
  );
}

function CouponTagIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
      <line x1="7" y1="7" x2="7.01" y2="7" />
    </svg>
  );
}

function StepsCheckIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

function MemoReceiptIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1Z" />
      <path d="M8 7h8M8 11h8M8 15h5" />
    </svg>
  );
}

function VideoProofIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="6" width="14" height="12" rx="2" />
      <polygon points="22 7 16 12 22 17 22 7" />
    </svg>
  );
}

function RadarTrackIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a10 10 0 0 1 10 10" />
      <path d="M12 6a6 6 0 0 1 6 6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}

function UserVipIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14" />
    </svg>
  );
}

function StarReviewIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

function SitemapTreeIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="3" width="6" height="4" rx="1" />
      <rect x="2" y="17" width="6" height="4" rx="1" />
      <rect x="9" y="17" width="6" height="4" rx="1" />
      <rect x="16" y="17" width="6" height="4" rx="1" />
      <path d="M12 7v4M5 11v6M12 11v6M19 11v6M5 11h14" />
    </svg>
  );
}

export default function GuideClient() {
  const { lang } = useT();

  return (
    <>
      <PolicyHeader
        icon={<CompassNavIcon />}
        title="ইউজার গাইড ও ওয়েবসাইট আর্কিটেকচার (User Guide)"
        subtitle="Vangcur ই-কমার্স প্ল্যাটফর্ম ব্যবহারের পূর্ণাঙ্গ নির্দেশিকা"
        updated="আগস্ট ২০২৬"
      />

      <PolicySection
        icon={<CompassNavIcon />}
        title={lang === 'en' ? '1. Website Overview & Smart Navigation' : '১. ওয়েবসাইট পরিচিতি ও স্মার্ট নেভিগেশন'}
      >
        <p className={policyPClass}>
          {lang === 'en'
            ? 'Vangcur (vangcur.com) is an innovative tech gadget and lifestyle e-commerce platform in Bangladesh. Designed with a mobile-first architecture, customers can explore products effortlessly through multiple intuitive entry points:'
            : 'Vangcur (ভাঙচুর) বাংলাদেশের অন্যতম আধুনিক গ্যাজেট ও লাইফস্টাইল ই-কমার্স প্ল্যাটফর্ম। কাস্টমারদের দ্রুত ও আনন্দদায়ক কেনাকাটার অভিজ্ঞতা দিতে ওয়েবসাইটটিকে অত্যন্ত সহজ ও ডায়নামিক আর্কিটেকচারে সাজানো হয়েছে:'}
        </p>
        <ul className={policyUlClass}>
          <PolicyBulletPoint>
            {lang === 'en'
              ? 'Floating Navbar: Displays real-time Wishlist counter, Cart badge with liquid fill physics, 1-tap Account dashboard access, and live Track Order modal.'
              : 'ফ্লোটিং ন্যাভবার: ন্যাভবারের মাধ্যমে রিয়েল-টাইম উইশলিস্ট কাউন্টার, কার্ট ব্যাজ, ১-ট্যাপে একাউন্ট প্রোফাইল এবং লাইভ অর্ডার ট্র্যাকিং উইন্ডো তাৎক্ষণিকভাবে ব্যবহার করা যায়।'}
          </PolicyBulletPoint>
          <PolicyBulletPoint>
            {lang === 'en'
              ? 'Hero Duo Slider: Interactive horizontal story cards linking directly to curated product collections with smooth touch-drag physics.'
              : 'হিরো স্টোরি স্লাইডার: হোমপেজের শীর্ষে থাকা কার্ডে ক্লিক করলে সরাসরি নির্দিষ্ট ট্রেন্ডিং কালেকশনে পৌঁছে যাওয়া যায়।'}
          </PolicyBulletPoint>
          <PolicyBulletPoint>
            {lang === 'en'
              ? 'Categories Carousel: Categorized product filters for RGB Lights, Smart Watches, TWS Earbuds, Power Banks, Crystal Lamps, and Unique Lifestyle Tech.'
              : 'ক্যাটাগরি ক্যারোসেল: হোমপেজে ক্যাটাগরি চিপে ক্লিক করে নিমিষেই কাঙ্ক্ষিত গ্যাজেট ফিল্টার করে নেওয়া যায়।'}
          </PolicyBulletPoint>
        </ul>
      </PolicySection>

      <PolicySection
        icon={<SearchMagnifyIcon />}
        title={lang === 'en' ? '2. Product Search & Instant Keyword Matching' : '২. প্রোডাক্ট সার্চ ও কিউরেটেড কিওয়ার্ড ফিল্টারিং'}
      >
        <p className={policyPClass}>
          {lang === 'en'
            ? 'Our global search engine supports debounced instant queries in both English and Bengali:'
            : 'আমাদের গ্লোবাল সার্চ বারের মাধ্যমে ইংরেজি ও বাংলা উভয় ভাষায় দ্রুত প্রোডাক্ট খুঁজে পাওয়া যায়:'}
        </p>
        <ul className={policyUlClass}>
          <PolicyBulletPoint>
            {lang === 'en'
              ? 'Search by English keywords (min 3 characters) or direct Bangla phonetic tags (e.g., "নিয়ন", "ঘড়ি", "স্পিকার").'
              : 'ইংরেজি অক্ষরের পাশাপাশি সরাসরি বাংলা ট্যাগ লিখেও প্রোডাক্ট সার্চ করা সম্ভব।'}
          </PolicyBulletPoint>
          <PolicyBulletPoint>
            {lang === 'en'
              ? 'Recent Searches: Browser-local search history saves your last queries for 1-tap access with zero server tracking.'
              : 'সাম্প্রতিক অনুসন্ধান: পূর্বে খোঁজা কিওয়ার্ডগুলো লোকালি সেভ থাকে, যা ১-ট্যাপে পুনরায় সার্চ করা যায়।'}
          </PolicyBulletPoint>
          <PolicyBulletPoint>
            {lang === 'en'
              ? 'Dedicated Search Results Page (/search): Filter products and explore related category suggestions in a full-grid layout.'
              : 'পূর্ণাঙ্গ সার্চ পেজ (/search): সার্চ বারে এন্টার চাপলে সম্পূর্ণ সার্চ রেজাল্ট গ্রিডে দেখা যায়।'}
          </PolicyBulletPoint>
        </ul>
      </PolicySection>

      <PolicySection
        icon={<CartBagIcon />}
        title={lang === 'en' ? '3. Wishlist, Shopping Cart & 1-Click Quick Order' : '৩. উইশলিস্ট, শপিং কার্ট ও ১-ক্লিক কুইক অর্ডার'}
      >
        <ul className={policyUlClass}>
          <PolicyBulletPoint>
            {lang === 'en'
              ? 'Wishlist Hearting: Tapping the heart icon triggers a parabolic flying animation to your top navigation bar, saving your favorite products for future visits.'
              : 'উইশলিস্ট (পছন্দের তালিকা): হার্ট আইকনে ট্যাপ করলে প্যারাবলিক অ্যানিমেশনে প্রোডাক্টটি উইশলিস্টে যুক্ত হয়।'}
          </PolicyBulletPoint>
          <PolicyBulletPoint>
            {lang === 'en'
              ? 'Add to Cart: Adds the item to your persistent cart drawer with instant quantity modification and real-time subtotal calculation.'
              : 'কার্টে যোগ: কার্ট ড্রয়ারের মাধ্যমে প্রোডাক্টের পরিমাণ বাড়ানো-কমানো এবং রিয়েল-টাইম বিল পর্যবেক্ষণ করা যায়।'}
          </PolicyBulletPoint>
          <PolicyBulletPoint>
            {lang === 'en'
              ? '1-Click Quick Order ("Order Now"): If your cart is empty, clicking "Order Now" bypasses extra steps and takes you directly to single-product checkout.'
              : '১-ক্লিক কুইক অর্ডার ("অর্ডার করুন"): কার্ট খালি থাকলে সরাসরি "অর্ডার করুন" বাটনে ক্লিক করে একক প্রোডাক্টের চেকআউটে যাওয়া যায়।'}
          </PolicyBulletPoint>
        </ul>
      </PolicySection>

      <PolicySection
        icon={<CouponTagIcon />}
        title={lang === 'en' ? '4. Applying Coupon Codes & Promotional Discounts' : '৪. কুপন কোড ও বিশেষ ছাড় ব্যবহারের নিয়ম'}
      >
        <p className={policyPClass}>
          {lang === 'en'
            ? 'Discount coupons can be entered in the Cart Drawer, Quick Order modal, or during Checkout Step 1:'
            : 'কার্ট ড্রয়ার, কুইক কার্ট মডাল কিংবা চেকআউটের ১ম ধাপে কুপন কোড ব্যবহার করা যায়:'}
        </p>
        <ul className={policyUlClass}>
          <PolicyBulletPoint>
            {lang === 'en'
              ? 'Live Validation: Enter your coupon code and tap Apply. If valid, the box transforms into a green success badge with an instant subtotal deduction.'
              : 'লাইভ যাচাই: কুপন লিখে প্রয়োগ বাটনে চাপলে মুহূর্তের মধ্যে ডাটাবেজ থেকে ভ্যালিডেট হয়ে সবুজ ব্যাজে মোট ছাড় প্রদর্শিত হয়।'}
          </PolicyBulletPoint>
          <PolicyBulletPoint>
            {lang === 'en'
              ? 'Smart Auto-Apply: If you type a coupon code and directly click "Checkout" without hitting Apply, our system pauses for 900ms, validates the code, applies the discount animation, and proceeds seamlessly.'
              : 'স্মার্ট অটো-অ্যাপ্লাই: কুপন লিখে আলাদাভাবে প্রয়োগ বাটনে না চেপে সরাসরি চেকআউট বাটনে চাপলেও সিস্টেম স্বয়ংক্রিয়ভাবে কোডটি যাচাই করে ডিসকাউন্ট যুক্ত করে পরবর্তী ধাপে নিয়ে যায়।'}
          </PolicyBulletPoint>
          <PolicyBulletPoint>
            {lang === 'en'
              ? 'VIP Membership Coupons: Rewards won from the VIP Spin Wheel are uniquely tied to your tier and automatically recognized.'
              : 'ভিআইপি কুপন: মেম্বারশিপ স্পিন হুইল থেকে প্রাপ্ত রিওয়ার্ড কোডগুলো চেকআউটে সরাসরি ব্যবহারযোগ্য।'}
          </PolicyBulletPoint>
        </ul>
      </PolicySection>

      <PolicySection
        icon={<StepsCheckIcon />}
        title={lang === 'en' ? '5. 3-Step Secure Checkout & Tiered bKash Advance' : '৫. ৩-ধাপের নিরাপদ চেকআউট ও ৩-টায়ার বিকাশ অগ্রিম পেমেন্ট'}
      >
        <p className={policyPClass}>
          {lang === 'en'
            ? 'Our frictionless checkout flow (/checkout) takes less than 60 seconds across 3 streamlined steps:'
            : 'আমাদের ৩-ধাপের চেকআউট প্রক্রিয়ায় এক মিনিটেরও কম সময়ে অর্ডার সম্পন্ন করা যায়:'}
        </p>

        <div className={policySubheadingClass}>
          {lang === 'en' ? 'Step 1: Delivery Information & District Selection' : 'ধাপ ১: ডেলিভারি তথ্য ও জেলা নির্বাচন'}
        </div>
        <ul className={policyUlClass}>
          <PolicyBulletPoint>
            {lang === 'en'
              ? 'Enter your Full Name, 11-digit mobile number, District dropdown, and complete home address. Shipping options update automatically based on location (Inside Dhaka ৳70, Outside Dhaka / All Bangladesh ৳120).'
              : 'পূর্ণ নাম, ১১ ডিজিটের মোবাইল নম্বর, জেলা এবং সম্পূর্ণ ঠিকানা দিন। জেলা অনুযায়ী কুরিয়ার চার্জ স্বয়ংক্রিয়ভাবে যুক্ত হবে (ঢাকা সিটি ৭০ টাকা, সারা বাংলাদেশ ১২০ টাকা)।'}
          </PolicyBulletPoint>
        </ul>

        <div className={policySubheadingClass}>
          {lang === 'en' ? 'Step 2: Tiered Advance Payment via bKash Send Money' : 'ধাপ ২: ৩-টায়ার বিকাশ অগ্রিম পেমেন্ট'}
        </div>
        <ul className={policyUlClass}>
          <PolicyBulletPoint>
            {lang === 'en'
              ? 'Orders below ৳8,000: Send Money a fixed ৳200 advance to our official bKash merchant number (01816-365504) or scan the on-screen QR code.'
              : '৮,০০০ টাকার নিচে অর্ডার: ফিক্সড ২০০ টাকা বিকাশ সেন্ড মানি করুন (01816-365504) অথবা স্ক্রিনের কিউআর কোড স্ক্যান করুন।'}
          </PolicyBulletPoint>
          <PolicyBulletPoint>
            {lang === 'en'
              ? 'Orders ৳8,000 – ৳20,000: Send Money a 5% advance + 1.5% bKash transaction fee on the total bill (live breakdown viewable on-screen).'
              : '৮,০০০ থেকে ২০,০০০ টাকার অর্ডার: মোট বিলের ৫% মূল অগ্রিম ও ১.৫% বিকাশ ট্রানজেকশন ফি অগ্রিম পরিশোধ করুন (ড্রপডাউনে বিস্তারিত হিসাব দেখা যাবে)।'}
          </PolicyBulletPoint>
          <PolicyBulletPoint>
            {lang === 'en'
              ? 'Orders above ৳20,000: Triggers the dedicated WhatsApp Bulk Order modal for customized logistics and corporate handling.'
              : '২০,০০০ টাকার বেশি অর্ডার: স্বয়ংক্রিয়ভাবে বিশেষ WhatsApp বাল্ক অর্ডার মডাল ওপেন হবে।'}
          </PolicyBulletPoint>
          <PolicyBulletPoint>
            {lang === 'en'
              ? 'Enter either the 10-character bKash Transaction ID (TxnID) or the Last 4 Digits of your payment number.'
              : 'বিকাশ ট্রানজেকশন সম্পন্ন করে ১০ ডিজিটের TxnID অথবা প্রেরক নম্বরের শেষ ৪ ডিজিট বক্সে লিখুন।'}
          </PolicyBulletPoint>
        </ul>

        <div className={policySubheadingClass}>
          {lang === 'en' ? 'Step 3: Final Review & Confirmation' : 'ধাপ ৩: অর্ডার মেমো রিভিউ ও নিশ্চিতকরণ'}
        </div>
        <ul className={policyUlClass}>
          <PolicyBulletPoint>
            {lang === 'en'
              ? 'Review your itemized invoice breakdown, advance deduction, and Cash on Delivery (COD) due balance. Check the terms agreement and click "Confirm Order".'
              : 'মোট বিল, অগ্রিম কর্তন ও বাকি ক্যাশ অন ডেলিভারি (COD) টাকার হিসাব দেখে শর্তাবলীতে টিক দিয়ে "অর্ডার কনফার্ম করুন" বাটনে চাপুন।'}
          </PolicyBulletPoint>
        </ul>
      </PolicySection>

      <PolicySection
        icon={<MemoReceiptIcon />}
        title={lang === 'en' ? '6. Automated Verification & Invoice Memo Download' : '৬. স্বয়ংক্রিয় ভেরিফিকেশন ও মেমো ডাউনলোড'}
      >
        <ul className={policyUlClass}>
          <PolicyBulletPoint>
            {lang === 'en'
              ? 'Real-Time Verification: After submission, our system monitors your payment in the background. Verification typically completes within 5–10 minutes.'
              : 'রিয়েল-টাইম ভেরিফিকেশন: অর্ডার সাবমিটের পর আমাদের টিম ৫–১০ মিনিটের মধ্যে বিকাশ পেমেন্ট মিলিয়ে অর্ডার কনফার্ম করে।'}
          </PolicyBulletPoint>
          <PolicyBulletPoint>
            {lang === 'en'
              ? 'Official PNG Invoice Memo: Upon confirmation, an HD official invoice memo (/checkout/invoice) is generated with automatic download to your device.'
              : 'অফিসিয়াল ইনভয়েস মেমো: অর্ডার কনফার্ম হওয়ামাত্র স্বয়ংক্রিয়ভাবে একটি ফুল এইচডি ডিজিটাল ইনভয়েস মেমো ডিভাইসে ডাউনলোড হয়ে যায়।'}
          </PolicyBulletPoint>
        </ul>
      </PolicySection>

      <PolicySection
        icon={<VideoProofIcon />}
        title={lang === 'en' ? '7. Parcel Acceptance & Mandatory Unboxing Protocol' : '৭. পার্সেল গ্রহণ ও আনবক্সিং ভিডিও প্রোটোকল'}
      >
        <p className={policyPClass}>
          {lang === 'en'
            ? 'When your parcel arrives at your doorstep via Pathao Courier:'
            : 'পাঠাও কুরিয়ারের ডেলিভারিম্যান যখন আপনার ঠিকানায় পার্সেল নিয়ে আসবেন:'}
        </p>
        <ul className={policyUlClass}>
          <PolicyBulletPoint>
            {lang === 'en'
              ? 'Pay the remaining Cash on Delivery (COD) balance to the delivery person and collect the sealed box.'
              : 'ডেলিভারিম্যানকে অবশিষ্ট ক্যাশ অন ডেলিভারির টাকা পরিশোধ করে সিলযুক্ত বক্স বুঝে নিন।'}
          </PolicyBulletPoint>
          <PolicyBulletPoint>
            {lang === 'en'
              ? 'Mandatory Unboxing Video: Record a continuous, uncut video from opening the outer courier flyer to powering on the device. This is legally required for any warranty or replacement claim.'
              : 'বাধ্যতামূলক আনবক্সিং ভিডিও: পার্সেলের প্যাকেট কাটার শুরু থেকেই একটানা আন-কাট ভিডিও রেকর্ড করুন। কোনো ত্রুটির ক্ষেত্রে এই ভিডিও ওয়ারেন্টি ক্লেইমের একমাত্র অফিসিয়াল প্রমাণ।'}
          </PolicyBulletPoint>
        </ul>
      </PolicySection>

      <PolicySection
        icon={<RadarTrackIcon />}
        title={lang === 'en' ? '8. Live Order Tracking Across All Devices' : '৮. লাইভ অর্ডার ট্র্যাকিং পদ্ধতি'}
      >
        <p className={policyPClass}>
          {lang === 'en'
            ? 'Track your parcel in real-time from booking to doorstep delivery:'
            : 'আপনার অর্ডারের সর্বশেষ অবস্থা যেকোনো ডিভাইস থেকে লাইভ দেখতে পারবেন:'}
        </p>
        <ul className={policyUlClass}>
          <PolicyBulletPoint>
            {lang === 'en'
              ? <>Guest Tracking (/track-order): Enter your Order Number (e.g. VC-1082) on our <Link href="/track-order" className="font-bold text-brand-light hover:underline">Track Order</Link> page to view live courier status.</>
              : <>গেস্ট ট্র্যাকিং: ওয়েবসাইটের <Link href="/track-order" className="font-bold text-brand-light hover:underline">অর্ডার ট্র্যাক</Link> পেজে অর্ডার নম্বর লিখে লাইভ স্ট্যাটাস দেখা যায়।</>}
          </PolicyBulletPoint>
          <PolicyBulletPoint>
            {lang === 'en'
              ? <>Account Dashboard (/account/orders): Logged-in users can view full lifetime order history, re-download invoices, and monitor parcel transit stages.</>
              : <>অ্যাকাউন্ট ড্যাশবোর্ড: লগইন করা থাকলে আজীবন সকল অর্ডারের মেমো ও ট্র্যাকিং হিস্টোরি একাউন্টে সংরক্ষিত থাকে।</>}
          </PolicyBulletPoint>
          <PolicyBulletPoint>
            {lang === 'en'
              ? 'SMS Tracking: Pathao Courier automatically sends an SMS with a direct tracking link once the parcel is scanned at the logistics hub.'
              : 'কুরিয়ার এসএমএস: পার্সেল কুরিয়ারে বুকিং হওয়ামাত্র আপনার ফোনে এসএমএসে ট্র্যাকিং লিংক পৌঁছে যায়।'}
          </PolicyBulletPoint>
        </ul>
      </PolicySection>

      <PolicySection
        icon={<UserVipIcon />}
        title={lang === 'en' ? '9. User Profile, Draft Recovery & VIP Club' : '৯. ইউজার প্রোফাইল, ড্রাফট রিকভারি ও ভিআইপি ক্লাব'}
      >
        <ul className={policyUlClass}>
          <PolicyBulletPoint>
            {lang === 'en'
              ? '1-Tap Google Login: Instant secure authentication linking all your guest orders to your permanent profile automatically.'
              : '১-ট্যাপ গুগল লগইন: এক ক্লিকে গুগল দিয়ে লগইন করলে পূর্বের সকল গেস্ট অর্ডার স্বয়ংক্রিয়ভাবে প্রোফাইলে যুক্ত হয়ে যায়।'}
          </PolicyBulletPoint>
          <PolicyBulletPoint>
            {lang === 'en'
              ? 'Smart Draft Recovery: If you leave the checkout page unfinished, your filled details and cart are preserved for easy 1-click continuation upon return.'
              : 'ড্রাফট রিকভারি: চেকআউট ফর্ম পূরণ করে বের হয়ে গেলেও পরবর্তীতে ফিরে এলে তথ্য পুনরায় লেখার প্রয়োজন হয় না।'}
          </PolicyBulletPoint>
          <PolicyBulletPoint>
            {lang === 'en'
              ? 'VIP Membership Club: Unlock Silver, Gold, Diamond, and Legendary tiers based on delivered orders. Enjoy daily Lucky Cash Spin Wheels, exclusive discounts, and Zero-Advance COD privileges.'
              : 'ভিআইপি মেম্বারশিপ: সফল অর্ডারের ভিত্তিতে সিলভার, গোল্ড, ডায়মন্ড ও লিজেন্ডারি ব্যাজ আনলক হয় এবং লাকি স্পিন হুইল থেকে ক্যাশব্যাক কুপন জেতা যায়।'}
          </PolicyBulletPoint>
        </ul>
      </PolicySection>

      <PolicySection
        icon={<StarReviewIcon />}
        title={lang === 'en' ? '10. Customer Reviews & Community Q&A' : '১০. কাস্টমার রিভিউ ও কমিউনিটি প্রশ্নোত্তর (Q&A)'}
      >
        <ul className={policyUlClass}>
          <PolicyBulletPoint>
            {lang === 'en'
              ? 'Real Unboxing Gallery: Submit reviews with real product photos directly compressed to high-speed WebP. Verified buyer badges are awarded automatically upon order match.'
              : 'আনবক্সিং গ্যালারি: প্রোডাক্ট হাতে পেয়ে কাস্টমাররা সরাসরি ছবি সহ রিভিউ প্রকাশ করতে পারেন।'}
          </PolicyBulletPoint>
          <PolicyBulletPoint>
            {lang === 'en'
              ? 'Product Q&A: Ask questions about gadget compatibility, power specifications, or usage directly on product pages and receive official answers from the Vangcur technical team.'
              : 'প্রশ্নোত্তর (Q&A): যেকোনো প্রোডাক্টের নিচে প্রশ্ন জিজ্ঞাসা করলে আমাদের টিম সরাসরি তার অফিসিয়াল উত্তর প্রদান করে।'}
          </PolicyBulletPoint>
        </ul>
      </PolicySection>

      <PolicySection
        icon={<SitemapTreeIcon />}
        title={lang === 'en' ? '11. Full Website Route Architecture (AEO & GEO Reference)' : '১১. সম্পূর্ণ ওয়েবসাইট রাউট আর্কিটেকচার'}
      >
        <p className={policyPClass}>
          {lang === 'en'
            ? 'For automated search engines (Google SGE, Perplexity, ChatGPT) and customer navigation, the following table details all public endpoints of Vangcur:'
            : 'ওয়েবসাইটের সকল প্রধান ফিচার ও পেজের সরাসরি লিঙ্ক কাঠামো নিচে দেওয়া হলো:'}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 font-body text-xs">
          <div className="rounded-[12px] border border-border-base bg-white p-3 shadow-2xs">
            <Link href="/" className="font-extrabold text-brand-light hover:underline block mb-0.5">
              / (Home)
            </Link>
            <span className="text-muted">হিরো স্লাইডার, ক্যাটাগরি, প্রোডাক্ট গ্রিড, রিভিউ গ্যালারি ও এফএকিউ।</span>
          </div>

          <div className="rounded-[12px] border border-border-base bg-white p-3 shadow-2xs">
            <Link href="/shipping" className="font-extrabold text-brand-light hover:underline block mb-0.5">
              /shipping (Shipping Policy)
            </Link>
            <span className="text-muted">ডেলিভারি এলাকা, সময়সীমা, চার্জ ও কুরিয়ার ট্র্যাকিং নীতিমালা।</span>
          </div>

          <div className="rounded-[12px] border border-border-base bg-white p-3 shadow-2xs">
            <Link href="/refund-policy" className="font-extrabold text-brand-light hover:underline block mb-0.5">
              /refund-policy (Refunds)
            </Link>
            <span className="text-muted">রিটার্ন, ১০০% ফ্রি রিপ্লেসমেন্ট ও আনবক্সিং ভিডিওর আইনি শর্তাবলী।</span>
          </div>

          <div className="rounded-[12px] border border-border-base bg-white p-3 shadow-2xs">
            <Link href="/terms" className="font-extrabold text-brand-light hover:underline block mb-0.5">
              /terms (Terms & Conditions)
            </Link>
            <span className="text-muted">ডিজিটাল কমার্স পরিচালনা চুক্তি ও আইনি শর্তাবলী।</span>
          </div>

          <div className="rounded-[12px] border border-border-base bg-white p-3 shadow-2xs">
            <Link href="/privacy-policy" className="font-extrabold text-brand-light hover:underline block mb-0.5">
              /privacy-policy (Privacy)
            </Link>
            <span className="text-muted">ব্যক্তিগত তথ্যের সুরক্ষা, এনক্রিপশন ও গোপনীয়তা প্রতিশ্রুতি।</span>
          </div>

          <div className="rounded-[12px] border border-border-base bg-white p-3 shadow-2xs">
            <Link href="/track-order" className="font-extrabold text-brand-light hover:underline block mb-0.5">
              /track-order (Tracking)
            </Link>
            <span className="text-muted">অর্ডার নম্বর দিয়ে লাইভ পার্সেল ডেলিভারি স্ট্যাটাস ট্র্যাকিং।</span>
          </div>

          <div className="rounded-[12px] border border-border-base bg-white p-3 shadow-2xs">
            <Link href="/account" className="font-extrabold text-brand-light hover:underline block mb-0.5">
              /account (Profile Dashboard)
            </Link>
            <span className="text-muted">কাস্টমার প্রোফাইল, লাইভ ওয়েদার কার্ড, অর্ডার মেমো ও মেম্বারশিপ স্পিনার।</span>
          </div>

          <div className="rounded-[12px] border border-border-base bg-white p-3 shadow-2xs">
            <Link href="/search" className="font-extrabold text-brand-light hover:underline block mb-0.5">
              /search (Product Search)
            </Link>
            <span className="text-muted">বাংলা ও ইংরেজি কিওয়ার্ড দিয়ে প্রোডাক্ট সার্চ রেজাল্ট পেজ।</span>
          </div>
        </div>
      </PolicySection>

      <PolicyNote type="info">
        {lang === 'en'
          ? 'Need personalized assistance? Our dedicated support managers are live on WhatsApp at 01897-804055 from 9:00 AM to 10:00 PM daily.'
          : 'যেকোনো প্রয়োজনে সরাসরি সহায়তা পেতে আমাদের অফিসিয়াল WhatsApp নম্বরে (01897-804055) প্রতিদিন সকাল ৯:০০ টা থেকে রাত ১০:০০ টা পর্যন্ত মেসেজ দিতে পারেন।'}
      </PolicyNote>
    </>
  );
            }
