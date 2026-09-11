// ফাইলের পাথ: app/guides/[slug]/GuidePageClient.tsx
// [NEW] সার্ভার থেকে আসা GuidePage ডাটা নিয়ে ব্রেডক্রাম্ব + তার নিচে blocks[]
// ক্রম অনুযায়ী GuideBlockRenderer দিয়ে একের পর এক রেন্ডার করে। নতুন কোনো
// পেজ-টাইপ বা ব্লক-টাইপ যোগ হলে এই ফাইলে হাত দেওয়ার দরকার নেই।

'use client';

import Link from 'next/link';
import { useT } from '@/lib/i18n/useT';
import type { GuidePage } from '@/types/guides';
import { GUIDE_PAGE_TYPE_LABELS } from '@/types/guides';
import { GuideBlockRenderer, type ProductSnapshot } from '@/app/components/guides/GuideBlocks';

export default function GuidePageClient({
  page,
  productSnapshots,
}: {
  page: GuidePage;
  productSnapshots: Record<number, ProductSnapshot>;
}) {
  const { lang } = useT();
  const h1 = lang === 'en' ? page.h1_en : page.h1_bn;
  const typeLabel = GUIDE_PAGE_TYPE_LABELS[page.page_type][lang];

  return (
    <article>
      <div className="mx-auto max-w-[1100px] px-4 pt-4 sm:px-5">
        <nav className="mb-3 flex flex-wrap items-center gap-1.5 font-body text-[12px] text-muted" aria-label="breadcrumb">
          <Link href="/" className="hover:text-brand-light">
            {lang === 'en' ? 'Home' : 'হোম'}
          </Link>
          <span>/</span>
          <span>{typeLabel}</span>
          <span>/</span>
          <span className="font-bold text-ink">{h1}</span>
        </nav>
      </div>

      {page.blocks.map((block) => (
        <GuideBlockRenderer key={block.id} block={block} lang={lang} productSnapshots={productSnapshots} />
      ))}
    </article>
  );
}
