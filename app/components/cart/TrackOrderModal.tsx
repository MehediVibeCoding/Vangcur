'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { lockBody, unlockBody } from '@/lib/bodyScrollLock';
import { fetchFullOrder, readPendingOrder, readLatestGuestOrder } from '@/lib/orderStatus';
import { mapSupabaseOrderRow } from '@/lib/orderMapping';
import { useAuthStore } from '@/lib/store/authStore';
import { GENERATE_INVOICE_EVENT, OPEN_ACCOUNT_EVENT } from '@/lib/uiEvents';
import { useT } from '@/lib/i18n/useT';
import OrderCard from '@/app/components/orders/OrderCard';
import type { Order } from '@/types';

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

  useEffect(() => {
    if (isOpen) lockBody();
    else unlockBody();
    return () => unlockBody();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    if (currentUser) {
      onClose();
      router.push('/account/orders');
      return;
    }

    setLoading(true);
    setNotFound(false);
    setOrders([]);

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

    (async () => {
      const fetched: Order[] = [];
      for (const g of guestList) {
        if (!g.id || !g.phone) continue;
        const data = await fetchFullOrder(supabase, String(g.id), g.phone);
        if (data) {
          fetched.push(mapSupabaseOrderRow(data as Record<string, unknown>));
        }
      }

      if (fetched.length > 0) {
        setOrders(fetched);
      } else {
        setNotFound(true);
      }
      setLoading(false);
    })();
  }, [isOpen, currentUser, router, supabase, onClose]);

  const openInvoice = (orderId: string | number) => {
    window.dispatchEvent(new CustomEvent(GENERATE_INVOICE_EVENT, {
      detail: { orderId, ctx: 'guest-track' },
    }));
  };

  const handleOpenLogin = () => {
    onClose();
    window.dispatchEvent(new CustomEvent(OPEN_ACCOUNT_EVENT));
  };

  if (currentUser || !isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[960] bg-ink/55 backdrop-blur-[3px] transition-opacity duration-brand"
        onClick={onClose}
      />

      {/* Centered Aesthetic Modal Dialog */}
      <div className="fixed inset-0 z-[965] flex items-center justify-center p-4">
        <div className="relative flex max-h-[88vh] w-full max-w-[460px] flex-col overflow-hidden rounded-[28px] bg-gradient-to-b from-brand-bg via-[#DCEBFD] to-white shadow-sh3 transition-all duration-300 ease-brand animate-section-reveal">
          
          {/* Header */}
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
              <button
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-white/60 bg-white/80 text-ink/60 shadow-sh1 backdrop-blur-[8px] transition-brand hover:bg-white hover:text-ink focus-visible:outline-none"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Content Body */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {/* Loading State */}
            {loading && (
              <div className="py-12 text-center font-body text-[13px] text-muted">
                <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-brand-light/30 border-t-brand-light" />
                {t('লোড হচ্ছে...')}
              </div>
            )}

            {/* দৃশ্যপট ১: আন-লগইন + কোনো অর্ডার নেই */}
            {!loading && notFound && (
              <div className="py-8 text-center">
                <div className="mx-auto mb-3.5 flex h-16 w-16 items-center justify-center rounded-full border border-white/80 bg-white text-brand-light shadow-sm">
                  <ReceiptEmptySvgIcon className="h-8 w-8 text-brand-light" />
                </div>
                <div className="mb-1.5 font-body text-[16px] font-bold text-ink">
                  {lang === 'en' ? 'No orders placed yet' : 'এখনো কোনো অর্ডার করেননি'}
                </div>
                <p className="mx-auto mb-5 max-w-xs font-body text-[12.5px] leading-relaxed text-muted">
                  {lang === 'en'
                    ? 'Orders will appear here automatically once placed. Log in to track from any device.'
                    : 'অর্ডার করলে সেটি এখানে স্বয়ংক্রিয়ভাবে দেখা যাবে। ভবিষ্যতে যেকোনো ডিভাইস থেকে অর্ডার ট্র্যাক করতে লগইন করে রাখুন।'}
                </p>
                <button
                  onClick={handleOpenLogin}
                  className="rounded-full bg-gradient-to-r from-brand-light to-brand-light-hover px-7 py-2.5 font-body text-xs font-bold text-white shadow-sh2 transition-brand hover:brightness-[1.03] active:scale-95"
                >
                  {t('লগইন করুন')}
                </button>
              </div>
            )}

            {/* দৃশ্যপট ২: আন-লগইন + এই ব্রাউজারে করা সবকটি অর্ডার লিস্ট */}
            {!loading && orders.length > 0 && (
              <div className="space-y-4">
                <div className="space-y-3.5">
                  {orders.map((o) => (
                    <OrderCard key={o.id} order={o} onInvoice={openInvoice} />
                  ))}
                </div>

                {/* হাই-কন্ট্রাস্ট সাইকোলজিক্যাল ভ্যালু লগইন কার্ড (কার্ড তালিকার একদম নিচে) */}
                <div className="rounded-[24px] border-[1.5px] border-brand-light/40 bg-white/95 p-4.5 shadow-md backdrop-blur-sm">
                  <div className="flex items-start gap-3">
                    <SparklesCrownSvgIcon />
                    <div className="flex-1">
                      <div className="mb-1.5 font-body text-[13.5px] font-extrabold text-ink">
                        {lang === 'en' ? 'Unlock VIP Features & Discounts' : 'ভিআইপি মেম্বারশিপ ও অফার সুবিধা পান'}
                      </div>
                      <p className="font-body text-[12px] leading-[1.7] text-ink/75">
                        {lang === 'en'
                          ? 'This order information is temporarily stored in this browser. Log in now to track & manage orders across all devices, switch languages (Bangla/English), save invoice history, and unlock VIP membership rewards & exclusive coupon discounts.'
                          : 'এই অর্ডারের তথ্য শুধুমাত্র সাময়িক সময়ের জন্য এই ব্রাউজারে সংরক্ষিত রয়েছে। যেকোনো ডিভাইস থেকে অর্ডার ট্র্যাক ও হিস্টোরি সংরক্ষণ, ভাষা পরিবর্তন (বাংলা/English), মেম্বারশিপ রিওয়ার্ড ও স্পেশাল কুপন ডিসকাউন্ট সুবিধা পেতে এখনই অ্যাকাউন্টে লগইন করে নিন।'}
                      </p>
                      <button
                        onClick={handleOpenLogin}
                        className="mt-3 inline-flex items-center gap-1 font-body text-[12.5px] font-extrabold text-brand-light transition-colors hover:text-brand-light-hover active:scale-95"
                      >
                        <span>{lang === 'en' ? 'Login to Account →' : 'অ্যাকাউন্টে লগইন করুন →'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
