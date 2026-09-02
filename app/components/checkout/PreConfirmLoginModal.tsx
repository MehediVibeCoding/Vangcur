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

function VipCrownIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-brand-light">
      <path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14" />
    </svg>
  );
}

function CheckFeatureIcon() {
  return (
    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-brand-light text-white shadow-2xs">
      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    </span>
  );
}

export default function PreConfirmLoginModal({
  isOpen, onClose, onLogin, onRegister, onGoogle, onSkip,
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

            <div className="relative z-10 mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full border border-brand-light/35 bg-white text-brand-light shadow-sm">
              <VipCrownIcon />
            </div>

            <h3 className="relative z-10 font-body text-[18px] font-extrabold text-ink leading-snug">
              {lang === 'en' ? 'Unlock Exclusive VIP Privileges' : 'লগইন করে বিশেষ সুবিধা আনলক করুন'}
            </h3>

            <p className="relative z-10 mt-1 font-body text-[12.5px] leading-relaxed text-muted">
              {lang === 'en'
                ? 'Create an account or login in 5 seconds to enjoy these exclusive features:'
                : 'মাত্র ৫ সেকেন্ডে সাইন-আপ বা লগইন করলেই পাচ্ছেন আকর্ষণীয় সব সুবিধা:'}
            </p>

            <div className="relative z-10 my-4 rounded-[14px] border border-white/90 bg-white/85 p-3.5 text-left shadow-xs backdrop-blur-md space-y-2.5">
              <div className="flex items-start gap-2.5">
                <CheckFeatureIcon />
                <div className="min-w-0 flex-1 font-body text-[12px] leading-snug text-ink/85">
                  <strong>{lang === 'en' ? 'Track & Invoices:' : 'অর্ডার ট্র্যাকিং ও ইনভয়েস:'}</strong>{' '}
                  {lang === 'en' ? 'Live status tracking & permanent invoice archive from any device.' : 'যেকোনো ডিভাইস থেকে লাইভ অর্ডার ট্র্যাক ও ইনভয়েস সংরক্ষণ।'}
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <CheckFeatureIcon />
                <div className="min-w-0 flex-1 font-body text-[12px] leading-snug text-ink/85">
                  <strong>{lang === 'en' ? 'VIP Rewards & Spin Wheel:' : 'ভিআইপি রিওয়ার্ড ও ক্যাশ স্পিন:'}</strong>{' '}
                  {lang === 'en' ? 'Earn membership tier points & spin the lucky wheel for discounts.' : 'প্রতি অর্ডারে মেম্বারশিপ পয়েন্ট ও লাকি ক্যাশ স্পিন ডিসকাউন্ট।'}
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <CheckFeatureIcon />
                <div className="min-w-0 flex-1 font-body text-[12px] leading-snug text-ink/85">
                  <strong>{lang === 'en' ? 'Priority & Bilingual:' : 'অগ্রাধিকার ও দ্বিভাষিক মোড:'}</strong>{' '}
                  {lang === 'en' ? '1-day priority dispatch & seamless Bangla/English switching.' : 'সবার আগে কুরিয়ার হ্যান্ডওভার ও বাংলা/English সুইচিং সুবিধা।'}
                </div>
              </div>
            </div>

            <div className="relative z-10 flex flex-col gap-2.5 pt-1">
              <motion.button
                whileTap={{ scale: 0.96 }}
                transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                onClick={onRegister}
                className="shimmer-sheen w-full rounded-full bg-gradient-to-r from-info to-brand-light py-[12.5px] font-body text-[14px] font-bold text-white shadow-sh2 transition-[filter] duration-brand hover:brightness-[1.03]"
              >
                {lang === 'en' ? 'Create a New Account (Sign Up)' : 'নতুন অ্যাকাউন্ট তৈরি করুন (Sign Up)'}
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.96 }}
                transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                onClick={onLogin}
                className="w-full rounded-full border border-brand-light/40 bg-white/90 py-[11px] font-body text-[13px] font-bold text-brand-light shadow-2xs transition-colors duration-brand hover:bg-white hover:border-brand-light"
              >
                {lang === 'en' ? 'Already have an account? Login' : 'পূর্বে অ্যাকাউন্ট থাকলে লগইন করুন (Login)'}
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.96 }}
                transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                onClick={onGoogle}
                className="flex w-full items-center justify-center gap-2 rounded-full border border-border-base bg-white/80 py-[10.5px] font-body text-[12.5px] font-bold text-ink shadow-2xs transition-colors hover:bg-white"
              >
                <svg width="16" height="16" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                <span>{lang === 'en' ? 'Continue with Google' : 'Google দিয়ে সরাসরি সাইন-ইন'}</span>
              </motion.button>

              <div className="pt-1">
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={onSkip}
                  className="w-full rounded-full border border-border-base bg-white/70 py-[10px] font-body text-[12.5px] font-bold text-ink/75 transition-colors hover:bg-white hover:text-ink"
                >
                  {lang === 'en' ? 'Skip & Place Order Directly →' : 'পরে করব, সরাসরি অর্ডার সম্পন্ন করুন →'}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
