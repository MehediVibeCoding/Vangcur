import type { Metadata } from 'next';
import { Suspense } from 'react';
import { cache } from 'react';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { fetchCustomProducts } from '@/lib/productData';
import { fetchCategories, makeCatSlug } from '@/lib/categoryData';
import ClientHome from '../../ClientHome';

const SITE_URL = 'https://vangcur.com';

// আগে /category/<slug> URL শুধু client-side history.replaceState দিয়ে
// cosmetic-ভাবে বসানো হতো (Categories.tsx / ProductGrid.tsx-এ) — আসলে এই
// রুটে কোনো পেজ ছিল না, তাই সরাসরি লিংক শেয়ার/রিলোড/crawl করলে 404 পেতো।
// এখন এটা একটা real, crawlable, SSR রুট — প্রতিটা ক্যাটাগরির নিজস্ব title/
// meta description থাকবে আর গুগলে ইনডেক্স হবে। fetchCategories() অ্যাডমিন
// প্যানেল থেকে যোগ করা কাস্টম ক্যাটাগরিও ধরবে, শুধু হার্ডকোড ডিফল্ট লিস্ট না।
// cache() দিয়ে generateMetadata আর পেজ কম্পোনেন্ট একই রিকোয়েস্টে একবারই fetch করবে।
const findCategoryBySlug = cache(async (slug: string) => {
  const supabase = await createClient();
  const cats = await fetchCategories(supabase);
  return cats.find((c) => c.id !== 'all' && makeCatSlug(c.id) === slug) || null;
});

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const cat = await findCategoryBySlug(slug);
  if (!cat) {
    return { title: 'ক্যাটাগরি পাওয়া যায়নি - Vangcur', robots: { index: false, follow: true } };
  }
  const title = `${cat.name} - Vangcur`;
  const description = `Vangcur-এ ${cat.name} ক্যাটাগরির সেরা প্রোডাক্টগুলো দেখুন — সেরা দামে, দ্রুত হোম ডেলিভারিতে।`;
  return {
    title,
    description,
    alternates: { canonical: `/category/${makeCatSlug(cat.id)}` },
    openGraph: {
      type: 'website',
      url: `${SITE_URL}/category/${makeCatSlug(cat.id)}`,
      title,
      description,
      locale: 'bn_BD',
      siteName: 'Vangcur',
    },
  };
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const cat = await findCategoryBySlug(slug);
  if (!cat) notFound();

  const supabase = await createClient();
  const initialProducts = await fetchCustomProducts(supabase);

  return (
    <Suspense fallback={null}>
      <ClientHome initialProducts={initialProducts} initialCategory={cat.id} />
    </Suspense>
  );
}
