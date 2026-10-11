'use client';

import Link from 'next/link';
import { useT } from '@/lib/i18n/useT';
import { makeCatSlug } from '@/lib/categoryData';
import { optimizeCloudinaryUrl } from '@/lib/cloudinaryUrl';
import type { ShowcaseCard, ShowcaseHeading } from '@/lib/showcaseData';
import ScrollReveal from '@/app/components/ui/ScrollReveal';

/**
 * ক্যাটাগরি অনুযায়ী শপিং — ঠিক ৪টা প্রিমিয়াম কার্ড।
 *  • মোবাইলে ২×২, ট্যাবলেট/ল্যাপটপে এক সারিতে ৪টা।
 *  • কার্ডের কোণা ইচ্ছা করে সোজা (বাকি সাইটের গোল কার্ডের সাথে আলাদা, প্রিমিয়াম লুক)।
 *  • ক্লিক করলে সরাসরি /category/<slug> পেজে যায় (catId ফাঁকা হলে /products)।
 *  • ডেটা আসে অ্যাডমিন প্যানেলের "হোম শোকেস" পেজ থেকে (lib/showcaseData.ts দেখুন)।
 */

function SparkIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8L12 2z" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="transition-transform duration-brand ease-brand group-hover:translate-x-0.5">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

interface Props {
  heading: ShowcaseHeading;
  cards: ShowcaseCard[];
}

export default function CategoryShowcase({ heading, cards }: Props) {
  const { lang } = useT();
  const en = lang === 'en';
  const pick = (bn: string, enText: string) => (en && enText ? enText : bn);

  if (!cards.length) return null;

  return (
    <section className="mx-auto mb-14 max-w-[1300px] px-4 sm:px-5" id="categoryShowcase" aria-label={en ? 'Shop by category' : 'ক্যাটাগরি অনুযায়ী শপিং'}>
      <ScrollReveal>
        <h2 className="mb-5 font-body sm:mb-7">
          <span className="block text-[15px] font-medium leading-snug text-ink/60 sm:text-[22px]">{pick(heading.lead, heading.leadEn)}</span>
          <span className="mt-0.5 flex items-center gap-2 text-[22px] font-bold leading-tight text-ink sm:text-[32px]">
            <span className="text-brand-light"><SparkIcon /></span>
            <span className="pr-1 italic">{pick(heading.hl, heading.hlEn)}</span>
          </span>
        </h2>
      </ScrollReveal>

      <div className="grid grid-cols-2 gap-2.5 sm:gap-4 md:grid-cols-4">
        {cards.map((c, i) => {
          const href = c.catId && c.catId !== 'all' ? `/category/${makeCatSlug(c.catId)}` : '/products';
          const title = pick(c.title, c.titleEn);
          return (
            <ScrollReveal key={`${c.catId}-${i}`} delay={i * 0.06} className="h-full">
              <Link
                href={href}
                aria-label={`${pick(c.lead, c.leadEn)} ${title}`}
                className="group relative block aspect-[3/4] w-full overflow-hidden bg-slate-800 outline-none focus-visible:ring-2 focus-visible:ring-brand-light focus-visible:ring-offset-2"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={optimizeCloudinaryUrl(c.img, 640)}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  draggable={false}
                  className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-[900ms] ease-brand group-hover:scale-[1.06]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" aria-hidden="true" />

                <div className="absolute inset-x-0 bottom-0 flex flex-col items-center px-2.5 pb-3.5 text-center text-white sm:px-4 sm:pb-5">
                  <span className="font-body text-[12px] font-medium leading-tight text-white/90 sm:text-[16px]">{pick(c.lead, c.leadEn)}</span>
                  <span className="mt-0.5 line-clamp-2 px-1.5 font-body text-[17px] font-bold italic leading-tight sm:text-[24px]">{title}</span>
                  <span className="mt-2.5 inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 font-body text-[11.5px] font-bold text-ink shadow-sh1 transition-colors duration-brand group-hover:bg-brand-light group-hover:text-white sm:mt-3.5 sm:px-4 sm:py-2 sm:text-[13px]">
                    {pick(c.btn, c.btnEn)}
                    <ArrowIcon />
                  </span>
                </div>
              </Link>
            </ScrollReveal>
          );
        })}
      </div>
    </section>
  );
}
