'use client';

import { useEffect, useState, type CSSProperties } from 'react';
import { MEMBERSHIP_TIERS, getTier, crownSVG, tierColorStyle } from '@/lib/membershipData';
import { sanitizeSvgHtml } from '@/lib/sanitize';
import { lockBody, unlockBody } from '@/lib/bodyScrollLock';
import { OPEN_MEMBERSHIP_EVENT } from '@/lib/uiEvents';

function cssStringToStyle(css: string): CSSProperties {
  const [prop, val] = css.split(':');
  if (!prop || !val) return {};
  const camel = prop.trim().replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
  return { [camel]: val.trim() } as CSSProperties;
}

export default function MembershipModal() {
  const [completedCount, setCompletedCount] = useState<number | null>(null);

  useEffect(() => {
    const onOpen = (e: Event) => {
      const d = (e as CustomEvent<{ completedCount: number }>).detail;
      setCompletedCount(d?.completedCount ?? 0);
    };
    window.addEventListener(OPEN_MEMBERSHIP_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_MEMBERSHIP_EVENT, onOpen);
  }, []);

  useEffect(() => {
    if (completedCount !== null) lockBody();
    else unlockBody();
    return () => unlockBody();
  }, [completedCount]);

  const isOpen = completedCount !== null;
  const close = () => setCompletedCount(null);
  const currentTier = isOpen ? getTier(completedCount as number) : null;
  const currentIdx = currentTier ? MEMBERSHIP_TIERS.findIndex((t) => t.key === currentTier.key) : -1;
  const nextTier = currentIdx >= 0 && currentIdx < MEMBERSHIP_TIERS.length - 1 ? MEMBERSHIP_TIERS[currentIdx + 1] : null;

  return (
    <>
      <div className={`fixed inset-0 z-[70] bg-black/50 transition-opacity duration-brand ${isOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'}`} onClick={close} />
      <div className={`fixed inset-0 z-[75] flex items-center justify-center p-4 transition-opacity duration-brand ${isOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'}`}>
        <div className="max-h-[90vh] w-full max-w-[420px] overflow-y-auto rounded-brand bg-white shadow-sh3">
          <div className="flex items-center justify-between border-b border-border-base px-5 py-4">
            <h3 className="font-display text-base font-bold text-ink">👑 মেম্বারশিপ লেভেল</h3>
            <button className="flex h-8 w-8 items-center justify-center rounded-full text-lg text-muted hover:bg-surface-muted" onClick={close}>✕</button>
          </div>
          {currentTier && (
            <div className="px-5 py-4">
              <div className="mb-4 rounded-[14px] bg-surface-muted p-4 text-center">
                <div className="mx-auto mb-2 h-10 w-10" dangerouslySetInnerHTML={{ __html: sanitizeSvgHtml(crownSVG(currentTier.crown)) }} />
                <div className="font-body text-[15px] font-bold" style={cssStringToStyle(tierColorStyle(currentTier.key))}>{currentTier.bn}</div>
                <div className="mt-1 font-body text-[12px] text-muted">সম্পন্ন অর্ডার: {completedCount}টি</div>
                {nextTier && (
                  <div className="mt-2 font-body text-[12px] font-semibold text-brand-primary">
                    পরবর্তী লেভেল ({nextTier.bn})-এর জন্য আর {Math.max(0, nextTier.min - (completedCount || 0))}টি অর্ডার লাগবে
                  </div>
                )}
                {!nextTier && <div className="mt-2 font-body text-[12px] font-semibold text-brand-primary">আপনি সর্বোচ্চ লেভেলে আছেন 🎉</div>}
              </div>
              <div className="flex flex-col gap-2">
                {MEMBERSHIP_TIERS.map((t, i) => {
                  const reached = i <= currentIdx;
                  return (
                    <div
                      key={t.key}
                      className={`flex items-center gap-3 rounded-[10px] border px-3 py-2.5 ${reached ? 'border-brand-primary/30 bg-brand-bg/40' : 'border-border-base bg-white'}`}
                    >
                      <div className="h-7 w-7 shrink-0" dangerouslySetInnerHTML={{ __html: sanitizeSvgHtml(crownSVG(t.crown)) }} />
                      <div className="min-w-0 flex-1">
                        <div className="font-body text-[13px] font-bold text-ink">{t.bn}</div>
                        <div className="font-body text-[11px] text-muted">{t.max === Infinity ? `${t.min}+ অর্ডার সম্পন্ন` : `${t.min}-${t.max}টি অর্ডার সম্পন্ন`}</div>
                      </div>
                      {reached && <span className="shrink-0 text-brand-primary">✓</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
