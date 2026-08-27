'use client';

import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { optimizeCloudinaryUrl } from '@/lib/cloudinaryUrl';
import {
  prodInCat, fetchCustomProducts, mergeCustomProducts, subscribeCustomProducts,
  findProdBySlug,
  startQuickOrder, QUICK_CART_EVENT, STOCK_NOTIFY_EVENT,
} from '@/lib/productData';
import { useWishlistStore } from '@/lib/store/wishlistStore';
import { fetchProductDetail } from '@/lib/productDetailData';
import { trackProductView } from '@/lib/visitorTracking';
import { trackViewItem, trackAddToCart } from '@/lib/analytics';
import {
  DEFAULT_WA_LINK, DEFAULT_MSG_LINK, computeWaLink, computeMsgLink, fetchContactSettings, subscribeContactSettings,
} from '@/lib/floatButtonsData';
import { showToast } from '@/lib/toast';
import { useCartStore, cartCount } from '@/lib/store/cartStore';
import { useAuthStore } from '@/lib/store/authStore';
import { OPEN_CART_EVENT, OPEN_WISHLIST_EVENT, OPEN_TRACK_ORDER_EVENT, OPEN_ACCOUNT_EVENT, WISHLIST_FLY_EVENT } from '@/lib/uiEvents';
import Navbar from '@/app/components/layout/Navbar';
import ProductCard from '@/app/components/home/ProductCard';
import WarrantyModal from '@/app/components/modals/WarrantyModal';
import LoginModal from '@/app/components/auth/LoginModal';
import AccountPage from '@/app/components/auth/AccountPage';
import { useT } from '@/lib/i18n/useT';
import type { Product, ProductSpecs } from '@/types';

function ShieldIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3Z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}
function HeartIcon({ className = '', filled = false }: { className?: string; filled?: boolean }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
    </svg>
  );
}
function BoltIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <path d="M13 2 3 14h7l-1 8 11-14h-7l0-6Z" />
    </svg>
  );
}
function CartIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} width="17" height="17" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
    </svg>
  );
}
function BellIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}
function DocIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 3h6l5 5v11a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
      <path d="M14 3v5h5M9 13h6M9 17h6" />
    </svg>
  );
}
function SparkIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M18.4 5.6l-2.8 2.8M8.4 15.6l-2.8 2.8" />
    </svg>
  );
}
function WrenchIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.7 2.7-2-2 2.7-2.7Z" />
    </svg>
  );
}
function QuestionIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.1 9a3 3 0 0 1 5.82 1c0 2-3 2-3.05 4" /><path d="M12 17.5h.01" />
      <circle cx="12" cy="12" r="9" />
    </svg>
  );
}
function StarFillIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} width="17" height="17" viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6-5.9-3.3-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8Z" />
    </svg>
  );
}
function ChevronIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}
function CheckBadgeIcon({ className = '' }: { className?: string }) {
  return (
    <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-success/10 text-success ${className}`}>
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 6 9 17l-5-5" />
      </svg>
    </span>
  );
}
function ArrowIcon({ className = '', dir = 'left' }: { className?: string; dir?: 'left' | 'right' }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
      <path d={dir === 'left' ? 'M15 5l-7 7 7 7' : 'M9 5l7 7-7 7'} />
    </svg>
  );
}

function SectionHeading({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="mb-5 flex items-center gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-bg text-brand-light">
        {icon}
      </div>
      <div className="font-display text-lg font-bold text-ink">{children}</div>
    </div>
  );
}

function getQuickSpecPills(quickSpecsText: string | undefined, specs?: ProductSpecs & { _quick_keys?: string[] }): string[] {
  if (quickSpecsText && quickSpecsText.trim()) {
    return quickSpecsText.split('•').map((s) => s.trim()).filter(Boolean);
  }
  const s = specs || {};
  const quickKeys = s._quick_keys;
  if (Array.isArray(quickKeys) && quickKeys.length) {
    return quickKeys.filter((k) => s[k] !== undefined).slice(0, 6).map((k) => `${k}: ${s[k]}`);
  }
  return [];
}

const SPEC_PILL_GAP = 8;

function useSpecPillRows(pills: string[]) {
  const containerRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const [rows, setRows] = useState<string[][] | null>(null);

  const pillsKey = pills.join('\u0001');

  useLayoutEffect(() => {
    if (!pills.length) { setRows([]); return; }
    const recompute = () => {
      const containerEl = containerRef.current;
      const measureEl = measureRef.current;
      if (!containerEl || !measureEl) return;
      const containerWidth = containerEl.clientWidth;
      if (!containerWidth) return;
      const items = Array.from(measureEl.children) as HTMLElement[];
      const widths = pills.map((_, i) => Math.ceil(items[i]?.getBoundingClientRect().width || 0));
      const order = pills.map((_, i) => i).sort((a, b) => widths[b] - widths[a]);
      const binRows: { idx: number[]; used: number }[] = [];
      for (const idx of order) {
        const w = widths[idx];
        let placed = false;
        for (const row of binRows) {
          const needed = row.used + SPEC_PILL_GAP + w;
          if (needed <= containerWidth) {
            row.idx.push(idx);
            row.used = needed;
            placed = true;
            break;
          }
        }
        if (!placed) binRows.push({ idx: [idx], used: w });
      }
      setRows(binRows.map((r) => r.idx.map((i) => pills[i])));
    };
    recompute();
    window.addEventListener('resize', recompute);
    return () => window.removeEventListener('resize', recompute);
  }, [pillsKey]);

  return { containerRef, measureRef, rows };
}

function getTechSpecRows(specs?: ProductSpecs & { _quick_keys?: string[] }): [string, string][] {
  const s = specs || {};
  const quickKeys = s._quick_keys;
  const quickKeySet = Array.isArray(quickKeys) ? new Set(quickKeys) : new Set<string>();
  const EXCLUDE_FROM_TABLE = new Set(['Packaging Content', 'packaging_content']);
  return Object.entries(s).filter(
    ([k]) => !k.startsWith('_') && !quickKeySet.has(k) && !EXCLUDE_FROM_TABLE.has(k),
  ) as [string, string][];
}

function getPackagingContent(packagingContent: string | undefined, specs?: ProductSpecs): string {
  if (packagingContent && packagingContent.trim()) return packagingContent;
  const s = specs || {};
  return s['Packaging Content'] || s['packaging_content'] || '';
}

function FeatureItem({ text }: { text: string }) {
  const boldMatch = text.match(/^(.*?)\*\*(.*?)\*\*(.*)$/);
  if (boldMatch) {
    const [, pre, title, rest] = boldMatch;
    return (
      <div className="flex items-start gap-3 rounded-[10px] px-2.5 py-2.5 transition-brand duration-brand hover:bg-surface-muted">
        <div className="mt-0.5 shrink-0 text-base leading-none">{pre.trim() || <CheckBadgeIcon />}</div>
        <div className="text-[14px] leading-[1.6] text-ink"><strong>{title}</strong>{rest}</div>
      </div>
    );
  }
  const emojiMatch = text.match(/^(\p{Emoji_Presentation}|\p{Extended_Pictographic})\s*(.*)/u);
  if (emojiMatch) {
    return (
      <div className="flex items-start gap-3 rounded-[10px] px-2.5 py-2.5 transition-brand duration-brand hover:bg-surface-muted">
        <div className="mt-0.5 shrink-0 text-base leading-none">{emojiMatch[1]}</div>
        <div className="text-[14px] leading-[1.6] text-ink">{emojiMatch[2]}</div>
      </div>
    );
  }
  return (
    <div className="flex items-start gap-3 rounded-[10px] px-2.5 py-2.5 transition-brand duration-brand hover:bg-surface-muted">
      <div className="mt-0.5 shrink-0"><CheckBadgeIcon /></div>
      <div className="text-[14px] leading-[1.6] text-ink">{text}</div>
    </div>
  );
}

function GalleryImg({ val, name, isThumb }: { val?: string; name: string; isThumb: boolean }) {
  const [broken, setBroken] = useState(false);
  const isUrl = typeof val === 'string' && (val.startsWith('http://') || val.startsWith('https://'));
  if (isUrl && !broken) {
    return (
      <img
        src={optimizeCloudinaryUrl(val, isThumb ? 200 : 900)}
        alt={name || ''}
        loading="lazy"
        className={isThumb ? 'h-full w-full rounded-lg object-cover' : 'block h-full w-full object-contain'}
        onError={() => setBroken(true)}
      />
    );
  }
  return <span className={isThumb ? 'text-2xl' : 'text-[90px]'}>{val || '📦'}</span>;
}

const TABS = [
  { id: 'ppSecDesc', label: 'বিবরণ' },
  { id: 'ppSecFeatures', label: 'ফিচারস' },
  { id: 'ppSecSpecs', label: 'স্পেসিফিকেশন' },
  { id: 'ppSecExtra', label: 'অতিরিক্ত তথ্য' },
  { id: 'ppSecFaq', label: 'প্রশ্নোত্তর' },
  { id: 'ppSecReviews', label: 'রিভিউ' },
];

function SpecCalloutBox({ icon, title, children, tone }: { icon: string; title: string; children: ReactNode; tone: 'amber' | 'blue' }) {
  const toneClasses = tone === 'amber'
    ? 'border-[#FDE0B0] bg-[#FFF7ED]'
    : 'border-[#BAE0FD] bg-[#F0F9FF]';
  return (
    <div className={`mt-4 rounded-brand border p-4 ${toneClasses}`}>
      <div className="mb-2 flex items-center gap-2 text-[14px] font-bold text-ink">
        <span>{icon}</span>{title}
      </div>
      <div className="text-[14px] leading-[1.7] text-ink/80">{children}</div>
    </div>
  );
}

interface ProductDetailClientProps {
  slug: string;
  initialId: string | null;
  initialProduct: Product | null;
}

export default function ProductDetailClient({ slug, initialId, initialProduct }: ProductDetailClientProps) {
  const { t, lang } = useT();
  const router = useRouter();
  const supabase = useRef(createClient()).current;

  const [prods, setProds] = useState<Product[]>(initialProduct ? [initialProduct] : []);
  const [prodsLoaded, setProdsLoaded] = useState(!!initialProduct);

  useEffect(() => {
    let cancelled = false;
    fetchCustomProducts(supabase).then((customRows) => {
      if (cancelled) return;
      if (customRows.length) setProds((prev) => mergeCustomProducts(prev, customRows));
      setProdsLoaded(true);
    });
    const channel = subscribeCustomProducts(supabase, {
      onInsert: (mapped) => setProds((prev) => (
        prev.find((x) => String(x.id) === String(mapped.id)) ? prev : [...prev, mapped]
      )),
      onUpdate: (mapped) => setProds((prev) => {
        const idx = prev.findIndex((x) => String(x.id) === String(mapped.id));
        if (idx === -1) return prev;
        const next = [...prev];
        next[idx] = { ...next[idx], ...mapped };
        return next;
      }),
      onDelete: (id) => setProds((prev) => prev.filter((x) => String(x.id) !== String(id))),
    });
    return () => { cancelled = true; supabase.removeChannel(channel); };
  }, [supabase]);

  const baseProd = useMemo(
    () => findProdBySlug(prods, slug) || (initialId ? prods.find((x) => String(x.id) === String(initialId)) : null),
    [prods, slug, initialId],
  );

  useEffect(() => {
    if (!baseProd) return;
    trackProductView(supabase, baseProd.id);
  }, [baseProd?.id, supabase]);

  const [detail, setDetail] = useState<Partial<Product> | null>(null);
  useEffect(() => {
    if (!baseProd) return;
    if (baseProd._detailLoaded) { setDetail(null); return; }
    let cancelled = false;
    fetchProductDetail(supabase, baseProd.id).then((d) => { if (!cancelled) setDetail(d); });
    return () => { cancelled = true; };
  }, [baseProd?.id, supabase]);

  const prod = useMemo(() => (baseProd ? { ...baseProd, ...(detail || {}) } : null), [baseProd, detail]);

  const quickSpecPills = useMemo(
    () => (prod ? getQuickSpecPills(prod.quickSpecsText, prod.specs) : []),
    [prod],
  );
  const { containerRef: specPillsRef, measureRef: specPillsMeasureRef, rows: specPillRows } = useSpecPillRows(quickSpecPills);

  const [qty, setQty] = useState(1);
  const [curImgIdx, setCurImgIdx] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const [transformOrigin, setTransformOrigin] = useState('center center');
  const [activeTab, setActiveTab] = useState('ppSecDesc');
  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(null);
  const [warrantyOpen, setWarrantyOpen] = useState(false);
  const [stickyShown, setStickyShown] = useState(false);
  const [isMobileWidth, setIsMobileWidth] = useState(false);

  useEffect(() => {
    let raf = 0;
    const check = () => {
      raf = 0;
      setIsMobileWidth(window.innerWidth <= 600);
    };
    const scheduleCheck = () => {
      if (typeof window !== 'undefined' && window.visualViewport && window.visualViewport.scale !== 1) {
        return;
      }
      if (raf) return;
      raf = requestAnimationFrame(check);
    };
    check();
    window.addEventListener('resize', scheduleCheck);
    return () => {
      window.removeEventListener('resize', scheduleCheck);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  const [waLink, setWaLink] = useState(DEFAULT_WA_LINK);
  const [msgLink, setMsgLink] = useState<string | null>(DEFAULT_MSG_LINK);

  const cartQty = useCartStore((s) => cartCount(s.cart));
  const wishQty = useWishlistStore((s) => s.wishlist.length);
  const currentUser = useAuthStore((s) => s.currentUser);
  const [loginOpen, setLoginOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);

  useEffect(() => {
    const onOpenAccount = () => {
      if (!useAuthStore.getState().currentUser) setLoginOpen(true);
      else setAccountOpen(true);
    };
    window.addEventListener(OPEN_ACCOUNT_EVENT, onOpenAccount);
    return () => window.removeEventListener(OPEN_ACCOUNT_EVENT, onOpenAccount);
  }, []);

  const touchRef = useRef({ x: 0, y: 0 });
  const tabsWrapRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const relatedGridRef = useRef<HTMLDivElement>(null);
  const ppWishBtnRef = useRef<HTMLButtonElement>(null);

  const wished = useWishlistStore((s) => (prod ? s.wishlist.some((x) => String(x.id) === String(prod.id)) : false));

  useEffect(() => {
    if (!prod) return;
    setQty(1);
    setCurImgIdx(0);
    setZoomed(false);
    setActiveTab('ppSecDesc');
    setOpenFaqIdx(null);

    trackViewItem({
      item_id: prod.id,
      item_name: prod.name,
      price: prod.price,
      item_category: prod.cat,
    });
  }, [prod?.id]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const contact = await fetchContactSettings(supabase);
      if (cancelled) return;
      setWaLink(computeWaLink(contact));
      setMsgLink(computeMsgLink(contact));
    })();
    const channel = subscribeContactSettings(supabase, (contact) => {
      setWaLink(computeWaLink(contact));
      setMsgLink(computeMsgLink(contact));
    });
    return () => { cancelled = true; supabase.removeChannel(channel); };
  }, [supabase]);

  useEffect(() => {
    let raf = 0;
    const handler = () => {
      raf = 0;
      const el = tabsWrapRef.current;
      if (!el) return;
      setStickyShown(el.getBoundingClientRect().top <= 70);
    };
    const scheduleHandler = () => {
      if (typeof window !== 'undefined' && window.visualViewport && window.visualViewport.scale !== 1) {
        return;
      }
      if (raf) return;
      raf = requestAnimationFrame(handler);
    };
    window.addEventListener('scroll', scheduleHandler, { passive: true });
    handler();
    return () => {
      window.removeEventListener('scroll', scheduleHandler);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [prod?.id]);

  useEffect(() => {
    const grid = relatedGridRef.current;
    if (!grid) return undefined;
    const prefersReduced = typeof window !== 'undefined' && window.matchMedia
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced || !window.IntersectionObserver) return undefined;
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) { entry.target.classList.add('vc-visible'); obs.unobserve(entry.target); }
      });
    }, { rootMargin: '0px 0px -30px 0px', threshold: 0.08 });
    grid.querySelectorAll('.prod-card').forEach((card, i) => {
      card.classList.add('vc-reveal');
      (card as HTMLElement).style.transitionDelay = (Math.min(i, 5) * 60) + 'ms';
      obs.observe(card);
    });
    return () => obs.disconnect();
  }, [prod?.id, prods]);

  const maxQty = prod ? (prod.stock > 0 ? Math.min(prod.stock, 99) : 99) : 99;

  const chgQty = (d: number) => setQty((q) => Math.max(1, Math.min(maxQty, q + d)));

  const addCartFromPP = () => {
    if (!prod || prod.stock <= 0) return;
    window.dispatchEvent(new CustomEvent(QUICK_CART_EVENT, { detail: { id: prod.id, qty } }));
    
    trackAddToCart(
      {
        item_id: prod.id,
        item_name: prod.name,
        price: prod.price,
        item_category: prod.cat,
      },
      qty,
    );

    showToast(t('কার্টে যোগ হয়েছে'));
  };

  const orderNow = () => {
    if (!prod) return;
    startQuickOrder(router, prod, qty);
  };

  const notifyStock = () => {
    if (!prod) return;
    window.dispatchEvent(new CustomEvent(STOCK_NOTIFY_EVENT, { detail: { id: prod.id, name: prod.name } }));
  };

  const toggleWishFromPP = () => {
    if (!prod) return;
    const added = useWishlistStore.getState().toggleWish(prod);
    if (added && ppWishBtnRef.current) {
      const r = ppWishBtnRef.current.getBoundingClientRect();
      window.dispatchEvent(new CustomEvent(WISHLIST_FLY_EVENT, {
        detail: { x: r.left + r.width / 2, y: r.top + r.height / 2 },
      }));
    }
  };

  function buildOrderMsg(): string {
    if (!prod) return '';
    const pageUrl = window.location.href.split('?')[0].split('#')[0];
    const productRef = `${pageUrl}#prod-${prod.id}`;
    if (lang === 'en') {
      return `Hello Vangcur! I want to order:\n\n📦 ${prod.name}\n💰 ৳${prod.price.toLocaleString('en-US')}\n🔢 Quantity: ${qty}\n🛡️ Warranty: ${prod.warranty}\n\n🔗 Product Ref: ${productRef}\n\nPlease share the details.`;
    }
    return `হ্যালো Vangcur! অর্ডার করতে চাই:\n\n📦 ${prod.name}\n💰 ৳${prod.price.toLocaleString('en-US')}\n🔢 পরিমাণ: ${qty}\n🛡️ ওয়ারেন্টি: ${prod.warranty}\n\n🔗 পণ্য রেফ: ${productRef}\n\nবিস্তারিত জানান।`;
  }
  const waOrder = () => { if (prod) window.open(`${waLink}?text=${encodeURIComponent(buildOrderMsg())}`, '_blank'); };
  const msgOrder = () => { if (prod && msgLink) window.open(`${msgLink}?text=${encodeURIComponent(buildOrderMsg())}`, '_blank'); };

  const goImg = (i: number) => { setCurImgIdx(i); setZoomed(false); };
  const galleryArrow = (dir: number) => {
    if (!prod || !prod.imgs || prod.imgs.length <= 1) return;
    goImg((curImgIdx + dir + prod.imgs.length) % prod.imgs.length);
  };
  const handleGalleryTouchStart = (e: React.TouchEvent) => {
    touchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };
  const handleGalleryTouchEnd = (e: React.TouchEvent) => {
    if (zoomed) return;
    const dx = e.changedTouches[0].clientX - touchRef.current.x;
    const dy = e.changedTouches[0].clientY - touchRef.current.y;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 40) galleryArrow(dx < 0 ? 1 : -1);
  };
  const toggleZoom = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!zoomed) {
      const rect = e.currentTarget.getBoundingClientRect();
      const xPct = ((e.clientX - rect.left) / rect.width * 100).toFixed(2);
      const yPct = ((e.clientY - rect.top) / rect.height * 100).toFixed(2);
      setTransformOrigin(`${xPct}% ${yPct}%`);
      setZoomed(true);
    } else {
      setZoomed(false);
      setTimeout(() => setTransformOrigin('center center'), 380);
    }
  };

  const scrollToSection = (id: string) => {
    setActiveTab(id);
    const section = sectionRefs.current[id];
    if (!section) return;
    const tabHeight = tabsWrapRef.current ? tabsWrapRef.current.offsetHeight : 50;
    const top = section.getBoundingClientRect().top + window.scrollY - tabHeight - 8;
    window.scrollTo({ top, behavior: 'smooth' });
  };

  const toggleFaq = (i: number) => setOpenFaqIdx((cur) => (cur === i ? null : i));

  const navbarProps = {
    sticky: false as const,
    showHomeButton: true,
    cartCount: cartQty,
    wishCount: wishQty,
    currentUser,
    onCartClick: () => window.dispatchEvent(new CustomEvent(OPEN_CART_EVENT)),
    onWishClick: () => window.dispatchEvent(new CustomEvent(OPEN_WISHLIST_EVENT)),
    onTrackClick: () => window.dispatchEvent(new CustomEvent(OPEN_TRACK_ORDER_EVENT)),
    onLoginClick: () => setLoginOpen(true),
    onAccountClick: () => window.dispatchEvent(new CustomEvent(OPEN_ACCOUNT_EVENT)),
  };

  if (!prod) {
    if (!prodsLoaded) {
      return (
        <div className="min-h-screen bg-gradient-to-b from-brand-bg/25 via-white to-white">
          <Navbar {...navbarProps} />
          <div className="flex min-h-[50vh] items-center justify-center gap-2.5 text-sm text-muted">
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-brand-light/25 border-t-brand-light" />
            {t('লোড হচ্ছে...')}
          </div>
          <LoginModal isOpen={loginOpen} onClose={() => setLoginOpen(false)} />
          <AccountPage isOpen={accountOpen} onClose={() => setAccountOpen(false)} currentUser={currentUser} />
        </div>
      );
    }
    return (
      <div className="min-h-screen bg-gradient-to-b from-brand-bg/25 via-white to-white">
        <Navbar {...navbarProps} />
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3.5 px-4 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-bg/60 text-brand-light">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 8.5 12 4l9 4.5-9 4.5-9-4.5Z" />
              <path d="M3 8.5v7L12 20l9-4.5v-7" />
              <path d="M12 13v7" />
            </svg>
          </div>
          <p className="text-sm text-muted">{t('এই প্রোডাক্টটি খুঁজে পাওয়া যায়নি')}</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full bg-brand-light px-7 py-3 font-body text-sm font-bold text-white no-underline shadow-sh2 transition-brand duration-brand hover:-translate-y-0.5 hover:bg-brand-light-hover hover:shadow-sh3"
          >
            {t('হোমে ফিরে যান')}
            <ArrowIcon dir="right" className="h-3.5 w-3.5" />
          </Link>
        </div>
        <LoginModal isOpen={loginOpen} onClose={() => setLoginOpen(false)} />
        <AccountPage isOpen={accountOpen} onClose={() => setAccountOpen(false)} currentUser={currentUser} />
      </div>
    );
  }

  const sold = prod.stock <= 0;
  const imgs = prod.imgs && prod.imgs.length ? prod.imgs : ['📦'];
  const techRows = getTechSpecRows(prod.specs);
  const pkg = getPackagingContent(prod.packagingContent, prod.specs);
  const features = Array.isArray(prod.features) ? prod.features : [];
  const faqs = Array.isArray(prod.faqs) ? prod.faqs : [];
  const rating = prod.rating || 4.5;
  const related = prods
    .filter((p) => prodInCat(p, prod.cat) && p.id !== prod.id)
    .sort((a, b) => (a.stock <= 0 ? 1 : 0) - (b.stock <= 0 ? 1 : 0))
    .slice(0, 4);
  const discountPct = prod.old && prod.old > prod.price ? Math.round((1 - prod.price / prod.old) * 100) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-bg/25 via-white to-white">
      <Navbar {...navbarProps} />

      <div className="mx-auto grid max-w-[1100px] grid-cols-1 gap-8 px-4 pb-6 pt-5 md:grid-cols-2 md:px-8 md:pb-10">
        <div>
          <div
            className={`relative flex aspect-square items-center justify-center overflow-hidden rounded-brand border border-border-base bg-white p-6 shadow-sh1 sm:p-8 ${zoomed ? 'cursor-zoom-out' : 'cursor-zoom-in'}`}
            onClick={toggleZoom}
            onTouchStart={handleGalleryTouchStart}
            onTouchEnd={handleGalleryTouchEnd}
          >
            {sold ? (
              <div className="absolute left-3.5 top-3.5 z-10 rounded-full bg-ink/85 px-3 py-1 text-[11px] font-bold text-white backdrop-blur">
                {t('স্টক আউট')}
              </div>
            ) : prod.badge && (
              <div className="absolute left-3.5 top-3.5 z-10 animate-badge-hot-glow rounded-full bg-brand-light px-3 py-1 text-[11px] font-bold text-white">
                {prod.badge}
              </div>
            )}
            <div
              className="flex h-full w-full items-center justify-center transition-transform duration-300"
              style={{ transformOrigin, transform: zoomed ? 'scale(2)' : 'scale(1)' }}
            >
              <GalleryImg val={imgs[curImgIdx]} name={prod.name} isThumb={false} />
            </div>
          </div>
          {imgs.length > 1 && (
            <>
              <div className="mt-4 flex justify-center gap-1.5">
                {imgs.map((_, i) => (
                  <button
                    key={i}
                    aria-label={lang === 'en' ? `Image ${i + 1}` : `ছবি ${i + 1}`}
                    className={`h-1.5 rounded-full transition-brand duration-brand ${i === curImgIdx ? 'w-6 bg-brand-light' : 'w-1.5 bg-border-base hover:bg-brand-light/40'}`}
                    onClick={() => goImg(i)}
                  />
                ))}
              </div>
              <div className="mt-3 flex gap-2.5 overflow-x-auto pb-1">
                {imgs.map((im, i) => (
                  <button
                    type="button"
                    key={i}
                    aria-label={lang === 'en' ? `View image ${i + 1}` : `ছবি ${i + 1} দেখুন`}
                    className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-[10px] border-[1.5px] bg-white p-1 transition-brand duration-brand ${i === curImgIdx ? 'border-brand-light shadow-[0_0_0_3px_rgba(0,88,199,.12)]' : 'border-border-base hover:border-brand-light/40'}`}
                    onClick={() => goImg(i)}
                  >
                    <GalleryImg val={im} name={prod.name} isThumb />
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <div>
          <h1 className="mb-3 font-body text-[21px] font-bold leading-snug text-ink sm:text-2xl">{prod.seoH1 || prod.name}</h1>

          <div className="mb-3 flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
            <span className="font-body text-[28px] font-bold text-brand-light sm:text-[32px]">৳{prod.price.toLocaleString('en-US')}</span>
            {prod.old > prod.price && (
              <>
                <span className="text-[15px] text-muted line-through">৳{prod.old.toLocaleString('en-US')}</span>
                {discountPct > 0 && (
                  <span className="text-[13px] font-bold text-success">{lang === 'en' ? `${discountPct}% Off` : `${discountPct}% ছাড়`}</span>
                )}
              </>
            )}
          </div>

          {!sold && (
            <div className="mb-3 flex items-center gap-1.5 text-[12.5px] font-semibold">
              {prod.stock <= 10 ? (
                <span className="text-brand-light">⚡ {t('মাত্র')} {prod.stock}{t('টি বাকি — দ্রুত অর্ডার করুন')}</span>
              ) : (
                <span className="text-brand-light">{t('স্টকে আছে')} ({prod.stock}{t('টি')})</span>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={() => setWarrantyOpen(true)}
            className="mb-5 flex w-full items-center justify-between gap-2 rounded-[10px] border border-success/30 bg-success/10 px-3.5 py-2.5 text-left transition-brand duration-brand hover:border-success/50"
          >
            <span className="flex items-center gap-1.5 text-[12.5px] font-medium text-success">
              <ShieldIcon className="text-success" /> {t(prod.warranty)}
            </span>
            <span
              className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-success/40 text-[10.5px] font-bold text-success"
              title={t('ওয়ারেন্টি বিস্তারিত')}
            >
              ?
            </span>
          </button>

          {quickSpecPills.length > 0 && (
            <div className="mb-5">
              <div className="mb-2.5 text-[11px] font-bold uppercase tracking-wide text-muted">
                {t('স্পেসিফিকেশন এক নজরে')}
              </div>
              <div ref={specPillsRef} className="relative overflow-hidden">
                <div ref={specPillsMeasureRef} aria-hidden className="pointer-events-none invisible absolute left-0 top-0 flex gap-2 opacity-0">
                  {quickSpecPills.map((pill, i) => (
                    <div key={i} className="whitespace-nowrap rounded-full bg-brand-bg/35 px-3 py-1.5 text-[13px] text-ink">
                      {pill}
                    </div>
                  ))}
                </div>
                {specPillRows === null ? (
                  <div className="flex flex-wrap gap-2">
                    {quickSpecPills.map((pill, i) => (
                      <div key={i} className="rounded-full bg-brand-bg/35 px-3 py-1.5 text-[13px] text-ink">
                        {pill}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {specPillRows.map((row, ri) => (
                      <div key={ri} className="flex gap-2">
                        {row.map((pill, pi) => (
                          <div key={pi} className="whitespace-nowrap rounded-full bg-brand-bg/35 px-3 py-1.5 text-[13px] text-ink">
                            {pill}
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="mb-5 flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center gap-2.5 rounded-full bg-brand-bg/35 py-1 pl-3.5 pr-1">
              <span className="text-[13px] font-semibold text-ink">{t('পরিমাণ')}</span>
              <div className="flex items-center gap-1">
                <button
                  className="flex h-8 w-8 items-center justify-center rounded-full text-base font-bold text-ink transition-brand duration-brand hover:bg-white disabled:opacity-30"
                  onClick={() => chgQty(-1)}
                  disabled={qty <= 1}
                  aria-label={t('কমান')}
                >
                  −
                </button>
                <span className="min-w-[26px] text-center text-[14px] font-bold text-ink">{qty}</span>
                <button
                  className="flex h-8 w-8 items-center justify-center rounded-full text-base font-bold text-ink transition-brand duration-brand hover:bg-white disabled:opacity-30"
                  onClick={() => chgQty(1)}
                  disabled={qty >= maxQty}
                  aria-label={t('বাড়ান')}
                >
                  +
                </button>
              </div>
            </div>

            {qty > 1 && (
              <span className="text-[13px] text-muted">
                {t('মোট')} <span className="font-bold text-ink">৳{(prod.price * qty).toLocaleString('en-US')}</span>
              </span>
            )}

            <div className="ml-auto flex items-center gap-1">
              <button
                ref={ppWishBtnRef}
                onClick={toggleWishFromPP}
                title={t('Wishlist এ যোগ করুন')}
                className={`flex h-9 w-9 items-center justify-center rounded-[10px] bg-brand-bg/35 transition-brand duration-brand ${wished ? 'text-brand-light' : 'text-ink/60 hover:text-brand-light'}`}
              >
                <HeartIcon filled={wished} />
              </button>
              {!sold && (
                <button
                  onClick={waOrder}
                  title={t('WhatsApp এ অর্ডার করুন')}
                  className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-[#25D366] transition-brand duration-brand hover:brightness-95"
                >
                  <svg width="18" height="18" fill="white" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2.5">
            {sold ? (
              <button className="flex w-full items-center justify-center gap-2 rounded-[10px] border-none bg-gold py-3.5 text-sm font-bold text-white shadow-sh1 transition-brand duration-brand hover:brightness-95" onClick={notifyStock}>
                <BellIcon /> {t('স্টকে আসলে আমাকে জানান')}
              </button>
            ) : (
              <>
                <button className="flex w-full items-center justify-center gap-2 rounded-[10px] border-[1.5px] border-brand-light/40 bg-brand-bg/35 py-3.5 text-sm font-bold text-brand-light transition-brand duration-brand hover:bg-brand-bg/55" onClick={addCartFromPP}>
                  <CartIcon /> {t('কার্টে যোগ করুন')}
                </button>
                <button className="flex w-full items-center justify-center gap-2 rounded-[10px] border-none bg-brand-light py-3.5 text-sm font-bold text-white shadow-sh2 transition-brand duration-brand hover:-translate-y-0.5 hover:bg-brand-light-hover hover:shadow-sh3" onClick={orderNow}>
                  <BoltIcon /> {t('এখনই অর্ডার করুন')}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="sticky top-0 z-10 border-b border-border-base bg-white/95 backdrop-blur" ref={tabsWrapRef}>
        <div
          className="no-scrollbar mx-auto flex max-w-[1100px] gap-1 overflow-x-auto px-4 [overscroll-behavior-x:contain] [touch-action:pan-x] md:px-8"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {TABS.map((tab) => (
            <button
              key={tab.id}
              className={`whitespace-nowrap border-b-2 px-3.5 py-3.5 text-[13px] font-semibold transition-brand duration-brand ${activeTab === tab.id ? 'border-brand-light text-brand-light' : 'border-transparent text-muted hover:text-ink'}`}
              onClick={() => scrollToSection(tab.id)}
            >
              {t(tab.label)}
            </button>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-[1100px] px-4 md:px-8">
        <div className="border-b border-border-base py-8" id="ppSecDesc" ref={(el) => { sectionRefs.current.ppSecDesc = el; }}>
          <SectionHeading icon={<DocIcon />}>{t('প্রোডাক্টের')} <span className="text-brand-light">{t('বিস্তারিত বিবরণ')}</span></SectionHeading>
          <div className="text-[15px] leading-[1.85] text-ink/80">
            {(prod.longDesc || prod.desc) ? (
              (prod.longDesc || prod.desc)!.split('\n\n').map((p, i) => (
                <p key={i} className="mb-3.5">
                  {p.split('\n').map((line, j) => (j === 0 ? line : [<br key={j} />, line]))}
                </p>
              ))
            ) : (
              <p className="text-muted">{t('এই প্রোডাক্টের বিস্তারিত বিবরণ শীঘ্রই যোগ করা হবে।')}</p>
            )}
          </div>
        </div>

        <div className="border-b border-border-base py-8" id="ppSecFeatures" ref={(el) => { sectionRefs.current.ppSecFeatures = el; }}>
          <SectionHeading icon={<SparkIcon />}>{t('প্রধান')} <span className="text-brand-light">{t('ফিচারস')}</span></SectionHeading>
          {features.length ? (
            <div className="grid grid-cols-1 gap-x-8 sm:grid-cols-2">
              {features.map((f, i) => <FeatureItem key={i} text={f} />)}
            </div>
          ) : (
            <div className="text-[13px] text-muted">{t('এই প্রোডাক্টের features এখনো যোগ হয়নি।')}</div>
          )}
        </div>

        <div className="border-b border-border-base py-8" id="ppSecSpecs" ref={(el) => { sectionRefs.current.ppSecSpecs = el; }}>
          <SectionHeading icon={<WrenchIcon />}>{t('কারিগরি')} <span className="text-brand-light">{t('স্পেসিফিকেশন')}</span></SectionHeading>
          <div className="mx-auto max-w-[600px] overflow-x-auto rounded-brand border border-border-base sm:translate-x-[12%]">
            <table className="w-full border-collapse text-[14px]">
              <thead>
                <tr className="bg-surface-muted">
                  <th className="w-[42%] px-4 py-3 text-left font-semibold text-ink">{t('বিবরণ')}</th>
                  <th className="px-4 py-3 text-left font-semibold text-ink">{t('তথ্য')}</th>
                </tr>
              </thead>
              <tbody>
                {techRows.length === 0 ? (
                  <tr><td colSpan={2} className="p-4 text-center text-muted">{t('স্পেসিফিকেশন শীঘ্রই যোগ করা হবে।')}</td></tr>
                ) : (
                  techRows.map(([k, v], i) => (
                    <tr key={k} className={`border-t border-border-base transition-brand duration-brand hover:bg-surface-muted/60 ${i % 2 === 1 ? 'bg-surface-muted/30' : ''}`}>
                      <td className="px-4 py-3 font-medium text-ink">{k}</td>
                      <td className="px-4 py-3 text-ink/80">{v}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {prod.powerInfo && (
            <SpecCalloutBox icon="🔌" title={t('পাওয়ার / কানেকশন তথ্য')} tone="amber">
              {prod.powerInfo.split('\n').filter((l) => l.trim()).map((l, i) => (
                <div key={i}>{l.trim()}</div>
              ))}
            </SpecCalloutBox>
          )}

          {pkg && (
            <SpecCalloutBox icon="📦" title={t('Packaging Content')} tone="blue">
              {pkg.split('\n').filter((l) => l.trim()).map((l, i) => (
                <div key={i}>{l.trim()}</div>
              ))}
            </SpecCalloutBox>
          )}
        </div>

        <div className="border-b border-border-base py-8" id="ppSecExtra" ref={(el) => { sectionRefs.current.ppSecExtra = el; }}>
          <SectionHeading icon={<DocIcon />}>{t('অতিরিক্ত')} <span className="text-brand-light">{t('তথ্য')}</span></SectionHeading>
          {(prod.infoBoxes && prod.infoBoxes.length) ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {prod.infoBoxes.map((box, i) => (
                <div key={i} className="rounded-brand border border-border-base bg-white p-4 shadow-sh1">
                  <div className="mb-1.5 text-[14.5px] font-bold text-ink">{box.title}</div>
                  <div className="text-[14px] leading-[1.7] text-ink/80">{box.body}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-[13px] text-muted">{t('এই প্রোডাক্টের জন্য অতিরিক্ত তথ্য এখনো যোগ হয়নি।')}</div>
          )}
        </div>

        <div className="border-b border-border-base py-8" id="ppSecFaq" ref={(el) => { sectionRefs.current.ppSecFaq = el; }}>
          <SectionHeading icon={<QuestionIcon />}>{t('কমন')} <span className="text-brand-light">{t('প্রশ্নোত্তর (FAQ)')}</span></SectionHeading>
          {faqs.length ? faqs.map((f, i) => (
            <div className="border-b border-border-base last:border-0" key={i}>
              <button
                type="button"
                className="flex w-full items-center justify-between gap-3 py-4 text-left text-[14.5px] font-semibold text-ink transition-brand duration-brand hover:text-brand-light"
                onClick={() => toggleFaq(i)}
              >
                <span>{f.q}</span>
                <ChevronIcon className={`shrink-0 transition-transform duration-brand ${openFaqIdx === i ? 'rotate-180 text-brand-light' : 'text-muted'}`} />
              </button>
              {openFaqIdx === i && <div className="pb-4 text-[14px] leading-[1.7] text-muted">{f.a}</div>}
            </div>
          )) : (
            <div className="text-[13px] text-muted">{t('কোনো FAQ নেই।')}</div>
          )}
        </div>

        <div className="py-8" id="ppSecReviews" ref={(el) => { sectionRefs.current.ppSecReviews = el; }}>
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
            <div className="flex shrink-0 flex-col items-center gap-1.5 sm:border-r sm:border-border-base sm:pr-8">
              <div className="font-display text-4xl font-bold text-ink">{rating.toFixed(1)}</div>
              <div className="flex gap-0.5 text-gold">
                {[0, 1, 2, 3, 4].map((i) => <StarFillIcon key={i} className={i < Math.round(rating) ? '' : 'opacity-25'} />)}
              </div>
              <div className="text-[12px] text-muted">{t('বেশিরভাগ কাস্টমার সন্তুষ্ট')}</div>
            </div>
            <div className="flex flex-1 flex-col gap-2">
              {[[5, 65], [4, 22], [3, 8], [2, 3], [1, 2]].map(([star, pct]) => (
                <div key={star} className="flex items-center gap-2 text-[12px]">
                  <span className="w-5 text-right text-ink">{star}★</span>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-muted">
                    <div className="h-full rounded-full bg-gold" style={{ width: pct + '%' }} />
                  </div>
                  <span className="w-8 text-muted">{pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <div className="mx-auto max-w-[1100px] px-4 pb-10 md:px-8">
          <div className="mb-4 flex items-center gap-3">
            <div className="h-px flex-1 bg-border-base" />
            <div className="whitespace-nowrap font-display text-lg font-bold text-ink">{t('একই ক্যাটাগরির')} <span className="text-brand-light">{t('আরও পণ্য')}</span></div>
            <div className="h-px flex-1 bg-border-base" />
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4" ref={relatedGridRef}>
            {related.map((p) => (
              <div className="prod-card" key={p.id}>
                <ProductCard prod={p} isFirst={false} />
              </div>
            ))}
          </div>
        </div>
      )}

      <WarrantyModal isOpen={warrantyOpen} onClose={() => setWarrantyOpen(false)} warrantyText={prod.warranty} />
      <LoginModal isOpen={loginOpen} onClose={() => setLoginOpen(false)} />
      <AccountPage isOpen={accountOpen} onClose={() => setAccountOpen(false)} currentUser={currentUser} />

      <div className={`fixed inset-x-0 bottom-0 z-30 border-t border-border-base bg-white/95 shadow-sh3 backdrop-blur transition-transform duration-brand ${stickyShown ? 'translate-y-0' : 'translate-y-full'}`}>
        <div className="mx-auto flex max-w-[1100px] items-center gap-3 px-4 py-2.5 md:px-8">
          <div className="min-w-0 flex-1 truncate text-[13px] font-semibold text-ink">
            {(() => {
              const maxLen = isMobileWidth ? 25 : 45;
              return prod.name.length > maxLen ? prod.name.slice(0, maxLen) + '...' : prod.name;
            })()}
          </div>
          <div className="shrink-0 whitespace-nowrap text-[15px] font-bold text-ink">
            ৳{(prod.price * qty).toLocaleString('en-US')}
            {qty > 1 && <span className="ml-1 text-[11px] font-normal text-muted">×{qty}</span>}
          </div>
          {sold ? (
            <button className="flex shrink-0 items-center gap-1.5 rounded-[10px] border-none bg-gold px-4 py-2.5 text-[13px] font-bold text-white shadow-sh1 transition-brand duration-brand hover:brightness-95" onClick={notifyStock}>
              <BellIcon /> {t('জানান')}
            </button>
          ) : (
            <>
              <button className="flex shrink-0 items-center gap-1.5 rounded-[10px] border-none bg-brand-light px-4 py-2.5 text-[13px] font-bold text-white shadow-sh1 transition-brand duration-brand hover:bg-brand-light-hover" onClick={orderNow}>
                <BoltIcon /> {t('অর্ডার করুন')}
              </button>
              <button className="flex shrink-0 items-center gap-1.5 rounded-[10px] border-[1.5px] border-brand-light/40 bg-brand-bg/35 px-4 py-2.5 text-[13px] font-bold text-brand-light transition-brand duration-brand hover:bg-brand-bg/55" onClick={addCartFromPP}>
                <CartIcon /> {t('কার্ট')}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
