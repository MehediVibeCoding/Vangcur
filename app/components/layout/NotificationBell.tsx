'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'motion/react';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/lib/store/authStore';
import { lockBody, unlockBody } from '@/lib/bodyScrollLock';
import { useT } from '@/lib/i18n/useT';
import {
  fetchLiveOfferNotification,
  fetchStockBackNotifications,
  buildPendingOrderNotifications,
  buildNotifSignature,
  getNotifSeenSignature,
  setNotifSeenSignature,
  type NotificationItem,
} from '@/lib/notificationsData';
import { fetchMyOrders } from '@/lib/accountData';

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

function IconOrderClock({ className = '' }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" />
    </svg>
  );
}

function iconForType(type: NotificationItem['type']) {
  if (type === 'offer') return <IconOfferTag className="h-4 w-4" />;
  if (type === 'stock') return <IconStockBox className="h-4 w-4" />;
  return <IconOrderClock className="h-4 w-4" />;
}

function tileColorForType(type: NotificationItem['type']) {
  if (type === 'offer') return 'bg-red-50 text-red-500';
  if (type === 'stock') return 'bg-emerald-50 text-emerald-600';
  return 'bg-amber-50 text-amber-600';
}

export default function NotificationBell({ className = '' }: { className?: string }) {
  const { lang } = useT();
  const currentUser = useAuthStore((s) => s.currentUser);
  const supabase = useRef(createClient()).current;

  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [hasUnread, setHasUnread] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const loadNotifications = useCallback(async () => {
    const [offer, stock, orders] = await Promise.all([
      fetchLiveOfferNotification(supabase, lang),
      fetchStockBackNotifications(supabase, lang),
      currentUser ? fetchMyOrders(supabase, currentUser) : Promise.resolve([]),
    ]);
    const pendingOrders = buildPendingOrderNotifications(orders, lang);
    const next = [...(offer ? [offer] : []), ...stock, ...pendingOrders];
    setItems(next);
    const sig = buildNotifSignature(next);
    setHasUnread(next.length > 0 && sig !== getNotifSeenSignature());
  }, [supabase, lang, currentUser]);

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 60000);
    return () => clearInterval(interval);
  }, [loadNotifications]);

  useEffect(() => {
    if (!open) return undefined;
    function handleOutside(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
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
      setHasUnread(false);
      setNotifSeenSignature(buildNotifSignature(items));
    }
  };

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

      <AnimatePresence>
        {open && (
          <>
            {/* মোবাইলে হালকা ব্যাকড্রপ, ডেস্কটপে ড্রপডাউন হিসেবেই থাকবে */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[950] bg-ink/40 backdrop-blur-[2px] sm:hidden"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.97 }}
              transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
              className="fixed inset-x-3 bottom-3 z-[960] max-h-[70vh] overflow-hidden rounded-[24px] border border-white/70 bg-white/95 shadow-sh3 backdrop-blur-md sm:absolute sm:inset-x-auto sm:bottom-auto sm:right-0 sm:top-[calc(100%+10px)] sm:w-[360px] sm:rounded-[20px]"
            >
              <div className="flex items-center justify-between border-b border-border-base/70 px-4 py-3">
                <span className="font-body text-[14px] font-extrabold text-ink">
                  {lang === 'en' ? 'Notifications' : 'নোটিফিকেশন'}
                </span>
                <button
                  onClick={() => setOpen(false)}
                  className="flex h-7 w-7 items-center justify-center rounded-full text-muted hover:bg-surface-muted hover:text-ink sm:hidden"
                  aria-label="close"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
                </button>
              </div>

              <div className="max-h-[calc(70vh-52px)] overflow-y-auto sm:max-h-[420px]">
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
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-surface-muted/70"
                      >
                        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${tileColorForType(item.type)}`}>
                          {iconForType(item.type)}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-body text-[13px] font-bold text-ink">{item.title}</p>
                          {item.subtitle && (
                            <p className="truncate font-body text-[11.5px] text-muted">{item.subtitle}</p>
                          )}
                        </div>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-muted">
                          <path d="M9 18l6-6-6-6" />
                        </svg>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
                                 }
