'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { lockBody, unlockBody } from '@/lib/bodyScrollLock';
import { showToast } from '@/lib/toast';
import { getWishlist, WISHLIST_EVENT } from '@/lib/productData';
import {
  saveCurrentUser, saveLinkedAccount,
  signInWithPassword, signUp, signInWithGoogle, checkOAuthCallback,
  syncWishlistFromSupabase, saveWishlistToSupabase, mergeGuestOrdersToUser,
  requestPasswordReset, getCurrentUser,
} from '@/lib/authData';
import { checkPasswordStrength } from '@/lib/passwordStrength';
import PasswordStrengthMeter from './PasswordStrengthMeter';
import type { CurrentUser } from '@/types';

type Mode = 'login' | 'register' | 'forgot';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderMode?: boolean;
  initialMode?: Mode;
  onAuthSuccess?: (user: CurrentUser) => void;
  onBackFromOrder?: () => void;
}

const lineIcon = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

function IconClose() {
  return (
    <svg {...lineIcon} width="16" height="16" strokeWidth={2.2}>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}
function IconMail() {
  return (
    <svg {...lineIcon} width="16" height="16" strokeWidth={1.7}>
      <path d="M4 6h16v12H4z" />
      <path d="M4.5 6.5L12 12.5l7.5-6" />
    </svg>
  );
}
function IconLock() {
  return (
    <svg {...lineIcon} width="16" height="16" strokeWidth={1.7}>
      <rect x="5" y="10.5" width="14" height="9" rx="2" />
      <path d="M7.5 10.5V7.8a4.5 4.5 0 0 1 9 0v2.7" />
    </svg>
  );
}
function IconUser() {
  return (
    <svg {...lineIcon} width="16" height="16" strokeWidth={1.7}>
      <circle cx="12" cy="8" r="3.4" />
      <path d="M5 20c0-3.6 3.1-6.2 7-6.2s7 2.6 7 6.2" />
    </svg>
  );
}
function IconPhone() {
  return (
    <svg {...lineIcon} width="16" height="16" strokeWidth={1.7}>
      <path d="M6 3.5h3.2l1.3 4-2 1.6a11 11 0 0 0 5.4 5.4l1.6-2 4 1.3V17c0 1.4-1.2 2.5-2.6 2.3C10.5 18.4 5.6 13.5 4.7 7.1 4.5 5.7 5.6 3.5 6 3.5z" />
    </svg>
  );
}
function IconEye({ off }: { off?: boolean }) {
  return (
    <svg {...lineIcon} width="17" height="17" strokeWidth={1.7}>
      <path d="M2.5 12S5.8 6 12 6s9.5 6 9.5 6-3.3 6-9.5 6-9.5-6-9.5-6z" />
      <circle cx="12" cy="12" r="2.6" />
      {off && <path d="M4 4l16 16" />}
    </svg>
  );
}
function IconAlert() {
  return (
    <svg {...lineIcon} width="15" height="15" strokeWidth={2} className="shrink-0">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v5" />
      <circle cx="12" cy="16" r=".6" fill="currentColor" />
    </svg>
  );
}
function IconMailCheck() {
  return (
    <svg {...lineIcon} width="26" height="26" strokeWidth={1.6}>
      <path d="M4 6h16v12H4z" />
      <path d="M4.5 6.5L12 12.5l7.5-6" />
      <path d="M9 16.3l1.8 1.8L15.5 14" />
    </svg>
  );
}

/** Faint decorative device-line-art on the header gradient — echoes the brand key art, no emoji. */
function HeaderDecor() {
  const deco = { ...lineIcon, strokeWidth: 1.4 };
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden text-brand-primary/[0.14]">
      <svg {...deco} width="34" height="34" className="absolute -left-1 top-3 -rotate-12" viewBox="0 0 24 24">
        <path d="M4 13a8 8 0 0 1 16 0" />
        <rect x="3" y="13" width="4" height="6" rx="1.5" />
        <rect x="17" y="13" width="4" height="6" rx="1.5" />
      </svg>
      <svg {...deco} width="26" height="26" className="absolute right-4 top-4 rotate-6" viewBox="0 0 24 24">
        <rect x="7" y="2.5" width="10" height="15" rx="3" />
        <path d="M10 5.5h4" />
        <circle cx="12" cy="20" r="1.6" />
      </svg>
      <svg {...deco} width="22" height="22" className="absolute bottom-3 left-8 rotate-[10deg]" viewBox="0 0 24 24">
        <path d="M9 18c1.5-3 1.5-9 0-12" />
        <path d="M15 18c-1.5-3-1.5-9 0-12" />
        <path d="M4.5 6h1.5M4.5 18h1.5M18 6h1.5M18 18h1.5" />
      </svg>
    </div>
  );
}

function ErrMsg({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-[#FCA5A5] bg-[#FEF2F2] px-3.5 py-2.5 font-body text-[12.5px] font-semibold text-[#B91C1C]">
      <IconAlert />
      <span>{text}</span>
    </div>
  );
}

const fieldInputClass =
  'w-full rounded-full border border-border-base bg-surface-muted pl-11 pr-[18px] py-[13px] font-body text-sm text-ink outline-none transition-brand duration-brand placeholder:text-muted/70 focus:border-brand-primary/50 focus:bg-white focus:shadow-[0_0_0_3px_rgba(0,88,199,.12)]';

const fieldIconWrapClass =
  'pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted';

const fieldLabelClass = 'mb-1.5 block font-body text-[12.5px] font-bold text-ink';

const primaryBtnClass =
  'w-full rounded-full bg-gradient-to-r from-brand-primary to-brand-accent py-[13px] font-body text-[15px] font-bold text-white shadow-[0_4px_14px_rgba(0,88,199,.28)] transition-brand duration-brand hover:-translate-y-0.5 hover:shadow-[0_8px_22px_rgba(0,88,199,.38)] active:translate-y-0 active:shadow-[0_2px_10px_rgba(0,88,199,.28)] disabled:pointer-events-none disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/50 focus-visible:ring-offset-2';

const backBtnClass =
  'mt-2.5 w-full rounded-full border-[1.5px] border-border-base bg-transparent py-[11px] font-body text-[13px] font-semibold text-muted transition-brand duration-brand hover:border-brand-primary/30 hover:bg-brand-primary/5 hover:text-brand-primary';

export default function LoginModal({
  isOpen, onClose, orderMode = false, initialMode = 'login', onAuthSuccess, onBackFromOrder,
}: LoginModalProps) {
  const supabase = useRef(createClient()).current;

  const [mode, setMode] = useState<Mode>('login');
  const [lEmail, setLEmail] = useState('');
  const [lPass, setLPass] = useState('');
  const [showLPass, setShowLPass] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [lErr, setLErr] = useState('');

  const [rName, setRName] = useState('');
  const [rPhone, setRPhone] = useState('');
  const [rEmail, setREmail] = useState('');
  const [rPass, setRPass] = useState('');
  const [showRPass, setShowRPass] = useState(false);
  const [rErr, setRErr] = useState('');

  const [googleLoading, setGoogleLoading] = useState(false);
  const oauthCheckedRef = useRef(false);

  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSubmitted, setForgotSubmitted] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);

  useEffect(() => {
    if (isOpen) lockBody();
    else unlockBody();
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setMode(initialMode || 'login');
      setLErr('');
      setRErr('');
      setForgotSubmitted(false);
      setForgotEmail('');
    }
  }, [isOpen, initialMode]);

  useEffect(() => {
    if (oauthCheckedRef.current) return;
    oauthCheckedRef.current = true;
    (async () => {
      const safeUser = await checkOAuthCallback(supabase);
      if (!safeUser) return;
      saveCurrentUser(safeUser);
      await mergeGuestOrdersToUser(supabase, safeUser.email || '', safeUser.id || '');
      await applyWishlistSync(safeUser.id || '');
      showToast('Google দিয়ে লগইন সফল হয়েছে');
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onWishChange = (e: Event) => {
      const user = getCurrentUser();
      if (!user?.id) return;
      const items = (e as CustomEvent).detail?.wishlist ?? getWishlist();
      saveWishlistToSupabase(supabase, user.id, items);
    };
    window.addEventListener(WISHLIST_EVENT, onWishChange);
    return () => window.removeEventListener(WISHLIST_EVENT, onWishChange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function applyWishlistSync(userId: string) {
    const items = await syncWishlistFromSupabase(supabase, userId);
    if (items) {
      try {
        localStorage.setItem('vc_wish', JSON.stringify(items));
      } catch {
        // storage full/blocked — wishlist still applied in-memory via the event below
      }
      window.dispatchEvent(new CustomEvent(WISHLIST_EVENT, { detail: { wishlist: items } }));
    } else {
      const local = getWishlist();
      if (local.length) saveWishlistToSupabase(supabase, userId, local);
    }
  }

  const switchToRegister = () => { setMode('register'); setRErr(''); };
  const switchToLogin = () => { setMode('login'); setLErr(''); };
  const switchToForgot = () => { setMode('forgot'); setForgotSubmitted(false); setForgotEmail(lEmail); };

  const handleForgotSubmit = async () => {
    const em = forgotEmail.trim();
    if (!em) return;
    setForgotLoading(true);
    await requestPasswordReset(supabase, em);
    setForgotLoading(false);
    setForgotSubmitted(true);
  };

  const finishAuthSuccess = async (safeUser: CurrentUser, successMsg: string) => {
    saveCurrentUser(safeUser);
    await mergeGuestOrdersToUser(supabase, safeUser.email || '', safeUser.id || '');
    await applyWishlistSync(safeUser.id || '');
    showToast(successMsg);
    onClose();
    if (orderMode && onAuthSuccess) onAuthSuccess(safeUser);
  };

  const doLogin = async () => {
    const em = lEmail.trim();
    const pw = lPass;
    if (!em && !pw) { setLErr('ইমেইল ও পাসওয়ার্ড দিন'); return; }
    if (!em) { setLErr('ইমেইল দিন'); return; }
    if (!pw) { setLErr('পাসওয়ার্ড দিন'); return; }
    setLErr('');

    const { data, error } = await signInWithPassword(supabase, em, pw);
    if (error) {
      const msg = (error.message || '').toLowerCase();
      if (msg.includes('invalid login')) {
        setLErr(!em.includes('@') || !em.includes('.') ? 'ইমেইল ঠিকানা ভুল' : 'ইমেইল বা পাসওয়ার্ড ভুল');
      } else if (msg.includes('email')) {
        setLErr('ইমেইল ঠিকানা ভুল');
      } else {
        setLErr('ইমেইল বা পাসওয়ার্ড ভুল');
      }
      return;
    }
    if (!data.user) { setLErr('ইমেইল বা পাসওয়ার্ড ভুল'); return; }

    const safeUser: CurrentUser = {
      id: data.user.id,
      email: data.user.email,
      name: data.user.user_metadata?.name || 'Customer',
      phone: data.user.user_metadata?.phone || '',
    };
    saveLinkedAccount(safeUser, data.session);
    await finishAuthSuccess(safeUser, 'লগইন সফল হয়েছে');
  };

  const doRegister = async () => {
    const nm = rName.trim();
    const ph = rPhone.trim();
    const em = rEmail.trim();
    const pw = rPass;
    if (!nm) { setRErr('নাম দিন'); return; }
    if (!ph || !/^01[3-9]\d{8}$/.test(ph)) { setRErr('সঠিক মোবাইল নম্বর দিন'); return; }
    if (!em) { setRErr('ইমেইল দিন'); return; }
    const strength = await checkPasswordStrength(pw);
    if (!strength.minLenOk) { setRErr('পাসওয়ার্ড কমপক্ষে ৮ অক্ষর হতে হবে'); return; }
    if (!strength.ok) { setRErr('আরও শক্তিশালী পাসওয়ার্ড দিন (নিচের মিটার দেখুন)'); return; }
    setRErr('');

    const { data, error } = await signUp(supabase, { name: nm, phone: ph, email: em, password: pw });
    if (error) {
      setRErr(error.message?.includes('already registered') ? 'এই ইমেইল ইতিমধ্যে নিবন্ধিত' : 'অ্যাকাউন্ট তৈরি করতে সমস্যা হয়েছে');
      return;
    }
    if (!data.user) { setRErr('অ্যাকাউন্ট তৈরি করতে সমস্যা হয়েছে'); return; }

    if (!data.session) {
      onClose();
      showToast('ইমেইল ভেরিফাই করুন — একটি লিংক পাঠানো হয়েছে');
      return;
    }

    const safeUser: CurrentUser = { id: data.user.id, email: data.user.email, name: nm, phone: ph, createdAt: new Date().toISOString() };
    await finishAuthSuccess(safeUser, 'অ্যাকাউন্ট তৈরি হয়েছে');
  };

  const loginWithGoogle = async () => {
    setGoogleLoading(true);
    try {
      const { error } = await signInWithGoogle(supabase);
      if (error) { showToast('Google লগইন ব্যর্থ হয়েছে'); setGoogleLoading(false); }
    } catch {
      showToast('কিছু একটা সমস্যা হয়েছে, আবার চেষ্টা করুন');
      setGoogleLoading(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleOrderBack = () => {
    onClose();
    if (onBackFromOrder) onBackFromOrder();
  };

  const showLoginTitle = orderMode ? 'লগইন করুন' : 'স্বাগতম';
  const showLoginSub = 'আপনার অ্যাকাউন্টে প্রবেশ করুন';
  const title = mode === 'login' ? showLoginTitle : mode === 'register' ? 'অ্যাকাউন্ট তৈরি করুন' : 'পাসওয়ার্ড রিসেট করুন';
  const sub = mode === 'login' ? showLoginSub : mode === 'register' ? 'নতুন অ্যাকাউন্ট খুলুন' : 'আপনার ইমেইল দিন, আমরা লিংক পাঠাব';

  return (
    <div
      className={`fixed inset-0 z-[70] flex items-center justify-center bg-ink/55 p-4 backdrop-blur-[3px] transition-opacity duration-brand ${isOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'}`}
      onClick={handleBackdropClick}
    >
      <div
        className={`relative max-h-[92vh] w-full max-w-[400px] overflow-y-auto overflow-x-hidden rounded-[28px] bg-white shadow-sh3 transition-transform duration-brand ${isOpen ? 'scale-100' : 'scale-95'}`}
      >
        <div className="relative overflow-hidden bg-gradient-to-br from-brand-bg via-[#DCEBFD] to-white px-7 pb-6 pt-7 text-center">
          <HeaderDecor />
          <button
            onClick={onClose}
            title="বন্ধ করুন"
            className="absolute right-3.5 top-3.5 z-[1] flex h-[32px] w-[32px] items-center justify-center rounded-full border border-white/60 bg-white/70 text-ink/60 shadow-sh1 backdrop-blur-md transition-brand duration-brand hover:bg-white hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/50"
          >
            <IconClose />
          </button>
          <div className="relative z-[1] mb-3.5 flex justify-center">
            <Image
              src="/vangcur-logo.png"
              alt="Vangcur Gadgets"
              width={900}
              height={317}
              className="h-9 w-auto select-none"
              draggable={false}
            />
          </div>
          <h2 className="relative z-[1] font-display text-[19px] font-bold text-ink">{title}</h2>
          <p className="relative z-[1] mt-1 font-body text-[13px] text-muted">{sub}</p>
        </div>

        <div className="px-7 pb-8 pt-6">
          {mode === 'login' ? (
            <div className="flex flex-col gap-3.5">
              <div>
                <label className={fieldLabelClass}>ইমেইল</label>
                <div className="relative">
                  <span className={fieldIconWrapClass}><IconMail /></span>
                  <input
                    type="email" placeholder="name@example.com" autoComplete="email"
                    value={lEmail} onChange={(e) => setLEmail(e.target.value)}
                    className={fieldInputClass}
                  />
                </div>
              </div>
              <div>
                <label className={fieldLabelClass}>পাসওয়ার্ড</label>
                <div className="relative">
                  <span className={fieldIconWrapClass}><IconLock /></span>
                  <input
                    type={showLPass ? 'text' : 'password'} placeholder="আপনার পাসওয়ার্ড দিন"
                    autoComplete="current-password" value={lPass}
                    onChange={(e) => setLPass(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') doLogin(); }}
                    className={`${fieldInputClass} pr-11`}
                  />
                  <button
                    type="button" title={showLPass ? 'পাসওয়ার্ড লুকান' : 'পাসওয়ার্ড দেখুন'} onClick={() => setShowLPass((v) => !v)}
                    className={`absolute right-3.5 top-1/2 flex -translate-y-1/2 items-center p-1 text-muted transition-brand ${showLPass ? 'text-brand-primary' : ''}`}
                  >
                    <IconEye off={showLPass} />
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between font-body text-[12.5px]">
                <label className="flex items-center gap-1.5 text-muted">
                  <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="h-3.5 w-3.5 accent-brand-primary" />
                  মনে রাখুন
                </label>
                <button onClick={switchToForgot} className="font-semibold text-brand-primary hover:underline">পাসওয়ার্ড ভুলে গেছেন?</button>
              </div>
              {lErr && <ErrMsg text={lErr} />}
              <button className={primaryBtnClass} onClick={doLogin}>লগইন করুন</button>

              {!orderMode && (
                <>
                  <div className="relative my-1 text-center font-body text-[12px] text-muted before:absolute before:left-0 before:top-1/2 before:h-px before:w-[42%] before:bg-border-base after:absolute after:right-0 after:top-1/2 after:h-px after:w-[42%] after:bg-border-base">অথবা</div>
                  <button
                    className="flex w-full items-center justify-center gap-2.5 rounded-full border-[1.5px] border-border-base bg-white py-3 font-body text-[13.5px] font-bold text-ink transition-brand duration-brand hover:border-brand-primary/25 hover:bg-surface-muted disabled:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/40"
                    onClick={loginWithGoogle} disabled={googleLoading}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Google দিয়ে লগইন করুন
                  </button>
                  <div className="mt-1 text-center font-body text-[12.5px] text-muted">
                    অ্যাকাউন্ট নেই? <button onClick={switchToRegister} className="font-bold text-brand-primary hover:underline">রেজিস্ট্রেশন করুন</button>
                  </div>
                </>
              )}

              {orderMode && (
                <button onClick={handleOrderBack} className={backBtnClass}>← ফিরে যান</button>
              )}
            </div>
          ) : mode === 'register' ? (
            <div className="flex flex-col gap-3.5">
              <div>
                <label className={fieldLabelClass}>পূর্ণ নাম</label>
                <div className="relative">
                  <span className={fieldIconWrapClass}><IconUser /></span>
                  <input placeholder="আপনার পূর্ণ নাম লিখুন" value={rName} onChange={(e) => setRName(e.target.value)} className={fieldInputClass} />
                </div>
              </div>
              <div>
                <label className={fieldLabelClass}>মোবাইল নম্বর</label>
                <div className="relative">
                  <span className={fieldIconWrapClass}><IconPhone /></span>
                  <input
                    type="tel" placeholder="01XXXXXXXXX" maxLength={11}
                    value={rPhone} onChange={(e) => setRPhone(e.target.value.replace(/\D/g, ''))}
                    className={fieldInputClass}
                  />
                </div>
              </div>
              <div>
                <label className={fieldLabelClass}>ইমেইল</label>
                <div className="relative">
                  <span className={fieldIconWrapClass}><IconMail /></span>
                  <input type="email" placeholder="name@example.com" value={rEmail} onChange={(e) => setREmail(e.target.value)} className={fieldInputClass} />
                </div>
              </div>
              <div>
                <label className={fieldLabelClass}>পাসওয়ার্ড</label>
                <div className="relative">
                  <span className={fieldIconWrapClass}><IconLock /></span>
                  <input
                    type={showRPass ? 'text' : 'password'} placeholder="কমপক্ষে ৮ অক্ষর, শক্তিশালী পাসওয়ার্ড"
                    value={rPass} onChange={(e) => setRPass(e.target.value)}
                    className={`${fieldInputClass} pr-11`}
                  />
                  <button
                    type="button" title={showRPass ? 'পাসওয়ার্ড লুকান' : 'পাসওয়ার্ড দেখুন'} onClick={() => setShowRPass((v) => !v)}
                    className={`absolute right-3.5 top-1/2 flex -translate-y-1/2 items-center p-1 text-muted transition-brand ${showRPass ? 'text-brand-primary' : ''}`}
                  >
                    <IconEye off={showRPass} />
                  </button>
                </div>
                <PasswordStrengthMeter password={rPass} />
              </div>
              {rErr && <ErrMsg text={rErr} />}
              <button className={primaryBtnClass} onClick={doRegister}>অ্যাকাউন্ট তৈরি করুন</button>

              {!orderMode && (
                <div className="mt-1 text-center font-body text-[12.5px] text-muted">
                  ইতিমধ্যে অ্যাকাউন্ট আছে? <button onClick={switchToLogin} className="font-bold text-brand-primary hover:underline">লগইন করুন</button>
                </div>
              )}
              {orderMode && (
                <button onClick={handleOrderBack} className={backBtnClass}>← ফিরে যান</button>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-3.5">
              {forgotSubmitted ? (
                <div className="py-2 text-center">
                  <div className="mx-auto mb-3.5 flex h-14 w-14 items-center justify-center rounded-full bg-brand-primary/10 text-brand-primary">
                    <IconMailCheck />
                  </div>
                  <p className="font-body text-[13.5px] leading-relaxed text-ink">
                    যদি <strong>{forgotEmail.trim()}</strong> দিয়ে কোনো অ্যাকাউন্ট থাকে, একটি পাসওয়ার্ড রিসেট লিংক পাঠানো হয়েছে। ইমেইল চেক করুন।
                  </p>
                  <button className={`${primaryBtnClass} mt-4`} onClick={switchToLogin}>লগইনে ফিরে যান</button>
                </div>
              ) : (
                <>
                  <div>
                    <label className={fieldLabelClass}>ইমেইল</label>
                    <div className="relative">
                      <span className={fieldIconWrapClass}><IconMail /></span>
                      <input
                        type="email" placeholder="name@example.com" autoComplete="email"
                        value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleForgotSubmit(); }}
                        className={fieldInputClass}
                      />
                    </div>
                  </div>
                  <button className={primaryBtnClass} onClick={handleForgotSubmit} disabled={forgotLoading}>
                    রিসেট লিংক পাঠান
                  </button>
                  <div className="mt-1 text-center font-body text-[12.5px] text-muted">
                    মনে পড়েছে? <button onClick={switchToLogin} className="font-bold text-brand-primary hover:underline">লগইন করুন</button>
                  </div>
                </>

              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
