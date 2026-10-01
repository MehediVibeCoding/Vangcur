import type { SupabaseClient } from '@supabase/supabase-js';

export interface Faq {
  /** বাংলা প্রশ্ন */
  q: string;
  /** বাংলা উত্তর */
  a: string;
  /** English question (ঐচ্ছিক — না থাকলে বাংলাই দেখাবে / ডিকশনারি থেকে অনুবাদ হবে) */
  qEn?: string;
  /** English answer */
  aEn?: string;
}

// নিচের তথ্য সরাসরি শিপিং, রিফান্ড, শর্তাবলী ও প্রাইভেসি পলিসি পেজ থেকে নেওয়া —
// কোনো নীতিমালা বদলালে এখানেও মিলিয়ে নিন।
export const DEFAULT_FAQS: Faq[] = [
  {
    q: 'পেমেন্ট কীভাবে করব এবং অগ্রিম কত দিতে হবে?',
    a: 'অর্ডার নিশ্চিত করতে বিকাশ সেন্ড মানির মাধ্যমে সামান্য অগ্রিম দিতে হয়, বাকি টাকা পার্সেল হাতে পেয়ে ক্যাশ অন ডেলিভারিতে (COD) পরিশোধ করবেন। ৮,০০০ টাকার নিচের অর্ডারে অগ্রিম ফিক্সড ২০০ টাকা। ৮,০০০ থেকে ২০,০০০ টাকার অর্ডারে মোট বিলের ৫% এবং সাথে ১.৫% বিকাশ ফি অগ্রিম দিতে হবে।',
    qEn: 'How do I pay, and how much is the advance?',
    aEn: 'To confirm your order, you pay a small advance via bKash Send Money and settle the rest in cash when the parcel arrives (Cash on Delivery). For orders below ৳8,000 the advance is a fixed ৳200. For orders between ৳8,000 and ৳20,000 it is 5% of the total bill plus a 1.5% bKash fee.',
  },
  {
    q: 'ডেলিভারি পেতে কতদিন লাগে এবং চার্জ কত?',
    a: 'পাঠাও কুরিয়ারের মাধ্যমে সারা বাংলাদেশের ৬৪ জেলাতেই হোম ডেলিভারি দেওয়া হয়। ঢাকা সিটির ভেতরে ১–২ কার্যদিবসে (চার্জ ৭০ টাকা) এবং ঢাকার বাইরে ২–৪ কার্যদিবসে (চার্জ ১২০ টাকা) পার্সেল পৌঁছায়। পেমেন্ট যাচাইয়ের ২৪ কার্যঘণ্টার মধ্যে আমরা পার্সেল কুরিয়ারের হাতে তুলে দিই। কুপন বা মেম্বারশিপ রিওয়ার্ড থাকলে ডেলিভারি চার্জ ফ্রিও হতে পারে।',
    qEn: 'How long does delivery take, and what are the charges?',
    aEn: 'We deliver to all 64 districts of Bangladesh through Pathao Courier. Parcels reach you in 1–2 working days inside Dhaka City (৳70 charge) and 2–4 working days outside Dhaka (৳120 charge). We hand your parcel over to the courier within 24 working hours of payment verification. A coupon or membership reward can make delivery free.',
  },
  {
    q: 'প্রোডাক্টগুলো কি অথেনটিক? ওয়ারেন্টি কেমন পাব?',
    a: 'হ্যাঁ, প্রতিটি পণ্য আমাদের কোয়ালিটি চেকের পর গ্রাহকের কাছে পাঠানো হয়। সব পণ্যে ন্যূনতম ৭ দিনের ফ্রি রিপ্লেসমেন্ট ওয়ারেন্টি আছে, আর নির্বাচিত প্রিমিয়াম পণ্যে ৬ মাস, ১ বছর বা ২ বছর পর্যন্ত অফিসিয়াল ওয়ারেন্টি পাবেন। ওয়ারেন্টির মেয়াদ অর্ডারের দিন থেকে শুরু হয়।',
    qEn: 'Are your products authentic, and what warranty do I get?',
    aEn: 'Yes. Every product goes through our own quality check before it is shipped. All products carry at least a 7-day free replacement warranty, and selected premium products come with an official warranty of 6 months, 1 year or 2 years. The warranty period starts from the day of your order.',
  },
  {
    q: 'পণ্যে সমস্যা থাকলে রিপ্লেসমেন্ট কীভাবে পাব?',
    a: 'পার্সেল খোলার শুরু থেকে শেষ পর্যন্ত একটানা আন-কাট আনবক্সিং ভিডিও করে রাখুন। কারখানাগত ত্রুটি, ট্রানজিটে ভাঙা বা ভুল পণ্য পেলে পার্সেল পাওয়ার ২৪ থেকে ৪৮ ঘণ্টার মধ্যে অর্ডার নম্বর ও ভিডিওসহ আমাদের WhatsApp-এ (01897-804055) জানান। ভিডিও যাচাই করে ২৪ ঘণ্টার মধ্যে সম্পূর্ণ নিজ খরচে নতুন পণ্য পাঠিয়ে দেওয়া হবে। এ জন্য পণ্যের আসল বক্স ও অফিসিয়াল ইনভয়েস পেপার সংরক্ষণ করে রাখুন।',
    qEn: 'What if there is a problem with my product? How do I get a replacement?',
    aEn: 'Record one continuous, uncut unboxing video from the moment you start opening the parcel. If you receive a manufacturing defect, transit damage or the wrong product, message us on WhatsApp (01897-804055) with your order number and the video within 24–48 hours of receiving the parcel. After verifying the video, we ship a new product within 24 hours at no cost to you. Please keep the original box and the official invoice paper safe.',
  },
  {
    q: 'পছন্দ না হলে কি পণ্য ফেরত দেওয়া যাবে?',
    a: 'পণ্যে কোনো ত্রুটি না থাকলে শুধু পছন্দ না হওয়া বা মন পরিবর্তনের কারণে রিটার্ন বা রিফান্ড করা যায় না। তাই অর্ডারের আগে ছবি ও স্পেসিফিকেশন ভালো করে দেখে নিন। তবে পণ্যে প্রকৃত ত্রুটি থাকলে ১০০% ফ্রি রিপ্লেসমেন্ট পাবেন।',
    qEn: 'Can I return a product if I do not like it?',
    aEn: 'If the product has no defect, we cannot accept returns or refunds for personal preference or a change of mind, so please check the photos and specifications carefully before ordering. If the product has a genuine defect, you get a 100% free replacement.',
  },
  {
    q: 'আমার অর্ডার কীভাবে ট্র্যাক করব?',
    a: 'পার্সেল কুরিয়ারে বুকিং হওয়ার পর পাঠাও থেকে আপনার ফোনে ট্র্যাকিং এসএমএস যায়। এছাড়া ওয়েবসাইটের "অর্ডার ট্র্যাক" অপশনে গিয়ে যেকোনো সময় লাইভ স্ট্যাটাস দেখতে পারবেন, আর লগইন করা থাকলে যেকোনো ডিভাইস থেকেই দেখা যাবে।',
    qEn: 'How do I track my order?',
    aEn: 'Once your parcel is booked with the courier, Pathao sends a tracking SMS to your phone. You can also open "Track Order" on our website to see the live status at any time, and from any device if you are logged in.',
  },
  {
    q: '২০,০০০ টাকার বেশি দামের অর্ডার কীভাবে করব?',
    a: 'নিরাপত্তা, বিশেষ প্যাকেজিং ও বাল্ক ডিসকাউন্ট সুবিধার জন্য ২০,০০০ টাকার বেশি মূল্যের অর্ডার সাধারণ চেকআউটে নেওয়া হয় না। এ ধরনের অর্ডারের জন্য সরাসরি আমাদের অফিসিয়াল WhatsApp সাপোর্টে (01897-804055) মেসেজ দিন, আমরা বিশেষ গুরুত্ব দিয়ে অর্ডারটি সম্পন্ন করব।',
    qEn: 'How do I place an order above ৳20,000?',
    aEn: 'For security, special packaging and bulk-discount benefits, orders above ৳20,000 are not accepted through the regular checkout. Please message our official WhatsApp support (01897-804055) directly and we will handle your order with priority.',
  },
  {
    q: 'আমার ব্যক্তিগত ও পেমেন্ট তথ্য কি নিরাপদ?',
    a: 'হ্যাঁ। Vangcur কখনো আপনার বিকাশ পিন, ওটিপি বা কার্ড পাসওয়ার্ড চায় না বা সংরক্ষণ করে না। আপনার তথ্য শুধু অর্ডার প্রক্রিয়া, ডেলিভারি ও সাপোর্টের কাজে ব্যবহার হয় এবং কোনো তৃতীয় পক্ষের কাছে বিক্রি করা হয় না। ওয়েবসাইটের সব ডেটা এনক্রিপ্টেড HTTPS সংযোগে আদান-প্রদান হয়।',
    qEn: 'Is my personal and payment information safe?',
    aEn: 'Yes. Vangcur never asks for or stores your bKash PIN, OTP or card password. Your information is used only for order processing, delivery and support, and is never sold to any third party. All data on the website is transferred over an encrypted HTTPS connection.',
  },
  {
    q: 'কাস্টমার সাপোর্টে কীভাবে যোগাযোগ করব?',
    a: 'আমাদের অফিসিয়াল WhatsApp হেল্পলাইনে (01897-804055) প্রতিদিন সকাল ৯:০০ টা থেকে রাত ১০:০০ টা পর্যন্ত সরাসরি মেসেজ দিতে পারেন। ইমেইলেও যোগাযোগ করতে পারেন: support@vangcur.com',
    qEn: 'How can I contact customer support?',
    aEn: 'You can message our official WhatsApp helpline (01897-804055) directly every day from 9:00 AM to 10:00 PM. You can also email us at support@vangcur.com',
  },
];

export async function fetchFAQs(supabase: SupabaseClient): Promise<Faq[]> {
  try {
    const { data, error } = await supabase
      .from('store_settings')
      .select('setting_value')
      .eq('setting_key', 'vc_faqs')
      .maybeSingle();
    if (error || !data) return DEFAULT_FAQS;

    const raw = data.setting_value;
    const parsed = typeof raw === 'string'
      ? (() => { try { return JSON.parse(raw); } catch { return null; } })()
      : raw;

    if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].q && parsed[0].a) {
      return parsed as Faq[];
    }
    return DEFAULT_FAQS;
  } catch {
    return DEFAULT_FAQS;
  }
}
