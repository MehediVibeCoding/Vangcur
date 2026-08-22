'use client';

import Link from 'next/link';
import { useT } from '@/lib/i18n/useT';
import {
  PolicyHeader, PolicySection, PolicyNote, PolicyContact, policyPClass, policyUlClass, policyLiClass,
} from '../PolicyContent';

export default function RefundPolicyClient() {
  const { lang, t } = useT();

  return (
    <>
      <PolicyHeader icon="🔄" title="রিটার্ন ও রিফান্ড পলিসি" updated="আগস্ট ২০২৬" />

      <PolicySection title="১. পছন্দ না হওয়া বা মন পরিবর্তনের কারণে কোনো রিটার্ন নেই">
        <p className={policyPClass}>
          {lang === 'en'
            ? "After purchasing from Vangcur (ভাঙচুর), there is no option to return, exchange, or refund a product due to the customer's personal preference, change of mind, or any other unreasonable or intentional reason unrelated to a genuine product issue."
            : 'Vangcur (ভাঙচুর) থেকে কেনাকাটার পর গ্রাহকের ব্যক্তিগত পছন্দ-অপছন্দ, মন পরিবর্তন (Change of mind) কিংবা প্রোডাক্টে কোনো জেনুইন সমস্যা ব্যতীত অন্য কোনো ইচ্ছাকৃত বা অযৌক্তিক কারণে প্রোডাক্ট রিটার্ন, এক্সচেঞ্জ কিংবা রিফান্ড করার কোনো সুযোগ নেই।'}
        </p>
        <p className={policyPClass}>
          {t('কাস্টমারদের অনুরোধ করা হচ্ছে অর্ডার করার পূর্বেই প্রোডাক্টের বিবরণ, ছবি এবং কার্যকারিতা ওয়েবসাইট থেকে ভালোভাবে দেখে নেওয়ার জন্য।')}
        </p>
      </PolicySection>

      <PolicySection title="২. রিপ্লেসমেন্ট সুবিধা (শুধুমাত্র জেনুইন সমস্যা বা ত্রুটির ক্ষেত্রে)">
        <p className={policyPClass}>
          {lang === 'en'
            ? 'If, after delivery, the product has a genuine manufacturing defect, transit damage (a broken or damaged product), or you received the wrong product, we will replace it entirely at our own cost and send a new product to your address, completely free of charge. 🤍'
            : 'ডেলিভারি পাওয়ার পর যদি প্রোডাক্টে কোনো আসল কারিগরি বা ম্যানুফ্যাকচারিং ত্রুটি (Manufacturing Defect), ট্রানজিট ড্যামেজ (ভাঙা বা নষ্ট প্রোডাক্ট) অথবা ভুল প্রোডাক্ট ডেলিভারি পাওয়া যায়, তবেই কেবল আমরা সেটি সম্পূর্ণ আমাদের নিজ দায়িত্বে এবং সম্পূর্ণ ফ্রিতে পরিবর্তন (Replacement) করে নতুন প্রোডাক্ট আপনার ঠিকানায় পাঠিয়ে দেব। 🤍'}
        </p>
        <ul className={policyUlClass}>
          <li className={policyLiClass}>{t('ম্যানুফ্যাকচারিং ত্রুটি — প্রোডাক্ট স্বাভাবিকভাবে কাজ করছে না বা কারখানাগত সমস্যা।')}</li>
          <li className={policyLiClass}>{t('ট্রানজিট ড্যামেজ — ডেলিভারির সময় পরিবহনজনিত কারণে প্রোডাক্ট ভাঙা/নষ্ট অবস্থায় পৌঁছানো।')}</li>
          <li className={policyLiClass}>{t('ভুল প্রোডাক্ট — অর্ডার করা প্রোডাক্টের বদলে সম্পূর্ণ ভিন্ন কোনো প্রোডাক্ট পাঠানো হলে।')}</li>
        </ul>
      </PolicySection>

      <PolicySection title="🎥 ৩. আনবক্সিং ভিডিও বাধ্যতামূলক">
        <p className={policyPClass}>{t('রিপ্লেসমেন্ট ক্লেইম করার জন্য একটানা ও আন-এডিটেড আনবক্সিং ভিডিও প্রমাণ হিসেবে দেওয়া বাধ্যতামূলক —')}</p>
        <ul className={policyUlClass}>
          <li className={policyLiClass}>{t('পার্সেলের বাইরে থেকে শুরু করে প্রোডাক্টের ভেতরের সব পার্টস পর্যন্ত একটানা রেকর্ড করতে হবে (কোনো কাট বা পজ ছাড়া)।')}</li>
          <li className={policyLiClass}>{t('ইলেকট্রনিক প্রোডাক্টের ক্ষেত্রে ভিডিওতে প্রোডাক্টটি চালু করে দেখাতে হবে।')}</li>
        </ul>
        <PolicyNote>{t('⚠️ আনবক্সিং ভিডিও ছাড়া কোনো রিপ্লেসমেন্ট বা ওয়ারেন্টি ক্লেইম গ্রহণযোগ্য হবে না।')}</PolicyNote>
      </PolicySection>

      <PolicySection title="📋 ৪. ক্লেইম করার জন্য যা যা লাগবে">
        <ul className={policyUlClass}>
          <li className={policyLiClass}>
            {lang === 'en'
              ? <>The original product box <em>(a torn/cracked box, or a box with tape on it, will not be accepted)</em></>
              : <>মূল প্রোডাক্টের বক্স <em>(ছেঁড়া/ফাটা বক্স বা বক্সের গায়ে টেপ লাগানো থাকলে গ্রহণযোগ্য হবে না)</em></>}
          </li>
          <li className={policyLiClass}>
            {lang === 'en'
              ? <>Invoice paper <em>(provided with the product, or downloaded from your account)</em></>
              : <>ইনভয়েস পেপার <em>(প্রোডাক্টের সাথে দেওয়া, অথবা আপনার অ্যাকাউন্ট থেকে ডাউনলোডকৃত)</em></>}
          </li>
          <li className={policyLiClass}>{t('একটানা আনবক্সিং ভিডিও')}</li>
          <li className={policyLiClass}>
            {lang === 'en'
              ? <>Order number — this can also be found on the <Link href="/track-order" className="font-semibold text-brand-light hover:underline">Track Order</Link> page</>
              : <>অর্ডার নম্বর — এটি <Link href="/track-order" className="font-semibold text-brand-light hover:underline">অর্ডার ট্র্যাক</Link> পেজ থেকেও দেখা যাবে</>}
          </li>
        </ul>
      </PolicySection>

      <PolicySection title="📞 ৫. কীভাবে ক্লেইম করবেন">
        <ul className={policyUlClass}>
          <li className={policyLiClass}>{t('প্রোডাক্ট হাতে পাওয়ার যত দ্রুত সম্ভব (সাধারণত ২৪ ঘণ্টার মধ্যে) আমাদের WhatsApp বা ফোনে জানান।')}</li>
          <li className={policyLiClass}>{t('অর্ডার নম্বর, সমস্যার বিবরণ এবং আনবক্সিং ভিডিও পাঠান।')}</li>
          <li className={policyLiClass}>{t('আমাদের টিম যাচাই করে যোগ্য হলে রিপ্লেসমেন্ট প্রক্রিয়া শুরু করবে।')}</li>
        </ul>
      </PolicySection>

      <PolicySection title="🛡️ ৬. ওয়ারেন্টি-ভিত্তিক ক্লেইম">
        <p className={policyPClass}>
          {lang === 'en'
            ? <>If an issue arises even after delivery, within the warranty period (ranging from 1 week to 2 years depending on the product), you can file a warranty claim through the same process. Full details are on the <Link href="/terms" className="font-semibold text-brand-light hover:underline">Terms & Conditions</Link> page.</>
            : <>ডেলিভারির পরেও ওয়ারেন্টি মেয়াদের মধ্যে (প্রোডাক্টভেদে ১ সপ্তাহ থেকে ২ বছর পর্যন্ত) কোনো সমস্যা দেখা দিলে একই প্রক্রিয়ায় ওয়ারেন্টি ক্লেইম করা যাবে। বিস্তারিত <Link href="/terms" className="font-semibold text-brand-light hover:underline">শর্তাবলী</Link> পাতায় দেওয়া আছে।</>}
        </p>
      </PolicySection>

      <div className="mb-7 border-t border-border-base pt-4 text-center font-body text-[11.5px] italic text-muted">
        {t('⚠️ Vangcur কর্তৃপক্ষ যেকোনো সময় এই নীতিমালা পরিবর্তন বা আপডেট করার অধিকার রাখে।')}
      </div>

      <PolicyContact />
    </>
  );
}
