'use client';

import Link from 'next/link';
import { useT } from '@/lib/i18n/useT';
import { optimizeCloudinaryUrl } from '@/lib/cloudinaryUrl';
import { collectionHref, type ShowcaseCard, type ShowcaseHeading } from '@/lib/showcaseData';
import ScrollReveal from '@/app/components/ui/ScrollReveal';

/**
 * কালেকশন অনুযায়ী শপিং — ঠিক ৪টা প্রিমিয়াম কার্ড (গিফট আইডিয়া, প্রিমিয়াম, ইউনিক, কিউট)।
 *  • মোবাইলে ২×২, ট্যাবলেট/ল্যাপটপে এক সারিতে ৪টা।
 *  • কার্ড লম্বা (২:৩), কোণা ইচ্ছা করে সোজা — বাকি সাইটের গোল কার্ড থেকে আলাদা প্রিমিয়াম লুক।
 *  • ছবির উপর শুধু একটাই লেখা: নিচের গ্লাস বাটনে কালেকশনের নাম।
 *  • ক্লিক করলে সরাসরি /collection/<id> পেজে যায় (ক্যাটাগরি সিস্টেম থেকে সম্পূর্ণ আলাদা)।
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
    <section className="mx-auto mb-14 max-w-[1300px] px-4 sm:px-5" id="categoryShowcase" aria-label={en ? 'Shop by collection' : 'কালেকশন অনুযায়ী শপিং'}>
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
          const title = pick(c.title, c.titleEn);
          return (
            <ScrollReveal key={`${c.collectionId}-${i}`} delay={i * 0.06} className="h-full">
              <Link
                href={collectionHref(c.collectionId)}
                aria-label={title}
                className="group relative block aspect-[2/3] w-full overflow-hidden bg-slate-900 outline-none focus-visible:ring-2 focus-visible:ring-brand-light focus-visible:ring-offset-2"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={optimizeCloudinaryUrl(c.img, 720)}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  draggable={false}
                  className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-[1100ms] ease-brand group-hover:scale-[1.07]"
                />

                {/* নিচ থেকে গাঢ় গ্রেডিয়েন্ট — বাটনের লেখা যেন সবসময় পরিষ্কার পড়া যায় */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/5" aria-hidden="true" />

                {/* সূক্ষ্ম ইনসেট ফ্রেম — হোভারে উজ্জ্বল হয় */}
                <div
                  className="pointer-events-none absolute inset-2 border border-white/30 transition-colors duration-500 ease-brand group-hover:border-white/70 sm:inset-3"
                  aria-hidden="true"
                />

                {/* গ্লাস বাটন: কালেকশনের নাম + তীর */}
                <div className="absolute inset-x-0 bottom-0 p-3.5 sm:p-5">
                  <span className="flex min-h-[46px] items-center justify-between gap-2 border border-white/45 bg-white/[0.14] px-3 py-2 text-white shadow-[0_8px_24px_rgba(0,0,0,0.35)] backdrop-blur-md transition-colors duration-500 ease-brand group-hover:border-white group-hover:bg-white group-hover:text-ink sm:min-h-[54px] sm:px-4">
                    <span className="line-clamp-2 text-left font-body text-[13px] font-bold leading-tight tracking-wide sm:text-[16px]">{title}</span>
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/20 transition-colors duration-500 ease-brand group-hover:bg-brand-light group-hover:text-white sm:h-7 sm:w-7">
                      <ArrowIcon />
                    </span>
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
