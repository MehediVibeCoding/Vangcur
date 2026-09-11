// ফাইলের পাথ: lib/guidePageData.ts
// [NEW] guide_pages টেবিল থেকে ডাটা আনার সব ফাংশন। প্যাটার্নটা ইচ্ছাকৃতভাবে
// app/product/[slug]/page.tsx-এর getProduct() ফাংশনের সাথে হুবহু মিলিয়ে লেখা।

import type { SupabaseClient } from '@supabase/supabase-js';
import type { GuidePage, GuidePageType } from '@/types/guides';
import { fetchProductById, productHref } from '@/lib/productData';
import type { ProductSnapshot } from '@/app/components/guides/GuideBlocks';

/** পাবলিক সাইট থেকে slug দিয়ে একটা পাবলিশড গাইড পেজ আনা (anon key যথেষ্ট, RLS পাবলিশড রো-ই দেখাবে) */
export async function fetchGuidePageBySlug(
  supabase: SupabaseClient,
  slug: string
): Promise<GuidePage | null> {
  const { data, error } = await supabase
    .from('guide_pages')
    .select('*')
    .eq('slug', slug)
    .eq('is_published', true)
    .maybeSingle();

  if (error || !data) return null;
  return data as GuidePage;
}

/** sitemap.ts-এর জন্য — পাবলিশড সব গাইড পেজের slug + updated_at */
export async function fetchAllPublishedGuideSlugs(
  supabase: SupabaseClient
): Promise<{ slug: string; updated_at: string; page_type: GuidePageType }[]> {
  const { data, error } = await supabase
    .from('guide_pages')
    .select('slug, updated_at, page_type')
    .eq('is_published', true);

  if (error || !data) return [];
  return data;
}

/** অ্যাডমিন প্যানেলে "See All Pages" — একটা নির্দিষ্ট প্রোডাক্টের সব গাইড পেজ (draft + published) */
export async function fetchGuidePagesByProduct(
  supabase: SupabaseClient,
  productId: number
): Promise<GuidePage[]> {
  const { data, error } = await supabase
    .from('guide_pages')
    .select('*')
    .eq('product_id', productId)
    .order('created_at', { ascending: true });

  if (error || !data) return [];
  return data as GuidePage[];
}

/** অ্যাডমিন প্যানেলে "See All Pages" — একটা নির্দিষ্ট ক্যাটাগরির সব গাইড পেজ (draft + published) */
export async function fetchGuidePagesByCategory(
  supabase: SupabaseClient,
  categoryId: string
): Promise<GuidePage[]> {
  const { data, error } = await supabase
    .from('guide_pages')
    .select('*')
    .eq('category_id', categoryId)
    .order('created_at', { ascending: true });

  if (error || !data) return [];
  return data as GuidePage[];
}

/**
 * blocks[]-এর ভেতর থেকে FAQ ব্লকগুলোর প্রশ্ন-উত্তর একসাথে জড়ো করা —
 * FAQPage JSON-LD বানানোর সময় ব্যবহার হয়।
 */
export function collectFaqEntries(
  page: GuidePage,
  lang: 'bn' | 'en'
): { question: string; answer: string }[] {
  const out: { question: string; answer: string }[] = [];
  for (const block of page.blocks) {
    if (block.type === 'faq') {
      for (const item of block.items) {
        out.push({ question: item.question[lang], answer: item.answer[lang] });
      }
    }
  }
  return out;
}

/**
 * blocks[]-এর ভেতর থেকে Steps ব্লক থাকলে HowTo schema বানানোর জন্য প্রথমটা রিটার্ন করা।
 * একাধিক Steps ব্লক থাকলে প্রথমটাকেই "মূল প্রসেস" ধরা হয়।
 */
export function collectHowToSteps(
  page: GuidePage,
  lang: 'bn' | 'en'
): { name: string; text: string }[] | null {
  for (const block of page.blocks) {
    if (block.type === 'steps') {
      return block.steps.map((s) => ({ name: s.title[lang], text: s.description[lang] }));
    }
  }
  return null;
}

/**
 * পেজের ভেতরে থাকা সব productRecommendation ব্লকের productId খুঁজে বের করে,
 * প্রতিটার জন্য হালকা প্রোডাক্ট স্ন্যাপশট (নাম/দাম/ছবি/লিংক) সার্ভারেই ফেচ করে আনা —
 * যাতে ক্লায়েন্টে আলাদা করে ফেচ করতে না হয়।
 */
export async function resolveProductSnapshots(
  supabase: SupabaseClient,
  page: GuidePage
): Promise<Record<number, ProductSnapshot>> {
  const ids = Array.from(
    new Set(
      page.blocks
        .filter((b): b is Extract<typeof b, { type: 'productRecommendation' }> => b.type === 'productRecommendation')
        .map((b) => b.productId)
    )
  );

  if (ids.length === 0) return {};

  const products = await Promise.all(ids.map((id) => fetchProductById(supabase, id)));

  const out: Record<number, ProductSnapshot> = {};
  products.forEach((p, i) => {
    if (!p) return;
    out[ids[i]] = {
      id: p.id,
      name: p.name,
      nameBn: p.nameBn,
      price: p.price,
      old: p.old,
      image: p.imgs?.[0] ?? '',
      href: productHref(p),
    };
  });
  return out;
}
