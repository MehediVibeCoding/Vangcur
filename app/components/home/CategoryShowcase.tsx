'use client';

import Link from 'next/link';
import { useT } from '@/lib/i18n/useT';
import { optimizeCloudinaryUrl } from '@/lib/cloudinaryUrl';
import { collectionHref, type ShowcaseCard, type ShowcaseHeading } from '@/lib/showcaseData';
import ScrollReveal from '@/app/components/ui/ScrollReveal';

/**
 * কালেকশন অনুযায়ী শপিং — ঠিক ৪টা প্রিমিয়াম কার্ড (গিফট আইডিয়া, প্রিমিয়াম, ইউনিক, কিউট)।
 *  • হেডিং: গোল পিল ব্যাজ → মেইন হেডিং (মাঝ বরাবর), সাবটাইটেল নেই।
 *      - পিল = heading.hl ("কিউরেটেড কালেকশন"), মেইন হেডিং = heading.lead (অ্যাডমিন থেকে বদলায়), শেষ ১–২ শব্দ নীল।
 *  • মোবাইলে ২×২, ট্যাবলেট/ল্যাপটপে এক সারিতে ৪টা। কার্ড লম্বা (৫:৮), গোল কোণা (সাইটের কার্ডের মতো)।
 *  • কার্ডে শুধু নিচে-মাঝে একটা চিকন গ্লাস বাটন (নাম + ছোট তীর) — ছবি যেন পুরো পরিষ্কার দেখা যায়।
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

// হেডিংয়ের শেষ ১–২ শব্দ নীল হাইলাইট (সাইটের বাকি সেকশনের মতো)
function splitHighlight(text: string): [string, string] {
  const words = text.trim().split(/\s+/);
  if (words.length < 2) return ['', text];
  const n = words.length >= 4 ? 2 : 1;
  return [words.slice(0, -n).join(' ') + ' ', words.slice(-n).join(' ')];
}

function SparkIcon() {
  return (
    <svg {...SVG} width={14} height={14}>
      <path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8L12 2z" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg {...SVG} width={12} height={12} strokeWidth={2.8} className="transition-transform duration-brand ease-brand group-hover:translate-x-0.5">
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

  const [headLead, headHl] = splitHighlight(pick(heading.lead, heading.leadEn));

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
            {headLead}
            <span className="text-brand-light">{headHl}</span>
          </h2>
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

                {/* শুধু নিচে হালকা শেড — ছবি যেন পরিষ্কার দেখা যায়, বাটনের লেখাও পড়া যায় */}
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-black/45 to-transparent" aria-hidden="true" />

                {/* চিকন, ছোট, মাঝ-বরাবর গ্লাস বাটন: নাম + ছোট তীর */}
                <div className="absolute inset-x-0 bottom-2.5 flex justify-center px-2 sm:bottom-4">
                  <span className="inline-flex max-w-full items-center gap-2 rounded-full border border-white/50 bg-white/20 py-1 pl-3.5 pr-1 text-white shadow-[0_6px_18px_rgba(0,0,0,0.28)] backdrop-blur-xl transition-colors duration-500 ease-brand group-hover:border-white group-hover:bg-white group-hover:text-ink sm:gap-2.5 sm:py-1.5 sm:pl-5 sm:pr-1.5">
                    <span className="truncate font-body text-[12px] font-bold leading-none sm:text-[14px]">{title}</span>
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-brand-light transition-colors duration-500 ease-brand group-hover:bg-brand-light group-hover:text-white sm:h-7 sm:w-7">
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
