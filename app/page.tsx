import { Suspense } from 'react';
import { createClient } from '@supabase/supabase-js';
import { fetchCustomProducts } from '@/lib/productData';
import ClientHome from './ClientHome';

export const revalidate = 120;

export default async function HomePage() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const initialProducts = await fetchCustomProducts(supabase);

  return (
    <Suspense fallback={null}>
      <ClientHome initialProducts={initialProducts} />
    </Suspense>
  );
}
