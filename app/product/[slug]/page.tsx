import type { Metadata } from 'next';
import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';
import { idFromSlug, makeSlug, fetchProductById } from '@/lib/productData';
import { getServerLang } from '@/lib/i18n/getServerLang';
import ProductDetailClient from './ProductDetailClient';

const SITE_URL = 'https://vangcur.com';

// generateMetadata আর পেজ কম্পোনেন্ট দুটোই একই প্রোডাক্ট লাগবে — React-এর cache()
// দিয়ে একই রিকোয়েস্টের মধ্যে এই ফাংশনটা একবারই চলবে, দুইবার Supabase-এ কল যাবে না।
const getProduct = cache(async (id: string) => {
  const supabase = await createClient();
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

  const title = `${p.name} - ৳${Number(p.price).toLocaleString('en-US')} | Vangcur`;
  const rawDesc = p.desc || '';
  const description = rawDesc
    ? (rawDesc.length > 160 ? rawDesc.slice(0, 157) + '...' : rawDesc)
    : (lang === 'en'
      ? `${p.name} for just ৳${Number(p.price).toLocaleString('en-US')} at Vangcur. Fast delivery, best price.`
      : `${p.name} মাত্র ৳${Number(p.price).toLocaleString('en-US')} টাকায়, Vangcur-এ। দ্রুত ডেলিভারি, সেরা দাম।`);
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
      description,
      images: firstImg ? [{ url: firstImg, width: 800, height: 800, alt: p.name }] : undefined,
      locale: lang === 'en' ? 'en_US' : 'bn_BD',
      siteName: 'Vangcur',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
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
