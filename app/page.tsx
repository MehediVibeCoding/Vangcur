import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { fetchCustomProducts } from '@/lib/productData';
import ClientHome from './ClientHome';

export default async function HomePage() {
  const supabase = await createClient();
  const initialProducts = await fetchCustomProducts(supabase);

  return (
    <Suspense fallback={null}>
      <ClientHome initialProducts={initialProducts} />
    </Suspense>
  );
}
