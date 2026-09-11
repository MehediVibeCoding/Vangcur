// ফাইলের পাথ: app/components/guides/GuideBlocks.tsx
// [NEW] প্রতিটা ব্লক-টাইপের জন্য একটা করে রেন্ডারার কম্পোনেন্ট, আর শেষে
// GuideBlockRenderer — যেটা block.type দেখে সঠিক কম্পোনেন্ট বেছে রেন্ডার করে।
// এই ফাইলটাই পুরো সিস্টেমের "ডিজাইন সিস্টেম" — নতুন কোনো পেজ বানাতে এই
// কম্পোনেন্টগুলোর কোনোটাই আর নতুন করে লিখতে হবে না, শুধু ডাটা পাল্টালেই হবে।

'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type {
  GuideBlock,
  LocalizedText,
  CardGridBlock,
  PriceTableBlock,
  ComparisonTableBlock,
  StepsBlock,
  ChecklistBlock,
  ImageTextBlock,
  FaqBlock,
  RelatedLinksBlock,
  GalleryBlock,
  CtaBlock,
  HeroBlock,
  RichTextBlock,
  ProductRecommendationBlock,
} from '@/types/guides';
import { GuideIcon, GuideCheckboxIcon, GuideChevronIcon, GuideArrowRightIcon } from './GuideIcons';

type Lang = 'bn' | 'en';

/** productRecommendation ব্লক রেন্ডার করতে সার্ভার থেকে আগেই ফেচ করে পাঠাতে হবে এই শেপে */
export interface ProductSnapshot {
  id: number | string;
  name: string;
  nameBn?: string;
  price: number;
  old?: number;
  image: string;
  href: string;
}

const t = (v: LocalizedText, lang: Lang) => v[lang];

function Container({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`mx-auto max-w-[880px] px-4 sm:px-5 ${className}`}>{children}</div>;
}

function WideContainer({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`mx-auto max-w-[1100px] px-4 sm:px-5 ${className}`}>{children}</div>;
}

function BlockHeading({ text, lang }: { text?: LocalizedText; lang: Lang }) {
  if (!text) return null;
  return (
    <h2 className="mb-4 font-body text-[21px] font-extrabold text-ink sm:text-[24px]">{t(text, lang)}</h2>
  );
}

function ImageOrPlaceholder({
  image,
  lang,
  aspect = 'aspect-[4/3]',
  sizes = '(min-width: 768px) 500px, 100vw',
}: {
  image?: { url: string; alt: LocalizedText };
  lang: Lang;
  aspect?: string;
  sizes?: string;
}) {
  if (image?.url) {
    return (
      <div className={`relative w-full overflow-hidden rounded-2xl bg-brand-bg/40 ${aspect}`}>
        <Image src={image.url} alt={t(image.alt, lang)} fill sizes={sizes} className="object-cover" />
      </div>
    );
  }
  return (
    <div
      className={`flex w-full items-center justify-center rounded-2xl border-2 border-dashed border-border-base bg-brand-bg/20 ${aspect}`}
    >
      <span className="px-4 text-center font-body text-[12px] text-muted">
        {lang === 'en' ? 'Photo to be added' : 'এখানে বাস্তব ছবি যোগ করা হবে'}
      </span>
    </div>
  );
}

/* ────────────────────────────── HERO ────────────────────────────── */

function HeroBlockView({ block, lang }: { block: HeroBlock; lang: Lang }) {
  return (
    <section className="border-b border-border-base bg-gradient-to-b from-brand-bg/35 via-[#DCEBFD]/45 to-white">
      <WideContainer className="grid gap-8 py-10 sm:py-14 md:grid-cols-[1.1fr_0.9fr] md:items-center">
        <div>
          {block.eyebrow && (
            <div className="mb-3 inline-flex items-center rounded-full border border-brand-light/35 bg-white/90 px-3.5 py-1 font-body text-[11px] font-bold uppercase tracking-wider text-brand-light shadow-2xs">
              {t(block.eyebrow, lang)}
            </div>
          )}
          <h1 className="font-body text-[26px] font-extrabold leading-tight text-ink sm:text-[34px]">
            {t(block.title, lang)}
          </h1>
          {block.subtitle && (
            <p className="mt-3 max-w-[560px] font-body text-[14.5px] leading-[1.8] text-muted sm:text-[15px]">
              {t(block.subtitle, lang)}
            </p>
          )}
        </div>
        <ImageOrPlaceholder image={block.image} lang={lang} aspect="aspect-[5/4]" />
      </WideContainer>
    </section>
  );
}

/* ────────────────────────────── RICH TEXT ────────────────────────────── */

function RichTextBlockView({ block, lang }: { block: RichTextBlock; lang: Lang }) {
  return (
    <Container className="py-8">
      <BlockHeading text={block.heading} lang={lang} />
      <div className="space-y-3 font-body text-[14.5px] leading-[1.9] text-ink/85">
        {block.paragraphs.map((p, i) => (
          <p key={i}>{t(p, lang)}</p>
        ))}
      </div>
    </Container>
  );
}

/* ────────────────────────────── CARD GRID ────────────────────────────── */

function CardGridBlockView({ block, lang }: { block: CardGridBlock; lang: Lang }) {
  const colsClass =
    block.columns === 2
      ? 'sm:grid-cols-2'
      : block.columns === 4
      ? 'sm:grid-cols-2 lg:grid-cols-4'
      : 'sm:grid-cols-3';

  return (
    <WideContainer className="py-8">
      <BlockHeading text={block.heading} lang={lang} />
      <div className={`grid grid-cols-1 gap-4 ${colsClass}`}>
        {block.cards.map((card, i) => (
          <div
            key={i}
            className="rounded-2xl border border-border-base bg-white/95 p-5 shadow-xs transition-colors hover:border-brand-light/40"
          >
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-brand-bg/50 text-brand-light">
              <GuideIcon name={card.icon} />
            </div>
            {card.tag && (
              <div className="mb-1 font-body text-[11px] font-bold uppercase tracking-wide text-brand-light">
                {t(card.tag, lang)}
              </div>
            )}
            <h3 className="mb-1.5 font-body text-[15px] font-bold text-ink">{t(card.title, lang)}</h3>
            <p className="font-body text-[13.5px] leading-[1.75] text-muted">{t(card.description, lang)}</p>
          </div>
        ))}
      </div>
    </WideContainer>
  );
}

/* ────────────────────────────── PRICE TABLE ────────────────────────────── */

function PriceTableBlockView({ block, lang }: { block: PriceTableBlock; lang: Lang }) {
  return (
    <Container className="py-8">
      <BlockHeading text={block.heading} lang={lang} />
      <div className="overflow-hidden rounded-2xl border border-border-base shadow-xs">
        <table className="w-full border-collapse font-body text-[13.5px]">
          <thead>
            <tr className="bg-brand-bg/40 text-left">
              <th className="px-4 py-3 font-bold text-ink">{lang === 'en' ? 'Type' : 'ধরন'}</th>
              <th className="px-4 py-3 font-bold text-ink">{lang === 'en' ? 'Unit' : 'ইউনিট'}</th>
              <th className="px-4 py-3 text-right font-bold text-ink">
                {lang === 'en' ? 'Price Range (BDT)' : 'দামের রেঞ্জ (BDT)'}
              </th>
            </tr>
          </thead>
          <tbody>
            {block.rows.map((row, i) => (
              <tr key={i} className={i % 2 ? 'bg-white' : 'bg-brand-bg/10'}>
                <td className="border-t border-border-base px-4 py-3 text-ink">{t(row.label, lang)}</td>
                <td className="border-t border-border-base px-4 py-3 text-muted">
                  {row.unit ? t(row.unit, lang) : '—'}
                </td>
                <td className="border-t border-border-base px-4 py-3 text-right font-bold text-brand-primary">
                  {row.priceRangeBdt}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {block.note && <p className="mt-3 font-body text-[12px] leading-[1.7] text-muted">{t(block.note, lang)}</p>}
    </Container>
  );
}

/* ────────────────────────────── COMPARISON TABLE ────────────────────────────── */

function ComparisonTableBlockView({ block, lang }: { block: ComparisonTableBlock; lang: Lang }) {
  return (
    <WideContainer className="py-8">
      <BlockHeading text={block.heading} lang={lang} />
      <div className="overflow-x-auto rounded-2xl border border-border-base shadow-xs">
        <table className="w-full min-w-[560px] border-collapse font-body text-[13px]">
          <thead>
            <tr className="bg-brand-bg/40">
              <th className="sticky left-0 z-10 bg-brand-bg/60 px-4 py-3 text-left font-bold text-ink">
                {lang === 'en' ? 'Feature' : 'বিষয়'}
              </th>
              {block.columnHeaders.map((h, i) => (
                <th key={i} className="px-4 py-3 text-left font-bold text-ink">
                  {t(h, lang)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {block.rows.map((row, i) => (
              <tr key={i} className={i % 2 ? 'bg-white' : 'bg-brand-bg/10'}>
                <td className="sticky left-0 z-10 border-t border-border-base bg-inherit px-4 py-3 font-bold text-ink">
                  {t(row.label, lang)}
                </td>
                {row.values.map((v, j) => (
                  <td key={j} className="border-t border-border-base px-4 py-3 text-ink/85">
                    {t(v, lang)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </WideContainer>
  );
}

/* ────────────────────────────── STEPS ────────────────────────────── */

function StepsBlockView({ block, lang }: { block: StepsBlock; lang: Lang }) {
  return (
    <Container className="py-8">
      <BlockHeading text={block.heading} lang={lang} />
      <div className="space-y-5">
        {block.steps.map((step, i) => (
          <div key={i} className="flex gap-4">
            <div className="flex shrink-0 flex-col items-center">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-light font-body text-[14px] font-bold text-white shadow-sh2">
                {i + 1}
              </div>
              {i < block.steps.length - 1 && <div className="mt-1 w-px flex-1 bg-border-base" />}
            </div>
            <div className="flex-1 pb-5">
              <h3 className="mb-1 font-body text-[15px] font-bold text-ink">{t(step.title, lang)}</h3>
              <p className="font-body text-[13.5px] leading-[1.75] text-muted">{t(step.description, lang)}</p>
              {step.warning && (
                <div className="mt-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 font-body text-[12.5px] text-amber-800">
                  {t(step.warning, lang)}
                </div>
              )}
              {step.image?.url && (
                <div className="mt-3 max-w-[360px]">
                  <ImageOrPlaceholder image={step.image} lang={lang} aspect="aspect-[4/3]" />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </Container>
  );
}

/* ────────────────────────────── CHECKLIST ────────────────────────────── */

function ChecklistBlockView({ block, lang }: { block: ChecklistBlock; lang: Lang }) {
  return (
    <Container className="py-8">
      <BlockHeading text={block.heading} lang={lang} />
      <ul className="space-y-2.5">
        {block.items.map((item, i) => (
          <li key={i} className="flex items-start gap-2.5 font-body text-[14px] text-ink/85">
            <GuideCheckboxIcon className="mt-0.5 shrink-0 text-brand-light" />
            <span>{t(item, lang)}</span>
          </li>
        ))}
      </ul>
    </Container>
  );
}

/* ────────────────────────────── IMAGE + TEXT SPLIT ────────────────────────────── */

function ImageTextBlockView({ block, lang }: { block: ImageTextBlock; lang: Lang }) {
  const imageFirst = block.imageSide === 'left';
  return (
    <WideContainer className="py-8">
      <div className="grid gap-6 sm:grid-cols-2 sm:items-center">
        <div className={imageFirst ? 'sm:order-1' : 'sm:order-2'}>
          <ImageOrPlaceholder image={block.image} lang={lang} aspect="aspect-[4/3]" />
        </div>
        <div className={imageFirst ? 'sm:order-2' : 'sm:order-1'}>
          <BlockHeading text={block.heading} lang={lang} />
          <div className="space-y-2.5 font-body text-[14px] leading-[1.85] text-ink/85">
            {block.paragraphs.map((p, i) => (
              <p key={i}>{t(p, lang)}</p>
            ))}
          </div>
        </div>
      </div>
    </WideContainer>
  );
}

/* ────────────────────────────── PRODUCT RECOMMENDATION ────────────────────────────── */

function ProductRecommendationBlockView({
  block,
  lang,
  product,
}: {
  block: ProductRecommendationBlock;
  lang: Lang;
  product?: ProductSnapshot | null;
}) {
  if (!product) return null;
  const title = lang === 'bn' && product.nameBn ? product.nameBn : product.name;

  return (
    <Container className="py-8">
      <BlockHeading text={block.heading} lang={lang} />
      <Link
        href={product.href}
        className="flex flex-col gap-4 overflow-hidden rounded-2xl border border-brand-light/30 bg-gradient-to-br from-[#F0F7FF] via-white to-white p-4 shadow-sh1 transition-transform hover:scale-[1.01] sm:flex-row sm:items-center"
      >
        <div className="relative h-40 w-full shrink-0 overflow-hidden rounded-xl bg-white sm:h-24 sm:w-24">
          <Image src={product.image} alt={title} fill sizes="200px" className="object-contain p-1.5" />
        </div>
        <div className="flex-1">
          <h3 className="font-body text-[15.5px] font-bold text-ink">{title}</h3>
          {block.blurb && (
            <p className="mt-1 font-body text-[13px] leading-[1.7] text-muted">{t(block.blurb, lang)}</p>
          )}
          <div className="mt-2 font-body text-[16px] font-extrabold text-brand-primary">
            ৳{product.price.toLocaleString('en-US')}
          </div>
        </div>
        <div className="shimmer-sheen inline-flex shrink-0 items-center gap-1.5 self-start rounded-full bg-gradient-to-r from-info to-brand-light px-5 py-2.5 font-body text-[13.5px] font-bold text-white shadow-sh2 sm:self-center">
          {lang === 'en' ? 'View Product' : 'প্রোডাক্ট দেখুন'}
          <GuideArrowRightIcon className="h-4 w-4" />
        </div>
      </Link>
    </Container>
  );
}

/* ────────────────────────────── FAQ ────────────────────────────── */

function FaqBlockView({ block, lang }: { block: FaqBlock; lang: Lang }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <Container className="py-8">
      <BlockHeading text={block.heading} lang={lang} />
      <div className="space-y-3">
        {block.items.map((item, i) => {
          const open = openIndex === i;
          return (
            <div
              key={i}
              className={`overflow-hidden rounded-[16px] border transition-colors duration-200 ${
                open
                  ? 'border-brand-light/50 bg-gradient-to-br from-[#F0F7FF] via-white to-white shadow-sh1 ring-1 ring-brand-light/20'
                  : 'border-border-base bg-white/95 shadow-xs hover:border-brand-light/40 hover:bg-white'
              }`}
            >
              <button
                type="button"
                onClick={() => setOpenIndex(open ? null : i)}
                className="flex w-full cursor-pointer select-none items-center justify-between gap-3 p-4 text-left font-body text-[14px] font-bold text-ink sm:p-[17px]"
              >
                <span className="leading-snug">{t(item.question, lang)}</span>
                <GuideChevronIcon
                  className={`h-4 w-4 shrink-0 transition-transform duration-300 ${
                    open ? 'rotate-180 text-brand-light' : 'text-muted'
                  }`}
                />
              </button>
              <div
                className={`grid transition-[grid-template-rows,opacity] duration-300 ease-out ${
                  open ? 'grid-rows-[1fr] opacity-100' : 'pointer-events-none grid-rows-[0fr] opacity-0'
                }`}
              >
                <div className="min-h-0 overflow-hidden">
                  <div className="border-t border-brand-light/15 px-4 pb-4 pt-3 font-body text-[13.5px] leading-[1.8] text-ink/80 sm:px-[18px] sm:pb-[18px]">
                    <div className="border-l-2 border-brand-light/60 pl-3.5">{t(item.answer, lang)}</div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Container>
  );
}

/* ────────────────────────────── RELATED LINKS ────────────────────────────── */

function RelatedLinksBlockView({ block, lang }: { block: RelatedLinksBlock; lang: Lang }) {
  return (
    <WideContainer className="py-10">
      <BlockHeading text={block.heading} lang={lang} />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {block.items.map((item, i) => (
          <Link
            key={i}
            href={item.href}
            className="flex items-center gap-3 rounded-2xl border border-border-base bg-white/95 p-4 shadow-xs transition-colors hover:border-brand-light/40"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-bg/50 text-brand-light">
              <GuideIcon name={item.icon} />
            </div>
            <span className="font-body text-[13.5px] font-bold text-ink">{t(item.title, lang)}</span>
            <GuideArrowRightIcon className="ml-auto h-4 w-4 shrink-0 text-muted" />
          </Link>
        ))}
      </div>
    </WideContainer>
  );
}

/* ────────────────────────────── GALLERY ────────────────────────────── */

function GalleryBlockView({ block, lang }: { block: GalleryBlock; lang: Lang }) {
  return (
    <WideContainer className="py-8">
      <BlockHeading text={block.heading} lang={lang} />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {block.items.map((item, i) => (
          <div key={i} className="overflow-hidden rounded-2xl border border-border-base bg-white shadow-xs">
            <ImageOrPlaceholder image={item.image} lang={lang} aspect="aspect-square" sizes="240px" />
            {item.caption && (
              <div className="p-2.5 font-body text-[12px] leading-snug text-muted">{t(item.caption, lang)}</div>
            )}
          </div>
        ))}
      </div>
    </WideContainer>
  );
}

/* ────────────────────────────── CTA ────────────────────────────── */

function CtaBlockView({ block, lang }: { block: CtaBlock; lang: Lang }) {
  return (
    <Container className="py-8">
      <div className="flex flex-col items-center gap-4 rounded-3xl bg-gradient-to-br from-[#F0F7FF] via-white to-white p-8 text-center shadow-sh1 ring-1 ring-brand-light/20">
        <h2 className="font-body text-[19px] font-extrabold text-ink">{t(block.heading, lang)}</h2>
        <Link
          href={block.href}
          className="shimmer-sheen rounded-full bg-gradient-to-r from-info to-brand-light px-7 py-[13.5px] font-body text-[15px] font-bold text-white shadow-sh2 transition-[filter] duration-brand hover:brightness-[1.03] active:scale-95"
        >
          {t(block.buttonLabel, lang)}
        </Link>
      </div>
    </Container>
  );
}

/* ────────────────────────────── MASTER RENDERER ────────────────────────────── */

export function GuideBlockRenderer({
  block,
  lang,
  productSnapshots,
}: {
  block: GuideBlock;
  lang: Lang;
  /** productRecommendation ব্লকের জন্য সার্ভার থেকে আগে থেকে ফেচ করা প্রোডাক্ট ডাটা, productId → snapshot */
  productSnapshots?: Record<number, ProductSnapshot>;
}) {
  switch (block.type) {
    case 'hero':
      return <HeroBlockView block={block} lang={lang} />;
    case 'richText':
      return <RichTextBlockView block={block} lang={lang} />;
    case 'cardGrid':
      return <CardGridBlockView block={block} lang={lang} />;
    case 'priceTable':
      return <PriceTableBlockView block={block} lang={lang} />;
    case 'comparisonTable':
      return <ComparisonTableBlockView block={block} lang={lang} />;
    case 'steps':
      return <StepsBlockView block={block} lang={lang} />;
    case 'checklist':
      return <ChecklistBlockView block={block} lang={lang} />;
    case 'imageText':
      return <ImageTextBlockView block={block} lang={lang} />;
    case 'productRecommendation':
      return (
        <ProductRecommendationBlockView
          block={block}
          lang={lang}
          product={productSnapshots?.[block.productId]}
        />
      );
    case 'faq':
      return <FaqBlockView block={block} lang={lang} />;
    case 'relatedLinks':
      return <RelatedLinksBlockView block={block} lang={lang} />;
    case 'gallery':
      return <GalleryBlockView block={block} lang={lang} />;
    case 'cta':
      return <CtaBlockView block={block} lang={lang} />;
    default:
      return null;
  }
}
