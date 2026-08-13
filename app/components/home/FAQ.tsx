'use client';

import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { DEFAULT_FAQS, fetchFAQs } from '@/lib/faqData';
import type { Faq } from '@/lib/faqData';

type CategoryId = 'order' | 'delivery' | 'product' | 'support';

const CATEGORY_ORDER: CategoryId[] = ['order', 'delivery', 'product', 'support'];

const CATEGORY_META: Record<CategoryId, { label: string; icon: React.ReactNode }> = {
  order: {
    label: 'অর্ডার ও পেমেন্ট',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="2" y="6" width="20" height="14" rx="2.5" />
        <path d="M2 10h20" strokeLinecap="round" />
        <path d="M6 15h4" strokeLinecap="round" />
      </svg>
    ),
  },
  delivery: {
    label: 'ডেলিভারি',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 7h11v9H3z" />
        <path d="M14 11h4l3 3v2h-7z" />
        <circle cx="7" cy="18" r="1.6" />
        <circle cx="17.5" cy="18" r="1.6" />
      </svg>
    ),
  },
  product: {
    label: 'প্রোডাক্ট ও ওয়ারেন্টি',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 3l7 3v6c0 4.5-3 8-7 9-4-1-7-4.5-7-9V6l7-3z" />
        <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  support: {
    label: 'সাপোর্ট',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 13a8 8 0 0116 0" />
        <path d="M4 13v3.5a1.5 1.5 0 001.5 1.5H6a1 1 0 001-1v-3a1 1 0 00-1-1H4z" />
        <path d="M20 13v3.5a1.5 1.5 0 01-1.5 1.5H18a1 1 0 01-1-1v-3a1 1 0 011-1h2z" />
      </svg>
    ),
  },
};

// প্রতিটা প্রশ্নের টেক্সট দেখে স্বয়ংক্রিয়ভাবে ক্যাটাগরি ঠিক করে — Supabase-এর
// vc_faqs ডেটা এখনো flat {q, a} লিস্টই থাকে, অ্যাডমিন প্যানেল/DB কাঠামোতে হাত
// দেওয়া হয়নি। নতুন কোনো প্রশ্ন কোনো কিওয়ার্ডের সাথে না মিললে "সাপোর্ট"-এ পড়বে।
function categorize(question: string): CategoryId {
  if (/পেমেন্ট|bKash|ট্র্যাক/.test(question)) return 'order';
  if (/ডেলিভারি|শিপিং|কুরিয়ার/.test(question)) return 'delivery';
  if (/ওয়ারেন্টি|রিটার্ন|রিফান্ড|অথেনটিক|প্রোডাক্ট/.test(question)) return 'product';
  return 'support';
}

export default function FAQ() {
  const supabase = useRef(createClient()).current;
  const [faqs, setFaqs] = useState<Faq[]>(DEFAULT_FAQS);
  const [activeCategory, setActiveCategory] = useState<CategoryId>('order');
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

  const categorized = CATEGORY_ORDER
    .map((id) => ({ id, ...CATEGORY_META[id], items: faqs.filter((f) => categorize(f.q) === id) }))
    .filter((c) => c.items.length > 0);

  useEffect(() => {
    setOpenIndex(null);
    setActiveCategory((prev) => (categorized.some((c) => c.id === prev) ? prev : categorized[0]?.id ?? 'order'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [faqs]);

  const currentItems = categorized.find((c) => c.id === activeCategory)?.items ?? [];

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

      {categorized.length > 1 && (
        <div className="mx-auto mb-7 w-full max-w-[760px]">
          <div className="mx-auto flex w-fit max-w-full items-center gap-1.5 overflow-x-auto rounded-full bg-surface-muted p-1.5">
            {categorized.map((cat) => {
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => { setActiveCategory(cat.id); setOpenIndex(null); }}
                  className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-2 font-body text-[12.5px] font-semibold transition-brand duration-brand ${
                    isActive ? 'bg-brand-primary text-white shadow-sh1' : 'text-muted hover:bg-white hover:text-ink'
                  }`}
                >
                  <span className={isActive ? 'text-white' : 'text-muted'}>{cat.icon}</span>
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="mx-auto max-w-[760px]">
        {currentItems.map((f, i) => {
          const open = openIndex === i;
          return (
            <div
              key={`${activeCategory}-${i}`}
              className={`mb-2.5 overflow-hidden rounded-xl border-[1.5px] transition-brand duration-brand ${
                open ? 'border-brand-primary/30 bg-white shadow-sh1' : 'border-border-base bg-surface-muted/60 hover:bg-white'
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
                    open ? 'bg-brand-primary text-white' : 'bg-white text-muted'
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
                className="overflow-hidden px-[18px] font-body text-[13px] leading-[1.8] text-muted transition-[max-height,padding] duration-[320ms] ease-in-out"
                style={open ? { maxHeight: '400px', padding: '0 18px 16px' } : { maxHeight: 0, padding: '0 18px' }}
              >
                {f.a}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
