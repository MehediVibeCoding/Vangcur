'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { showToast } from '@/lib/toast';
import { saveCurrentUser, updatePassword } from '@/lib/authData';
import { checkPasswordStrength } from '@/lib/passwordStrength';
import PasswordStrengthMeter from '@/app/components/auth/PasswordStrengthMeter';

type Status = 'checking' | 'ready' | 'invalid' | 'done';

const MAX_PASS_LEN = 30;

const lineIcon = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

function IconLock() {
  return (
    <svg {...lineIcon} width="16" height="16" strokeWidth={1.7}>
      <rect x="5" y="10.5" width="14" height="9" rx="2" />
      <path d="M7.5 10.5V7.8a4.5 4.5 0 0 1 9 0v2.7" />
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
function IconCheck() {
  return (
    <svg {...lineIcon} width="26" height="26" strokeWidth={1.8}>
      <circle cx="12" cy="12" r="9" />
      <path d="M8.5 12.3l2.4 2.4 4.8-5.4" />
    </svg>
  );
}

/** সংক্ষিপ্ত brand line-art — LoginModal-এর HeaderDecor-এর সাথে সামঞ্জস্যপূর্ণ, কোনো লোগো/টেক্সট পিল নেই */
function HeaderDecor() {
  const deco = { ...lineIcon, strokeWidth: 1.4 };
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden text-brand-primary/[0.14]">
      <svg {...deco} width="34" height="34" className="absolute -left-1 top-3 -rotate-12" viewBox="0 0 24 24">
        <rect x="5" y="10.5" width="14" height="9" rx="2" />
        <path d="M7.5 10.5V7.8a4.5 4.5 0 0 1 9 0v2.7" />
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

function FieldError({ text }: { text?: string }) {
  if (!text) return null;
  return <p className="mt-1 pl-1 font-body text-[11.5px] font-semibold text-[#DC2626]">{text}</p>;
}

function fieldClass(hasErr: boolean, extra = '') {
  const base =
    'w-full rounded-full border pl-11 pr-[18px] py-[13px] font-body text-sm text-ink outline-none transition-brand duration-brand placeholder:text-muted/70';
  const normal =
    'border-border-base bg-white focus:border-brand-primary/50 focus:shadow-[0_0_0_3px_rgba(0,88,199,.12)]';
  const error =
    'border-[#FCA5A5] bg-[#FEF2F2] focus:border-[#DC2626] focus:bg-[#FEF2F2] focus:shadow-[0_0_0_3px_rgba(220,38,38,.12)]';
  return `${base} ${hasErr ? error : normal} ${extra}`;
}

const fieldIconWrapClass = 'pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-muted';
const fieldLabelClass = 'mb-1.5 block font-body text-[12.5px] font-bold text-ink';
const primaryBtnClass =
  'w-full rounded-full bg-gradient-to-r from-brand-primary to-brand-accent py-[13px] font-body text-[15px] font-bold text-white shadow-[0_4px_14px_rgba(0,88,199,.28)] transition-brand duration-brand hover:-translate-y-0.5 hover:shadow-[0_8px_22px_rgba(0,88,199,.38)] active:translate-y-0 active:shadow-[0_2px_10px_rgba(0,88,199,.28)] disabled:pointer-events-none disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/50 focus-visible:ring-offset-2';

export default function ResetPasswordClient() {
  const supabase = useRef(createClient()).current;
  const [status, setStatus] = useState<Status>('checking');
  const [pass, setPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [passErr, setPassErr] = useState(false);
  const [confirmErr, setConfirmErr] = useState('');
  const [genErr, setGenErr] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      await new Promise((r) => setTimeout(r, 300));
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      setStatus(data?.session ? 'ready' : 'invalid');
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async () => {
    setPassErr(false);
    setConfirmErr('');
    setGenErr('');

    const strength = await checkPasswordStrength(pass);
    if (!strength.minLenOk || !strength.ok) { setPassErr(true); return; }
    if (pass !== confirmPass) { setConfirmErr('দুটো পাসওয়ার্ড মিলছে না'); return; }

    setLoading(true);
    const { error } = await updatePassword(supabase, pass);
    setLoading(false);
    if (error) { setGenErr('পাসওয়ার্ড পরিবর্তন করা যায়নি, লিংকের মেয়াদ শেষ হয়ে থাকতে পারে'); return; }

    const { data } = await supabase.auth.getUser();
    if (data?.user) {
      saveCurrentUser({
        id: data.user.id,
        email: data.user.email,
        name: data.user.user_metadata?.name || 'Customer',
        phone: data.user.user_metadata?.phone || '',
      });
    }
    setStatus('done');
    showToast('✅ পাসওয়ার্ড পরিবর্তন হয়েছে!');
    setTimeout(() => router.push('/'), 1500);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-brand-bg via-[#DCEBFD] to-white p-4">
      <div className="relative w-full max-w-[400px] overflow-hidden rounded-[28px] bg-gradient-to-b from-brand-bg via-[#DCEBFD] to-white shadow-sh3">
        <div className="relative overflow-hidden px-7 pb-5 pt-8 text-center">
          <HeaderDecor />
          <h2 className="relative z-[1] font-display text-[21px] font-bold text-ink">নতুন পাসওয়ার্ড সেট করুন</h2>
          {status === 'ready' && (
            <p className="relative z-[1] mt-1.5 font-body text-[13px] text-muted">
              আপনার অ্যাকাউন্টের জন্য একটি নতুন, শক্তিশালী পাসওয়ার্ড দিন
            </p>
          )}
        </div>

        <div className="px-7 pb-8 pt-2">
          {status === 'checking' && (
            <p className="py-4 text-center font-body text-[13.5px] text-muted">লিংক যাচাই করা হচ্ছে...</p>
          )}

          {status === 'invalid' && (
            <div className="py-2 text-center">
              <div className="mx-auto mb-3.5 flex h-14 w-14 items-center justify-center rounded-full bg-[#FEF2F2] text-[#DC2626]">
                <IconAlert />
              </div>
              <p className="mb-4 font-body text-[13.5px] leading-relaxed text-ink">
                এই লিংকের মেয়াদ শেষ হয়ে গেছে বা এটি অবৈধ। আবার পাসওয়ার্ড রিসেট রিকোয়েস্ট করুন।
              </p>
              <button onClick={() => router.push('/')} className={primaryBtnClass}>হোমপেজে ফিরে যান</button>
            </div>
          )}

          {status === 'ready' && (
            <div className="flex flex-col gap-3.5">
              <div>
                <label className={fieldLabelClass}>নতুন পাসওয়ার্ড</label>
                <div className="relative">
                  <span className={fieldIconWrapClass}><IconLock /></span>
                  <input
                    type={showPass ? 'text' : 'password'} value={pass} maxLength={MAX_PASS_LEN}
                    onChange={(e) => { setPass(e.target.value); if (passErr) setPassErr(false); }}
                    placeholder="কমপক্ষে ৮ অক্ষর, শক্তিশালী পাসওয়ার্ড"
                    className={`${fieldClass(passErr)} pr-11`}
                  />
                  <button
                    type="button" title={showPass ? 'পাসওয়ার্ড লুকান' : 'পাসওয়ার্ড দেখুন'} onClick={() => setShowPass((v) => !v)}
                    className={`absolute right-3.5 top-1/2 flex -translate-y-1/2 items-center p-1 text-muted transition-brand ${showPass ? 'text-brand-primary' : ''}`}
                  >
                    <IconEye off={showPass} />
                  </button>
                </div>
                <PasswordStrengthMeter password={pass} />
              </div>
              <div>
                <label className={fieldLabelClass}>পাসওয়ার্ড আবার লিখুন</label>
                <div className="relative">
                  <span className={fieldIconWrapClass}><IconLock /></span>
                  <input
                    type={showConfirmPass ? 'text' : 'password'} value={confirmPass} maxLength={MAX_PASS_LEN}
                    onChange={(e) => { setConfirmPass(e.target.value); if (confirmErr) setConfirmErr(''); }}
                    placeholder="পাসওয়ার্ড আবার লিখুন"
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }}
                    className={`${fieldClass(!!confirmErr)} pr-11`}
                  />
                  <button
                    type="button" title={showConfirmPass ? 'পাসওয়ার্ড লুকান' : 'পাসওয়ার্ড দেখুন'} onClick={() => setShowConfirmPass((v) => !v)}
                    className={`absolute right-3.5 top-1/2 flex -translate-y-1/2 items-center p-1 text-muted transition-brand ${showConfirmPass ? 'text-brand-primary' : ''}`}
                  >
                    <IconEye off={showConfirmPass} />
                  </button>
                </div>
                <FieldError text={confirmErr} />
              </div>
              {genErr && (
                <div className="flex items-center gap-2 rounded-xl border border-[#FCA5A5] bg-[#FEF2F2] px-3.5 py-2.5 font-body text-[12.5px] font-semibold text-[#B91C1C]">
                  <IconAlert />
                  <span>{genErr}</span>
                </div>
              )}
              <button onClick={handleSubmit} disabled={loading} className={`${primaryBtnClass} mt-1`}>
                পাসওয়ার্ড সেভ করুন
              </button>
            </div>
          )}

          {status === 'done' && (
            <div className="py-2 text-center">
              <div className="mx-auto mb-3.5 flex h-14 w-14 items-center justify-center rounded-full bg-brand-primary/10 text-brand-primary">
                <IconCheck />
              </div>
              <p className="font-body text-[13.5px] font-bold text-ink">
                পাসওয়ার্ড পরিবর্তন হয়েছে! হোমপেজে নিয়ে যাওয়া হচ্ছে...
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
