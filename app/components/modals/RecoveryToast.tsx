'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { getDraft } from '@/lib/draftRecovery';
import type { CheckoutDraft } from '@/lib/draftRecovery';

const DISMISS_KEY = 'vc_recovery_dismissed';
const MAX_AGE_MS = 3 * 24 * 60 * 60 * 1000;

export default function RecoveryToast() {
  const pathname = usePathname();
  const router = useRouter();
  const [draft, setDraft] = useState<CheckoutDraft | null>(null);

  useEffect(() => {
    if (pathname?.startsWith('/checkout')) { setDraft(null); return; }
    try {
      if (sessionStorage.getItem(DISMISS_KEY)) return;
    } catch {
      // ignore
    }
    const d = getDraft();
    if (d && d.items.length > 0 && Date.now() - d.createdAt < MAX_AGE_MS) setDraft(d);
  }, [pathname]);

  if (!draft) return null;

  const dismiss = () => {
    try { sessionStorage.setItem(DISMISS_KEY, '1'); } catch { /* ignore */ }
    setDraft(null);
  };

  const resume = () => {
    dismiss();
    router.push('/checkout?resume=1');
  };

  const itemCount = draft.items.reduce((s, i) => s + i.qty, 0);

  return (
    <div className="fixed inset-x-0 bottom-0 z-[65] px-3 pb-3 sm:bottom-4 sm:left-auto sm:right-4 sm:w-[360px] sm:px-0">
      <div className="rounded-[14px] border border-border-base bg-white p-3.5 shadow-sh3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-bg text-lg">🛒</div>
          <div className="min-w-0 flex-1">
            <div className="font-body text-[13px] font-bold text-ink">আপনার একটা অসম্পূর্ণ অর্ডার আছে</div>
            <div className="font-body text-[11.5px] text-muted">{itemCount}টি পণ্য অপেক্ষা করছে — চালিয়ে যেতে চান?</div>
          </div>
          <button onClick={dismiss} className="shrink-0 text-muted hover:text-ink">✕</button>
        </div>
        <button
          onClick={resume}
          className="mt-2.5 w-full rounded-full bg-brand-light py-2.5 font-body text-[13px] font-bold text-white shadow-sh2 transition-brand duration-brand hover:bg-brand-light-hover"
        >
          চেকআউট চালিয়ে যান
        </button>
      </div>
    </div>
  );
}
