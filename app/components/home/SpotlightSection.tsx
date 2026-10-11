'use client';

import Link from 'next/link';
import { useT } from '@/lib/i18n/useT';
import { makeCatSlug } from '@/lib/categoryData';
import { productHref } from '@/lib/productData';
import { optimizeCloudinaryUrl } from '@/lib/cloudinaryUrl';
import type { ShowcaseSpotlight } from '@/lib/showcaseData';
import ScrollReveal from '@/app/components/ui/ScrollReveal';

/**
 * স্পটলাইট প্রোডাক্ট — মোট ২টা সারি:
 *  • প্রথমটায় বামে ছবি, ডানে লেখা; দ্বিতীয়টায় বামে লেখা, ডানে ছবি।
 *  • মোবাইলেও ডান-বাম লেআউট থাকে (ছবি ~৪৪% চওড়া, লেখা বাকিটা) — তাই ফন্ট ছোট এবং বিবরণ
 *    সর্বোচ্চ ৩ লাইনে কাটা। অ্যাডমিন প্যানেলে অক্ষর সীমা সেট করা আছে।
 *  • কোণা সোজা, ক্যাটাগরি কার্ডের সাথে একই প্রিমিয়াম ভাষা।
 *  • ডেটা আসে অ্যাডমিন প্যানেলের "হোম শোকেস" পেজ থেকে (lib/showcaseData.ts দেখুন)।
 */

function FlameIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8L12 2z" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="transition-transform duration-brand ease-brand group-hover:translate-x-0.5">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

function spotlightHref(s: ShowcaseSpotlight): string {
  if (s.linkType === 'product' && s.productId) {
    return productHref({ id: s.productId, name: s.productName || String(s.productId) });
  }
  return s.catId && s.catId !== 'all' ? `/category/${makeCatSlug(s.catId)}` : '/products';
}

function SpotlightRow({ s, reverse }: { s: ShowcaseSpotlight; reverse: boolean }) {
  const { lang } = useT();
  const en = lang === 'en';
  const pick = (bn: string, enText: string) => (en && enText ? enText : bn);

  const image = (
    <div className={`group relative min-h-[230px] overflow-hidden bg-slate-800 md:min-h-[440px] ${reverse ? 'order-2' : 'order-1'}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={optimizeCloudinaryUrl(s.img, 900)}
        alt={pick(s.title, s.titleEn)}
        loading="lazy"
        decoding="async"
        draggable={false}
        className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-[900ms] ease-brand group-hover:scale-[1.04]"
      />
    </div>
  );

  const text = (
    <div className={`flex min-w-0 flex-col justify-center gap-2 p-3.5 sm:gap-3 sm:p-6 md:gap-4 md:p-14 ${reverse ? 'order-1' : 'order-2'}`}>
      <span className="inline-flex w-fit items-center gap-1 rounded-full border border-brand-light/40 bg-white px-2 py-0.5 font-body text-[9.5px] font-bold uppercase tracking-wider text-brand-light dark:bg-brand-dark-card sm:gap-1.5 sm:px-3 sm:py-1 sm:text-[12px]">
        <FlameIcon />
        {pick(s.badge, s.badgeEn)}
      </span>

      <h3 className="line-clamp-3 font-body text-[16px] font-bold leading-snug text-ink sm:text-[22px] md:text-[34px] md:leading-tight">
        {pick(s.title, s.titleEn)}
      </h3>

      <p className="line-clamp-3 font-body text-[11.5px] leading-[1.65] text-muted sm:text-[14px] md:line-clamp-none md:text-[16px] md:leading-relaxed">
        {pick(s.desc, s.descEn)}
      </p>

      {s.price > 0 && (
        <div className="font-body text-[16px] font-bold text-ink sm:text-[20px] md:text-[26px]">
          ৳{s.price.toLocaleString('en-US')}
        </div>
      )}

      <Link
        href={spotlightHref(s)}
        className="group shimmer-sheen mt-1 inline-flex w-fit items-center gap-1.5 rounded-full bg-gradient-to-r from-info to-brand-light px-4 py-2.5 font-body text-[12px] font-bold text-white shadow-sh2 transition-[filter] duration-brand hover:brightness-[1.03] active:scale-95 sm:px-6 sm:py-3 sm:text-[14px] md:px-8 md:py-[13.5px] md:text-[15px]"
      >
        {pick(s.btn, s.btnEn)}
        <ArrowIcon />
      </Link>
    </div>
  );

  return (
    <div
      className={`grid items-stretch overflow-hidden bg-[#F0F8FF] dark:bg-brand-dark-surface md:grid-cols-2 ${
        reverse ? 'grid-cols-[1fr_44%]' : 'grid-cols-[44%_1fr]'
      }`}
    >
      {image}
      {text}
    </div>
  );
}

interface Props {
  items: ShowcaseSpotlight[];
}

export default function SpotlightSection({ items }: Props) {
  const visible = items.filter((s) => s.enabled);
  if (!visible.length) return null;

  return (
    <section className="mx-auto mb-14 flex max-w-[1300px] flex-col gap-2.5 px-4 sm:gap-4 sm:px-5" id="spotlightSec">
      {visible.map((s, i) => (
        <ScrollReveal key={`${s.title}-${i}`}>
          <SpotlightRow s={s} reverse={i % 2 === 1} />
        </ScrollReveal>
      ))}
    </section>
  );
}
