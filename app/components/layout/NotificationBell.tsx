'use client';

import {
  useCallback, useEffect, useLayoutEffect, useRef, useState,
} from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'motion/react';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/lib/store/authStore';
import { lockBody, unlockBody } from '@/lib/bodyScrollLock';
import { useT } from '@/lib/i18n/useT';
import { OPEN_COMPLETE_PROFILE_EVENT, PROFILE_UPDATED_EVENT } from '@/lib/uiEvents';
import {
  fetchLiveOfferNotification,
  fetchStockBackNotifications,
  buildDraftOrderNotifications,
  buildReviewRequestNotifications,
  buildTierUpgradeNotification,
  buildSecretCodeNotifications,
  buildProfileNotifications,
  parseDraftIdFromNotificationId,
  type NotificationItem,
} from '@/lib/notificationsData';
import {
  reconcileNotifications,
  markNotificationsRead,
  dismissNotificationForever,
  type ReconciledNotification,
} from '@/lib/notificationStore';
import { fetchMyOrders, fetchDrafts, orderStats } from '@/lib/accountData';
import { fetchMyProfile } from '@/lib/profileData';
import type { DraftOrder } from '@/types';

function IconBell({ className = '' }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function IconOfferTag({ className = '' }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
      <line x1="7" y1="7" x2="7.01" y2="7" />
    </svg>
  );
}

function IconStockBox({ className = '' }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  );
}

function IconDraftEdit({ className = '' }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function IconStar({ className = '' }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <path d="M12 2l2.9 6.26 6.9.6-5.2 4.6 1.6 6.74L12 16.9l-6.2 3.3 1.6-6.74-5.2-4.6 6.9-.6L12 2z" />
    </svg>
  );
}

function IconCrown({ className = '' }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 8l4 4 5-7 5 7 4-4-2 11H5L3 8z" />
    </svg>
  );
}

function IconTicket({ className = '' }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4V8z" />
      <line x1="12" y1="6" x2="12" y2="18" strokeDasharray="2 2" />
    </svg>
  );
}

function IconUserAlert({ className = '' }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <line x1="19" y1="8" x2="19" y2="12" />
      <line x1="19" y1="16" x2="19.01" y2="16" />
    </svg>
  );
}

function IconShieldCheck({ className = '' }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <polyline points="9 12 11 14 15 10" />
    </svg>
  );
}

function IconX({ className = '' }: { className?: string }) {
  return (
    <svg className={className} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}

function iconForType(type: NotificationItem['type']) {
  if (type === 'offer') return <IconOfferTag className="h-4 w-4" />;
  if (type === 'stock') return <IconStockBox className="h-4 w-4" />;
  if (type === 'draft') return <IconDraftEdit className="h-4 w-4" />;
  if (type === 'review') return <IconStar className="h-4 w-4" />;
  if (type === 'tier') return <IconCrown className="h-4 w-4" />;
  if (type === 'profile-incomplete') return <IconUserAlert className="h-4 w-4" />;
  if (type === 'profile-verified') return <IconShieldCheck className="h-4 w-4" />;
  return <IconTicket className="h-4 w-4" />;
}

function tileColorForType(type: NotificationItem['type']) {
  if (type === 'offer') return 'bg-red-50 text-red-500';
  if (type === 'stock') return 'bg-emerald-50 text-emerald-600';
  if (type === 'draft') return 'bg-amber-50 text-amber-600';
  if (type === 'review') return 'bg-yellow-50 text-yellow-500';
  if (type === 'tier') return 'bg-purple-50 text-purple-600';
  if (type === 'profile-incomplete') return 'bg-amber-50 text-amber-600';
  if (type === 'profile-verified') return 'bg-emerald-50 text-emerald-600';
  return 'bg-blue-50 text-blue-600';
}

interface PanelPos {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
}

const NAV_GAP = 10; // navbar আর নোটিফিকেশন প্যানেলের মাঝে স্ট্যান্ডার্ড গ্যাপ (px)
const DESKTOP_PANEL_WIDTH = 360;
const SIDE_MARGIN = 12;

// পজিশন হিসাব করার effect-টা পেইন্টের আগেই চালানো দরকার (নাহলে প্রথম ফ্রেমে
// প্যানেল ভুল জায়গায় দেখা যাবে, তারপর "লাফ" দিয়ে ঠিক জায়গায় যাবে)। সার্ভারে
// window না থাকায় সাধারণ useEffect-এ fallback করা হচ্ছে।
const useIsoLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

export default function NotificationBell({ className = '' }: { className?: string }) {
  const { lang } = useT();
  const router = useRouter();
  const currentUser = useAuthStore((s) => s.currentUser);
  const storeUserId = currentUser?.id || 'guest';
  const supabase = useRef(createClient()).current;

  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [items, setItems] = useState<ReconciledNotification[]>([]);
  const [hasUnread, setHasUnread] = useState(false);
  const [pos, setPos] = useState<PanelPos | null>(null);

  const wrapRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const draftsRef = useRef<DraftOrder[]>([]);

  useEffect(() => setMounted(true), []);

  const loadNotifications = useCallback(async () => {
    const [offer, stock, orders, drafts, profile] = await Promise.all([
      fetchLiveOfferNotification(supabase, lang),
      fetchStockBackNotifications(supabase, lang),
      currentUser ? fetchMyOrders(supabase, currentUser) : Promise.resolve([]),
      currentUser ? fetchDrafts(supabase, currentUser) : Promise.resolve([]),
      currentUser?.id ? fetchMyProfile(supabase, currentUser.id) : Promise.resolve(null),
    ]);
    draftsRef.current = drafts;

    const draftNotifs = buildDraftOrderNotifications(drafts, lang);
    const reviewNotifs = buildReviewRequestNotifications(orders, lang);
    const tierNotif = buildTierUpgradeNotification(orderStats(orders).completed, lang);
    const codeNotifs = buildSecretCodeNotifications(lang);
    const profileNotifs = buildProfileNotifications(profile, lang);

    const candidates: NotificationItem[] = [
      ...(offer ? [offer] : []),
      ...profileNotifs,
      ...(tierNotif ? [tierNotif] : []),
      ...stock,
      ...draftNotifs,
      ...reviewNotifs,
      ...codeNotifs,
    ];

    const merged = reconcileNotifications(storeUserId, candidates);
    setItems(merged);
    setHasUnread(merged.some((i) => i.readAt == null));
  }, [supabase, lang, currentUser, storeUserId]);

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 60000);
    return () => clearInterval(interval);
  }, [loadNotifications]);

  // প্রোফাইল সেভ হওয়ার সাথে সাথেই (৬০ সেকেন্ড অপেক্ষা না করে) তালিকা রিফ্রেশ
  useEffect(() => {
    window.addEventListener(PROFILE_UPDATED_EVENT, loadNotifications);
    return () => window.removeEventListener(PROFILE_UPDATED_EVENT, loadNotifications);
  }, [loadNotifications]);

  const computePosition = useCallback(() => {
    if (!wrapRef.current) return;
    const btnRect = wrapRef.current.getBoundingClientRect();
    const navEl = wrapRef.current.closest('.navbar-glass') as HTMLElement | null;
    const anchorRect = navEl ? navEl.getBoundingClientRect() : btnRect;
    const isMobile = window.innerWidth < 640;
    const viewportH = window.innerHeight;
    const viewportW = window.innerWidth;

    let left: number;
    let width: number;
    if (isMobile) {
      left = Math.max(SIDE_MARGIN, anchorRect.left);
      width = Math.min(anchorRect.width, viewportW - SIDE_MARGIN * 2);
    } else {
      width = DESKTOP_PANEL_WIDTH;
      left = Math.min(Math.max(SIDE_MARGIN, anchorRect.right - width), viewportW - width - SIDE_MARGIN);
    }
    const top = anchorRect.bottom + NAV_GAP;
    const maxHeight = Math.max(180, viewportH - top - SIDE_MARGIN);

    setPos({ top, left, width, maxHeight });
  }, []);

  useIsoLayoutEffect(() => {
    if (!open) return undefined;
    computePosition();
    const onResize = () => computePosition();
    window.addEventListener('resize', onResize);
    window.addEventListener('scroll', onResize, true);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('scroll', onResize, true);
    };
  }, [open, computePosition]);

  useEffect(() => {
    if (!open) return undefined;
    function handleOutside(e: MouseEvent) {
      const target = e.target as Node;
      const insideButton = wrapRef.current?.contains(target);
      const insidePanel = panelRef.current?.contains(target);
      if (!insideButton && !insidePanel) setOpen(false);
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [open]);

  useEffect(() => {
    if (open) lockBody(); else unlockBody();
    return () => unlockBody();
  }, [open]);

  const handleToggle = () => {
    const next = !open;
    setOpen(next);
    if (next) {
      const unreadIds = items.filter((i) => i.readAt == null).map((i) => i.id);
      if (unreadIds.length) {
        markNotificationsRead(storeUserId, unreadIds);
        const now = Date.now();
        setItems((prev) => prev.map((i) => (i.readAt == null ? { ...i, readAt: now } : i)));
      }
      setHasUnread(false);
    }
  };

  const continueDraftFromNotification = (draft: DraftOrder) => {
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
      // best effort
    }
    router.push('/checkout');
  };

  const handleItemClick = (item: ReconciledNotification) => (e: React.MouseEvent) => {
    if (item.type === 'draft') {
      e.preventDefault();
      setOpen(false);
      const draftId = parseDraftIdFromNotificationId(item.id);
      const draft = draftId ? draftsRef.current.find((d) => d.id === draftId) : null;
      if (draft) continueDraftFromNotification(draft);
      else router.push('/account');
      return;
    }
    if (item.type === 'profile-incomplete') {
      e.preventDefault();
      setOpen(false);
      window.dispatchEvent(new CustomEvent(OPEN_COMPLETE_PROFILE_EVENT));
      return;
    }
    setOpen(false);
  };

  const handleDismiss = (item: ReconciledNotification) => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dismissNotificationForever(storeUserId, item.id);
    setItems((prev) => prev.filter((i) => i.id !== item.id));
  };

  const panelContent = (
    <>
      {/* মোবাইলে হালকা ব্যাকড্রপ, ডেস্কটপে শুধু ড্রপডাউন */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[950] bg-ink/40 backdrop-blur-[2px] sm:hidden"
        onClick={() => setOpen(false)}
      />
      <motion.div
        ref={panelRef}
        initial={{ opacity: 0, y: -8, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -8, scale: 0.97 }}
        transition={{ type: 'spring', bounce: 0, duration: 0.25 }}
        style={pos ? {
          position: 'fixed',
          top: pos.top,
          left: pos.left,
          width: pos.width,
          maxHeight: pos.maxHeight,
        } : { position: 'fixed', top: -9999, left: -9999 }}
        className="z-[960] overflow-hidden rounded-[24px] border border-white/70 bg-white/95 shadow-sh3 backdrop-blur-md sm:rounded-[20px]"
      >
        <div className="flex items-center justify-between border-b border-border-base/70 px-4 py-3">
          <span className="font-body text-[14px] font-extrabold text-ink">
            {lang === 'en' ? 'Notifications' : 'নোটিফিকেশন'}
          </span>
          <motion.button
            onClick={() => setOpen(false)}
            whileTap={{ scale: 0.92 }}
            transition={{ type: 'spring', stiffness: 480, damping: 28 }}
            className="flex h-7 w-7 items-center justify-center rounded-full text-muted hover:bg-surface-muted hover:text-ink"
            aria-label="close"
          >
            <IconX />
          </motion.button>
        </div>

        <div className="overflow-y-auto" style={{ maxHeight: pos ? pos.maxHeight - 52 : undefined }}>
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 px-4 py-10 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-muted text-muted">
                <IconBell className="h-5 w-5" />
              </span>
              <p className="font-body text-[12.5px] text-muted">
                {lang === 'en' ? 'No notifications right now' : 'এই মুহূর্তে কোনো নোটিফিকেশন নেই'}
              </p>
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-border-base/60">
              {items.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={handleItemClick(item)}
                  className="group relative flex items-center gap-3 px-4 py-3 pr-10 transition-colors hover:bg-surface-muted/70"
                >
                  {item.readAt == null && (
                    <span className="absolute left-1.5 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-red-500" />
                  )}
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${tileColorForType(item.type)}`}>
                    {iconForType(item.type)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-body text-[13px] font-bold text-ink">{item.title}</p>
                    {item.subtitle && (
                      <p className="truncate font-body text-[11.5px] text-muted">{item.subtitle}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleDismiss(item)}
                    aria-label={lang === 'en' ? 'Delete notification' : 'নোটিফিকেশন ডিলিট করুন'}
                    className="absolute right-2.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-muted opacity-70 transition-colors hover:bg-red-50 hover:text-red-500 hover:opacity-100"
                  >
                    <IconX className="h-3 w-3" />
                  </button>
                </Link>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </>
  );

  return (
    <div className={`relative ${className}`} ref={wrapRef}>
      <motion.button
        whileTap={{ scale: 0.88 }}
        transition={{ type: 'spring', stiffness: 500, damping: 24 }}
        onClick={handleToggle}
        title={lang === 'en' ? 'Notifications' : 'নোটিফিকেশন'}
        className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-[9px] text-ink transition-colors hover:bg-surface-muted hover:text-brand-light"
      >
        <IconBell />
        {hasUnread && (
          <span className="absolute right-[6px] top-[6px] h-2 w-2 rounded-full bg-red-500 ring-2 ring-white animate-badge-hot-glow" />
        )}
      </motion.button>

      {mounted && createPortal(
        <AnimatePresence>{open && panelContent}</AnimatePresence>,
        document.body,
      )}
    </div>
  );
}
