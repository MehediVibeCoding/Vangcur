import type { Metadata } from 'next';
import { cache } from 'react';
import { createClient } from '@supabase/supabase-js';
import { idFromSlug, makeSlug, fetchProductById } from '@/lib/productData';
import { getServerLang } from '@/lib/i18n/getServerLang';
import ProductDetailClient from './ProductDetailClient';

const SITE_URL = 'https://vangcur.com';

// ৫ মিনিট পর পর ব্যাকগ্রাউন্ডে ফ্রেশ ডাটা ক্যাশ আপডেট হবে (Edge ISR)
export const revalidate = 300;

const getProduct = cache(async (id: string) => {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  return fetchProductById(supabase, id);
});

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const id = idFromSlug(slug);
  const [p, lang] = await Promise.all([id ? getProduct(id) : Promise.resolve(null), getServerLang()]);

  if (!p) {
    return {
      title: lang === 'en' ? 'Product Not Found - Vangcur' : 'প্রোডাক্ট পাওয়া যায়নি - Vangcur',
      robots: { index: false, follow: true },
    };
  }

  const autoTitle = `${p.name} - ৳${Number(p.price).toLocaleString('en-US')} | Vangcur`;
  const title = p.metaTitle || autoTitle;

  const rawDesc = p.desc || '';
  const autoDescription = rawDesc
    ? (rawDesc.length > 160 ? rawDesc.slice(0, 157) + '...' : rawDesc)
    : (lang === 'en'
      ? `${p.name} for just ৳${Number(p.price).toLocaleString('en-US')} at Vangcur. Fast delivery, best price.`
      : `${p.name} মাত্র ৳${Number(p.price).toLocaleString('en-US')} টাকায়, Vangcur-এ। দ্রুত ডেলিভারি, সেরা দাম।`);
  const description = p.metaDescription || autoDescription;
  const ogDescription = p.ogDescription || description;

  const firstImg = p.imgs.find((im) => typeof im === 'string' && im.startsWith('http'));
  const canonicalSlug = `${makeSlug(p.name)}-${p.id}`;

  return {
    title,
    description,
    alternates: { canonical: `/product/${canonicalSlug}` },
    openGraph: {
      type: 'website',
      url: `${SITE_URL}/product/${canonicalSlug}`,
      title,
      description: ogDescription,
      images: firstImg ? [{ url: firstImg, width: 800, height: 800, alt: p.name }] : undefined,
      locale: lang === 'en' ? 'en_US' : 'bn_BD',
      siteName: 'Vangcur',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: ogDescription,
      images: firstImg ? [firstImg] : undefined,
    },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const id = idFromSlug(slug);
  const initialProduct = id ? await getProduct(id) : null;
  return <ProductDetailClient slug={slug} initialId={id} initialProduct={initialProduct} />;
}
