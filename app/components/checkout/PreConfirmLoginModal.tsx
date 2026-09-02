'use client';

import { motion, AnimatePresence } from 'motion/react';
import useHistoryModal from '@/lib/useHistoryModal';
import { useT } from '@/lib/i18n/useT';

interface PreConfirmLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: () => void;
  onRegister: () => void;
  onGoogle: () => void;
  onSkip: () => void;
}

const lineIcon = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

function HeaderDecor() {
  const deco = { ...lineIcon, strokeWidth: 1.4 };
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden text-brand-light/[0.14]" aria-hidden="true">
      <svg {...deco} width="34" height="34" className="absolute -left-1 top-2 -rotate-12" viewBox="0 0 24 24">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
      <svg {...deco} width="26" height="26" className="absolute right-14 top-3 rotate-6" viewBox="0 0 24 24">
        <rect x="7" y="2.5" width="10" height="15" rx="3" />
        <path d="M10 5.5h4" />
        <circle cx="12" cy="20" r="1.6" />
      </svg>
    </div>
  );
}

function SecurityShieldIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand-light">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function CheckPerkIcon() {
  return (
    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-brand-light text-white shadow-2xs">
      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    </span>
  );
}

export default function PreConfirmLoginModal({
  isOpen, onClose, onLogin, onRegister, onSkip,
}: PreConfirmLoginModalProps) {
  const { lang } = useT();

  useHistoryModal(isOpen, onClose, 'pre-confirm-login-modal');

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
            className="fixed inset-0 bg-ink/55 backdrop-blur-[3px]"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 8 }}
            transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 flex max-h-[92vh] w-full max-w-[430px] flex-col overflow-hidden rounded-[28px] bg-gradient-to-b from-brand-bg via-[#DCEBFD] to-white p-6 sm:p-7 text-center shadow-sh3 ring-1 ring-white/80"
          >
            <HeaderDecor />

            <div className="relative z-10 mx-auto mb-2.5 flex h-14 w-14 items-center justify-center rounded-full border border-brand-light/35 bg-white text-brand-light shadow-sm">
              <SecurityShieldIcon />
            </div>

            <div className="relative z-10 mx-auto mb-2 inline-flex items-center gap-1.5 rounded-full border border-amber-300/80 bg-amber-50/90 px-3 py-1 font-body text-[11px] font-bold text-amber-900 shadow-2xs">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
              <span>{lang === 'en' ? 'Currently Not Logged In' : 'আপনি এই মুহূর্তে আনলগইন অবস্থায় আছেন'}</span>
            </div>

            <h3 className="relative z-10 font-body text-[17.5px] font-extrabold text-ink leading-snug">
              {lang === 'en' ? 'Log in to secure your order and information' : 'আপনার তথ্য ও অর্ডার সুরক্ষার জন্য লগইন করুন'}
            </h3>

            <p className="relative z-10 mt-1 font-body text-[12px] leading-relaxed text-muted">
              {lang === 'en'
                ? 'Logging in or creating an account unlocks these convenient benefits:'
                : 'লগইন বা সাইন-আপ করলে কেনাকাটায় আপনার জন্য যা যা সহজ হবে:'}
            </p>

            <div className="relative z-10 my-3.5 rounded-[14px] border border-white/90 bg-white/85 p-3.5 text-left shadow-xs backdrop-blur-md space-y-2.5">
              <div className="flex items-start gap-2.5">
                <CheckPerkIcon />
                <div className="min-w-0 flex-1 font-body text-[12px] leading-snug text-ink/85">
                  <strong>{lang === 'en' ? 'Live Order Tracking & Invoices:' : 'লাইভ অর্ডার ট্র্যাকিং ও মেমো:'}</strong>{' '}
                  {lang === 'en' ? 'Track order status live from any device & save invoice history.' : 'যেকোনো ডিভাইস থেকে অর্ডার ট্র্যাক ও আজীবন মেমো সংরক্ষণ।'}
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <CheckPerkIcon />
                <div className="min-w-0 flex-1 font-body text-[12px] leading-snug text-ink/85">
                  <strong>{lang === 'en' ? 'Coupons & Free Delivery Deals:' : 'কুপন ডিসকাউন্ট ও ফ্রি ডেলিভারি:'}</strong>{' '}
                  {lang === 'en' ? 'Get special coupon discounts and free delivery deals on future orders.' : 'ভবিষ্যতে কেনাকাটায় বিশেষ কুপন ছাড় ও ফ্রি ডেলিভারি সুবিধা।'}
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <CheckPerkIcon />
                <div className="min-w-0 flex-1 font-body text-[12px] leading-snug text-ink/85">
                  <strong>{lang === 'en' ? 'Language Toggle & Priority Support:' : 'ভাষা পরিবর্তন ও দ্রুত সাপোর্ট:'}</strong>{' '}
                  {lang === 'en' ? 'Switch between Bangla & English easily with priority customer care.' : 'বাংলা/English মোড পরিবর্তন ও দ্রুত কাস্টমার কেয়ার সহায়তা।'}
                </div>
              </div>
            </div>

            <div className="relative z-10 flex flex-col gap-2.5 pt-1">
              {/* ১ম সারি: পাশাপাশি সাইন-আপ ও লগইন বাটন */}
              <div className="grid grid-cols-2 gap-2.5">
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                  onClick={onRegister}
                  className="shimmer-sheen w-full rounded-full bg-gradient-to-r from-info to-brand-light py-[12px] font-body text-[13.5px] font-bold text-white shadow-sh2 transition-[filter] duration-brand hover:brightness-[1.03]"
                >
                  {lang === 'en' ? 'Sign Up' : 'সাইন-আপ (Sign Up)'}
                </motion.button>

                <motion.button
                  whileTap={{ scale: 0.96 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                  onClick={onLogin}
                  className="w-full rounded-full border border-brand-light/40 bg-white/90 py-[12px] font-body text-[13.5px] font-bold text-brand-light shadow-2xs transition-colors duration-brand hover:bg-white hover:border-brand-light"
                >
                  {lang === 'en' ? 'Login' : 'লগইন (Login)'}
                </motion.button>
              </div>

              {/* ২য় সারি: পুরোটা মিলিয়ে ১টি স্কিপ বাটন */}
              <motion.button
                whileTap={{ scale: 0.98 }}
                onClick={onSkip}
                className="w-full rounded-full border border-border-base bg-white/80 py-[11.5px] font-body text-[13px] font-bold text-ink/80 shadow-2xs transition-colors hover:bg-white hover:text-ink"
              >
                {lang === 'en' ? 'Skip & Place Order Directly →' : 'পরে করব, সরাসরি অর্ডার সম্পন্ন করুন →'}
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
