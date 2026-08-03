import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { idFromSlug, makeSlug, DEFAULT_PRODS } from '@/lib/productData';
import ProductDetailClient from './ProductDetailClient';

const SITE_URL = 'https://vangcur.com';

interface MetaProduct {
  id: number | string;
  name: string;
  price: number;
  old?: number;
  imgs?: unknown;
  desc_text?: string;
  desc?: string;
  stock?: number;
}

async function fetchMetaProduct(id: string): Promise<MetaProduct | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('custom_products')
      .select('id,name,price,old,imgs,desc_text,stock')
      .eq('id', id)
      .maybeSingle();
    if (!error && data) return data as MetaProduct;
  } catch {
    // fall through to DEFAULT_PRODS below
  }
  return (DEFAULT_PRODS.find((p) => String(p.id) === String(id)) as unknown as MetaProduct) || null;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const id = idFromSlug(slug);
  const p = id ? await fetchMetaProduct(id) : null;

  if (!p) {
    return {
      title: 'প্রোডাক্ট পাওয়া যায়নি - Vangcur',
      robots: { index: false, follow: true },
    };
  }

  const title = `${p.name} - ৳${Number(p.price).toLocaleString()} | Vangcur`;
  const rawDesc = p.desc_text || p.desc || '';
  const description = rawDesc
    ? (rawDesc.length > 160 ? rawDesc.slice(0, 157) + '...' : rawDesc)
    : `${p.name} মাত্র ৳${Number(p.price).toLocaleString()} টাকায়, Vangcur-এ। দ্রুত ডেলিভারি, সেরা দাম।`;
  const imgs = Array.isArray(p.imgs) ? p.imgs : [];
  const firstImg = imgs.find((im): im is string => typeof im === 'string' && im.startsWith('http'));
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
      locale: 'bn_BD',
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
  return <ProductDetailClient slug={slug} initialId={id} />;
}
