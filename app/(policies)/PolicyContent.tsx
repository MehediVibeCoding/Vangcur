'use client';

import Link from 'next/link';
import { useT } from '@/lib/i18n/useT';

export const policyPClass = 'mb-2.5 font-body text-[13.5px] leading-[1.85] text-[#444]';
export const policyUlClass = 'mb-2.5 flex list-disc flex-col gap-1.5 pl-[20px]';
export const policyLiClass = 'font-body text-[13.5px] leading-[1.85] text-[#444]';

export function PolicyHeader({ icon, title, updated }: { icon: string; title: string; updated: string }) {
  const { t } = useT();
  return (
    <div className="mb-7 border-b border-border-base pb-5">
      <Link href="/" className="mb-3 inline-flex items-center gap-1 font-body text-[12.5px] font-semibold text-muted transition-brand duration-brand hover:text-ink">
        {t('← হোমে ফিরুন')}
      </Link>
      <h1 className="font-display text-2xl font-bold text-ink">{icon} {t(title)}</h1>
      <p className="mt-1.5 font-body text-xs text-muted">{t('সর্বশেষ আপডেট:')} {t(updated)}</p>
    </div>
  );
}

export function PolicySection({ title, children }: { title: string; children: React.ReactNode }) {
  const { t } = useT();
  return (
    <section className="mb-7">
      <h2 className="mb-2.5 font-body text-[15px] font-bold text-ink">{t(title)}</h2>
      {children}
    </section>
  );
}

export function PolicyNote({ children }: { children: React.ReactNode }) {
  return (
    <div className="my-2.5 rounded-lg border-[1.5px] border-[#f97316] bg-[#fff8f0] px-3.5 py-2.5 font-body text-[12.5px] leading-[1.65] text-[#b45309]">
      {children}
    </div>
  );
}

export function PolicyContact() {
  const { t } = useT();
  return (
    <PolicySection title="📞 যোগাযোগ">
      <p className={policyPClass}>
        {t('এই নীতিমালা সম্পর্কে কোনো প্রশ্ন বা অভিযোগ থাকলে আমাদের সাথে যোগাযোগ করুন —')}
      </p>
      <ul className={policyUlClass}>
        <li className={policyLiClass}>{t('📞 ফোন / WhatsApp:')} <a href="tel:01897804055" className="font-semibold text-brand-light hover:underline">01897-804055</a></li>
        <li className={policyLiClass}>{t('✉️ ইমেইল:')} <a href="mailto:vangcurgadgets@gmail.com" className="font-semibold text-brand-light hover:underline">vangcurgadgets@gmail.com</a></li>
        <li className={policyLiClass}>{t('📍 ঠিকানা: Dhaka, Bangladesh')}</li>
      </ul>
    </PolicySection>
  );
}
