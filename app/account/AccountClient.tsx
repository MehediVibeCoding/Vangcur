'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { showToast } from '@/lib/toast';
import { sanitizeSvgHtml } from '@/lib/sanitize';
import { sanitizePlainName, validateName, MAX_NAME_LEN } from '@/lib/security';
import { checkNameChangeLimit } from '@/lib/rateLimit';
import { productHref } from '@/lib/productData';
import { useWishlistStore } from '@/lib/store/wishlistStore';
import { useCartStore, cartCount } from '@/lib/store/cartStore';
import { useAuthStore } from '@/lib/store/authStore';
import { useLanguageStore, type Language } from '@/lib/store/languageStore';
import { useT } from '@/lib/i18n/useT';
import { optimizeCloudinaryUrl } from '@/lib/cloudinaryUrl';
import { logout } from '@/lib/authData';
import {
  OPEN_MEMBERSHIP_EVENT, OPEN_CART_EVENT, OPEN_WISHLIST_EVENT, OPEN_TRACK_ORDER_EVENT,
} from '@/lib/uiEvents';
import {
  computeCelestialState, fetchIsRaining, formatLiveTimeDate, getGreeting,
  fetchMyOrders, orderStats, updateProfileName,
  getStockNotifications, removeStockNotification, clearAllStockNotifications,
  fetchDrafts, deleteDraft, deleteAllDrafts,
} from '@/lib/accountData';
import {
  getTier, tierIconSVG, crownSVG,
} from '@/lib/membershipData';
import Navbar from '@/app/components/layout/Navbar';
import Footer from '@/app/components/layout/Footer';
import OrderCard from '@/app/components/orders/OrderCard';
import type { Order, DraftOrder, StockNotification } from '@/types';

const LoginModal = dynamic(() => import('@/app/components/auth/LoginModal'));

const STATE_BG: Record<string, string> = {
  dawn: 'bg-gradient-to-b from-[#3d2145] via-[#7c4a6b] to-[#e8935f]',
  morning: 'bg-gradient-to-b from-[#4a90c2] via-[#87ceeb] to-[#c8e6f5]',
  noon: 'bg-gradient-to-b from-[#3a8fd1] via-[#6bb6e8] to-[#a8d8f0]',
  sunset: 'bg-gradient-to-b from-[#2d1b4e] via-[#a8456b] to-[#f4a261]',
  night: 'bg-gradient-to-b from-[#0a0e27] via-[#141b3d] to-[#1e2951]',
  rain: 'bg-gradient-to-b from-[#3d4451] via-[#5a6472] to-[#7d8a99]',
};

function ItemThumb({ imgVal }: { imgVal?: string }) {
  const isUrl = typeof imgVal === 'string' && imgVal.startsWith('http');
  if (isUrl) {
    return (
      <img
        src={optimizeCloudinaryUrl(imgVal, 120)}
        alt=""
        className="h-10 w-10 shrink-0 rounded-xl border border-white/90 bg-white object-cover shadow-xs"
        loading="lazy"
        decoding="async"
        onError={(e) => { e.currentTarget.style.display = 'none'; }}
      />
    );
  }
  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-muted text-xl shadow-xs">
      {imgVal || '📦'}
    </span>
  );
}

export default function AccountClient() {
  const { t, lang } = useT();
  const router = useRouter();
  const setLanguage = useLanguageStore((s) => s.setLanguage);
  const supabase = useRef(createClient()).current;

  const cartQty = useCartStore((s) => cartCount(s.cart));
  const wishQty = useWishlistStore((s) => s.wishlist.length);
  const currentUser = useAuthStore((s) => s.currentUser);

  const [loginOpen, setLoginOpen] = useState(false);
  const [now, setNow] = useState(() => new Date());
  const [isRaining, setIsRaining] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const [cardWidth, setCardWidth] = useState(320);

  const [nameEditOpen, setNameEditOpen] = useState(false);
  const [nameEditValue, setNameEditValue] = useState('');
  const [nameEditErr, setNameEditErr] = useState('');

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const [orders, setOrders] = useState<Order[]>([]);
  const [stockNotifs, setStockNotifs] = useState<StockNotification[]>([]);
  const [drafts, setDrafts] = useState<DraftOrder[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  useEffect(() => {
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!cardRef.current) return undefined;
    const measure = () => setCardWidth(cardRef.current?.clientWidth || 320);
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    fetchIsRaining(supabase, currentUser).then(setIsRaining);
  }, [currentUser, supabase]);

  useEffect(() => {
    if (!currentUser) {
      setLoadingOrders(false);
      return;
    }
    setNameEditOpen(false);
    setStockNotifs(getStockNotifications());
    setLoadingOrders(true);
    fetchMyOrders(supabase, currentUser).then((res) => {
      setOrders(res);
      setLoadingOrders(false);
    });
    fetchDrafts(supabase, currentUser).then(setDrafts);
  }, [currentUser, supabase]);

  const celestial = useMemo(
    () => computeCelestialState(now.getHours() + now.getMinutes() / 60, isRaining, cardWidth),
    [now, isRaining, cardWidth]
  );
  const stats = useMemo(() => orderStats(orders), [orders]);

  const initials = currentUser?.name
    ? currentUser.name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  const createdStr = currentUser?.createdAt
    ? new Date(currentUser.createdAt).toLocaleDateString(lang === 'en' ? 'en-US' : 'bn-BD', {
      year: 'numeric', month: 'long', day: 'numeric',
    })
    : '';

  const openNameEdit = () => {
    if (!currentUser) return;
    setNameEditValue(sanitizePlainName(currentUser.name || ''));
    setNameEditErr('');
    setNameEditOpen(true);
  };

  const closeNameEdit = () => {
    setNameEditOpen(false);
    setNameEditErr('');
  };

  const saveNameEdit = async () => {
    if (!currentUser) return;
    const nm = nameEditValue.trim();
    if (!validateName(nm)) {
      setNameEditErr(t('অন্তত ২ ও সর্বোচ্চ ৩০ অক্ষরের প্লেন নাম দিন (কোনো চিহ্ন/ইমোজি ছাড়া)'));
      return;
    }
    if (currentUser.id) {
      const limit = await checkNameChangeLimit(supabase, currentUser.id);
      if (!limit.allowed) {
        setNameEditErr(t('আপনি দৈনিক ৩ বার নাম পরিবর্তনের লিমিটে পৌঁছে গেছেন। আগামীকাল আবার চেষ্টা করুন।'));
        return;
      }
    }
    await updateProfileName(supabase, currentUser, nm);
    useAuthStore.getState().setCurrentUser({ ...currentUser, name: nm });
    closeNameEdit();
    showToast(t('নাম পরিবর্তন হয়েছে'));
  };

  const doLogout = async () => {
    setShowLogoutConfirm(false);
    await logout(supabase);
    useWishlistStore.getState().clearWishlist();
    showToast(t('লগআউট হয়েছে'));
  };

  const handleRemoveStockNotif = (key: string) => {
    removeStockNotification(key);
    setStockNotifs((prev) => prev.filter((i) => i.key !== key));
  };

  const handleClearStockNotifs = () => {
    clearAllStockNotifications();
    setStockNotifs([]);
  };

  const viewNotifiedProduct = (item: StockNotification) => {
    router.push(productHref({ id: item.prodId, name: item.prodName || '' }));
  };

  const handleDeleteDraft = async (draftId: string, sbId?: number) => {
    await deleteDraft(supabase, currentUser, draftId, sbId);
    setDrafts((prev) => prev.filter((d) => d.id !== draftId));
  };

  const handleClearAllDrafts = async () => {
    await deleteAllDrafts(supabase, currentUser);
    setDrafts([]);
  };

  const continueFromDraft = (draft: DraftOrder) => {
    try {
      if (Array.isArray(draft.items) && draft.items.length) {
        sessionStorage.setItem('vc_quick_order_items', JSON.stringify(draft.items));
      }
      sessionStorage.setItem('vc_form_draft', JSON.stringify({
        name: draft.name || '',
        phone: draft.phone || '',
        dist: draft.dist || '',
        addr: draft.addr || '',
        email: draft.email || '',
      }));
      if (draft.ship) sessionStorage.setItem('vc_ship', draft.ship);
    } catch {
      // ignore
    }
    router.push('/checkout');
  };

  const openInvoice = (orderId: string | number) => {
    router.push(`/checkout/invoice?id=${encodeURIComponent(String(orderId))}`);
  };

  const currentTier = getTier(stats.completed);
  const openMembership = () => {
    window.dispatchEvent(
      new CustomEvent(OPEN_MEMBERSHIP_EVENT, { detail: { completedCount: stats.completed } })
    );
  };

  const navbarProps = {
    showHomeButton: true,
    sticky: false as const,
    cartCount: cartQty,
    wishCount: wishQty,
    currentUser,
    onCartClick: () => window.dispatchEvent(new CustomEvent(OPEN_CART_EVENT)),
    onWishClick: () => window.dispatchEvent(new CustomEvent(OPEN_WISHLIST_EVENT)),
    onTrackClick: () => window.dispatchEvent(new CustomEvent(OPEN_TRACK_ORDER_EVENT)),
    onLoginClick: () => setLoginOpen(true),
    onAccountClick: () => router.push('/account'),
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-bg/25 via-white to-white">
      <Navbar {...navbarProps} />

      <main className="mx-auto max-w-[1100px] px-4 pb-16 pt-4 md:px-6">
        {!currentUser ? (
          <div className="mx-auto my-12 max-w-[420px] rounded-[28px] border border-white/80 bg-white/85 p-8 text-center shadow-sh2 backdrop-blur-md animate-section-reveal">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand-bg/50 text-brand-light text-2xl shadow-xs">
              🔒
            </div>
            <h1 className="mb-1.5 font-body text-xl font-bold text-ink">
              {t('প্রোফাইল দেখতে লগইন করুন')}
            </h1>
            <p className="mb-6 font-body text-[13px] leading-relaxed text-muted">
              {lang === 'en'
                ? 'Please log in to your account to view your orders, membership level, and profile settings.'
                : 'আপনার অর্ডার হিস্টোরি, মেম্বারশিপ লেভেল এবং প্রোফাইল তথ্য দেখতে অ্যাকাউন্টে লগইন করুন।'}
            </p>
            <button
              onClick={() => setLoginOpen(true)}
              className="w-full rounded-full bg-gradient-to-r from-info to-brand-light py-3 font-body text-sm font-bold text-white shadow-sh2 transition-all duration-brand hover:brightness-[1.03] active:scale-95"
            >
              {t('লগইন করুন')}
            </button>
          </div>
        ) : (
          <>
            {/* প্রোফাইল হেডার */}
            <div className="mb-6 text-center">
              <h1 className="font-body text-2xl font-extrabold text-ink sm:text-[28px]">
                {lang === 'en' ? 'Customer Profile' : 'কাস্টমার প্রোফাইল'}
              </h1>
              <div className="mt-1 font-body text-sm font-semibold text-brand-light">
                {getGreeting(currentUser, now)}
              </div>
              <div className="mt-0.5 font-body text-xs text-muted">
                {formatLiveTimeDate(now)}
              </div>
            </div>

            {/* ২-কলাম ড্যাশবোর্ড গ্রিড */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[360px_1fr]">
              
              {/* বাম কলাম: সাইডবার উইজেটসমূহ */}
              <div className="flex flex-col gap-4">
                
                {/* ১. লাইভ ওয়েদার ও সেলেস্টিয়াল প্রোফাইল কার্ড */}
                <div
                  ref={cardRef}
                  className={`relative overflow-hidden rounded-[24px] p-5 shadow-sh2 ${
                    STATE_BG[celestial.state] || STATE_BG.noon
                  }`}
                  style={{ minHeight: 240 }}
                >
                  {/* তারা */}
                  <svg className="pointer-events-none absolute inset-0 h-16 w-full opacity-80" viewBox="0 0 400 65" preserveAspectRatio="none">
                    {['10%', '20%', '35%', '50%', '65%', '80%', '92%', '15%', '45%', '75%'].map((left, i) => (
                      <circle
                        key={i}
                        cx={left}
                        cy={`${10 + (i % 4) * 4}`}
                        r={i % 2 === 0 ? 1 : 1.5}
                        fill="#fff"
                        style={{
                          animation: `twinkling ${1.5 + (i % 3) * 0.5}s infinite ${(i % 5) * 0.2}s`,
                          opacity: celestial.state === 'night' ? undefined : 0,
                        }}
                      />
                    ))}
                  </svg>

                  {/* মেঘ */}
                  {['0%', '35%', '68%'].map((left, i) => (
                    <div
                      key={i}
                      className="absolute top-2 h-4 w-10 rounded-full bg-white/70"
                      style={{
                        left,
                        animation: `cloudDrift ${12 + i * 6}s linear infinite ${-i * 4}s`,
                        opacity: celestial.state === 'rain' || celestial.state === 'night' ? 0.15 : 0.6,
                      }}
                    />
                  ))}

                  {/* বৃষ্টি */}
                  {isRaining && (
                    <div className="pointer-events-none absolute inset-0 overflow-hidden">
                      {['10%', '20%', '35%', '50%', '65%', '80%', '92%', '15%', '45%', '75%'].map((left, i) => (
                        <div
                          key={i}
                          className="absolute top-0 h-3 w-px bg-white/50"
                          style={{
                            left,
                            animation: `rainDropFall ${0.6 + (i % 3) * 0.1}s linear infinite ${(i % 6) * 0.1 + 0.1}s`,
                          }}
                        />
                      ))}
                    </div>
                  )}

                  {/* সূর্য / চাঁদ */}
                  {celestial.celestial !== 'none' && (
                    <div
                      className={`absolute h-6 w-6 rounded-full ${
                        celestial.celestial === 'sun'
                          ? 'bg-[#FDE68A] shadow-[0_0_18px_6px_rgba(253,230,138,0.6)]'
                          : 'bg-[#E5E7EB] shadow-[0_0_14px_4px_rgba(229,231,235,0.5)]'
                      }`}
                      style={{ left: celestial.posX, top: celestial.posY }}
                    />
                  )}

                  {/* দৃশ্যপট ল্যান্ডস্কেপ */}
                  <div
                    className="pointer-events-none absolute bottom-0 left-0 h-16 w-full opacity-90"
                    dangerouslySetInnerHTML={{ __html: sanitizeSvgHtml(celestial.sceneryHtml) }}
                  />

                  {/* কার্ড কনটেন্ট */}
                  <div className="relative z-10 flex h-full min-h-[200px] flex-col justify-between">
                    <div className="flex items-center gap-3.5">
                      <div className="relative shrink-0">
                        {currentTier.crown && (
                          <span
                            className="pointer-events-none absolute -top-4 left-1/2 h-8 w-8 -translate-x-1/2 [filter:drop-shadow(0_1px_3px_rgba(0,0,0,0.35))]"
                            dangerouslySetInnerHTML={{ __html: sanitizeSvgHtml(crownSVG(currentTier.crown)) }}
                          />
                        )}
                        <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-white/35 bg-white/20 text-sm font-bold text-white shadow-sm backdrop-blur-md">
                          {initials}
                        </div>
                      </div>
                      <div className="min-w-0 flex-1 text-white" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.65)' }}>
                        <div className="truncate font-body text-[15px] font-extrabold">{currentUser.name || '-'}</div>
                        <div className="truncate font-body text-[12px] text-white/80">{currentUser.email || '-'}</div>
                        {createdStr && (
                          <div className="mt-0.5 font-body text-[10.5px] text-white/70">
                            📅 {t('অ্যাকাউন্ট তৈরি:')} {createdStr}
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <div className="flex gap-2 border-t border-white/[0.16] pt-3">
                        <button
                          onClick={openNameEdit}
                          className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-white/25 bg-white/15 py-2 font-body text-xs font-bold text-white shadow-xs backdrop-blur-md transition-all hover:bg-white/25 active:scale-95"
                        >
                          <span>✏️</span>
                          <span>{t('এডিট')}</span>
                        </button>
                        <button
                          onClick={() => setShowLogoutConfirm(true)}
                          className="flex flex-1 items-center justify-center gap-1.5 rounded-full border border-white/25 bg-white/15 py-2 font-body text-xs font-bold text-white shadow-xs backdrop-blur-md transition-all hover:bg-white/25 active:scale-95"
                        >
                          <span>↩</span>
                          <span>{t('লগআউট')}</span>
                        </button>
                      </div>

                      {nameEditOpen && (
                        <div className="mt-3 rounded-[16px] bg-black/40 p-3.5 backdrop-blur-md animate-section-reveal">
                          <div className="mb-1.5 font-body text-[11.5px] font-bold text-white/80">
                            {t('নতুন নাম লিখুন')}
                          </div>
                          <div className="flex gap-1.5">
                            <input
                              type="text"
                              placeholder={t('আপনার নাম')}
                              value={nameEditValue}
                              maxLength={MAX_NAME_LEN}
                              onChange={(e) => setNameEditValue(sanitizePlainName(e.target.value))}
                              onKeyDown={(e) => { if (e.key === 'Enter') saveNameEdit(); }}
                              className="flex-1 rounded-[10px] border border-white/20 bg-white/15 px-3 py-1.5 font-body text-[13px] text-white outline-none placeholder:text-white/50 focus:border-brand-light"
                            />
                            <button
                              onClick={saveNameEdit}
                              className="rounded-[10px] bg-brand-light px-3.5 font-body text-xs font-bold text-white shadow-xs hover:bg-brand-light-hover"
                            >
                              {t('সেভ')}
                            </button>
                            <button
                              onClick={closeNameEdit}
                              className="rounded-[10px] bg-white/20 px-2.5 font-body text-xs text-white"
                            >
                              ✕
                            </button>
                          </div>
                          {nameEditErr && <div className="mt-1.5 font-body text-[11px] text-red-300">{nameEditErr}</div>}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* ২. অর্ডার স্ট্যাটাস ও মেম্বারশিপ টায়ার চিপস */}
                <div className="grid grid-cols-3 gap-2.5">
                  <div className="rounded-[18px] border border-white/80 bg-white/80 py-3 text-center shadow-xs backdrop-blur-md">
                    <div className="font-body text-base font-extrabold text-ink">
                      {stats.total}{lang === 'en' ? '' : 'টি'}
                    </div>
                    <div className="font-body text-[10.5px] font-semibold text-muted">{t('মোট অর্ডার')}</div>
                  </div>

                  <div className="rounded-[18px] border border-white/80 bg-white/80 py-3 text-center shadow-xs backdrop-blur-md">
                    <div className="font-body text-base font-extrabold text-brand-light">
                      {stats.running}{lang === 'en' ? '' : 'টি'}
                    </div>
                    <div className="font-body text-[10.5px] font-semibold text-muted">{t('রানিং অর্ডার')}</div>
                  </div>

                  <div
                    onClick={openMembership}
                    className="flex cursor-pointer flex-col items-center justify-center gap-0.5 rounded-[18px] border border-white/80 bg-white/80 py-2.5 shadow-xs backdrop-blur-md transition-all hover:border-brand-light/40 active:scale-95"
                  >
                    <div className="h-7 w-7" dangerouslySetInnerHTML={{ __html: sanitizeSvgHtml(tierIconSVG(currentTier.key)) }} />
                    <div className="font-body text-[10.5px] font-extrabold text-brand-light">
                      {lang === 'en' ? currentTier.en : currentTier.bn}
                    </div>
                    <div className="font-body text-[8.5px] font-semibold text-muted">{t('মেম্বারশিপ')}</div>
                  </div>
                </div>

                {/* ৩. ভাষা পরিবর্তন উইজেট */}
                <div className="rounded-[20px] border border-white/80 bg-white/80 p-4 shadow-xs backdrop-blur-md">
                  <div className="font-body text-[13px] font-bold text-ink">{t('ভাষা')}</div>
                  <div className="mt-0.5 font-body text-[11px] text-muted">{t('ওয়েবসাইটের ভাষা পরিবর্তন করুন')}</div>
                  <div className="mt-2.5 flex gap-2">
                    <button
                      onClick={() => setLanguage('bn' as Language)}
                      className={`flex-1 rounded-full border py-2 font-body text-[12.5px] font-bold transition-all duration-brand ${
                        lang === 'bn'
                          ? 'border-brand-light bg-brand-bg/40 text-brand-light shadow-xs'
                          : 'border-border-base bg-white/60 text-muted hover:bg-surface-muted'
                      }`}
                    >
                      {t('বাংলা')}
                    </button>
                    <button
                      onClick={() => setLanguage('en' as Language)}
                      className={`flex-1 rounded-full border py-2 font-body text-[12.5px] font-bold transition-all duration-brand ${
                        lang === 'en'
                          ? 'border-brand-light bg-brand-bg/40 text-brand-light shadow-xs'
                          : 'border-border-base bg-white/60 text-muted hover:bg-surface-muted'
                      }`}
                    >
                      English
                    </button>
                  </div>
                </div>

                {/* ৪. অসম্পূর্ণ ড্রাফট কার্ড (Draft Orders) */}
                {drafts.length > 0 && (
                  <div className="rounded-[20px] border border-white/80 bg-white/80 p-4 shadow-xs backdrop-blur-md">
                    <div className="mb-3 flex items-center justify-between">
                      <div className="font-body text-[13px] font-bold text-ink">🛒 {t('অর্ডার করতে চেয়েছিলেন')}</div>
                      <button
                        onClick={handleClearAllDrafts}
                        className="font-body text-[11px] font-semibold text-muted hover:text-red-500"
                      >
                        🗑️ {t('সব মুছুন')}
                      </button>
                    </div>
                    <div className="flex flex-col gap-2.5">
                      {drafts.map((draft) => {
                        const items = Array.isArray(draft.items) ? draft.items : [];
                        const firstItem = items[0] || null;
                        const d = new Date(draft.createdAt);
                        const dateStr = d.toLocaleDateString(lang === 'en' ? 'en-US' : 'bn-BD', {
                          year: 'numeric', month: 'short', day: 'numeric',
                        });
                        const prodName = firstItem ? firstItem.name : t('প্রোডাক্ট');
                        const tot = items.reduce((s, i) => s + (i.price || 0) * (i.qty || 1), 0);

                        return (
                          <div key={draft.id} className="rounded-[14px] border border-border-base bg-white/90 p-3 shadow-xs">
                            <div className="font-body text-[10.5px] text-muted">
                              📅 {dateStr} · {items.length} {t('আইটেম')}
                            </div>
                            <div className="mt-1.5 flex items-center gap-2.5">
                              {firstItem ? <ItemThumb imgVal={(firstItem.imgs || ['📦'])[0]} /> : <ItemThumb />}
                              <div className="min-w-0 flex-1 truncate font-body text-xs font-bold text-ink">
                                {prodName}
                              </div>
                              <div className="whitespace-nowrap font-body text-xs font-extrabold text-brand-light">
                                ৳{tot.toLocaleString('en-US')}
                              </div>
                            </div>
                            <div className="mt-2.5 flex gap-2">
                              <button
                                onClick={() => handleDeleteDraft(draft.id, draft._sbId)}
                                className="flex-1 rounded-full border border-border-base py-1.5 font-body text-[11px] font-semibold text-muted hover:bg-surface-muted"
                              >
                                {t('সরান')}
                              </button>
                              <button
                                onClick={() => continueFromDraft(draft)}
                                className="flex-1 rounded-full bg-gradient-to-r from-info to-brand-light py-1.5 font-body text-[11px] font-bold text-white shadow-xs hover:brightness-105 active:scale-95"
                              >
                                {t('চালিয়ে যান')} →
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ৫. স্টক নোটিফিকেশন অ্যালার্ট */}
                {stockNotifs.length > 0 && (
                  <div className="rounded-[20px] border border-white/80 bg-white/80 p-4 shadow-xs backdrop-blur-md">
                    <div className="mb-3 flex items-center justify-between">
                      <div className="font-body text-[13px] font-bold text-ink">🔔 {t('স্টকে আসলে জানানো')}</div>
                      <button
                        onClick={handleClearStockNotifs}
                        className="font-body text-[11px] font-semibold text-muted hover:text-red-500"
                      >
                        {t('সব মুছুন')}
                      </button>
                    </div>
                    <div className="flex flex-col gap-2">
                      {stockNotifs.map((item) => (
                        <div
                          key={item.key}
                          className="flex items-center gap-2.5 rounded-[14px] border border-border-base bg-white/90 px-3 py-2 shadow-xs"
                        >
                          <div className="shrink-0 text-lg">📦</div>
                          <div className="min-w-0 flex-1">
                            <div className="truncate font-body text-xs font-bold text-ink">
                              {item.prodName || t('প্রোডাক্ট')}
                            </div>
                            <div className="font-body text-[10.5px] font-semibold text-amber-600">
                              {t('স্টক নেই')}
                            </div>
                          </div>
                          <div className="flex shrink-0 items-center gap-1.5">
                            <button
                              onClick={() => viewNotifiedProduct(item)}
                              className="rounded-full bg-brand-light px-3 py-1 font-body text-[11px] font-bold text-white shadow-xs hover:bg-brand-light-hover"
                            >
                              {t('দেখুন')}
                            </button>
                            <button
                              onClick={() => handleRemoveStockNotif(item.key)}
                              className="flex h-6 w-6 items-center justify-center rounded-full text-muted hover:bg-surface-muted hover:text-ink"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>

              {/* ডান কলাম: আমার অর্ডার সমূহ */}
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <span className="font-body text-[16px] font-extrabold text-ink">
                    📦 {t('আমার অর্ডার সমূহ')}
                  </span>
                  {orders.length > 0 && (
                    <Link
                      href="/account/orders"
                      className="font-body text-[12.5px] font-bold text-brand-light hover:underline"
                    >
                      {t('সব দেখুন →')}
                    </Link>
                  )}
                </div>

                <div className="rounded-[24px] border border-white/80 bg-white/80 p-5 shadow-xs backdrop-blur-md">
                  {loadingOrders ? (
                    <div className="py-12 text-center font-body text-sm text-muted">
                      <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-brand-light/30 border-t-brand-light" />
                      {t('লোড হচ্ছে...')}
                    </div>
                  ) : orders.length === 0 ? (
                    <div className="py-12 text-center">
                      <div className="mx-auto mb-3 text-[42px]">📦</div>
                      <div className="mb-1 font-body text-sm font-bold text-ink">{t('এখনো কোনো অর্ডার নেই')}</div>
                      <div className="mb-5 font-body text-xs text-muted">{t('অর্ডার করলে এখানে দেখাবে')}</div>
                      <Link
                        href="/"
                        className="inline-block rounded-full bg-gradient-to-r from-info to-brand-light px-6 py-2.5 font-body text-xs font-bold text-white shadow-sh1 transition-all hover:brightness-105 active:scale-95"
                      >
                        {t('কেনাকাটা শুরু করুন')} →
                      </Link>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4">
                      {orders.slice(0, 5).map((o) => (
                        <OrderCard key={o.id} order={o} onInvoice={openInvoice} />
                      ))}
                    </div>
                  )}
                </div>
              </div>

            </div>
          </>
        )}
      </main>

      <Footer />

      {/* লগআউট কনফার্মেশন মোডাল */}
      {showLogoutConfirm && (
        <div
          className="fixed inset-0 z-[1200] flex items-center justify-center bg-ink/55 p-4 backdrop-blur-[3px] animate-section-reveal"
          onClick={(e) => { if (e.target === e.currentTarget) setShowLogoutConfirm(false); }}
        >
          <div className="w-full max-w-[340px] rounded-[24px] bg-white p-6 text-center shadow-sh3">
            <div className="mb-2.5 text-[38px]">👋</div>
            <div className="mb-4 font-body text-[14px] font-bold text-ink">
              {t('আপনি কি নিশ্চিতভাবে লগআউট করতে চান?')}
            </div>
            <div className="flex gap-2.5">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 rounded-full border border-border-base py-2.5 font-body text-[13px] font-semibold text-ink hover:bg-surface-muted"
              >
                {t('না')}
              </button>
              <button
                onClick={doLogout}
                className="flex-1 rounded-full bg-brand-light py-2.5 font-body text-[13px] font-bold text-white shadow-xs hover:bg-brand-light-hover active:scale-95"
              >
                {t('লগআউট')}
              </button>
            </div>
          </div>
        </div>
      )}

      <LoginModal isOpen={loginOpen} onClose={() => setLoginOpen(false)} />
    </div>
  );
    }
