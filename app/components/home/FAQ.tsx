'use client';

import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { DEFAULT_FAQS, fetchFAQs } from '@/lib/faqData';
import type { Faq } from '@/lib/faqData';

export default function FAQ() {
  const supabase = useRef(createClient()).current;
  const [faqs, setFaqs] = useState<Faq[]>(DEFAULT_FAQS);
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchFAQs(supabase).then((list) => {
      if (!cancelled) setFaqs(list);
    });

    const channel = supabase
      .channel('faq-store-watch')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'store_settings', filter: 'setting_key=eq.vc_faqs' },
        (payload) => {
          const row = payload.new as { setting_value?: unknown } | null;
          if (!row) return;
          const raw = row.setting_value;
          const parsed = typeof raw === 'string'
            ? (() => { try { return JSON.parse(raw); } catch { return null; } })()
            : raw;
          if (Array.isArray(parsed) && parsed.length) setFaqs(parsed as Faq[]);
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  useEffect(() => {
    setOpenIndex(null);
  }, [faqs]);

  const toggleFAQ = (i: number) => {
    setOpenIndex((prev) => (prev === i ? null : i));
  };

  return (
    <div className="mx-auto mb-14 max-w-[1300px] px-5" id="faqSec">
      <div className="mx-auto mb-9 max-w-xl text-center md:mb-11">
        <p className="mb-3.5 inline-flex items-center gap-1.5 font-body text-[11px] font-bold uppercase tracking-widest text-muted">
          <span className="inline-block h-1 w-1 rounded-full bg-brand-primary" />
          প্রয়োজন সাহায্য?
        </p>
        <h2 className="mb-3 font-body text-[26px] font-bold leading-tight text-ink md:text-[32px]">যা জানতে চান</h2>
        <p className="mx-auto max-w-md font-body text-[13.5px] leading-relaxed text-muted">
          Vangcur থেকে কেনাকাটা সম্পর্কে সকল প্রশ্নের উত্তর
        </p>
      </div>

      <div className="mx-auto max-w-[760px]">
        {faqs.map((f, i) => {
          const open = openIndex === i;
          return (
            <div
              key={i}
              className={`mb-2.5 overflow-hidden rounded-xl border-[1.5px] transition-brand duration-brand ${
                open ? 'border-brand-primary/30 bg-white shadow-sh1' : 'border-border-base bg-white hover:bg-surface-muted'
              }`}
            >
              <div
                className="flex cursor-pointer select-none items-center justify-between gap-4 px-[18px] py-3.5"
                onClick={() => toggleFAQ(i)}
              >
                <span className="font-body text-[13.5px] font-semibold leading-snug text-ink md:text-[14.5px]">
                  {f.q}
                </span>
                <span
                  className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full transition-brand duration-brand ${
                    open ? 'bg-brand-primary text-white' : 'bg-surface-muted text-muted'
                  }`}
                >
                  {open ? (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round"><path d="M5 12h14" /></svg>
                  ) : (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
                  )}
                </span>
              </div>
              <div
                className="overflow-hidden transition-[max-height,opacity] duration-[320ms] ease-in-out"
                style={open ? { maxHeight: '400px', opacity: 1 } : { maxHeight: 0, opacity: 0 }}
              >
                <div className="mx-[18px] mb-[18px] rounded-[14px] bg-surface-muted px-4 py-3.5 font-body text-[13px] leading-[1.8] text-muted">
                  {f.a}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
