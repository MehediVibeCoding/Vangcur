import type { Metadata } from 'next';
import Link from 'next/link';
import {
  PolicyHeader, PolicySection, PolicyNote, PolicyContact, policyPClass, policyUlClass, policyLiClass,
} from '../PolicyContent';

export const metadata: Metadata = {
  title: 'রিটার্ন ও রিফান্ড পলিসি - Vangcur',
  description: 'Vangcur (ভাঙচুর)-এর প্রোডাক্ট রিটার্ন, এক্সচেঞ্জ, রিপ্লেসমেন্ট ও রিফান্ড সংক্রান্ত পূর্ণাঙ্গ নীতিমালা।',
};

export default function RefundPolicyPage() {
  return (
    <>
      <PolicyHeader icon="🔄" title="রিটার্ন ও রিফান্ড পলিসি" updated="আগস্ট ২০২৬" />

      <PolicySection title="১. পছন্দ না হওয়া বা মন পরিবর্তনের কারণে কোনো রিটার্ন নেই">
        <p className={policyPClass}>
          Vangcur (ভাঙচুর) থেকে কেনাকাটার পর গ্রাহকের ব্যক্তিগত পছন্দ-অপছন্দ, মন পরিবর্তন (Change of mind) কিংবা প্রোডাক্টে কোনো জেনুইন সমস্যা ব্যতীত অন্য কোনো ইচ্ছাকৃত বা অযৌক্তিক কারণে প্রোডাক্ট রিটার্ন, এক্সচেঞ্জ কিংবা রিফান্ড করার কোনো সুযোগ নেই।
        </p>
        <p className={policyPClass}>
          কাস্টমারদের অনুরোধ করা হচ্ছে অর্ডার করার পূর্বেই প্রোডাক্টের বিবরণ, ছবি এবং কার্যকারিতা ওয়েবসাইট থেকে ভালোভাবে দেখে নেওয়ার জন্য।
        </p>
      </PolicySection>

      <PolicySection title="২. রিপ্লেসমেন্ট সুবিধা (শুধুমাত্র জেনুইন সমস্যা বা ত্রুটির ক্ষেত্রে)">
        <p className={policyPClass}>
          ডেলিভারি পাওয়ার পর যদি প্রোডাক্টে কোনো আসল কারিগরি বা ম্যানুফ্যাকচারিং ত্রুটি (Manufacturing Defect), ট্রানজিট ড্যামেজ (ভাঙা বা নষ্ট প্রোডাক্ট) অথবা ভুল প্রোডাক্ট ডেলিভারি পাওয়া যায়, তবেই কেবল আমরা সেটি সম্পূর্ণ আমাদের নিজ দায়িত্বে এবং সম্পূর্ণ ফ্রিতে পরিবর্তন (Replacement) করে নতুন প্রোডাক্ট আপনার ঠিকানায় পাঠিয়ে দেব। 🤍
        </p>
        <ul className={policyUlClass}>
          <li className={policyLiClass}>ম্যানুফ্যাকচারিং ত্রুটি — প্রোডাক্ট স্বাভাবিকভাবে কাজ করছে না বা কারখানাগত সমস্যা।</li>
          <li className={policyLiClass}>ট্রানজিট ড্যামেজ — ডেলিভারির সময় পরিবহনজনিত কারণে প্রোডাক্ট ভাঙা/নষ্ট অবস্থায় পৌঁছানো।</li>
          <li className={policyLiClass}>ভুল প্রোডাক্ট — অর্ডার করা প্রোডাক্টের বদলে সম্পূর্ণ ভিন্ন কোনো প্রোডাক্ট পাঠানো হলে।</li>
        </ul>
      </PolicySection>

      <PolicySection title="🎥 ৩. আনবক্সিং ভিডিও বাধ্যতামূলক">
        <p className={policyPClass}>রিপ্লেসমেন্ট ক্লেইম করার জন্য একটানা ও আন-এডিটেড আনবক্সিং ভিডিও প্রমাণ হিসেবে দেওয়া বাধ্যতামূলক —</p>
        <ul className={policyUlClass}>
          <li className={policyLiClass}>পার্সেলের বাইরে থেকে শুরু করে প্রোডাক্টের ভেতরের সব পার্টস পর্যন্ত একটানা রেকর্ড করতে হবে (কোনো কাট বা পজ ছাড়া)।</li>
          <li className={policyLiClass}>ইলেকট্রনিক প্রোডাক্টের ক্ষেত্রে ভিডিওতে প্রোডাক্টটি চালু করে দেখাতে হবে।</li>
        </ul>
        <PolicyNote>⚠️ আনবক্সিং ভিডিও ছাড়া কোনো রিপ্লেসমেন্ট বা ওয়ারেন্টি ক্লেইম গ্রহণযোগ্য হবে না।</PolicyNote>
      </PolicySection>

      <PolicySection title="📋 ৪. ক্লেইম করার জন্য যা যা লাগবে">
        <ul className={policyUlClass}>
          <li className={policyLiClass}>মূল প্রোডাক্টের বক্স <em>(ছেঁড়া/ফাটা বক্স বা বক্সের গায়ে টেপ লাগানো থাকলে গ্রহণযোগ্য হবে না)</em></li>
          <li className={policyLiClass}>ইনভয়েস পেপার <em>(প্রোডাক্টের সাথে দেওয়া, অথবা আপনার অ্যাকাউন্ট থেকে ডাউনলোডকৃত)</em></li>
          <li className={policyLiClass}>একটানা আনবক্সিং ভিডিও</li>
          <li className={policyLiClass}>অর্ডার নম্বর — এটি <Link href="/track-order" className="font-semibold text-brand-light hover:underline">অর্ডার ট্র্যাক</Link> পেজ থেকেও দেখা যাবে</li>
        </ul>
      </PolicySection>

      <PolicySection title="📞 ৫. কীভাবে ক্লেইম করবেন">
        <ul className={policyUlClass}>
          <li className={policyLiClass}>প্রোডাক্ট হাতে পাওয়ার যত দ্রুত সম্ভব (সাধারণত ২৪ ঘণ্টার মধ্যে) আমাদের WhatsApp বা ফোনে জানান।</li>
          <li className={policyLiClass}>অর্ডার নম্বর, সমস্যার বিবরণ এবং আনবক্সিং ভিডিও পাঠান।</li>
          <li className={policyLiClass}>আমাদের টিম যাচাই করে যোগ্য হলে রিপ্লেসমেন্ট প্রক্রিয়া শুরু করবে।</li>
        </ul>
      </PolicySection>

      <PolicySection title="🛡️ ৬. ওয়ারেন্টি-ভিত্তিক ক্লেইম">
        <p className={policyPClass}>
          ডেলিভারির পরেও ওয়ারেন্টি মেয়াদের মধ্যে (প্রোডাক্টভেদে ১ সপ্তাহ থেকে ২ বছর পর্যন্ত) কোনো সমস্যা দেখা দিলে একই প্রক্রিয়ায় ওয়ারেন্টি ক্লেইম করা যাবে। বিস্তারিত <Link href="/terms" className="font-semibold text-brand-light hover:underline">শর্তাবলী</Link> পাতায় দেওয়া আছে।
        </p>
      </PolicySection>

      <div className="mb-7 border-t border-border-base pt-4 text-center font-body text-[11.5px] italic text-muted">
        ⚠️ Vangcur কর্তৃপক্ষ যেকোনো সময় এই নীতিমালা পরিবর্তন বা আপডেট করার অধিকার রাখে।
      </div>

      <PolicyContact />
    </>
  );
}
