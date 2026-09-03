'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'motion/react';
import { createClient } from '@/lib/supabase/client';
import { lockBody, unlockBody } from '@/lib/bodyScrollLock';
import { fetchFullOrder, readPendingOrder, readLatestGuestOrder } from '@/lib/orderStatus';
import { mapSupabaseOrderRow } from '@/lib/orderMapping';
import { useAuthStore } from '@/lib/store/authStore';
import { useT } from '@/lib/i18n/useT';
import useHistoryModal from '@/lib/useHistoryModal';
import OrderCard from '@/app/components/orders/OrderCard';
import SkeletonTransition from '@/app/components/ui/SkeletonTransition';
import { OrderListSkeleton } from '@/app/components/ui/Skeletons';
import type { Order } from '@/types';

const LoginModal = dynamic(() => import('@/app/components/auth/LoginModal'));

export interface TrackOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function ClearTrackSvgIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
    </svg>
  );
}

function ReceiptEmptySvgIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1Z" />
      <path d="M8 7h8M8 11h8M8 15h5" />
    </svg>
  );
}

function SparklesCrownSvgIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-brand-light">
      <path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14" />
    </svg>
  );
}

function SearchMagnifierIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function HeaderDecor() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden text-brand-light/[0.14]">
      <svg width="34" height="34" className="absolute -left-1 top-2 -rotate-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 13a8 8 0 0 1 16 0" />
        <rect x="3" y="13" width="4" height="6" rx="1.5" />
        <rect x="17" y="13" width="4" height="6" rx="1.5" />
      </svg>
      <svg width="26" height="26" className="absolute right-14 top-3 rotate-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <rect x="7" y="2.5" width="10" height="15" rx="3" />
        <path d="M10 5.5h4" />
        <circle cx="12" cy="20" r="1.6" />
      </svg>
    </div>
  );
}

export default function TrackOrderModal({ isOpen, onClose }: TrackOrderModalProps) {
  const { t, lang } = useT();
  const router = useRouter();
  const supabase = useRef(createClient()).current;
  const currentUser = useAuthStore((s) => s.currentUser);

  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [notFound, setNotFound] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);

  const [manualOrderId, setManualOrderId] = useState('');
  const [manualPhone, setManualPhone] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');

  useHistoryModal(isOpen && !currentUser, onClose, 'track-order-modal');

  useEffect(() => {
    if (isOpen) lockBody();
    else unlockBody();
    return () => unlockBody();
  }, [isOpen]);

  const loadGuestOrders = useCallback(async () => {
    setLoading(true);
    setNotFound(false);
    setOrders([]);
    setSearchError('');

    const guestList: { id?: string; orderNum?: string; phone?: string }[] = (() => {
      try {
        const list = JSON.parse(localStorage.getItem('vc_guest_orders') || '[]');
        if (Array.isArray(list) && list.length > 0) return list;
      } catch {
        // ignore
      }
      const pending = readPendingOrder();
      if (pending && pending.phone) return [pending];
      const latest = readLatestGuestOrder();
      if (latest && latest.phone) return [latest];
      return [];
    })();

    if (guestList.length === 0) {
      setLoading(false);
      setNotFound(true);
      return;
    }

    const validGuests = guestList.filter((g) => g.id && g.phone);
    const results = await Promise.allSettled(
      validGuests.map((g) => fetchFullOrder(supabase, String(g.id), g.phone!))
    );

    const fetched: Order[] = [];
    results.forEach((res) => {
      if (res.status === 'fulfilled' && res.value) {
        fetched.push(mapSupabaseOrderRow(res.value as Record<string, unknown>));
      }
    });

    if (fetched.length > 0) {
      setOrders(fetched);
      setNotFound(false);
    } else {
      setNotFound(true);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    if (!isOpen) return;

    if (currentUser) {
      onClose();
      router.push('/account/orders');
      return;
    }

    loadGuestOrders();
  }, [isOpen, currentUser, router, onClose, loadGuestOrders]);

  const handleManualSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setSearchError('');
    const cleanId = manualOrderId.trim().replace(/^#/, '');
    const cleanPhone = manualPhone.trim().replace(/\D/g, '');

    if (!cleanId) {
      setSearchError(lang === 'en' ? 'Enter Order Number or ID' : 'অর্ডার নম্বর বা আইডি লিখুন');
      return;
    }
    if (!cleanPhone || cleanPhone.length < 11) {
      setSearchError(lang === 'en' ? 'Enter valid 11-digit mobile number' : 'সঠিক ১১ সংখ্যার মোবাইল নম্বর দিন');
      return;
    }

    setSearching(true);
    try {
      const data = await fetchFullOrder(supabase, cleanId, cleanPhone);
      if (data) {
        const mapped = mapSupabaseOrderRow(data as Record<string, unknown>);
        setOrders([mapped]);
        setNotFound(false);
        setSearchError('');
      } else {
        setSearchError(lang === 'en' ? 'No order found with these details.' : 'এই তথ্যে কোনো অর্ডার পাওয়া যায়নি। নম্বরটি আবার চেক করুন।');
      }
    } catch {
      setSearchError(lang === 'en' ? 'Search error, please try again.' : 'অনুসন্ধানে সমস্যা হয়েছে, পুনরায় চেষ্টা করুন।');
    } finally {
      setSearching(false);
    }
  };

  const openInvoice = (orderId: string | number) => {
    onClose();
    router.push(`/checkout/invoice?id=${encodeURIComponent(String(orderId))}&from=track`);
  };

  const handleOpenLogin = () => {
    onClose();
    setTimeout(() => {
      setLoginOpen(true);
    }, 150);
  };

  if (currentUser) return null;

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[965] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
              className="fixed inset-0 bg-ink/55 backdrop-blur-[3px]"
              onClick={onClose}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 8 }}
              transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
              className="relative z-10 flex max-h-[88vh] w-full max-w-[460px] flex-col overflow-hidden rounded-[28px] bg-gradient-to-b from-brand-bg via-[#DCEBFD] to-white shadow-sh3 ring-1 ring-white/80"
            >
              <div className="relative shrink-0 overflow-hidden border-b border-ink/10 px-6 pb-3.5 pt-5 text-left">
                <HeaderDecor />
                <div className="relative z-10 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-light text-white shadow-xs">
                      <ClearTrackSvgIcon />
                    </span>
                    <h3 className="font-body text-[17px] font-extrabold text-ink">
                      {lang === 'en' ? 'Track Order' : 'অর্ডার ট্র্যাক করুন'}
                    </h3>
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.88 }}
                    onClick={onClose}
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-white/60 bg-white/80 text-ink/60 shadow-sh1 backdrop-blur-[8px] transition-colors hover:bg-white hover:text-ink focus-visible:outline-none"
                    aria-label="Close"
                  >
                    ✕
                  </motion.button>
                </div>
              </div>

              <div className="sleek-scrollbar flex-1 overflow-y-auto px-6 py-4">
                <SkeletonTransition isReady={!loading} skeleton={<OrderListSkeleton count={2} />}>
                  {notFound ? (
                    <div className="py-2 text-center">
                      <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full border border-white/80 bg-white text-brand-light shadow-sm">
                        <ReceiptEmptySvgIcon className="h-7 w-7 text-brand-light" />
                      </div>
                      
                      <div className="mb-1 font-body text-[15.5px] font-bold text-ink">
                        {lang === 'en' ? 'Search & Track Your Order' : 'অর্ডার নম্বর দিয়ে খুঁজুন'}
                      </div>
                      <p className="mx-auto mb-4 max-w-xs font-body text-[12px] leading-relaxed text-muted">
                        {lang === 'en'
                          ? 'Enter your Order Number and Mobile Number below to track delivery live.'
                          : 'লাইভ ডেলিভারি স্ট্যাটাস দেখতে আপনার অর্ডার নম্বর ও মোবাইল নম্বর দিন।'}
                      </p>

                      <form onSubmit={handleManualSearch} className="mb-4 flex flex-col gap-2.5 text-left">
                        <div>
                          <input
                            type="text"
                            value={manualOrderId}
                            maxLength={30}
                            onChange={(e) => setManualOrderId(e.target.value)}
                            placeholder={lang === 'en' ? 'Order Number (e.g. VC-1082)' : 'অর্ডার নম্বর (যেমন: VC-1082)'}
                            className="w-full rounded-[12px] border border-border-base bg-white/90 px-3.5 py-2.5 font-body text-xs text-ink outline-none transition-brand focus:border-brand-light"
                          />
                        </div>
                        <div>
                          <input
                            type="tel"
                            value={manualPhone}
                            maxLength={11}
                            onChange={(e) => setManualPhone(e.target.value.replace(/\D/g, ''))}
                            placeholder={lang === 'en' ? 'Mobile Number (01XXXXXXXXX)' : 'মোবাইল নম্বর (01XXXXXXXXX)'}
                            className="w-full rounded-[12px] border border-border-base bg-white/90 px-3.5 py-2.5 font-body text-xs text-ink outline-none transition-brand focus:border-brand-light"
                          />
                        </div>

                        {searchError && (
                          <div className="rounded-[10px] bg-red-50 p-2 font-body text-[11px] font-semibold text-red-600">
                            {searchError}
                          </div>
                        )}

                        <motion.button
                          type="submit"
                          disabled={searching}
                          whileTap={{ scale: 0.96 }}
                          className="flex w-full items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-info to-brand-light py-2.5 font-body text-xs font-bold text-white shadow-sh1 transition-all hover:brightness-[1.03]"
                        >
                          <SearchMagnifierIcon />
                          <span>{searching ? (lang === 'en' ? 'Searching...' : 'খোঁজা হচ্ছে...') : (lang === 'en' ? 'Track Now' : 'ট্র্যাক করুন')}</span>
                        </motion.button>
                      </form>

                      <div className="border-t border-ink/10 pt-3 text-center">
                        <span className="font-body text-[11px] text-muted">{lang === 'en' ? 'Already have an account?' : 'পূর্বে একাউন্ট তৈরি করা থাকলে:'} </span>
                        <button
                          type="button"
                          onClick={handleOpenLogin}
                          className="font-body text-[11.5px] font-extrabold text-brand-light hover:underline"
                        >
                          {t('লগইন করুন')}
                        </button>
                      </div>
                    </div>
                  ) : orders.length > 0 ? (
                    <div className="space-y-4">
                      <div className="space-y-3.5">
                        {orders.map((o) => (
                          <OrderCard key={o.id} order={o} onInvoice={openInvoice} from="track" />
                        ))}
                      </div>

                      <div className="rounded-[18px] border border-brand-light/35 bg-white/75 p-4 shadow-xs backdrop-blur-md">
                        <div className="flex items-start gap-3">
                          <SparklesCrownSvgIcon />
                          <div className="flex-1">
                            <div className="mb-1 font-body text-[13.5px] font-extrabold text-ink">
                              {lang === 'en' ? 'Unlock VIP Features & Discounts' : 'ভিআইপি মেম্বারশিপ ও অফার সুবিধা পান'}
                            </div>
                            <p className="font-body text-[12px] leading-[1.7] text-ink/75">
                              {lang === 'en'
                                ? 'This order information is temporarily stored in this browser. Log in now to track & manage orders across all devices, switch languages (Bangla/English), save invoice history, and unlock VIP membership rewards & exclusive coupon discounts.'
                                : 'এই অর্ডারের তথ্য শুধুমাত্র সাময়িক সময়ের জন্য এই ব্রাউজারে সংরক্ষিত রয়েছে। যেকোনো ডিভাইস থেকে অর্ডার ট্র্যাক ও হিস্টোরি সংরক্ষণ, ভাষা পরিবর্তন (বাংলা/English), মেম্বারশিপ রিওয়ার্ড ও স্পেশাল কুপন ডিসকাউন্ট সুবিধা পেতে এখনই অ্যাকাউন্টে লগইন করে নিন।'}
                            </p>
                            <motion.button
                              whileTap={{ scale: 0.95 }}
                              onClick={handleOpenLogin}
                              className="mt-2.5 inline-flex items-center gap-1 font-body text-[12.5px] font-extrabold text-brand-light transition-colors hover:text-brand-light-hover"
                            >
                              <span>{lang === 'en' ? 'Login to Account →' : 'অ্যাকাউন্টে লগইন করুন →'}</span>
                            </motion.button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : null}
                </SkeletonTransition>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <LoginModal isOpen={loginOpen} onClose={() => setLoginOpen(false)} />
    </>
  );
}
