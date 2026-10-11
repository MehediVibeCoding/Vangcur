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
 *  • ছবি লম্বা ৯:১৬ ফ্রেমে। প্রথমটায় বামে ছবি-ডানে লেখা; দ্বিতীয়টায় বামে লেখা-ডানে ছবি।
 *  • মোবাইলেও পাশাপাশি থাকে (ছবি ~৪২% চওড়া)। লেখা বেশি হলে সারিটা লম্বা হয়, ছবি নিজে থেকে
 *    ক্রপ হয়ে ভরে যায় — তাই ১৫০–২৫০ অক্ষরের বিবরণ সবচেয়ে সুন্দর দেখায় (সর্বোচ্চ ৫০০)।
 *  • লেখার অংশ: ছোট লেবেল, শিরোনাম, বিবরণ, ঐচ্ছিক দাম, আর একটা বাটন।
 *  • বাটনে ক্লিক করলে সরাসরি প্রোডাক্টের ডিটেলস পেজে যায় (অ্যাডমিনে লিংক/আইডি দিলে)।
 *  • কোণা সোজা, কালেকশন কার্ডের সাথে একই প্রিমিয়াম ভাষা।
 *  • ডেটা আসে অ্যাডমিন প্যানেলের "হোম শোকেস" পেজ থেকে (lib/showcaseData.ts দেখুন)।
 */

function ArrowIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="transition-transform duration-brand ease-brand group-hover:translate-x-1">
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
  const href = spotlightHref(s);
  const title = pick(s.title, s.titleEn);

  const image = (
    <div className={`group relative overflow-hidden bg-slate-900 ${reverse ? 'order-2' : 'order-1'}`}>
      {/* ৯:১৬ স্পেসার — সারির ন্যূনতম উচ্চতা ঠিক করে; লেখা বেশি হলে সারি বাড়ে, ছবি cover হয়ে ভরে যায় */}
      <div className="aspect-[9/16] w-full" aria-hidden="true" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={optimizeCloudinaryUrl(s.img, 900)}
        alt={title}
        loading="lazy"
        decoding="async"
        draggable={false}
        className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-[1100ms] ease-brand group-hover:scale-[1.05]"
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" aria-hidden="true" />
      <Link href={href} aria-label={title} tabIndex={-1} className="absolute inset-0" />
    </div>
  );

  const text = (
    <div className={`flex min-w-0 flex-col justify-center gap-2.5 p-3.5 sm:gap-3.5 sm:p-6 md:gap-5 md:p-12 lg:p-16 ${reverse ? 'order-1' : 'order-2'}`}>
      {s.badge && (
        <span className="inline-flex w-fit items-center gap-2 font-body text-[10px] font-bold uppercase tracking-[0.14em] text-brand-light sm:text-[12px]">
          <span className="h-px w-5 bg-brand-light sm:w-8" aria-hidden="true" />
          {pick(s.badge, s.badgeEn)}
        </span>
      )}

      <h3 className="break-words font-body text-[17px] font-bold leading-snug text-ink sm:text-[24px] md:text-[34px] md:leading-tight">
        {title}
      </h3>

      {(s.desc || s.descEn) && (
        <p className="whitespace-pre-line break-words font-body text-[12px] leading-[1.7] text-muted sm:text-[14px] md:text-[16px] md:leading-relaxed">
          {pick(s.desc, s.descEn)}
        </p>
      )}

      {s.price > 0 && (
        <div className="font-body text-[17px] font-bold text-ink sm:text-[21px] md:text-[28px]">
          ৳{s.price.toLocaleString('en-US')}
        </div>
      )}

      <Link
        href={href}
        className="group mt-1 inline-flex w-fit items-center gap-2 bg-brand-light px-4 py-2.5 font-body text-[12px] font-bold tracking-wide text-white shadow-sh2 transition-colors duration-brand hover:bg-[#3C93DE] active:scale-95 sm:gap-2.5 sm:px-6 sm:py-3 sm:text-[14px] md:px-8 md:py-[14px] md:text-[15px]"
      >
        {pick(s.btn, s.btnEn)}
        <ArrowIcon />
      </Link>
    </div>
  );

  return (
    <div
      className={`grid items-stretch overflow-hidden bg-[#F0F8FF] dark:bg-brand-dark-surface ${
        reverse
          ? 'grid-cols-[1fr_42%] md:grid-cols-[1fr_300px] lg:grid-cols-[1fr_340px]'
          : 'grid-cols-[42%_1fr] md:grid-cols-[300px_1fr] lg:grid-cols-[340px_1fr]'
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
