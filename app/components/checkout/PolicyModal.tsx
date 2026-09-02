'use client';

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { lockBody, unlockBody } from '@/lib/bodyScrollLock';
import useHistoryModal from '@/lib/useHistoryModal';
import { useT } from '@/lib/i18n/useT';

interface PolicyModalProps {
  open: boolean;
  onClose: () => void;
  onAgreeAndConfirm: () => void;
}

const lineIcon = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

function IconDocList() {
  return (
    <svg {...lineIcon} width="16" height="16" strokeWidth={2} className="text-brand-light">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <line x1="10" y1="9" x2="8" y2="9" />
    </svg>
  );
}

function IconBox() {
  return (
    <svg {...lineIcon} width="15" height="15" strokeWidth={2} className="shrink-0 text-brand-light">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  );
}

function IconTruck() {
  return (
    <svg {...lineIcon} width="15" height="15" strokeWidth={2} className="shrink-0 text-brand-light">
      <rect x="1" y="3" width="15" height="13" rx="1" />
      <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
      <circle cx="5.5" cy="18.5" r="2.5" />
      <circle cx="18.5" cy="18.5" r="2.5" />
    </svg>
  );
}

function IconVideoCamera() {
  return (
    <svg {...lineIcon} width="15" height="15" strokeWidth={2} className="shrink-0 text-brand-light">
      <rect x="2" y="6" width="14" height="12" rx="2" />
      <path d="m16 10 5-3.5v11L16 14" />
    </svg>
  );
}

function IconShield() {
  return (
    <svg {...lineIcon} width="15" height="15" strokeWidth={2} className="shrink-0 text-brand-light">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function IconRefresh() {
  return (
    <svg {...lineIcon} width="15" height="15" strokeWidth={2} className="shrink-0 text-brand-light">
      <polyline points="23 4 23 10 17 10" />
      <polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
  );
}

function IconAlertShield() {
  return (
    <svg {...lineIcon} width="15" height="15" strokeWidth={2} className="shrink-0 text-amber-700">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

function IconCheck() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="mb-5 rounded-[16px] border border-border-base/70 bg-[#F8FAFC]/80 p-4 shadow-2xs">
      <h3 className="mb-2.5 flex items-center gap-2 font-body text-[14px] font-bold text-ink">
        {icon}
        <span>{title}</span>
      </h3>
      {children}
    </div>
  );
}

const pClass = 'mb-2 font-body text-[13px] leading-[1.8] text-ink/85';
const ulClass = 'mb-2 list-disc space-y-1.5 pl-4 text-ink/85';
const liClass = 'font-body text-[12.5px] leading-[1.75] text-ink/85';

export default function PolicyModal({ open, onClose, onAgreeAndConfirm }: PolicyModalProps) {
  const { lang, t } = useT();

  useHistoryModal(open, onClose, 'policy-modal');

  useEffect(() => {
    if (open) lockBody();
    else unlockBody();
    return () => unlockBody();
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const onKeydown = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKeydown);
    return () => document.removeEventListener('keydown', onKeydown);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[9800] flex items-center justify-center p-0 sm:p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
            className="fixed inset-0 bg-ink/55 backdrop-blur-[3px]"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.98 }}
            transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
            className="sleek-scrollbar relative z-10 flex h-full max-h-[100dvh] w-full max-w-[540px] flex-col overflow-y-auto bg-white shadow-sh3 sm:h-auto sm:max-h-[90vh] sm:rounded-[24px] sm:border sm:border-border-base"
          >
            <div className="sticky top-0 z-[2] flex items-center justify-between border-b border-border-base bg-white/95 px-5 py-3.5 backdrop-blur-md">
              <div className="flex items-center gap-2">
                <IconDocList />
                <h3 className="font-body text-[15.5px] font-extrabold text-ink">
                  {lang === 'en' ? 'Terms & Conditions' : 'নীতিমালা ও শর্তাবলী'}
                </h3>
              </div>
              <motion.button
                whileTap={{ scale: 0.88 }}
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-white/60 bg-white/80 text-ink/60 shadow-sh1 backdrop-blur-[8px] transition-colors hover:bg-white hover:text-ink focus-visible:outline-none"
                aria-label={lang === 'en' ? 'Close' : 'বন্ধ করুন'}
              >
                ✕
              </motion.button>
            </div>

            <div className="flex-1 px-5 pb-8 pt-4">
              <Section
                icon={<IconBox />}
                title={lang === 'en' ? '1. Order Terms' : '১. অর্ডার সংক্রান্ত'}
              >
                <ul className={ulClass}>
                  <li className={liClass}>
                    {t('অর্ডার সম্পন্ন করার আগে অনুগ্রহ করে নিশ্চিত করুন যে আপনার দেওয়া নাম, মোবাইল নম্বর, ডেলিভারি ঠিকানা, bKash ট্রানজেকশন আইডি বা বিকাশের শেষ ৪ ডিজিট সহ সকল তথ্য সঠিক।')}
                  </li>
                  <li className={liClass}>
                    {lang === 'en'
                      ? <>If any information is incorrect, <strong>Vangcur reserves the full right to cancel your order.</strong></>
                      : <>যেকোনো তথ্য ভুল দিলে <strong>Vangcur আপনার অর্ডারটি বাতিল করার সম্পূর্ণ অধিকার রাখে।</strong></>}
                  </li>
                  <li className={liClass}>
                    {t('অর্ডার কনফার্ম হওয়ার ২৪ ঘণ্টার মধ্যে ডেলিভারি প্রক্রিয়া শুরু হবে।')}
                  </li>
                  <li className={liClass}>
                    {t('২৪–৪৮ ঘণ্টার মধ্যে কুরিয়ার সার্ভিস থেকে আপনার দেওয়া নম্বরে পার্সেলের ট্র্যাকিং লিংক পাঠানো হবে।')}
                  </li>
                </ul>
              </Section>

              <Section
                icon={<IconTruck />}
                title={lang === 'en' ? '2. Delivery Terms' : '২. ডেলিভারি সংক্রান্ত'}
              >
                <p className={pClass}>
                  {lang === 'en'
                    ? <>Vangcur ships products using the <strong>closed-box delivery</strong> method. So —</>
                    : <>Vangcur <strong>ক্লোজড বক্স ডেলিভারি</strong> পদ্ধতিতে প্রোডাক্ট পাঠায়। তাই —</>}
                </p>
                <ul className={ulClass}>
                  <li className={liClass}>
                    {lang === 'en'
                      ? <>Please pay the delivery person the <strong>remaining amount</strong> first, then accept the parcel.</>
                      : <>ডেলিভারিম্যানকে আগে <strong>অবশিষ্ট টাকা পরিশোধ করুন</strong>, তারপর পার্সেল বুঝে নিন।</>}
                  </li>
                  <li className={liClass}>
                    {lang === 'en'
                      ? <>Once you have the product in hand, there is <strong>no option to return it</strong> if you simply don&apos;t like it. Please review the product details and photos carefully before ordering.</>
                      : <>প্রোডাক্ট হাতে পাওয়ার পর পছন্দ না হলে ফেরত দেওয়ার <strong>কোনো সুযোগ নেই।</strong> অর্ডার করার আগেই প্রোডাক্টের বিবরণ ও ছবি ভালোভাবে দেখে নিন।</>}
                  </li>
                </ul>
              </Section>

              <Section
                icon={<IconVideoCamera />}
                title={lang === 'en' ? '3. Unboxing Video Terms (Mandatory)' : '৩. আনবক্সিং ভিডিও সংক্রান্ত (অবশ্যই করণীয়)'}
              >
                <p className={pClass}>
                  {lang === 'en'
                    ? <>While opening the product after receiving it, please record a <strong>continuous unboxing video</strong> —</>
                    : <>প্রোডাক্ট পাওয়ার পর খোলার সময় <strong>একটানা আনবক্সিং ভিডিও</strong> ধারণ করুন —</>}
                </p>
                <ul className={ulClass}>
                  <li className={liClass}>
                    {t('পার্সেলের বাইরে থেকে শুরু করে প্রোডাক্টের ভেতরের সব পার্টস পর্যন্ত একটানা রেকর্ড করতে হবে।')}
                  </li>
                  <li className={liClass}>
                    {lang === 'en'
                      ? <>The video must not have <strong>any cuts or pauses.</strong></>
                      : <>ভিডিওতে <strong>কোনো কাট বা পজ</strong> দেওয়া যাবে না।</>}
                  </li>
                  <li className={liClass}>
                    {lang === 'en'
                      ? <>For electronic products, the video must <strong>show the product being turned on.</strong></>
                      : <>ইলেকট্রনিক প্রোডাক্টের ক্ষেত্রে ভিডিওতে প্রোডাক্টটি <strong>চালু করে দেখাতে হবে।</strong></>}
                  </li>
                </ul>

                <div className="my-3 flex items-start gap-2.5 rounded-[12px] border border-amber-300/80 bg-amber-50/90 p-3 text-left">
                  <IconAlertShield />
                  <span className="font-body text-[12px] font-bold leading-relaxed text-amber-900">
                    {lang === 'en'
                      ? 'No warranty or replacement claim can be processed without unboxing video proof.'
                      : 'আনবক্সিং ভিডিও ছাড়া কোনো ওয়ারেন্টি ক্লেইম করা সম্ভব নয়।'}
                  </span>
                </div>

                <ul className={ulClass}>
                  <li className={liClass}>
                    {t('প্রোডাক্ট ভাঙা, ত্রুটিপূর্ণ, মিসিং বা ভুল পেলে এই আনবক্সিং ভিডিও দিয়ে ওয়ারেন্টি ক্লেইম করতে পারবেন।')}
                  </li>
                  <li className={liClass}>
                    {t('প্রোডাক্টে কোনো প্রকার সমস্যা হলে সম্পূর্ণ দায়ভার Vangcur কর্তৃপক্ষ বহন করবে এবং যত দ্রুত সম্ভব সমাধান দেওয়ার চেষ্টা করা হবে।')}
                  </li>
                </ul>
              </Section>

              <Section
                icon={<IconShield />}
                title={lang === 'en' ? '4. Warranty Terms' : '৪. ওয়ারেন্টি সংক্রান্ত'}
              >
                <ul className={ulClass}>
                  <li className={liClass}>
                    {lang === 'en'
                      ? <>Regular products come with a <strong>1-week</strong> warranty. Selected products carry up to 6 months / 1 year / 2 years of warranty.</>
                      : <>সাধারণ প্রোডাক্টে <strong>১ সপ্তাহের</strong> ওয়ারেন্টি থাকবে। নির্বাচিত প্রোডাক্টে ৬ মাস / ১ বছর / ২ বছর পর্যন্ত ওয়ারেন্টি থাকবে।</>}
                  </li>
                  <li className={liClass}>
                    {lang === 'en'
                      ? <>The warranty period starts <strong>from the date the order is placed.</strong></>
                      : <>ওয়ারেন্টির মেয়াদ শুরু হয় <strong>অর্ডার করার তারিখ থেকে।</strong></>}
                  </li>
                  <li className={liClass}>
                    {t('ওয়ারেন্টি থাকাকালীন সময়ের মধ্যে প্রোডাক্টে সমস্যা হলে এবং ওয়ারেন্টি ক্লেইম করা হলে, Vangcur কর্তৃপক্ষ নিজ খরচে সেটি রিপ্লেস করে নতুন একটি প্রোডাক্ট আপনার ঠিকানায় পৌঁছে দেবে।')}
                  </li>
                  <li className={liClass}>
                    {t('ওয়ারেন্টি থাকাকালীন সময়ে অবশ্যই প্রোডাক্টের বক্স ও ইনভয়েস পেপার সযত্নে সংরক্ষণ করুন।')}
                  </li>
                </ul>

                <p className={`${pClass} font-bold text-ink mt-3`}>
                  {t('ওয়ারেন্টি ক্লেইম করতে যা লাগবে —')}
                </p>
                <ul className={ulClass}>
                  <li className={liClass}>
                    {lang === 'en'
                      ? <>The original product box <em>(a torn or cracked box, or a box with tape on it, will not be accepted.)</em></>
                      : <>মূল প্রোডাক্টের বক্স <em>(ছেঁড়া বা ফাটা বক্স বা বক্সের গায়ে টেপ লাগানো থাকলে গ্রহণযোগ্য হবে না।)</em></>}
                  </li>
                  <li className={liClass}>
                    {lang === 'en'
                      ? <>Invoice paper <em>(provided with the product)</em></>
                      : <>ইনভয়েস পেপার <em>(প্রোডাক্টের সাথে দেওয়া)</em></>}
                  </li>
                  <li className={liClass}>{t('আনবক্সিং ভিডিও')}</li>
                </ul>
              </Section>

              <Section
                icon={<IconRefresh />}
                title={lang === 'en' ? '5. Returns & Refunds' : '৫. রিটার্ন ও রিফান্ড সংক্রান্ত'}
              >
                <ul className={ulClass}>
                  <li className={liClass}>
                    {lang === 'en'
                      ? <><strong>No returns for personal preference or change of mind:</strong> After purchasing from Vangcur (ভাঙচুর), there is no option to return, exchange, or refund a product due to the customer&apos;s personal preference, change of mind, or any other unreasonable or intentional reason unrelated to a genuine product issue. Customers are requested to carefully review the product&apos;s description, photos, and functionality on the website before ordering.</>
                      : <><strong>পছন্দ না হওয়া বা মন পরিবর্তনের কারণে কোনো রিটার্ন নেই:</strong> Vangcur (ভাঙচুর) থেকে কেনাকাটার পর গ্রাহকের ব্যক্তিগত পছন্দ-অপছন্দ, মন পরিবর্তন (Change of mind) কিংবা প্রোডাক্টে কোনো জেনুইন সমস্যা ব্যতীত অন্য কোনো ইচ্ছাকৃত বা অযৌক্তিক কারণে প্রোডাক্ট রিটার্ন, এক্সচেঞ্জ কিংবা রিফান্ড করার কোনো সুযোগ নেই। কাস্টমারদের অনুরোধ করা হচ্ছে অর্ডার করার পূর্বেই প্রোডাক্টের বিবরণ, ছবি এবং কার্যকারিতা ওয়েবসাইট থেকে ভালোভাবে দেখে নেওয়ার জন্য।</>}
                  </li>
                  <li className={liClass}>
                    {lang === 'en'
                      ? <><strong>Replacement facility (only for genuine issues or defects):</strong> If, after delivery, the product has a genuine manufacturing defect, transit damage (a broken or damaged product), or you received the wrong product, we will replace it entirely at our own cost and send a new product to your address, completely free of charge.</>
                      : <><strong>রিপ্লেসমেন্ট সুবিধা (শুধুমাত্র জেনুইন সমস্যা বা ত্রুটির ক্ষেত্রে):</strong> ডেলিভারি পাওয়ার পর যদি প্রোডাক্টে কোনো আসল কারিগরি বা ম্যানুফ্যাকচারিং ত্রুটি (Manufacturing Defect), ট্রানজিট ড্যামেজ (ভাঙা বা নষ্ট প্রোডাক্ট) অথবা ভুল প্রোডাক্ট ডেলিভারি পাওয়া যায়, তবেই কেবল আমরা সেটি সম্পূর্ণ আমাদের নিজ দায়িত্বে এবং সম্পূর্ণ ফ্রিতে পরিবর্তন (Replacement) করে নতুন প্রোডাক্ট আপনার ঠিকানায় পাঠিয়ে দেব।</>}
                  </li>
                  <li className={liClass}>
                    {lang === 'en'
                      ? 'Continuous unboxing video proof as specified in point 3 is mandatory for any replacement claim.'
                      : 'রিপ্লেসমেন্ট ক্লেইম করার জন্য ৩ নম্বর পয়েন্ট অনুযায়ী একটানা ও আন-এডিটেড আনবক্সিং ভিডিও প্রমাণ হিসেবে দেওয়া বাধ্যতামূলক।'}
                  </li>
                </ul>
              </Section>

              <div className="flex items-center justify-center gap-1.5 border-t border-border-base/70 pt-3 text-center font-body text-[11.5px] font-medium text-muted">
                <IconAlertShield />
                <span>
                  {lang === 'en'
                    ? 'Vangcur reserves the right to update these policies at any time.'
                    : 'ভাঙচুর কর্তৃপক্ষ যেকোনো সময় এই নীতিমালা পরিবর্তন অথবা আপডেট করার অধিকার রাখে।'}
                </span>
              </div>

              <div className="pt-4">
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                  onClick={onAgreeAndConfirm}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-info to-brand-light py-[13.5px] font-body text-[15px] font-bold text-white shadow-sh2 transition-[filter] duration-brand hover:brightness-[1.03] active:scale-95"
                >
                  <IconCheck />
                  <span>
                    {lang === 'en' ? 'I Agree, Confirm Order' : 'ঠিক আছে, অর্ডার কনফার্ম করুন'}
                  </span>
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
