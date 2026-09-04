import type { MetadataRoute } from 'next';
import { createClient } from '@supabase/supabase-js';
import { fetchCustomProducts, productHref } from '@/lib/productData';
import { fetchCategories, makeCatSlug } from '@/lib/categoryData';

const SITE_URL = 'https://vangcur.com';

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  let products: { id: string | number; name: string }[] = [];
  let categories: { id: string; name: string }[] = [];

  if (supabaseUrl && supabaseKey) {
    try {
      const supabase = createClient(supabaseUrl, supabaseKey);
      const [prods, cats] = await Promise.all([
        fetchCustomProducts(supabase),
        fetchCategories(supabase),
      ]);
      products = prods;
      categories = cats.filter((c) => c.id !== 'all');
    } catch {
      // Database fallback
    }
  }

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/offers`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/guide`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/shipping`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/refund-policy`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${SITE_URL}/terms`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${SITE_URL}/privacy-policy`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/track-order`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
  ];

  const categoryRoutes: MetadataRoute.Sitemap = categories.map((cat) => ({
    url: `${SITE_URL}/category/${makeCatSlug(cat.id)}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  const productRoutes: MetadataRoute.Sitemap = products.map((prod) => ({
    url: `${SITE_URL}${productHref(prod)}`,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: 0.9,
  }));

  return [...staticRoutes, ...categoryRoutes, ...productRoutes];
}
