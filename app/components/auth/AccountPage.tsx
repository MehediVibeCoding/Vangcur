'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { lockBody, unlockBody } from '@/lib/bodyScrollLock';
import { showToast } from '@/lib/toast';
import { sanitizeSvgHtml } from '@/lib/sanitize';
import { sanitizePlainName, validateName, MAX_NAME_LEN } from '@/lib/security';
import { checkNameChangeLimit } from '@/lib/rateLimit';
import { productHref, WISHLIST_EVENT } from '@/lib/productData';
import { saveCurrentUser, logout, getLinkedAccounts, switchToAccount } from '@/lib/authData';
import {
  OPEN_MEMBERSHIP_EVENT, GENERATE_INVOICE_EVENT, OPEN_CART_EVENT, OPEN_WISHLIST_EVENT, OPEN_TRACK_ORDER_EVENT,
} from '@/lib/uiEvents';
import {
  computeCelestialState, fetchIsRaining, formatLiveTimeDate, getGreeting,
  fetchMyOrders, orderStats, updateProfileName,
  getStockNotifications, removeStockNotification, clearAllStockNotifications,
  fetchDrafts, deleteDraft, deleteAllDrafts,
} from '@/lib/accountData';
import { getTier, tierIconSVG, crownSVG } from '@/lib/membershipData';
import type { CurrentUser, Order, DraftOrder, StockNotification, OrderStatus } from '@/types';

const STATUS_CLASS: Record<OrderStatus, string> = {
  pending: 'bg-[#FEF3C7] text-[#92400E]',
  confirmed: 'bg-[#D1FAE5] text-[#065F46]',
  shipped: 'bg-[#D1FAE5] text-[#065F46]',
  delivered: 'bg-[#DBEAFE] text-[#1E40AF]',
  cancelled: 'bg-[#FEE2E2] text-[#991B1B]',
  rejected: 'bg-[#FEE2E2] text-[#991B1B]',
};
const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: '⏳ Pending', confirmed: 'Confirmed', shipped: '🚚 Shipped',
  delivered: '📦 Delivered', cancelled: 'Cancelled', rejected: 'Cancelled',
};

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
        src={imgVal} alt="" className="h-9 w-9 shrink-0 rounded-[7px] border border-border-base object-cover"
        loading="lazy" decoding="async"
        onError={(e) => { e.currentTarget.style.display = 'none'; }}
      />
    );
  }
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[7px] bg-surface-muted text-xl">
      {imgVal || '📦'}
    </span>
  );
}

interface AccountPageProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: CurrentUser | null;
  onAddAccount?: () => void;
}

export default function AccountPage({ isOpen, onClose, currentUser, onAddAccount }: AccountPageProps) {
  const supabase = useRef(createClient()).current;
  const [now, setNow] = useState(() => new Date());
  const [isRaining, setIsRaining] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const [cardWidth, setCardWidth] = useState(300);

  const [nameEditOpen, setNameEditOpen] = useState(false);
  const [nameEditValue, setNameEditValue] = useState('');
  const [nameEditErr, setNameEditErr] = useState('');

  const [switchPanelOpen, setSwitchPanelOpen] = useState(false);
  const [linkedAccounts, setLinkedAccounts] = useState(getLinkedAccounts());
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const [orders, setOrders] = useState<Order[]>([]);
  const [stockNotifs, setStockNotifs] = useState<StockNotification[]>([]);
  const [drafts, setDrafts] = useState<DraftOrder[]>([]);

  const router = useRouter();

  useEffect(() => {
    if (isOpen) lockBody();
    else unlockBody();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !cardRef.current) return undefined;
    const measure = () => setCardWidth(cardRef.current?.clientWidth || 300);
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    fetchIsRaining(supabase, currentUser).then(setIsRaining);
  }, [isOpen, currentUser, supabase]);

  useEffect(() => {
    if (!isOpen || !currentUser) return;
    setNameEditOpen(false);
    setSwitchPanelOpen(false);
    setStockNotifs(getStockNotifications());
    fetchMyOrders(supabase, currentUser).then(setOrders);
    fetchDrafts(supabase, currentUser).then(setDrafts);
  }, [isOpen, currentUser, supabase]);

  const celestial = useMemo(
    () => computeCelestialState(now.getHours() + now.getMinutes() / 60, isRaining, cardWidth),
    [now, isRaining, cardWidth]
  );
  const stats = useMemo(() => orderStats(orders), [orders]);

  if (!currentUser) return null;

  const initials = (currentUser.name || '?').split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
  const createdStr = currentUser.createdAt
    ? new Date(currentUser.createdAt).toLocaleDateString('bn-BD', { year: 'numeric', month: 'long', day: 'numeric' })
    : '';

  const openNameEdit = () => { setNameEditValue(sanitizePlainName(currentUser.name || '')); setNameEditErr(''); setNameEditOpen(true); };
  const closeNameEdit = () => { setNameEditOpen(false); setNameEditErr(''); };
  const saveNameEdit = async () => {
    const nm = nameEditValue.trim();
    if (!validateName(nm)) { setNameEditErr('অন্তত ২ ও সর্বোচ্চ ৩০ অক্ষরের প্লেন নাম দিন (কোনো চিহ্ন/ইমোজি ছাড়া)'); return; }
    if (currentUser.id) {
      const limit = await checkNameChangeLimit(supabase, currentUser.id);
      if (!limit.allowed) { setNameEditErr('আপনি দৈনিক ৩ বার নাম পরিবর্তনের লিমিটে পৌঁছে গেছেন। আগামীকাল আবার চেষ্টা করুন।'); return; }
    }
    await updateProfileName(supabase, currentUser, nm);
    saveCurrentUser({ ...currentUser, name: nm });
    closeNameEdit();
    showToast('নাম পরিবর্তন হয়েছে');
  };

  const toggleSwitchPanel = () => {
    setSwitchPanelOpen((v) => {
      const next = !v;
      if (next) setLinkedAccounts(getLinkedAccounts().filter((a) => a.email !== currentUser.email));
      return next;
    });
  };
  const handleSwitchToAccount = async (email: string) => {
    showToast('⏳ সুইচ হচ্ছে...');
    const result = await switchToAccount(supabase, email);
    if (result.error) {
      showToast(result.error === 'expired' ? 'সেশন মেয়াদ শেষ, আবার লগইন করুন' : 'সুইচ করতে সমস্যা হয়েছে');
      return;
    }
    setSwitchPanelOpen(false);
    showToast('অ্যাকাউন্ট পরিবর্তন হয়েছে');
  };

  const doLogout = async () => {
    setShowLogoutConfirm(false);
    await logout(supabase);
    try {
      localStorage.removeItem('vc_wish');
    } catch {
      // storage unavailable — wishlist clear event below still fires
    }
    window.dispatchEvent(new CustomEvent(WISHLIST_EVENT, { detail: { wishlist: [] } }));
    onClose();
    showToast('লগআউট হয়েছে');
  };

  const handleRemoveStockNotif = (key: string) => {
    removeStockNotification(key);
    setStockNotifs((prev) => prev.filter((i) => i.key !== key));
  };
  const handleClearStockNotifs = () => { clearAllStockNotifications(); setStockNotifs([]); };
  const viewNotifiedProduct = (item: StockNotification) => {
    onClose();
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
        name: draft.name || '', phone: draft.phone || '', dist: draft.dist || '',
        addr: draft.addr || '', email: draft.email || '',
      }));
      if (draft.ship) sessionStorage.setItem('vc_ship', draft.ship);
    } catch {
      // sessionStorage full/blocked — checkout still opens, just without prefilled fields
    }
    onClose();
    router.push('/checkout');
  };

  const openInvoice = (orderId: string | number) => window.dispatchEvent(new CustomEvent(GENERATE_INVOICE_EVENT, { detail: { orderId, ctx: 'acc' } }));
  const currentTier = getTier(stats.completed);
  const openMembership = () => window.dispatchEvent(new CustomEvent(OPEN_MEMBERSHIP_EVENT, { detail: { completedCount: stats.completed } }));

  return (
    <div
      className={`fixed inset-0 z-[950] overflow-y-auto bg-gradient-to-b from-brand-bg via-[#DCEBFD] to-white transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
    >
      <div className="sticky top-[14px] z-10 mx-3 mb-1.5 mt-[14px] flex items-center gap-1.5 overflow-hidden rounded-[35px] border border-white/60 bg-white/70 px-3 py-2 shadow-sh2 backdrop-blur-md md:gap-2 md:px-4">
        <button
          onClick={() => { onClose(); router.push('/'); }} aria-label="হোম" title="হোম"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink transition-brand duration-brand hover:bg-surface-muted"
        >
          <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <path d="M3 9.5 12 3l9 6.5" /><path d="M5 9.5V20a1 1 0 001 1h4v-6h4v6h4a1 1 0 001-1V9.5" />
          </svg>
        </button>

        <div className="flex flex-1 items-center justify-end gap-0.5 overflow-x-auto md:gap-1.5">
          <button
            onClick={() => window.dispatchEvent(new CustomEvent(OPEN_CART_EVENT))} title="কার্ট"
            className="flex shrink-0 items-center gap-1.5 rounded-full px-2 py-2 text-ink transition-brand duration-brand hover:bg-surface-muted md:px-2.5"
          >
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" />
            </svg>
            <span className="hidden font-body text-[12.5px] font-semibold sm:inline">কার্ট</span>
          </button>

          <button
            onClick={() => window.dispatchEvent(new CustomEvent(OPEN_WISHLIST_EVENT))} title="উইশলিস্ট"
            className="flex shrink-0 items-center gap-1.5 rounded-full px-2 py-2 text-ink transition-brand duration-brand hover:bg-surface-muted md:px-2.5"
          >
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
            </svg>
            <span className="hidden font-body text-[12.5px] font-semibold sm:inline">উইশলিস্ট</span>
          </button>

          <button
            onClick={() => window.dispatchEvent(new CustomEvent(OPEN_TRACK_ORDER_EVENT))} title="ট্র্যাক"
            className="flex shrink-0 items-center gap-1.5 rounded-full px-2 py-2 text-ink transition-brand duration-brand hover:bg-surface-muted md:px-2.5"
          >
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <path d="M9 17H7A5 5 0 017 7h2" /><path d="M15 7h2a5 5 0 010 10h-2" />
              <line x1="8" y1="12" x2="16" y2="12" />
            </svg>
            <span className="hidden font-body text-[12.5px] font-semibold sm:inline">ট্র্যাক</span>
          </button>

          <button
            onClick={openMembership} title="মেম্বারশিপ"
            className="flex shrink-0 items-center gap-1.5 rounded-full px-2 py-2 text-ink transition-brand duration-brand hover:bg-surface-muted md:px-2.5"
          >
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <path d="M4 22V4a1 1 0 011-1h11.38a1 1 0 01.8 1.6l-2.9 3.87a1 1 0 000 1.2l2.9 3.86a1 1 0 01-.8 1.6H5" />
            </svg>
            <span className="hidden font-body text-[12.5px] font-semibold sm:inline">মেম্বারশিপ</span>
          </button>

          <button
            onClick={() => { onClose(); router.push('/'); }}
            className="ml-1 shrink-0 whitespace-nowrap rounded-full bg-brand-light px-3 py-2 font-body text-[12.5px] font-bold text-white shadow-sh1 transition-brand duration-brand hover:bg-brand-light-hover md:px-4"
          >
            ব্যাক টু হোম
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-[1100px] px-4 pb-16 pt-2 md:px-6">
        <div className="mb-6 text-center">
          <h1 className="font-display text-2xl font-bold text-ink md:text-[28px]">Welcome To Your Profile</h1>
          <div className="mt-1 font-body text-sm text-muted">{getGreeting(currentUser, now)}</div>
          <div className="mt-0.5 font-body text-xs text-muted">{formatLiveTimeDate(now)}</div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[340px_1fr]">
          {/* COLUMN 1: SIDEBAR */}
          <div className="flex flex-col gap-4">
            <div
              ref={cardRef}
              className={`relative overflow-hidden rounded-brand p-4 shadow-sh2 ${STATE_BG[celestial.state] || STATE_BG.noon}`}
              style={{ minHeight: 236 }}
            >
              <svg className="pointer-events-none absolute inset-0 h-16 w-full opacity-80" viewBox="0 0 400 65" preserveAspectRatio="none">
                {['10%', '20%', '35%', '50%', '65%', '80%', '92%', '15%', '45%', '75%'].map((left, i) => (
                  <circle
                    key={i} cx={left} cy={`${10 + (i % 4) * 4}`} r={i % 2 === 0 ? 1 : 1.5} fill="#fff"
                    style={{ animation: `twinkling ${1.5 + (i % 3) * 0.5}s infinite ${(i % 5) * 0.2}s`, opacity: celestial.state === 'night' ? undefined : 0 }}
                  />
                ))}
              </svg>

              {['0%', '35%', '68%'].map((left, i) => (
                <div
                  key={i}
                  className="absolute top-2 h-4 w-10 rounded-full bg-white/70"
                  style={{ left, animation: `cloudDrift ${12 + i * 6}s linear infinite ${-i * 4}s`, opacity: celestial.state === 'rain' || celestial.state === 'night' ? 0.15 : 0.6 }}
                />
              ))}

              {isRaining && (
                <div className="pointer-events-none absolute inset-0 overflow-hidden">
                  {['10%', '20%', '35%', '50%', '65%', '80%', '92%', '15%', '45%', '75%'].map((left, i) => (
                    <div
                      key={i} className="absolute top-0 h-3 w-px bg-white/50"
                      style={{ left, animationDelay: `${(i % 6) * 0.1 + 0.1}s`, animationDuration: `${0.6 + (i % 3) * 0.1}s`, animation: `rainDropFall ${0.6 + (i % 3) * 0.1}s linear infinite ${(i % 6) * 0.1 + 0.1}s` }}
                    />
                  ))}
                </div>
              )}

              {isRaining && (
                <>
                  <div className="pointer-events-none absolute inset-0 bg-white" style={{ animation: 'lightningFlash 7s ease-in-out infinite' }} />
                  <svg
                    className="pointer-events-none absolute right-[18%] top-1 h-12 w-4"
                    viewBox="0 0 30 90" preserveAspectRatio="none"
                    style={{ animation: 'lightningFlash 7s ease-in-out infinite' }}
                  >
                    <path d="M15,0 L3,45 L15,42 L7,90 L27,35 L15,38 Z" fill="#E0F2FE" />
                  </svg>
                </>
              )}

              {celestial.birdsVisible && (
                <>
                  <svg className="absolute left-0 top-3 h-2.5 w-3.5" viewBox="0 0 14 10" fill="none" style={{ animation: 'birdFly 10s linear infinite' }}>
                    <path d="M1 5 Q4 1 7 5 T13 5" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                  <svg className="absolute left-0 top-6 h-2 w-2.5" viewBox="0 0 14 10" fill="none" style={{ animation: 'birdFly 14s linear infinite -4s' }}>
                    <path d="M1 5 Q4 1 7 5 T13 5" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </>
              )}

              {celestial.celestial !== 'none' && (
                <div
                  className={`absolute h-6 w-6 rounded-full ${celestial.celestial === 'sun' ? 'bg-[#FDE68A] shadow-[0_0_18px_6px_rgba(253,230,138,0.6)]' : 'bg-[#E5E7EB] shadow-[0_0_14px_4px_rgba(229,231,235,0.5)]'}`}
                  style={{ left: celestial.posX, top: celestial.posY }}
                />
              )}

              <div
                className="pointer-events-none absolute bottom-0 left-0 h-16 w-full opacity-90"
                dangerouslySetInnerHTML={{ __html: sanitizeSvgHtml(celestial.sceneryHtml) }}
              />

              {celestial.state !== 'night' && celestial.state !== 'rain' && (
                <div className="pointer-events-none absolute inset-0">
                  {['15%', '35%', '55%', '75%', '90%'].map((left, i) => (
                    <div
                      key={i} className="absolute bottom-6 h-1 w-1 rounded-full bg-[#FEF08A]"
                      style={{ left, animation: `fireflyGlow ${1.8 + i * 0.15}s ease-in-out infinite ${0.1 + i * 0.2}s`, display: celestial.state === 'night' ? 'block' : 'none' }}
                    />
                  ))}
                </div>
              )}

              <svg className="pointer-events-none absolute bottom-0 left-0 h-14 w-full" viewBox="0 0 400 96" preserveAspectRatio="none">
                <path d="M0,50 Q100,18 200,36 T400,30 L400,96 L0,96 Z" fill="rgba(0,0,0,0.18)" />
                <path d="M0,66 Q120,38 240,56 T400,52 L400,96 L0,96 Z" fill="rgba(0,0,0,0.28)" />
              </svg>

              <div className="relative z-10 flex h-full min-h-[204px] flex-col justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative shrink-0">
                    {currentTier.crown && (
                      <span
                        className="pointer-events-none absolute -top-4 left-1/2 h-8 w-8 -translate-x-1/2 [filter:drop-shadow(0_1px_3px_rgba(0,0,0,0.35))]"
                        dangerouslySetInnerHTML={{ __html: sanitizeSvgHtml(crownSVG(currentTier.crown)) }}
                      />
                    )}
                    <div className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-white/25 bg-white/15 text-sm font-bold text-white backdrop-blur-sm">{initials}</div>
                  </div>
                  <div className="min-w-0 flex-1 text-white" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.65)' }}>
                    <div className="truncate font-body text-sm font-bold">{currentUser.name || '-'}</div>
                    <div className="truncate font-body text-[11.5px] text-white/75">{currentUser.email || '-'}</div>
                    {createdStr && <div className="mt-0.5 font-body text-[10.5px] text-white/60">📅 অ্যাকাউন্ট তৈরি: {createdStr}</div>}
                  </div>
                </div>

                <div>
                  <div className="flex gap-2 border-t border-white/[0.12] pt-3">
                    <button onClick={openNameEdit} className="flex flex-1 items-center justify-center gap-1 rounded-[10px] border border-white/20 bg-white/10 py-2 font-body text-[11px] font-semibold text-white backdrop-blur-sm hover:bg-white/20">✏️ এডিট</button>
                    <button onClick={toggleSwitchPanel} className="flex flex-1 items-center justify-center gap-1 rounded-[10px] border border-white/20 bg-white/10 py-2 font-body text-[11px] font-semibold text-white backdrop-blur-sm hover:bg-white/20">🔄 সুইচ</button>
                    <button onClick={() => setShowLogoutConfirm(true)} className="flex flex-1 items-center justify-center gap-1 rounded-[10px] border border-white/20 bg-white/10 py-2 font-body text-[11px] font-semibold text-white backdrop-blur-sm hover:bg-white/20">↩ লগআউট</button>
                  </div>

                  {nameEditOpen && (
                    <div className="mt-3 rounded-[12px] bg-white/10 p-3 backdrop-blur-sm">
                      <div className="mb-1.5 font-body text-[11px] font-semibold text-white/70">নতুন নাম লিখুন</div>
                      <div className="flex gap-1.5">
                        <input
                          type="text" placeholder="আপনার নাম" value={nameEditValue} maxLength={MAX_NAME_LEN}
                          onChange={(e) => setNameEditValue(sanitizePlainName(e.target.value))}
                          onKeyDown={(e) => { if (e.key === 'Enter') saveNameEdit(); }}
                          className="flex-1 rounded-[8px] border border-white/15 bg-white/10 px-3 py-2 font-body text-[13.5px] text-white outline-none placeholder:text-white/50"
                        />
                        <button onClick={saveNameEdit} className="rounded-[8px] bg-gold px-3.5 font-body text-xs font-bold text-ink">সেভ</button>
                        <button onClick={closeNameEdit} className="rounded-[8px] bg-white/15 px-2.5 font-body text-xs text-white">✕</button>
                      </div>
                      {nameEditErr && <div className="mt-1.5 font-body text-[11px] text-[#FCA5A5]">{nameEditErr}</div>}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {switchPanelOpen && (
              <div className="rounded-brand border border-border-base bg-white p-3.5 shadow-sh1">
                <div className="mb-2.5 font-body text-[13px] font-bold text-ink">অ্যাকাউন্ট পরিবর্তন করুন</div>
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2.5 rounded-[10px] bg-surface-muted p-2">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink text-[11px] font-bold text-white">{initials}</div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-body text-xs font-bold text-ink">{currentUser.name || 'Guest'}</div>
                      <div className="truncate font-body text-[10.5px] text-muted">{currentUser.email || ''}</div>
                    </div>
                    <div className="font-bold text-success">✓</div>
                  </div>
                  {linkedAccounts.map((a) => (
                    <div
                      key={a.email} onClick={() => handleSwitchToAccount(a.email)}
                      className="flex cursor-pointer items-center gap-2.5 rounded-[10px] p-2 hover:bg-surface-muted"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#6366F1] text-[11px] font-bold text-white">{a.initials || '?'}</div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-body text-xs font-bold text-ink">{a.name || ''}</div>
                        <div className="truncate font-body text-[10.5px] text-muted">{a.email || ''}</div>
                      </div>
                      <div className="font-body text-[11px] font-bold text-[#6366F1]">সুইচ</div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => { onClose(); if (onAddAccount) setTimeout(onAddAccount, 150); }}
                  className="mt-2.5 w-full rounded-[10px] border border-dashed border-border-base py-2 font-body text-xs font-semibold text-muted hover:bg-surface-muted"
                >
                  ➕ নতুন অ্যাকাউন্ট যোগ করুন
                </button>
              </div>
            )}

            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-[12px] border border-border-base bg-white py-2.5 text-center shadow-sh1">
                <div className="font-body text-base font-extrabold text-ink">{stats.total}টি</div>
                <div className="font-body text-[10px] text-muted">মোট অর্ডার</div>
              </div>
              <div className="rounded-[12px] border border-border-base bg-white py-2.5 text-center shadow-sh1">
                <div className="font-body text-base font-extrabold text-ink">{stats.running}টি</div>
                <div className="font-body text-[10px] text-muted">রানিং অর্ডার</div>
              </div>
              <div
                onClick={openMembership}
                className="flex cursor-pointer flex-col items-center justify-center gap-0.5 rounded-[12px] border border-border-base bg-white py-2 shadow-sh1"
              >
                <div className="h-7 w-7" dangerouslySetInnerHTML={{ __html: sanitizeSvgHtml(tierIconSVG(currentTier.key)) }} />
                <div className="font-body text-[10px] font-extrabold" style={{ color: currentTier.key === 'silver' ? '#475569' : currentTier.key === 'gold' ? '#92400E' : currentTier.key === 'diamond' ? '#1E40AF' : '#78350F' }}>
                  {currentTier.bn}
                </div>
                <div className="font-body text-[8.5px] text-muted">মেম্বারশিপ</div>
              </div>
            </div>

            {drafts.length > 0 && (
              <div className="rounded-brand border border-border-base bg-white p-3.5 shadow-sh1">
                <div className="mb-2.5 flex items-center justify-between">
                  <div className="font-body text-[13px] font-bold text-ink">🛒 অর্ডার করতে চেয়েছিলেন</div>
                  <button onClick={handleClearAllDrafts} className="font-body text-[11px] text-muted hover:text-ink">🗑️ সব মুছুন</button>
                </div>
                <div className="flex flex-col gap-2.5">
                  {drafts.map((draft) => {
                    const items = Array.isArray(draft.items) ? draft.items : [];
                    const firstItem = items[0] || null;
                    const d = new Date(draft.createdAt);
                    const dateStr = d.toLocaleDateString('bn-BD', { year: 'numeric', month: 'short', day: 'numeric' });
                    const timeStr = d.toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' });
                    const prodName = firstItem ? firstItem.name : 'প্রোডাক্ট';
                    const tot = items.reduce((s, i) => s + i.price * i.qty, 0);
                    return (
                      <div key={draft.id} className="rounded-[10px] border border-border-base p-2.5">
                        <div className="font-body text-[10.5px] text-muted">📅 {dateStr} · ⏰ {timeStr} · {items.length} আইটেম</div>
                        <div className="mt-1.5 flex items-center gap-2">
                          {firstItem ? <ItemThumb imgVal={(firstItem.imgs || ['📦'])[0]} /> : <ItemThumb />}
                          <div className="min-w-0 flex-1 truncate font-body text-xs font-semibold text-ink">
                            {prodName.length > 32 ? `${prodName.slice(0, 32)}...` : prodName}
                          </div>
                          <div className="whitespace-nowrap font-body text-xs font-bold text-ink">৳{tot.toLocaleString('en-US')}</div>
                        </div>
                        <div className="mt-2 flex gap-1.5">
                          <button onClick={() => handleDeleteDraft(draft.id, draft._sbId)} className="flex-1 rounded-[8px] border border-border-base py-1.5 font-body text-[11px] font-semibold text-muted hover:bg-surface-muted">🗑️ সরান</button>
                          <button onClick={() => continueFromDraft(draft)} className="flex-1 rounded-[8px] bg-brand-light py-1.5 font-body text-[11px] font-bold text-white hover:bg-brand-light-hover">⚡ চালিয়ে যান</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {stockNotifs.length > 0 && (
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <div className="font-body text-[13px] font-bold text-ink">🔔 স্টকে আসলে জানানো</div>
                  <button onClick={handleClearStockNotifs} className="font-body text-[11px] text-muted hover:text-ink">সব মুছুন</button>
                </div>
                <div className="flex flex-col gap-1.5">
                  {stockNotifs.map((item) => {
                    const dateStr = item.ts ? new Date(item.ts).toLocaleDateString('bn-BD', { month: 'short', day: 'numeric' }) : '';
                    return (
                      <div key={item.key} className="flex items-center gap-2.5 rounded-[10px] border border-border-base bg-surface-muted px-2.5 py-2">
                        <div className="shrink-0 text-xl">📦</div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate font-body text-xs font-bold text-ink">{item.prodName || 'প্রোডাক্ট'}</div>
                          <div className="font-body text-[11px] text-muted">⏳ স্টক নেই · {dateStr}</div>
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-1">
                          <button onClick={() => viewNotifiedProduct(item)} className="rounded-[7px] bg-ink px-2.5 py-1 font-body text-[11px] font-bold text-white">দেখুন</button>
                          <button onClick={() => handleRemoveStockNotif(item.key)} className="font-body text-xs text-muted hover:text-ink">✕</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* COLUMN 2: ORDERS */}
          <div>
            <div className="mb-4 font-body text-[15px] font-bold text-ink">📦 আমার অর্ডার সমূহ</div>
            <div className="flex flex-col gap-3.5">
              {orders.length === 0 ? (
                <div className="rounded-brand border border-dashed border-border-base py-9 text-center">
                  <div className="mb-2.5 text-[38px]">📦</div>
                  <div className="mb-1 font-body text-sm font-bold text-ink">এখনো কোনো অর্ডার নেই</div>
                  <div className="font-body text-xs text-muted">অর্ডার করলে এখানে দেখাবে</div>
                </div>
              ) : (
                orders.map((o) => {
                  const dateStr = new Date(o.date).toLocaleDateString('bn-BD', { year: 'numeric', month: 'short', day: 'numeric' });
                  return (
                    <div key={o.id} className="rounded-brand border border-border-base bg-white shadow-sh1">
                      <div className="flex items-center justify-between border-b border-border-base px-4 py-2.5">
                        <span className="font-body text-[13px] font-bold text-ink">{o.orderNum}</span>
                        <span className={`rounded-full px-2.5 py-1 font-body text-[11px] font-bold ${STATUS_CLASS[o.status] || STATUS_CLASS.pending}`}>{STATUS_LABEL[o.status] || STATUS_LABEL.pending}</span>
                      </div>
                      <div className="px-4 py-3">
                        <div className="mb-2.5 font-body text-[11.5px] text-muted">📅 {dateStr} &nbsp;|&nbsp; 👤 {o.customer?.name || '-'}</div>
                        <div className="flex flex-col gap-2">
                          {(o.items || []).map((i, idx) => (
                            <div key={idx} className="flex items-center gap-2.5">
                              <ItemThumb imgVal={(i.imgs || ['📦'])[0]} />
                              <div className="min-w-0 flex-1 truncate font-body text-[12.5px] text-ink">{i.name}</div>
                              <div className="whitespace-nowrap font-body text-[12.5px] font-semibold text-ink">{i.qty} × ৳{i.price.toLocaleString('en-US')}</div>
                            </div>
                          ))}
                        </div>
                        <div className="mt-3 flex items-center justify-between border-t border-border-base pt-3">
                          <div className="font-body text-[13px] font-bold text-ink">মোট: ৳{(o.total || 0).toLocaleString('en-US')} (শিপিং সহ)</div>
                          <button onClick={() => openInvoice(o.id)} className="rounded-full border border-border-base px-3 py-1.5 font-body text-[11px] font-bold text-ink hover:bg-surface-muted">📄 ইনভয়েস</button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {showLogoutConfirm && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setShowLogoutConfirm(false); }}
        >
          <div className="w-full max-w-[320px] rounded-brand bg-white p-6 text-center shadow-sh3">
            <div className="mb-2.5 text-[38px]">👋</div>
            <div className="mb-4 font-body text-sm font-semibold text-ink">আপনি কি নিশ্চিতভাবে লগআউট করতে চান?</div>
            <div className="flex gap-2.5">
              <button onClick={() => setShowLogoutConfirm(false)} className="flex-1 rounded-full border border-border-base py-2.5 font-body text-[13px] font-semibold text-ink hover:bg-surface-muted">না</button>
              <button onClick={doLogout} className="flex-1 rounded-full bg-brand-light py-2.5 font-body text-[13px] font-bold text-white hover:bg-brand-light-hover">লগআউট</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
