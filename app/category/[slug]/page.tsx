import type { Metadata } from 'next';
import { cache } from 'react';
import { notFound } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { fetchCustomProducts } from '@/lib/productData';
import { fetchCategories, makeCatSlug, DEFAULT_CATEGORIES } from '@/lib/categoryData';
import { fetchHeroCards, DEFAULT_HERO_CARDS } from '@/lib/heroSliderData';
import { getServerLang } from '@/lib/i18n/getServerLang';
import ClientHome from '@/app/ClientHome';

const SITE_URL = 'https://vangcur.com';

export const revalidate = 300;

const getCategories = cache(async () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) return DEFAULT_CATEGORIES;
  const supabase = createClient(supabaseUrl, supabaseKey);
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

  let supabase: ReturnType<typeof createClient> | null = null;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (supabaseUrl && supabaseKey) {
    try {
      supabase = createClient(supabaseUrl, supabaseKey);
    } catch {
      supabase = null;
    }
  }

  const [initialProducts, initialCategories, initialHeroCards] = supabase
    ? await Promise.all([
      fetchCustomProducts(supabase),
      fetchCategories(supabase),
      fetchHeroCards(supabase),
    ])
    : [[], DEFAULT_CATEGORIES, DEFAULT_HERO_CARDS];

  return (
    <ClientHome
      initialProducts={initialProducts}
      initialCategories={initialCategories}
      initialHeroCards={initialHeroCards}
      initialCategory={cat.id}
    />
  );
}
