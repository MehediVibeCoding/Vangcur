'use client';

import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { parseSupabaseVal } from '@/lib/categoryData';

const DEFAULT_ABOUT = 'Vangcur (ভাঙচুর) — গ্যাজেট ও লাইফস্টাইল অ্যাক্সেসরিজের এক বিশ্বস্ত নাম। বাংলাদেশের প্রতিটি কোণে আমরা পৌঁছে দিচ্ছি সেরা মানের পণ্য, সাশ্রয়ী মূল্যে। আমাদের লক্ষ্য: শুধু পণ্য নয়, একটি নিরাপদ ও আনন্দময় শপিং অভিজ্ঞতা।';

export default function About() {
  const supabase = useRef(createClient()).current;
  const [desc, setDesc] = useState(DEFAULT_ABOUT);

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
          if (typeof parsed === 'string' && parsed.trim()) setDesc(parsed);
        }
      } catch {
        // fallback stays as DEFAULT_ABOUT
      }
    })();

    const channel = supabase
      .channel('about-desc-watch')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'store_settings', filter: 'setting_key=eq.vc_about_desc' },
        (payload) => {
          const row = payload.new as { setting_value?: unknown } | null;
          if (!row) return;
          const parsed = parseSupabaseVal<unknown>(row.setting_value);
          if (typeof parsed === 'string' && parsed.trim()) setDesc(parsed);
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [supabase]);

  return (
    <section className="m-0 px-5 pb-11 pt-[52px]" style={{ background: 'linear-gradient(135deg,#1A1A1A 0%,#0f1a2e 60%,#1A1A1A 100%)' }}>
      <div className="mx-auto max-w-[760px] text-center">
        <div className="mb-3.5 inline-block rounded-full border border-brand-light/30 bg-brand-light/[.15] px-3.5 py-1 text-[11px] font-bold uppercase tracking-[1.2px] text-brand-light-hover">
          আমাদের সম্পর্কে
        </div>
        <h2 className="mb-4 font-display text-2xl leading-tight text-white md:text-[30px]">
          Vangcur — <span className="text-gold">ভাঙচুর</span>
        </h2>
        <p className="mx-auto max-w-[640px] font-body text-[13.5px] leading-[1.9] text-white/70 md:text-[14.5px]">
          {desc}
        </p>
      </div>
    </section>
  );
}
