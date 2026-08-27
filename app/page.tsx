import { createClient } from '@supabase/supabase-js';
import { fetchCustomProducts } from '@/lib/productData';
import { fetchCategories } from '@/lib/categoryData';
import { fetchHeroCards } from '@/lib/heroSliderData';
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

  return (
    <ClientHome
      initialProducts={initialProducts}
      initialCategories={initialCategories}
      initialHeroCards={initialHeroCards}
    />
  );
}
