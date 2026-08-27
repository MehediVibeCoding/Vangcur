import type { Metadata } from 'next';
import { Suspense } from 'react';
import { cache } from 'react';
import { notFound } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { fetchCustomProducts } from '@/lib/productData';
import { fetchCategories, makeCatSlug } from '@/lib/categoryData';
import { getServerLang } from '@/lib/i18n/getServerLang';
import CategoryClient from './CategoryClient';

const SITE_URL = 'https://vangcur.com';

// ৫ মিনিট পর পর ব্যাকগ্রাউন্ডে ফ্রেশ ক্যাটাগরি ক্যাশ আপডেট হবে
export const revalidate = 300;

const getCategories = cache(async () => {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  return fetchCategories(supabase);
});

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const [cats, lang] = await Promise.all([getCategories(), getServerLang()]);
  const cat = cats.find((c) => c.id !== 'all' && makeCatSlug(c.id) === slug) || null;
  if (!cat) {
    return {
      title: lang === 'en' ? 'Category Not Found - Vangcur' : 'ক্যাটাগরি পাওয়া যায়নি - Vangcur',
      robots: { index: false, follow: true },
    };
  }
  const title = `${cat.name} - Vangcur`;
  const description = lang === 'en'
    ? `Browse the best products in the ${cat.name} category on Vangcur — best prices, fast home delivery.`
    : `Vangcur-এ ${cat.name} ক্যাটাগরির সেরা প্রোডাক্টগুলো দেখুন — সেরা দামে, দ্রুত হোম ডেলিভারিতে।`;
  return {
    title,
    description,
    alternates: { canonical: `/category/${makeCatSlug(cat.id)}` },
    openGraph: {
      type: 'website',
      url: `${SITE_URL}/category/${makeCatSlug(cat.id)}`,
      title,
      description,
      locale: lang === 'en' ? 'en_US' : 'bn_BD',
      siteName: 'Vangcur',
    },
  };
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const cats = await getCategories();
  const cat = cats.find((c) => c.id !== 'all' && makeCatSlug(c.id) === slug) || null;
  if (!cat) notFound();

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const initialProducts = await fetchCustomProducts(supabase);

  return (
    <Suspense fallback={null}>
      <CategoryClient initialProducts={initialProducts} category={cat} siblingCategories={cats} />
    </Suspense>
  );
}
