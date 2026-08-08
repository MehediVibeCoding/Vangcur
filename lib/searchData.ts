import type { Product, Category } from '@/types';

const BANGLA_RE = /[\u0980-\u09FF]/;
const MIN_EN_LEN = 3;

// বাংলা টেক্সট থেকে "শব্দ" আলাদা করার জন্য সাধারণ ফাঁকা জায়গা/যতিচিহ্নে ভাঙা হয়,
// যাতে "সম্পূর্ণ শব্দ মিলেছে কিনা" নির্ভুলভাবে চেক করা যায় (substring না)।
function bnWords(text: string): string[] {
  return (text || '').split(/[\s,.।/|()-]+/).filter(Boolean);
}

export function searchProducts(prods: Product[], query: string): Product[] {
  const raw = (query || '').trim();
  if (!raw) return [];
  const isBangla = BANGLA_RE.test(raw);

  function matchProd(p: Product): boolean {
    if (isBangla) {
      // বাংলায় লিখলে nameBn/tags-এর কোনো একটা শব্দের সাথে হুবহু (exact) মিলতে
      // হবে — আংশিক মিল (যেমন "নিয়" দিয়ে "নিয়ন" ধরা) গ্রহণযোগ্য না।
      const words = [...bnWords(p.nameBn || ''), ...bnWords(p.tags || '')];
      return words.some((w) => w === raw);
    }
    // ইংরেজিতে লিখলে কমপক্ষে ৩ অক্ষর টাইপ করতে হবে (তার আগে কোনো রেজাল্ট
    // দেখানো হবে না), তারপর বড়/ছোট হাতের অক্ষর নির্বিশেষে (case-insensitive)
    // substring মিল যথেষ্ট — যেমন "neo" লিখলেই "Neon Light" ধরা পড়বে।
    const lower = raw.toLowerCase();
    if (lower.length < MIN_EN_LEN) return false;
    const hay = [
      p.name || '', p.desc || '', p.cat || '', p.tags || '',
      Object.values(p.specs || {}).join(' '),
    ].join(' ').toLowerCase();
    return hay.includes(lower);
  }

  return prods.filter(matchProd).sort((a, b) => (a.stock <= 0 ? 1 : 0) - (b.stock <= 0 ? 1 : 0));
}

export function matchCategories(cats: Category[], query: string, limit = 5): Category[] {
  const raw = (query || '').trim();
  if (!raw) return [];
  // ক্যাটাগরির নাম শুধু ইংরেজিতেই সংরক্ষিত আছে (আলাদা কোনো বাংলা নাম/alias
  // ডেটা নেই), তাই বাংলা কোয়েরিতে ক্যাটাগরি-সাজেশন দেখানো হয় না — ভুল/অর্ধেক
  // মিল দেখানোর চেয়ে কিছু না দেখানোই সঠিক।
  if (BANGLA_RE.test(raw)) return [];
  const lower = raw.toLowerCase();
  if (lower.length < MIN_EN_LEN) return [];
  const words = lower.split(/\s+/).filter(Boolean);

  return cats
    .map((c) => {
      const name = (c.name || '').toLowerCase();
      const id = (c.id || '').toLowerCase();
      const haystackSpaced = `${name} ${id}`;
      let score = 0;
      if (name.startsWith(lower) || id.startsWith(lower)) score = 3;
      else if (words.some((w) => w.length >= MIN_EN_LEN && name.split(' ').some((part) => part.startsWith(w)))) score = 2;
      else if (haystackSpaced.includes(lower)) score = 1;
      return { c, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.c);
}
