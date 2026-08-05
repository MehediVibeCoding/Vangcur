'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { showToast } from '@/lib/toast';
import { saveCurrentUser, updatePassword } from '@/lib/authData';
import { checkPasswordStrength } from '@/lib/passwordStrength';
import PasswordStrengthMeter from '@/app/components/auth/PasswordStrengthMeter';

type Status = 'checking' | 'ready' | 'invalid' | 'done';

const fieldInputClass =
  'w-full rounded-full border border-ink/[0.08] bg-surface-muted px-[18px] py-[13px] font-body text-sm text-ink outline-none transition-brand duration-brand placeholder:text-muted focus:border-brand-primary/40 focus:bg-white focus:shadow-[0_0_0_3px_rgba(0,88,199,.12)]';

const fieldLabelClass = 'mb-1.5 block font-body text-[12.5px] font-bold text-ink';

export default function ResetPasswordClient() {
  const supabase = useRef(createClient()).current;
  const [status, setStatus] = useState<Status>('checking');
  const [pass, setPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [err, setErr] = useState('');
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
    const strength = await checkPasswordStrength(pass);
    if (!strength.minLenOk) { setErr('পাসওয়ার্ড কমপক্ষে ৮ অক্ষর হতে হবে'); return; }
    if (!strength.ok) { setErr('আরও শক্তিশালী পাসওয়ার্ড দিন (নিচের মিটার দেখুন)'); return; }
    if (pass !== confirmPass) { setErr('দুটো পাসওয়ার্ড মিলছে না'); return; }
    setErr('');
    setLoading(true);
    const { error } = await updatePassword(supabase, pass);
    setLoading(false);
    if (error) { setErr('পাসওয়ার্ড পরিবর্তন করা যায়নি, লিংকের মেয়াদ শেষ হয়ে থাকতে পারে'); return; }

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
      <div className="w-full max-w-[400px] rounded-brand bg-white p-8 shadow-sh3">
        <div className="mb-6 text-center">
          <div className="inline-flex flex-col items-center rounded-[26px] bg-ink px-7 py-2.5">
            <div className="font-body text-[20px] font-black tracking-wide text-white">VangCur</div>
            <div className="font-body text-[10px] font-medium tracking-[3px] text-white/50">ভাঙচুর</div>
          </div>
          <h2 className="mt-4 font-display text-[19px] font-bold text-ink">নতুন পাসওয়ার্ড সেট করুন</h2>
        </div>

        {status === 'checking' && (
          <p className="text-center font-body text-[13.5px] text-muted">লিংক যাচাই করা হচ্ছে...</p>
        )}

        {status === 'invalid' && (
          <div className="text-center">
            <p className="mb-4 font-body text-[13.5px] leading-relaxed text-ink">
              এই লিংকের মেয়াদ শেষ হয়ে গেছে বা এটি অবৈধ। আবার পাসওয়ার্ড রিসেট রিকোয়েস্ট করুন।
            </p>
            <button
              onClick={() => router.push('/')}
              className="w-full rounded-full bg-ink py-3.5 font-body text-[15px] font-bold text-white transition-brand duration-brand hover:bg-brand-primary"
            >
              হোমপেজে ফিরে যান
            </button>
          </div>
        )}

        {status === 'ready' && (
          <div className="flex flex-col gap-3.5">
            <div>
              <label className={fieldLabelClass}>নতুন পাসওয়ার্ড</label>
              <input
                type="password" value={pass} onChange={(e) => setPass(e.target.value)}
                placeholder="কমপক্ষে ৮ অক্ষর, শক্তিশালী পাসওয়ার্ড"
                className={fieldInputClass}
              />
              <PasswordStrengthMeter password={pass} />
            </div>
            <div>
              <label className={fieldLabelClass}>পাসওয়ার্ড আবার লিখুন</label>
              <input
                type="password" value={confirmPass} onChange={(e) => setConfirmPass(e.target.value)}
                placeholder="পাসওয়ার্ড আবার লিখুন"
                onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }}
                className={fieldInputClass}
              />
            </div>
            {err && <div className="text-center font-body text-[11.5px] text-[#F59E0B]">{err}</div>}
            <button
              onClick={handleSubmit} disabled={loading}
              className="w-full rounded-full bg-ink py-3.5 font-body text-[15px] font-bold text-white transition-brand duration-brand hover:bg-brand-primary disabled:opacity-70"
            >
              পাসওয়ার্ড সেভ করুন
            </button>
          </div>
        )}

        {status === 'done' && (
          <p className="text-center font-body text-sm font-bold text-[#16A34A]">
            ✅ পাসওয়ার্ড পরিবর্তন হয়েছে! হোমপেজে নিয়ে যাওয়া হচ্ছে...
          </p>
        )}
      </div>
    </div>
  );
}
