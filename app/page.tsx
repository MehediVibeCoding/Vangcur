import { createClient } from '@supabase/supabase-js';
import { fetchCustomProducts } from '@/lib/productData';
import { fetchCategories } from '@/lib/categoryData';
import { fetchHeroCards } from '@/lib/heroSliderData';
import { optimizeCloudinaryUrl } from '@/lib/cloudinaryUrl';
import ClientHome from './ClientHome';

export const revalidate = 120;

export default async function HomePage() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [initialProducts, initialCategories, initialHeroCards] = await Promise.all([
    fetchCustomProducts(supabase),
    fetchCategories(supabase),
    fetchHeroCards(supabase),
  ]);

  // LCP preload — derived from the same card data + the same
  // optimizeCloudinaryUrl() transform HeroSlider actually renders with,
  // so this URL can never drift out of sync with the real <img> src again.
  // Only rendered on the homepage (where the hero slider actually lives),
  // not site-wide, so other routes stop wastefully preloading it too.
  const lcpHeroImg = initialHeroCards[0]?.img
    ? optimizeCloudinaryUrl(initialHeroCards[0].img, 360)
    : null;

  return (
    <>
      {lcpHeroImg && (
        <link
          rel="preload"
          as="image"
          href={lcpHeroImg}
          // @ts-expect-error - fetchpriority is standard in modern browsers
          fetchpriority="high"
        />
      )}
      <ClientHome
        initialProducts={initialProducts}
        initialCategories={initialCategories}
        initialHeroCards={initialHeroCards}
      />
    </>
  );
}
