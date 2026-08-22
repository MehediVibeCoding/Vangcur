'use client';

import { useT } from '@/lib/i18n/useT';
import {
  PolicyHeader, PolicySection, PolicyContact, policyPClass, policyUlClass, policyLiClass,
} from '../PolicyContent';

export default function PrivacyPolicyClient() {
  const { lang, t } = useT();

  return (
    <>
      <PolicyHeader icon="🔒" title="প্রাইভেসি পলিসি" updated="আগস্ট ২০২৬" />

      <PolicySection title="১. ভূমিকা">
        <p className={policyPClass}>
          {lang === 'en'
            ? 'Vangcur (ভাঙচুর) takes the privacy of your personal information seriously. This page explains what information we collect, why we collect it, and how we use and protect it. By using this website, you are considered to have agreed to this policy.'
            : 'Vangcur (ভাঙচুর) আপনার ব্যক্তিগত তথ্যের গোপনীয়তাকে গুরুত্বের সাথে দেখে। এই পাতায় ব্যাখ্যা করা হয়েছে আমরা কী তথ্য সংগ্রহ করি, কেন সংগ্রহ করি এবং কীভাবে তা ব্যবহার ও সুরক্ষিত রাখি। ওয়েবসাইট ব্যবহার করে আপনি এই নীতিমালায় সম্মত হচ্ছেন বলে ধরে নেওয়া হবে।'}
        </p>
      </PolicySection>

      <PolicySection title="📥 ২. আমরা যে তথ্য সংগ্রহ করি">
        <ul className={policyUlClass}>
          <li className={policyLiClass}>
            {lang === 'en'
              ? <><strong>Order information:</strong> name, mobile number, delivery address, email (optional), and the bKash transaction ID or last 4 digits for payment verification.</>
              : <><strong>অর্ডার তথ্য:</strong> নাম, মোবাইল নম্বর, ডেলিভারি ঠিকানা, ইমেইল (ঐচ্ছিক), এবং পেমেন্ট যাচাইয়ের জন্য bKash ট্রানজেকশন আইডি বা শেষ ৪ ডিজিট।</>}
          </li>
          <li className={policyLiClass}>
            {lang === 'en'
              ? <><strong>Account information:</strong> if you sign up, your name, email, and password (encrypted); or, if you log in with Google, the name and email received from Google.</>
              : <><strong>অ্যাকাউন্ট তথ্য:</strong> সাইন-আপ করলে নাম, ইমেইল ও পাসওয়ার্ড (এনক্রিপ্টেড), অথবা আপনি Google দিয়ে লগইন করলে Google থেকে পাওয়া নাম ও ইমেইল।</>}
          </li>
          <li className={policyLiClass}>
            {lang === 'en'
              ? <><strong>Browser-local information:</strong> your cart, wishlist, and recently viewed products are stored in your browser (localStorage) — this is not sent to our servers unless you place an order or log in.</>
              : <><strong>ব্রাউজার-লোকাল তথ্য:</strong> কার্ট, উইশলিস্ট এবং সাম্প্রতিক দেখা প্রোডাক্টের তথ্য আপনার ব্রাউজারে (localStorage) সংরক্ষিত থাকে — এটি আমাদের সার্ভারে পাঠানো হয় না যতক্ষণ না আপনি অর্ডার/লগইন করেন।</>}
          </li>
          <li className={policyLiClass}>
            {lang === 'en'
              ? <><strong>Order history:</strong> if you're logged in, your past orders are linked to your account so you can easily track them.</>
              : <><strong>অর্ডার হিস্টোরি:</strong> লগইন করা থাকলে আপনার আগের অর্ডারসমূহের তথ্য অ্যাকাউন্টের সাথে যুক্ত থাকে, যাতে আপনি সহজে ট্র্যাক করতে পারেন।</>}
          </li>
        </ul>
      </PolicySection>

      <PolicySection title="⚙️ ৩. তথ্য কীভাবে ব্যবহার করা হয়">
        <ul className={policyUlClass}>
          <li className={policyLiClass}>{t('অর্ডার প্রসেস করা, ডেলিভারি পাঠানো ও পেমেন্ট যাচাই করার জন্য।')}</li>
          <li className={policyLiClass}>{t('অর্ডার সংক্রান্ত যোগাযোগ (কনফার্মেশন, স্ট্যাটাস আপডেট, ওয়ারেন্টি/রিপ্লেসমেন্ট সহায়তা) করার জন্য।')}</li>
          <li className={policyLiClass}>{t('আপনার অ্যাকাউন্ট, উইশলিস্ট ও অর্ডার হিস্টোরি সংরক্ষণ করার জন্য।')}</li>
          <li className={policyLiClass}>{t('গ্রাহক সেবা উন্নত করা ও প্রতারণামূলক অর্ডার শনাক্ত করার জন্য।')}</li>
        </ul>
        <p className={policyPClass}>{t('আমরা আপনার ব্যক্তিগত তথ্য কোনো তৃতীয় পক্ষের কাছে বিক্রি করি না।')}</p>
      </PolicySection>

      <PolicySection title="🤝 ৪. তৃতীয় পক্ষের সেবা">
        <p className={policyPClass}>{t('ওয়েবসাইট পরিচালনার জন্য আমরা নির্দিষ্ট কিছু বিশ্বস্ত সেবা ব্যবহার করি —')}</p>
        <ul className={policyUlClass}>
          <li className={policyLiClass}>
            {lang === 'en'
              ? <><strong>Supabase:</strong> used for our database, authentication (login), and real-time order status updates.</>
              : <><strong>Supabase:</strong> আমাদের ডাটাবেস, অথেন্টিকেশন (লগইন) ও রিয়েল-টাইম অর্ডার স্ট্যাটাস আপডেটের জন্য ব্যবহৃত হয়।</>}
          </li>
          <li className={policyLiClass}>
            {lang === 'en'
              ? <><strong>Cloudinary:</strong> used to host and optimize product images.</>
              : <><strong>Cloudinary:</strong> প্রোডাক্টের ছবি হোস্ট ও অপটিমাইজ করার জন্য ব্যবহৃত হয়।</>}
          </li>
          <li className={policyLiClass}>
            {lang === 'en'
              ? <><strong>bKash:</strong> payments are verified manually — our admin team confirms using the transaction ID/last 4 digits you provide. We do not collect or store your bKash PIN or full account details.</>
              : <><strong>bKash:</strong> পেমেন্ট যাচাই ম্যানুয়ালি করা হয় — আপনার দেওয়া ট্রানজেকশন আইডি/শেষ ৪ ডিজিট দেখে অ্যাডমিন টিম নিশ্চিত করেন। আমরা আপনার bKash পিন বা পূর্ণ অ্যাকাউন্ট তথ্য সংগ্রহ বা সংরক্ষণ করি না।</>}
          </li>
          <li className={policyLiClass}>
            {lang === 'en'
              ? <><strong>Courier partners:</strong> the name, address, and mobile number needed for delivery are shared only for the purpose of delivering the package.</>
              : <><strong>কুরিয়ার পার্টনার:</strong> ডেলিভারির জন্য প্রয়োজনীয় নাম, ঠিকানা ও মোবাইল নম্বর শুধুমাত্র প্যাকেজ ডেলিভারির উদ্দেশ্যে শেয়ার করা হয়।</>}
          </li>
          <li className={policyLiClass}>
            {lang === 'en'
              ? <><strong>Google:</strong> if you choose to, you can log in with your Google account; in that case, only your name and email are shared with us.</>
              : <><strong>Google:</strong> আপনি চাইলে Google অ্যাকাউন্ট দিয়ে লগইন করতে পারেন; সেক্ষেত্রে শুধু নাম ও ইমেইল আমাদের কাছে আসে।</>}
          </li>
        </ul>
      </PolicySection>

      <PolicySection title="🍪 ৫. কুকি ও লোকাল স্টোরেজ">
        <p className={policyPClass}>
          {lang === 'en'
            ? "We use your browser's local storage/cookies to remember your login session and cart/wishlist — so your information isn't lost while you browse the site. We currently do not use any third-party advertising-tracking cookies. This page will be updated if this policy changes in the future."
            : 'আমরা লগইন সেশন ও কার্ট/উইশলিস্ট মনে রাখার জন্য আপনার ব্রাউজারের লোকাল স্টোরেজ/কুকি ব্যবহার করি — যাতে সাইট ঘুরে বেড়ানোর সময় আপনার তথ্য হারিয়ে না যায়। বর্তমানে আমরা কোনো তৃতীয় পক্ষের বিজ্ঞাপন-ট্র্যাকিং কুকি ব্যবহার করি না। ভবিষ্যতে এই নীতি পরিবর্তন হলে এই পাতা আপডেট করা হবে।'}
        </p>
      </PolicySection>

      <PolicySection title="🔐 ৬. তথ্য সংরক্ষণ ও নিরাপত্তা">
        <ul className={policyUlClass}>
          <li className={policyLiClass}>{t('পাসওয়ার্ড এনক্রিপ্টেড অবস্থায় সংরক্ষণ করা হয়; আমরা কখনো আপনার প্লেইন-টেক্সট পাসওয়ার্ড দেখতে পাই না।')}</li>
          <li className={policyLiClass}>{t('আপনার তথ্য সুরক্ষিত সার্ভারে সংরক্ষিত থাকে এবং শুধুমাত্র অনুমোদিত ব্যক্তিরা তা অ্যাক্সেস করতে পারেন।')}</li>
          <li className={policyLiClass}>{t('ইন্টারনেটে তথ্য আদান-প্রদান সম্পূর্ণ ঝুঁকিমুক্ত নয়; আমরা যুক্তিসঙ্গত নিরাপত্তা ব্যবস্থা নিলেও শতভাগ নিরাপত্তার নিশ্চয়তা দেওয়া সম্ভব নয়।')}</li>
        </ul>
      </PolicySection>

      <PolicySection title="✅ ৭. আপনার অধিকার">
        <p className={policyPClass}>{t('আপনি চাইলে —')}</p>
        <ul className={policyUlClass}>
          <li className={policyLiClass}>{t('আপনার সংরক্ষিত তথ্য দেখতে বা সংশোধন করতে পারেন (নাম পরিবর্তন অ্যাকাউন্ট থেকেই করা যায়)।')}</li>
          <li className={policyLiClass}>{t('আপনার অ্যাকাউন্ট ও তথ্য মুছে ফেলার অনুরোধ করতে পারেন — নিচের যোগাযোগ মাধ্যমে জানালে আমরা যাচাই করে ব্যবস্থা নেব।')}</li>
          <li className={policyLiClass}>{t('মার্কেটিং যোগাযোগ থেকে বিরত থাকার অনুরোধ করতে পারেন।')}</li>
        </ul>
      </PolicySection>

      <PolicySection title="🧒 ৮. শিশুদের গোপনীয়তা">
        <p className={policyPClass}>
          {t('এই ওয়েবসাইট প্রাপ্তবয়স্কদের জন্য তৈরি। জেনেশুনে ১৮ বছরের কম বয়সীদের কাছ থেকে আমরা তথ্য সংগ্রহ করি না। এমন কিছু লক্ষ্য করলে অনুগ্রহ করে আমাদের জানান, আমরা প্রয়োজনীয় ব্যবস্থা নেব।')}
        </p>
      </PolicySection>

      <PolicySection title="🔁 ৯. নীতিমালা পরিবর্তন">
        <p className={policyPClass}>
          {t('প্রয়োজন অনুযায়ী আমরা এই প্রাইভেসি পলিসি সময়ে সময়ে আপডেট করতে পারি। বড় কোনো পরিবর্তন হলে এই পাতায় তারিখসহ আপডেট করা হবে।')}
        </p>
      </PolicySection>

      <PolicyContact />
    </>
  );
}
