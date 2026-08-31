'use client';

import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { DEFAULT_FAQS, fetchFAQs } from '@/lib/faqData';
import type { Faq } from '@/lib/faqData';
import { useT } from '@/lib/i18n/useT';

function ChevronIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

function QuestionHelpIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

export default function FAQ() {
  const { t, lang } = useT();
  const supabase = useRef(createClient()).current;
  const [faqs, setFaqs] = useState<Faq[]>(DEFAULT_FAQS);
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchFAQs(supabase).then((list) => {
      if (!cancelled) setFaqs(list);
    });

    return () => {
      cancelled = true;
    };
  }, [supabase]);

  useEffect(() => {
    setOpenIndex(null);
  }, [faqs]);

  const toggleFAQ = (i: number) => {
    setOpenIndex((prev) => (prev === i ? null : i));
  };

  return (
    <div className="mx-auto mb-14 max-w-[1300px] px-4 sm:px-5" id="faqSec">
      {/* হেডার ব্লক */}
      <div className="mb-8 text-center">
        <div className="mb-2.5 inline-flex items-center gap-1.5 rounded-full border border-brand-light/40 bg-white/80 px-3.5 py-1 font-body text-[11px] font-bold uppercase tracking-wider text-brand-light shadow-xs backdrop-blur-md">
          <QuestionHelpIcon />
          <span>{lang === 'en' ? 'Help & FAQ' : 'সাধারণ জিজ্ঞাসা'}</span>
        </div>
        
        <h2 className="font-body text-2xl font-extrabold text-ink sm:text-[28px]">
          {lang === 'en' ? (
            <>Frequently Asked <span className="text-brand-light">Questions</span></>
          ) : (
            <>যা জানতে <span className="text-brand-light">চান</span></>
          )}
        </h2>
        
        <p className="mt-1.5 font-body text-[13px] text-muted sm:text-[14px]">
          {t('Vangcur থেকে কেনাকাটা সম্পর্কে সকল প্রশ্নের উত্তর')}
        </p>
      </div>

      {/* অ্যাকর্ডিয়ন লিস্ট */}
      <div className="mx-auto max-w-[760px] space-y-3">
        {faqs.map((f, i) => {
          const open = openIndex === i;
          return (
            <div
              key={i}
              className={`overflow-hidden rounded-[16px] border transition-all duration-300 ${
                open
                  ? 'border-brand-light/50 bg-gradient-to-br from-[#F0F7FF] via-white to-white shadow-sh1 ring-1 ring-brand-light/20'
                  : 'border-border-base bg-white/85 shadow-xs backdrop-blur-sm hover:border-brand-light/40 hover:bg-white'
              }`}
            >
              <button
                type="button"
                onClick={() => toggleFAQ(i)}
                className="flex w-full cursor-pointer select-none items-center justify-between gap-3 p-4 sm:p-[18px] text-left font-body text-[14px] font-bold text-ink transition-colors"
              >
                <span className="leading-snug">{t(f.q)}</span>
                <ChevronIcon
                  className={`shrink-0 transition-transform duration-300 ${
                    open ? 'rotate-180 text-brand-light' : 'text-muted'
                  }`}
                />
              </button>

              <div
                className="overflow-hidden px-4 transition-[max-height,padding] duration-300 ease-in-out sm:px-[18px]"
                style={open ? { maxHeight: '350px', paddingBottom: '18px', paddingTop: '0px' } : { maxHeight: 0, paddingBottom: 0, paddingTop: 0 }}
              >
                <div className="border-t border-brand-light/15 pt-3 font-body text-[13.5px] leading-[1.8] text-ink/80">
                  <div className="border-l-2 border-brand-light/60 pl-3.5">
                    {t(f.a)}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
