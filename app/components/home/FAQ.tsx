'use client';

import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { DEFAULT_FAQS, fetchFAQs } from '@/lib/faqData';
import type { Faq } from '@/lib/faqData';
import { useT } from '@/lib/i18n/useT';

export default function FAQ() {
  const { t } = useT();
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
    <div className="mx-auto mb-12 max-w-[1300px] px-5" id="faqSec">
      <div className="mb-[30px] text-center">
        <h2 className="mb-1.5 text-[26px] font-bold">{t('যা জানতে চান')}</h2>
        <p className="text-[13.5px] text-muted">{t('Vangcur থেকে কেনাকাটা সম্পর্কে সকল প্রশ্নের উত্তর')}</p>
      </div>
      <div className="mx-auto max-w-[760px]">
        {faqs.map((f, i) => {
          const open = openIndex === i;
          return (
            <div className="mb-2.5 overflow-hidden rounded-xl border-[1.5px] border-border-base" key={i}>
              <div
                className="flex cursor-pointer select-none items-center justify-between bg-white px-[17px] py-3.5 text-[13.5px] font-semibold transition-brand duration-brand hover:bg-surface-muted"
                onClick={() => toggleFAQ(i)}
              >
                <span>{t(f.q)}</span>
                <span className={`shrink-0 text-[11px] text-muted transition-transform duration-[250ms] ${open ? 'rotate-180' : ''}`}>▼</span>
              </div>
              <div
                className="overflow-hidden px-[17px] text-[13px] leading-[1.8] text-muted transition-[max-height,padding] duration-[320ms] ease-in-out"
                style={open ? { maxHeight: '300px', padding: '10px 17px 16px' } : { maxHeight: 0, padding: '0 17px' }}
              >
                {t(f.a)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
      }
