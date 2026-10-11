'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { useT } from '@/lib/i18n/useT';
import { optimizeCloudinaryUrl } from '@/lib/cloudinaryUrl';
import { collectionHref, type CollectionId, type ShowcaseCard, type ShowcaseHeading } from '@/lib/showcaseData';
import ScrollReveal from '@/app/components/ui/ScrollReveal';

/**
 * কালেকশন অনুযায়ী শপিং — ঠিক ৪টা প্রিমিয়াম কার্ড (গিফট আইডিয়া, প্রিমিয়াম, ইউনিক, কিউট)।
 *  • হেডিং সাইটের বাকি সেকশনের মতোই: গোল পিল ব্যাজ → মেইন হেডিং → ধূসর সাবটাইটেল (মাঝ বরাবর)।
 *      - পিল = heading.hl ("কিউরেটেড কালেকশন"), সাবটাইটেল = heading.lead (অ্যাডমিন থেকে বদলায়)।
 *      - মেইন হেডিং কোডে স্থির (দুই ভাষায়)।
 *  • মোবাইলে ২×২, ট্যাবলেট/ল্যাপটপে এক সারিতে ৪টা। কার্ড লম্বা (৫:৮), গোল কোণা (সাইটের কার্ডের মতো)।
 *  • কার্ডে: উপরে-বামে কালেকশন-আইকন চিপ, নিচে গ্লাস প্যানেলে নাম + গোল তীর বাটন।
 *  • ক্লিক করলে সরাসরি /collection/<id> পেজে যায় (ক্যাটাগরি সিস্টেম থেকে সম্পূর্ণ আলাদা)।
 *  • ডেটা আসে অ্যাডমিন প্যানেলের "হোম শোকেস" পেজ থেকে (lib/showcaseData.ts দেখুন)।
 */

const SVG = {
  width: 16,
  height: 16,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
};

function SparkIcon() {
  return (
    <svg {...SVG} width={14} height={14}>
      <path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8L12 2z" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg {...SVG} width={14} height={14} strokeWidth={2.6} className="transition-transform duration-brand ease-brand group-hover:translate-x-0.5">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

// প্রতিটা কালেকশনের নিজস্ব আইকন — ছবির উপরে-বামে চিপে বসে
const COLLECTION_ICONS: Record<CollectionId, ReactNode> = {
  gift: (
    <svg {...SVG}>
      <rect x="3" y="8" width="18" height="4" rx="1" />
      <path d="M12 8v13M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7" />
      <path d="M7.5 8a2.5 2.5 0 0 1 0-5C11 3 12 8 12 8s1-5 4.5-5a2.5 2.5 0 0 1 0 5" />
    </svg>
  ),
  premium: (
    <svg {...SVG}>
      <path d="M6 3h12l4 6-10 12L2 9l4-6z" />
      <path d="M2 9h20M10 3l-2 6 4 12M14 3l2 6-4 12" />
    </svg>
  ),
  unique: (
    <svg {...SVG}>
      <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z" />
      <path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15z" />
    </svg>
  ),
  cute: (
    <svg {...SVG}>
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z" />
    </svg>
  ),
};

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
      {/* ── হেডিং: পিল → মেইন হেডিং → সাবটাইটেল (বাকি সেকশনের সাথে হুবহু একই ধাঁচ) ── */}
      <ScrollReveal>
        <div className="mb-7 text-center sm:mb-9">
          <div className="mb-2.5 inline-flex items-center gap-1.5 rounded-full border border-brand-light/40 bg-white/80 px-3.5 py-1 font-body text-[11px] font-bold uppercase tracking-wider text-brand-light shadow-xs backdrop-blur-md">
            <SparkIcon />
            <span>{pick(heading.hl, heading.hlEn)}</span>
          </div>

          <h2 className="font-body text-2xl font-extrabold text-ink sm:text-[28px]">
            {en ? (
              <>Shop by <span className="text-brand-light">Collection</span></>
            ) : (
              <>কালেকশন অনুযায়ী <span className="text-brand-light">শপিং করুন</span></>
            )}
          </h2>

          <p className="mt-1.5 font-body text-[13px] text-muted sm:text-[14px]">{pick(heading.lead, heading.leadEn)}</p>
        </div>
      </ScrollReveal>

      {/* ── ৪টা কার্ড ── */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4 lg:gap-5">
        {cards.map((c, i) => {
          const title = pick(c.title, c.titleEn);
          return (
            <ScrollReveal key={`${c.collectionId}-${i}`} delay={i * 0.06} className="h-full">
              <Link
                href={collectionHref(c.collectionId)}
                aria-label={title}
                className="group relative block aspect-[5/8] w-full overflow-hidden rounded-[22px] bg-slate-200 shadow-sh2 ring-1 ring-white/70 outline-none transition-[transform,box-shadow] duration-500 ease-brand focus-visible:ring-2 focus-visible:ring-brand-light focus-visible:ring-offset-2 active:scale-[0.985] sm:rounded-[28px] [@media(hover:hover)]:hover:-translate-y-1 [@media(hover:hover)]:hover:shadow-sh3"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={optimizeCloudinaryUrl(c.img, 720)}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  draggable={false}
                  className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-[1200ms] ease-brand group-hover:scale-[1.06]"
                />

                {/* উপরে হালকা + নিচে গাঢ় শেড — চিপ ও লেখা যেন সবসময় পরিষ্কার পড়া যায় */}
                <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/30 to-transparent" aria-hidden="true" />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" aria-hidden="true" />

                {/* কালেকশন-আইকন চিপ */}
                <span
                  className="absolute left-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-full border border-white/50 bg-white/20 text-white shadow-[0_4px_14px_rgba(0,0,0,0.25)] backdrop-blur-md sm:left-4 sm:top-4 sm:h-10 sm:w-10"
                  aria-hidden="true"
                >
                  {COLLECTION_ICONS[c.collectionId]}
                </span>

                {/* নিচের গ্লাস প্যানেল: নাম + গোল তীর */}
                <div className="absolute inset-x-2 bottom-2 sm:inset-x-3 sm:bottom-3">
                  <span className="flex items-center justify-between gap-2 rounded-[16px] border border-white/40 bg-white/[0.16] px-3 py-2.5 text-white shadow-[0_10px_28px_rgba(0,0,0,0.30)] backdrop-blur-xl transition-colors duration-500 ease-brand group-hover:border-white/80 group-hover:bg-white/90 group-hover:text-ink sm:rounded-[20px] sm:px-4 sm:py-3.5">
                    <span className="min-w-0">
                      <span className="block font-body text-[10px] font-medium leading-none text-white/75 transition-colors duration-500 group-hover:text-brand-light sm:text-[11px]">
                        {en ? 'Explore collection' : 'কালেকশন দেখুন'}
                      </span>
                      <span className="mt-1.5 line-clamp-2 block text-left font-body text-[14px] font-bold leading-tight sm:text-[17px]">{title}</span>
                    </span>
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-brand-light shadow-sh1 transition-colors duration-500 ease-brand group-hover:bg-brand-light group-hover:text-white sm:h-9 sm:w-9">
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
