'use client';

import { useEffect, useState, useRef } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { useT } from '@/lib/i18n/useT';

export interface Faq {
  q: string;
  a: string;
}

const DEFAULT_FAQS: Faq[] = [
  {
    q: 'পেমেন্ট কীভাবে করব ও অগ্রিম কত?',
    a: 'বিকাশে (bKash) অগ্রিম দিয়ে বাকি টাকা ক্যাশ অন ডেলিভারিতে (COD) পরিশোধ করতে পারবেন। ৮,০০০ টাকার নিচে অর্ডারে ফিক্সড ২০০ টাকা এবং ৮,০০০ থেকে ২০,০০০ টাকার অর্ডারে মোট বিলের ৫% অগ্রিম প্রযোজ্য।',
  },
  {
    q: 'ডেলিভারি পেতে কতদিন লাগে এবং চার্জ কত?',
    a: 'পাঠাও কুরিয়ারে ঢাকা সিটির ভেতরে ১–২ দিনে (চার্জ ৭০ টাকা) এবং ঢাকা সিটির বাইরে সারা দেশে ২–৪ দিনে (চার্জ ১২০ টাকা) হোম ডেলিভারি দেওয়া হয়।',
  },
  {
    q: 'প্রোডাক্টে কি ওয়ারেন্টি আছে?',
    a: 'হ্যাঁ, সব প্রোডাক্টে ন্যূনতম ৭ দিনের ফ্রি রিপ্লেসমেন্ট ওয়ারেন্টি থাকে। এছাড়া নির্বাচিত ব্র্যান্ডেড গ্যাজেটে ৬ মাস থেকে ২ বছর পর্যন্ত অফিসিয়াল ওয়ারেন্টি সুবিধা রয়েছে।',
  },
  {
    q: 'প্রোডাক্টে সমস্যা থাকলে রিপ্লেসমেন্ট কীভাবে পাব?',
    a: 'পার্সেল খোলার সময় একটানা আন-কাট আনবক্সিং ভিডিও করে রাখুন। কোনো ত্রুটি বা ট্রানজিট ড্যামেজ থাকলে ভিডিওসহ আমাদের WhatsApp-এ জানালে সম্পূর্ণ ফ্রিতে নতুন প্রোডাক্ট রিপ্লেস করে দেওয়া হবে।',
  },
  {
    q: 'পছন্দ না হলে কি রিটার্ন করা যাবে?',
    a: 'প্রোডাক্ট সঠিক থাকলে কেবল ব্যক্তিগত পছন্দ-অপছন্দ বা মন পরিবর্তনের (Change of Mind) কারণে রিটার্ন নেওয়া হয় না। তবে কোনো ত্রুটি থাকলে ১০০% ফ্রি রিপ্লেসমেন্ট সুবিধা পাবেন।',
  },
  {
    q: 'অর্ডার ট্র্যাক করব কীভাবে?',
    a: 'পার্সেল বুকিংয়ের পর আপনার ফোনে এসএমএসে ট্র্যাকিং লিংক যাবে। এছাড়া ওয়েবসাইটের "অর্ডার ট্র্যাক" অপশনে অর্ডার নম্বর ও ফোন নম্বর দিয়ে যেকোনো সময় লাইভ স্ট্যাটাস দেখতে পারবেন।',
  },
  {
    q: 'কাস্টমার কেয়ারে যোগাযোগের নম্বর কোনটি?',
    a: 'যেকোনো প্রয়োজনে আমাদের অফিসিয়াল WhatsApp হেল্পলাইনে (01897-804055) প্রতিদিন সকাল ৯:০০ টা থেকে রাত ১০:০০ টা পর্যন্ত সরাসরি মেসেজ দিতে পারেন।',
  },
];

const FAQ_CACHE_KEY = 'vc_faqs_cache';
const FAQ_CACHE_TS_KEY = 'vc_faqs_cache_ts';
const FAQ_CACHE_TTL_MS = 15 * 60 * 1000;

function getCachedFAQs(): Faq[] | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(FAQ_CACHE_KEY);
    const ts = Number(sessionStorage.getItem(FAQ_CACHE_TS_KEY)) || 0;
    if (raw && Date.now() - ts < FAQ_CACHE_TTL_MS) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // ignore
  }
  return null;
}

function setCachedFAQs(faqs: Faq[]) {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(FAQ_CACHE_KEY, JSON.stringify(faqs));
    sessionStorage.setItem(FAQ_CACHE_TS_KEY, String(Date.now()));
  } catch {
    // storage limit safe
  }
}

async function fetchCustomFaqs(supabase: SupabaseClient): Promise<Faq[] | null> {
  try {
    const { data, error } = await supabase
      .from('store_settings')
      .select('setting_value')
      .eq('setting_key', 'vc_faqs')
      .maybeSingle();

    if (error || !data?.setting_value) return null;
    const raw = data.setting_value;
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].q && parsed[0].a) {
      return parsed as Faq[];
    }
    return null;
  } catch {
    return null;
  }
}

function ChevronIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

function SupportHelpIcon() {
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

    const cached = getCachedFAQs();
    if (cached && cached.length) {
      setFaqs(cached);
      return;
    }

    fetchCustomFaqs(supabase).then((customList) => {
      if (!cancelled && customList && customList.length) {
        setFaqs(customList);
        setCachedFAQs(customList);
      }
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
    <div className="mx-auto mb-14 max-w-[1300px] px-4 sm:px-5 [contain:content] [transform:translateZ(0)]" id="faqSec">
      <div className="mb-8 text-center">
        <div className="mb-2.5 inline-flex items-center gap-1.5 rounded-full border border-brand-light/35 bg-white/90 px-3.5 py-1 font-body text-[11px] font-bold uppercase tracking-wider text-brand-light shadow-2xs">
          <SupportHelpIcon />
          <span>{lang === 'en' ? 'Help & Support' : 'কাস্টমার সাপোর্ট'}</span>
        </div>
        
        <h2 className="font-body text-2xl font-extrabold text-ink sm:text-[28px]">
          {lang === 'en' ? (
            <>Frequently Asked <span className="text-brand-light">Questions</span></>
          ) : (
            <>সাধারণ জিজ্ঞাসা ও <span className="text-brand-light">উত্তর</span></>
          )}
        </h2>
        
        <p className="mt-1.5 font-body text-[13px] text-muted sm:text-[14px]">
          {lang === 'en'
            ? 'Everything you need to know about shopping, delivery & warranty'
            : 'কেনাকাটা, ডেলিভারি ও ওয়ারেন্টি সম্পর্কিত আপনার সকল প্রশ্নের উত্তর'}
        </p>
      </div>

      <div className="mx-auto max-w-[760px] space-y-3">
        {faqs.map((f, i) => {
          const open = openIndex === i;
          return (
            <div
              key={i}
              className={`overflow-hidden rounded-[16px] border transition-colors duration-200 [contain:paint_layout] [transform:translateZ(0)] ${
                open
                  ? 'border-brand-light/50 bg-gradient-to-br from-[#F0F7FF] via-white to-white shadow-sh1 ring-1 ring-brand-light/20'
                  : 'border-border-base bg-white/95 shadow-xs hover:border-brand-light/40 hover:bg-white'
              }`}
            >
              <button
                type="button"
                onClick={() => toggleFAQ(i)}
                className="flex w-full cursor-pointer select-none items-center justify-between gap-3 p-4 sm:p-[17px] text-left font-body text-[14px] font-bold text-ink transition-colors"
              >
                <span className="leading-snug">{t(f.q)}</span>
                <ChevronIcon
                  className={`shrink-0 transition-transform duration-300 ${
                    open ? 'rotate-180 text-brand-light' : 'text-muted'
                  }`}
                />
              </button>

              <div
                className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${
                  open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0 pointer-events-none'
                }`}
              >
                <div className="min-h-0 overflow-hidden">
                  <div className="border-t border-brand-light/15 px-4 pb-4 pt-3 sm:px-[18px] sm:pb-[18px] font-body text-[13.5px] leading-[1.8] text-ink/80">
                    <div className="border-l-2 border-brand-light/60 pl-3.5">
                      {t(f.a)}
                    </div>
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
