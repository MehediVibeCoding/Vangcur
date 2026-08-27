import { createClient } from '@supabase/supabase-js';
import { fetchCustomProducts } from '@/lib/productData';
import { fetchCategories, DEFAULT_CATEGORIES } from '@/lib/categoryData';
import { fetchHeroCards, DEFAULT_HERO_CARDS } from '@/lib/heroSliderData';
import { optimizeCloudinaryUrl } from '@/lib/cloudinaryUrl';
import { logError } from '@/lib/logger';
import ClientHome from './ClientHome';

export const revalidate = 120;

export default async function HomePage() {
  // ⚠️ আগে createClient() কলটা কোনো try/catch ছাড়াই ছিল — এটাই একমাত্র
  // জায়গা যেখানে সরাসরি "throw" হতে পারত (যেমন env var কোনো একটা সার্ভার
  // রিকোয়েস্টে সাময়িকভাবে undefined এলে)। এই async Server Component-এর
  // ভেতরে uncaught throw ঘটলে পুরো Suspense boundary-টাই সার্ভারে ফেইল করে
  // যেত, আর Next.js পুরো পেজ ক্লায়েন্ট-সাইড রেন্ডারিং-এ পাঠিয়ে দিত (React
  // error #419 — কনসোলে যেটা দেখা যাচ্ছিল)।
  //
  // fetchCustomProducts/fetchCategories/fetchHeroCards — এই তিনটা ফাংশন
  // নিজেরাই আগে থেকে try/catch + রিট্রাই দিয়ে সুরক্ষিত এবং এরর হলে ফলব্যাক
  // ডেটা রিটার্ন করে, কখনো throw করে না। শুধু createClient()-এর এই একটা
  // ধাপই অরক্ষিত ছিল। নিচে ঠিক একই প্যাটার্নে (fetchCategories-এর মতোই)
  // try/catch দিয়ে ঘিরে দেওয়া হলো, এবং কোনো নতুন await/রিট্রাই/নেটওয়ার্ক
  // কল যোগ করা হয়নি — তাই স্বাভাবিক (সফল) কেসে লোড স্পিড অপরিবর্তিত থাকছে।
  // শুধু বিরল ব্যর্থতার কেসে পেজ ক্র্যাশ না করে ডিফল্ট ডেটা দিয়ে সার্ভারেই
  // সফলভাবে রেন্ডার হবে।
  let supabase: ReturnType<typeof createClient> | null = null;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (supabaseUrl && supabaseKey) {
    try {
      supabase = createClient(supabaseUrl, supabaseKey);
    } catch (e) {
      logError('[Vangcur] HomePage: createClient() failed:', e);
      supabase = null;
    }
  } else {
    logError('[Vangcur] HomePage: Supabase env var missing at request time.');
  }

  const [initialProducts, initialCategories, initialHeroCards] = supabase
    ? await Promise.all([
      fetchCustomProducts(supabase),
      fetchCategories(supabase),
      fetchHeroCards(supabase),
    ])
    : [[], DEFAULT_CATEGORIES, DEFAULT_HERO_CARDS];

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
