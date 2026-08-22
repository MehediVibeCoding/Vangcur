'use client';

import Link from 'next/link';
import { useT } from '@/lib/i18n/useT';
import {
  PolicyHeader, PolicySection, PolicyNote, PolicyContact, policyPClass, policyUlClass, policyLiClass,
} from '../PolicyContent';

export default function TermsClient() {
  const { lang, t } = useT();

  return (
    <>
      <PolicyHeader icon="📋" title="শর্তাবলী (Terms & Conditions)" updated="আগস্ট ২০২৬" />

      <PolicySection title="১. ভূমিকা">
        <p className={policyPClass}>
          {lang === 'en'
            ? 'By placing an order through the Vangcur (ভাঙচুর) website, you are considered to have agreed to the terms below. Please read this entire page carefully before ordering.'
            : 'Vangcur (ভাঙচুর) ওয়েবসাইট ব্যবহার করে অর্ডার করার মাধ্যমে আপনি নিচের শর্তাবলীর সাথে সম্মত হচ্ছেন বলে ধরে নেওয়া হবে। অনুগ্রহ করে অর্ডার করার আগে পুরো পাতাটি মনোযোগ দিয়ে পড়ুন।'}
        </p>
      </PolicySection>

      <PolicySection title="🧾 ২. অর্ডার সংক্রান্ত">
        <ul className={policyUlClass}>
          <li className={policyLiClass}>
            {t('অর্ডার সম্পন্ন করার আগে অনুগ্রহ করে নিশ্চিত করুন যে আপনার দেওয়া নাম, মোবাইল নম্বর, ডেলিভারি ঠিকানা, bKash ট্রানজেকশন আইডি বা বিকাশের শেষ ৪ ডিজিট সহ সকল তথ্য সঠিক।')}
          </li>
          <li className={policyLiClass}>
            {lang === 'en'
              ? <>If any information is incorrect, <strong>Vangcur reserves the full right to cancel your order.</strong></>
              : <>যেকোনো তথ্য ভুল দিলে <strong>Vangcur আপনার অর্ডারটি বাতিল করার সম্পূর্ণ অধিকার রাখে।</strong></>}
          </li>
          <li className={policyLiClass}>
            {t('অর্ডার কনফার্ম হওয়ার ২৪ ঘণ্টার মধ্যে ডেলিভারি প্রক্রিয়া শুরু হবে।')}
          </li>
          <li className={policyLiClass}>
            {t('২৪–৪৮ ঘণ্টার মধ্যে কুরিয়ার সার্ভিস থেকে আপনার দেওয়া নম্বরে পার্সেলের ট্র্যাকিং লিংক পাঠানো হবে।')}
          </li>
          <li className={policyLiClass}>
            {t('ওয়েবসাইটে প্রদর্শিত মূল্য যেকোনো সময় পরিবর্তন হতে পারে; তবে ইতিমধ্যে কনফার্ম হওয়া অর্ডারের মূল্য পরিবর্তন হবে না।')}
          </li>
        </ul>
      </PolicySection>

      <PolicySection title="💳 ৩. মূল্য ও পেমেন্ট">
        <ul className={policyUlClass}>
          <li className={policyLiClass}>{t('সকল মূল্য বাংলাদেশি টাকায় (৳) প্রদর্শিত হয়।')}</li>
          <li className={policyLiClass}>
            {t('বর্তমানে অর্ডার কনফার্ম করতে আংশিক পেমেন্ট (advance) bKash-এর মাধ্যমে ম্যানুয়ালি ভেরিফাই করা হয় — আপনার দেওয়া ট্রানজেকশন আইডি/শেষ ৪ ডিজিট দেখে অ্যাডমিন টিম যাচাই করে অর্ডার কনফার্ম করেন।')}
          </li>
          <li className={policyLiClass}>{t('Vangcur কখনো আপনার bKash পিন বা পূর্ণ কার্ড তথ্য চায় না বা সংরক্ষণ করে না।')}</li>
          <li className={policyLiClass}>{t('অবশিষ্ট (বাকি) টাকা ক্লোজড বক্স ডেলিভারির সময় ডেলিভারিম্যানকে পরিশোধ করতে হয়।')}</li>
        </ul>
      </PolicySection>

      <PolicySection title="🚚 ৪. ডেলিভারি সংক্রান্ত">
        <p className={policyPClass}>
          {lang === 'en'
            ? <>Vangcur ships products using the <strong>closed-box delivery</strong> method. So —</>
            : <>Vangcur <strong>ক্লোজড বক্স ডেলিভারি</strong> পদ্ধতিতে প্রোডাক্ট পাঠায়। তাই —</>}
        </p>
        <ul className={policyUlClass}>
          <li className={policyLiClass}>
            {lang === 'en'
              ? <>Please pay the delivery person the <strong>remaining amount</strong> first, then accept the parcel.</>
              : <>ডেলিভারিম্যানকে আগে <strong>অবশিষ্ট টাকা পরিশোধ করুন</strong>, তারপর পার্সেল বুঝে নিন।</>}
          </li>
          <li className={policyLiClass}>
            {lang === 'en'
              ? <>Once you have the product in hand, there is <strong>no option to return it</strong> if you simply don&apos;t like it. Please review the product details and photos carefully before ordering.</>
              : <>প্রোডাক্ট হাতে পাওয়ার পর পছন্দ না হলে ফেরত দেওয়ার <strong>কোনো সুযোগ নেই।</strong> অর্ডার করার আগেই প্রোডাক্টের বিবরণ ও ছবি ভালোভাবে দেখে নিন।</>}
          </li>
        </ul>
      </PolicySection>

      <PolicySection title="🎥 ৫. আনবক্সিং ভিডিও নীতি (অবশ্যই করণীয়)">
        <p className={policyPClass}>
          {lang === 'en'
            ? <>While opening the product after receiving it, please record a <strong>continuous unboxing video</strong> —</>
            : <>প্রোডাক্ট পাওয়ার পর খোলার সময় <strong>একটানা আনবক্সিং ভিডিও</strong> ধারণ করুন —</>}
        </p>
        <ul className={policyUlClass}>
          <li className={policyLiClass}>{t('পার্সেলের বাইরে থেকে শুরু করে প্রোডাক্টের ভেতরের সব পার্টস পর্যন্ত একটানা রেকর্ড করতে হবে।')}</li>
          <li className={policyLiClass}>
            {lang === 'en'
              ? <>The video must not have <strong>any cuts or pauses.</strong></>
              : <>ভিডিওতে <strong>কোনো কাট বা পজ</strong> দেওয়া যাবে না।</>}
          </li>
          <li className={policyLiClass}>
            {lang === 'en'
              ? <>For electronic products, the video must <strong>show the product being turned on.</strong></>
              : <>ইলেকট্রনিক প্রোডাক্টের ক্ষেত্রে ভিডিওতে প্রোডাক্টটি <strong>চালু করে দেখাতে হবে।</strong></>}
          </li>
        </ul>
        <PolicyNote>
          {t('⚠️ আনবক্সিং ভিডিও ছাড়া কোনো ওয়ারেন্টি বা রিপ্লেসমেন্ট ক্লেইম করা সম্ভব নয়।')}
        </PolicyNote>
      </PolicySection>

      <PolicySection title="🛡️ ৬. ওয়ারেন্টি সংক্রান্ত">
        <ul className={policyUlClass}>
          <li className={policyLiClass}>
            {lang === 'en'
              ? <>Regular products come with a <strong>1-week</strong> warranty. Selected products carry up to 6 months / 1 year / 2 years of warranty (mentioned on the product page).</>
              : <>সাধারণ প্রোডাক্টে <strong>১ সপ্তাহের</strong> ওয়ারেন্টি থাকবে। নির্বাচিত প্রোডাক্টে ৬ মাস / ১ বছর / ২ বছর পর্যন্ত ওয়ারেন্টি থাকবে (প্রোডাক্ট পেজে উল্লেখ থাকে)।</>}
          </li>
          <li className={policyLiClass}>
            {lang === 'en'
              ? <>The warranty period starts <strong>from the date the order is placed.</strong></>
              : <>ওয়ারেন্টির মেয়াদ শুরু হয় <strong>অর্ডার করার তারিখ থেকে।</strong></>}
          </li>
          <li className={policyLiClass}>{t('ওয়ারেন্টির মধ্যে প্রোডাক্টে সমস্যা হলে ও ক্লেইম করা হলে, Vangcur নিজ খরচে সেটি রিপ্লেস করে নতুন প্রোডাক্ট আপনার ঠিকানায় পৌঁছে দেবে।')}</li>
          <li className={policyLiClass}>{t('ওয়ারেন্টি থাকাকালীন সময়ে অবশ্যই প্রোডাক্টের বক্স ও ইনভয়েস পেপার সযত্নে সংরক্ষণ করুন।')}</li>
        </ul>
        <p className={policyPClass}>
          <strong>{t('ওয়ারেন্টি ক্লেইম করতে যা লাগবে —')}</strong>
        </p>
        <ul className={policyUlClass}>
          <li className={policyLiClass}>
            {lang === 'en'
              ? <>The original product box <em>(a torn/cracked box, or a box with tape on it, will not be accepted)</em></>
              : <>মূল প্রোডাক্টের বক্স <em>(ছেঁড়া/ফাটা বক্স বা বক্সের গায়ে টেপ লাগানো থাকলে গ্রহণযোগ্য হবে না)</em></>}
          </li>
          <li className={policyLiClass}>
            {lang === 'en'
              ? <>Invoice paper <em>(provided with the product)</em></>
              : <>ইনভয়েস পেপার <em>(প্রোডাক্টের সাথে দেওয়া)</em></>}
          </li>
          <li className={policyLiClass}>{t('আনবক্সিং ভিডিও')}</li>
        </ul>
      </PolicySection>

      <PolicySection title="🔄 ৭. রিটার্ন, এক্সচেঞ্জ ও রিফান্ড">
        <p className={policyPClass}>
          {lang === 'en'
            ? <>Full return and refund policy details are available separately on the <Link href="/refund-policy" className="font-semibold text-brand-light hover:underline">Refund Policy</Link> page. In short — there is no return for change of mind or personal preference; a free replacement is offered only for genuine manufacturing defects, transit damage, or the wrong product.</>
            : <>রিটার্ন ও রিফান্ড সংক্রান্ত পূর্ণাঙ্গ নীতিমালা আলাদাভাবে <Link href="/refund-policy" className="font-semibold text-brand-light hover:underline">রিফান্ড পলিসি</Link> পাতায় দেওয়া আছে। সংক্ষেপে — পছন্দ না হওয়া বা মন পরিবর্তনের কারণে কোনো রিটার্ন নেই; শুধুমাত্র জেনুইন ম্যানুফ্যাকচারিং ত্রুটি, ট্রানজিট ড্যামেজ বা ভুল প্রোডাক্টের ক্ষেত্রে ফ্রি রিপ্লেসমেন্ট দেওয়া হয়।</>}
        </p>
      </PolicySection>

      <PolicySection title="👤 ৮. অ্যাকাউন্ট ও ব্যবহারকারীর দায়িত্ব">
        <ul className={policyUlClass}>
          <li className={policyLiClass}>{t('অ্যাকাউন্ট তৈরির সময় সঠিক ও সত্য তথ্য দেওয়া বাধ্যতামূলক।')}</li>
          <li className={policyLiClass}>{t('আপনার অ্যাকাউন্টের লগইন তথ্যের নিরাপত্তার দায়িত্ব আপনার নিজের।')}</li>
          <li className={policyLiClass}>{t('প্রতারণামূলক অর্ডার, ভুয়া তথ্য বা ওয়েবসাইট অপব্যবহারের ক্ষেত্রে Vangcur সংশ্লিষ্ট অ্যাকাউন্ট/অর্ডার বাতিল বা স্থগিত করার অধিকার রাখে।')}</li>
        </ul>
      </PolicySection>

      <PolicySection title="©️ ৯. কপিরাইট ও বুদ্ধিবৃত্তিক সম্পত্তি">
        <p className={policyPClass}>
          {t('এই ওয়েবসাইটের সকল লোগো, ডিজাইন, লেখা ও ছবি Vangcur-এর সম্পত্তি (অথবা যথাযথ অনুমতিক্রমে ব্যবহৃত)। লিখিত অনুমতি ছাড়া বাণিজ্যিকভাবে পুনঃব্যবহার করা যাবে না।')}
        </p>
      </PolicySection>

      <PolicySection title="⚖️ ১০. দায়বদ্ধতার সীমাবদ্ধতা">
        <p className={policyPClass}>
          {t('স্বাভাবিক ব্যবহারজনিত ঝুঁকি, ভুল ব্যবহার বা তৃতীয় পক্ষের কারণে সৃষ্ট ক্ষতির জন্য Vangcur দায়ী থাকবে না। ওয়েবসাইটে তথ্যগত ভুল-ভ্রান্তি থাকলে তা যত দ্রুত সম্ভব সংশোধন করার চেষ্টা করা হয়।')}
        </p>
      </PolicySection>

      <PolicySection title="🔁 ১১. শর্তাবলী পরিবর্তনের অধিকার">
        <p className={policyPClass}>
          {t('Vangcur কর্তৃপক্ষ যেকোনো সময় এই শর্তাবলী পরিবর্তন বা আপডেট করার অধিকার রাখে। বড় কোনো পরিবর্তন হলে এই পাতায় তা আপডেট করা হবে।')}
        </p>
      </PolicySection>

      <PolicySection title="🇧🇩 ১২. প্রযোজ্য আইন">
        <p className={policyPClass}>{t('এই শর্তাবলী বাংলাদেশের প্রচলিত আইন অনুযায়ী পরিচালিত হবে।')}</p>
      </PolicySection>

      <PolicyContact />
    </>
  );
}
