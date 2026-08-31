'use client';

import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { parseSupabaseVal } from '@/lib/categoryData';
import { useT } from '@/lib/i18n/useT';

function HeaderDecor() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden text-brand-light/[0.10]" aria-hidden="true">
      <svg width="40" height="40" className="absolute -left-2 top-2 -rotate-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 13a8 8 0 0 1 16 0" />
        <rect x="3" y="13" width="4" height="6" rx="1.5" />
        <rect x="17" y="13" width="4" height="6" rx="1.5" />
      </svg>
      <svg width="32" height="32" className="absolute right-4 top-4 rotate-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <rect x="7" y="2.5" width="10" height="15" rx="3" />
        <path d="M10 5.5h4" />
        <circle cx="12" cy="20" r="1.6" />
      </svg>
    </div>
  );
}

function SparklesIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8L12 2z" />
    </svg>
  );
}

export default function About() {
  const { t, lang } = useT();
  const supabase = useRef(createClient()).current;
  const [customDesc, setCustomDesc] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const { data, error } = await supabase
          .from('store_settings')
          .select('setting_value')
          .eq('setting_key', 'vc_about_desc')
          .maybeSingle();
        if (!cancelled && !error && data && data.setting_value) {
          const parsed = parseSupabaseVal<unknown>(data.setting_value);
          if (typeof parsed === 'string' && parsed.trim() && !parsed.includes('গ্যাজেট ও লাইফস্টাইল অ্যাক্সেসরিজের এক বিশ্বস্ত নাম')) {
            setCustomDesc(parsed);
          }
        }
      } catch {
        // fallback to rich default
      }
    })();

    const uniqueName = `about-desc-watch-${Math.random().toString(36).slice(2, 9)}`;
    const channel = supabase
      .channel(uniqueName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'store_settings', filter: 'setting_key=eq.vc_about_desc' },
        (payload) => {
          const row = payload.new as { setting_value?: unknown } | null;
          if (!row) return;
          const parsed = parseSupabaseVal<unknown>(row.setting_value);
          if (typeof parsed === 'string' && parsed.trim()) {
            setCustomDesc(parsed);
          }
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  return (
    <section className="mx-auto mb-14 max-w-[1300px] px-4 sm:px-5">
      {/* অ্যাপল-স্টাইল মিনিমাল ফ্রস্টেড স্কাই-ব্লু ক্যানভাস (সফট শ্যাডো) */}
      <div className="relative overflow-hidden rounded-[28px] border border-white/90 bg-gradient-to-b from-brand-bg/30 via-[#EFF6FE]/55 to-white/95 p-6 sm:p-10 shadow-[0_4px_24px_rgba(68,167,252,0.08)] ring-1 ring-white/80 backdrop-blur-md">
        
        {/* লাইন-আর্ট ওয়াটারমার্ক */}
        <HeaderDecor />

        <div className="relative z-10 mx-auto max-w-[860px] text-center">
          
          {/* অফিসিয়াল ট্যাগলাইন ব্যাজ (মোবাইলে ১০০% এক লাইনে রেসপন্সিভ) */}
          <div className="mb-3.5 inline-flex items-center gap-1.5 rounded-full border border-brand-light/30 bg-white/85 px-3 py-1 min-[380px]:px-4 min-[380px]:py-1.5 font-body text-[9.5px] min-[360px]:text-[10.5px] sm:text-[12px] font-bold uppercase tracking-[0.8px] min-[380px]:tracking-[1.3px] text-brand-light shadow-xs backdrop-blur-md whitespace-nowrap">
            <SparklesIcon />
            <span>Vangcur — Your First Choice For Gadgets</span>
          </div>

          {/* মূল শিরোনাম — মোবাইলে নিখুঁত ২-লাইন এবং ডেস্কে ১-লাইন */}
          <h2 className="mb-5 font-body font-extrabold text-ink leading-snug">
            {lang === 'en' ? (
              <>
                <span className="block text-[18px] min-[360px]:text-[20px] sm:inline sm:text-[28px] md:text-[30px]">
                  Vangcur
                </span>
                <span className="hidden sm:inline"> — </span>
                <span className="block text-[14px] min-[360px]:text-[15.5px] sm:inline sm:text-[28px] md:text-[30px] text-brand-light mt-1 sm:mt-0">
                  Your Trusted Tech &amp; Lifestyle Store
                </span>
              </>
            ) : (
              <>
                <span className="block text-[19px] min-[360px]:text-[21px] sm:inline sm:text-[28px] md:text-[30px]">
                  Vangcur — ভাঙচুর
                </span>
                <span className="hidden sm:inline"> — </span>
                <span className="block text-[13px] min-[360px]:text-[14.5px] min-[400px]:text-[16px] sm:inline sm:text-[28px] md:text-[30px] text-brand-light mt-1 sm:mt-0 whitespace-nowrap">
                  আপনার বিশ্বস্ত গ্যাজেট ও লাইফস্টাইল শপ
                </span>
              </>
            )}
          </h2>

          {/* কাস্টম ডেসক্রিপশন বা বিস্তারিত প্রফেশনাল টেক্সট */}
          {customDesc ? (
            <p className="font-body text-[14px] sm:text-[15px] leading-[1.9] text-ink/85 whitespace-pre-line">
              {t(customDesc)}
            </p>
          ) : (
            <div className="space-y-4 font-body text-[13.5px] sm:text-[15px] leading-[1.85] sm:leading-[1.9] text-ink/80 text-justify sm:text-center">
              <p>
                {lang === 'en' ? (
                  <>Vangcur is one of Bangladesh&apos;s leading innovative gadget and lifestyle e-commerce brands. Catering to modern lifestyle tech and everyday creative needs, we bring you the finest collection of trending RGB &amp; neon lights, ambient crystal lamps, premium TWS earbuds, smartwatches, portable cooling fans, and unique utility gadgets.</>
                ) : (
                  <>Vangcur (ভাঙচুর) বাংলাদেশের অন্যতম উদ্ভাবনী ও আধুনিক গ্যাজেট এবং লাইফস্টাইল ই-কমার্স ব্র্যান্ড। আমরা নতুন প্রজন্মের রুচি ও দৈনন্দিন প্রযুক্তিগত চাহিদাকে প্রাধান্য দিয়ে সেরা মানের ট্রেন্ডি RGB ও নিয়ন লাইট, ডেকোরেটিভ ক্রিস্টাল ল্যাম্প, প্রিমিয়াম TWS ইয়ারবাডস, স্মার্ট ওয়াচ, রিচার্জেবল ফ্যান এবং ইউনিক লাইফস্টাইল ইলেকট্রনিক্স গ্যাজেট সরবরাহ করে থাকি।</>
                )}
              </p>

              <p>
                {lang === 'en' ? (
                  <>Every product undergoes strict quality inspections to ensure uncompromised quality before reaching your doorstep. Partnered with top logistics providers, we offer fast and reliable home delivery across all 64 districts of Bangladesh, backed by genuine replacement warranties and dedicated customer support to ensure a secure, transparent, and seamless shopping experience.</>
                ) : (
                  <>আমাদের প্রতিটি পণ্য নিজস্ব কোয়ালিটি চেকের মাধ্যমে শতভাগ গুণগত মান নিশ্চিত করে গ্রাহকের কাছে পৌঁছানো হয়। দেশের স্বনামধন্য কুরিয়ার পার্টনারের মাধ্যমে ঢাকা সিটি সহ সমগ্র বাংলাদেশের ৬৪টি জেলাতেই রয়েছে আমাদের দ্রুত হোম ডেলিভারি সুবিধা। প্রতিটি অর্ডারে জেনুইন রিপ্লেসমেন্ট ওয়ারেন্টি এবং সার্বক্ষণিক কাস্টমার সাপোর্ট প্রদান করে একটি নিরাপদ, স্বচ্ছ ও প্রিমিয়াম কেনাকাটার অভিজ্ঞতা দেওয়াই আমাদের মূল অঙ্গীকার।</>
                )}
              </p>
            </div>
          )}

        </div>
      </div>
    </section>
  );
}
