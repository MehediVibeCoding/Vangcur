import type { Product, Category } from '@/types';

export function searchProducts(prods: Product[], query: string): Product[] {
  const lower = (query || '').toLowerCase().trim();
  if (!lower) return [];
  const words = lower.split(/\s+/).filter(Boolean);
  const compactQ = lower.replace(/\s+/g, '');

  function matchProd(p: Product): boolean {
    const hay = [
      p.name || '', p.nameBn || '', p.desc || '', p.cat || '', p.tags || '',
      Object.values(p.specs || {}).join(' '),
    ].join(' ').toLowerCase();
    if (words.every((w) => hay.includes(w))) return true;
    if (hay.replace(/\s+/g, '').includes(compactQ)) return true;
    if (words.some((w) => w.length >= 3 && hay.includes(w))) return true;
    return false;
  }

  return prods.filter(matchProd).sort((a, b) => (a.stock <= 0 ? 1 : 0) - (b.stock <= 0 ? 1 : 0));
}

export function matchCategories(cats: Category[], query: string, limit = 5): Category[] {
  const lower = (query || '').toLowerCase().trim();
  if (!lower) return [];
  const words = lower.split(/\s+/).filter(Boolean);
  const compactQ = lower.replace(/\s+/g, '');

  return cats
    .map((c) => {
      const name = (c.name || '').toLowerCase();
      const id = (c.id || '').toLowerCase();
      const haystackSpaced = `${name} ${id}`;
      const compactHay = haystackSpaced.replace(/\s+/g, '');
      let score = 0;
      if (name.startsWith(lower) || id.startsWith(lower)) score = 3;
      else if (words.some((w) => name.split(' ').some((part) => part.startsWith(w)))) score = 2;
      else if (haystackSpaced.includes(lower) || compactHay.includes(compactQ)) score = 1;
      else if (words.some((w) => w.length >= 1 && haystackSpaced.includes(w))) score = 1;
      return { c, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.c);
}
