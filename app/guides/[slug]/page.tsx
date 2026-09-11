// ফাইলের পাথ: app/guides/[slug]/page.tsx
// [NEW] সব প্রোগ্রামেটিক SEO গাইড পেজ (Pillar/Comparison/Installation/App-Remote/
// Design Ideas) এই একটামাত্র ডায়নামিক রুট দিয়েই চলে — কোনটা কোন পেজ, সেটা
// ডাটাবেজের guide_pages.slug দিয়ে ঠিক হয়। প্যাটার্নটা app/product/[slug]/page.tsx-এর
// সাথে ইচ্ছাকৃতভাবে হুবহু মেলানো।

import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { cache } from 'react';
import { createClient } from '@supabase/supabase-js';
import { getServerLang } from '@/lib/i18n/getServerLang';
import {
  fetchGuidePageBySlug,
  resolveProductSnapshots,
  collectFaqEntries,
  collectHowToSteps,
} from '@/lib/guidePageData';
import GuidePageClient from './GuidePageClient';

const SITE_URL = 'https://vangcur.com';

// ৫ মিনিট পর পর ব্যাকগ্রাউন্ডে ফ্রেশ ডাটা ক্যাশ আপডেট হবে (Edge ISR) — product page-এর সাথে মিলিয়ে
export const revalidate = 300;

function getSupabase() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
}

const getPage = cache(async (slug: string) => {
  const supabase = getSupabase();
  return fetchGuidePageBySlug(supabase, slug);
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const [page, lang] = await Promise.all([getPage(slug), getServerLang()]);

  if (!page) return { title: 'Vangcur' };

  const title = lang === 'en' ? page.meta_title_en : page.meta_title_bn;
  const description = lang === 'en' ? page.meta_description_en : page.meta_description_bn;
  const url = `${SITE_URL}/guides/${page.slug}`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      siteName: 'Vangcur',
      locale: lang === 'en' ? 'en_US' : 'bn_BD',
      type: 'article',
    },
  };
}

export default async function GuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [page, lang] = await Promise.all([getPage(slug), getServerLang()]);

  if (!page) notFound();

  const supabase = getSupabase();
  const productSnapshots = await resolveProductSnapshots(supabase, page);

  const url = `${SITE_URL}/guides/${page.slug}`;
  const h1 = lang === 'en' ? page.h1_en : page.h1_bn;

  const faqEntries = collectFaqEntries(page, lang);
  const howToSteps = collectHowToSteps(page, lang);

  const graph: Record<string, unknown>[] = [
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: lang === 'en' ? 'Home' : 'হোম', item: SITE_URL },
        { '@type': 'ListItem', position: 2, name: h1, item: url },
      ],
    },
    {
      '@type': 'WebPage',
      name: h1,
      url,
      inLanguage: lang === 'en' ? 'en' : 'bn',
    },
  ];

  if (faqEntries.length > 0) {
    graph.push({
      '@type': 'FAQPage',
      mainEntity: faqEntries.map((f) => ({
        '@type': 'Question',
        name: f.question,
        acceptedAnswer: { '@type': 'Answer', text: f.answer },
      })),
    });
  }

  if (howToSteps && howToSteps.length > 0) {
    graph.push({
      '@type': 'HowTo',
      name: h1,
      step: howToSteps.map((s) => ({ '@type': 'HowToStep', name: s.name, text: s.text })),
    });
  }

  const jsonLd = { '@context': 'https://schema.org', '@graph': graph };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <GuidePageClient page={page} productSnapshots={productSnapshots} />
    </>
  );
}
