'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { createClient } from '@/lib/supabase/client';
import Navbar from '@/app/components/layout/Navbar';
import Footer from '@/app/components/layout/Footer';
import { fetchFullOrder, readPendingOrder, readLatestGuestOrder } from '@/lib/orderStatus';
import { mapSupabaseOrderRow } from '@/lib/orderMapping';
import { useCartStore, cartCount } from '@/lib/store/cartStore';
import { useWishlistStore } from '@/lib/store/wishlistStore';
import { useAuthStore } from '@/lib/store/authStore';
import { OPEN_CART_EVENT, OPEN_WISHLIST_EVENT, OPEN_ACCOUNT_EVENT, GENERATE_INVOICE_EVENT } from '@/lib/uiEvents';
import { useT } from '@/lib/i18n/useT';
import type { Order } from '@/types';

const LoginModal = dynamic(() => import('@/app/components/auth/LoginModal'));
const AccountPage = dynamic(() => import('@/app/components/auth/AccountPage'));

function PackageSvgIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16.5 9.4 7.55 4.24a1.8 1.8 0 0 0-1.8 0L2.5 6.1a1.8 1.8 0 0 0-.9 1.56v8.68a1.8 1.8 0 0 0 .9 1.56l3.25 1.86a1.8 1.8 0 0 0 1.8 0l8.95-5.16a1.8 1.8 0 0 0 .9-1.56V9.4z" />
      <polyline points="3.29 7 12 12 20.71 7" />
      <line x1="12" y1="22" x2="12" y2="12" />
    </svg>
  );
}

function ReceiptEmptySvgIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1Z" />
      <path d="M8 7h8M8 11h8M8 15h5" />
    </svg>
  );
}

function AlertTriangleSvgIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-amber-700">
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

function StepReceivedSvg() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  );
}

function StepConfirmedSvg() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

function StepShippedSvg() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="3" width="15" height="13" rx="1" />
      <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
      <circle cx="5.5" cy="18.5" r="2.5" />
      <circle cx="18.5" cy="18.5" r="2.5" />
    </svg>
  );
}

function StepDeliveredSvg() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  );
}

function CrossCancelSvg() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  );
}

const TIMELINE_STEPS = [
  { key: 'pending', label: 'অর্ডার গ্রহণ করা হয়েছে', icon: StepReceivedSvg },
  { key: 'confirmed', label: 'কনফার্ম হয়েছে', icon: StepConfirmedSvg },
  { key: 'shipped', label: 'পাঠানো হয়েছে', icon: StepShippedSvg },
  { key: 'delivered', label: 'ডেলিভারি সম্পন্ন', icon: StepDeliveredSvg },
];

export default function TrackOrderClient() {
  const { t, lang } = useT();
  const router = useRouter();
  const supabase = useRef(createClient()).current;

  const cartQty = useCartStore((s) => cartCount(s.cart));
  const wishQty = useWishlistStore((s) => s.wishlist.length);
  const currentUser = useAuthStore((s) => s.currentUser);
  const [loginOpen, setLoginOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);

  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<Order | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const onOpenAccount = () => {
      if (!useAuthStore.getState().currentUser) setLoginOpen(true);
      else setAccountOpen(true);
    };
    window.addEventListener(OPEN_ACCOUNT_EVENT, onOpenAccount);
    return () => window.removeEventListener(OPEN_ACCOUNT_EVENT, onOpenAccount);
  }, []);

  useEffect(() => {
    if (currentUser) {
      router.replace('/account/orders');
      return;
    }
    setLoading(true);
    setNotFound(false);
    setOrder(null);

    const guest = readLatestGuestOrder() || (() => {
      const p = readPendingOrder();
      return p && p.phone ? { id: p.id, orderNum: p.orderNum, phone: p.phone } : null;
    })();

    if (!guest) {
      setLoading(false);
      setNotFound(true);
      return;
    }

    fetchFullOrder(supabase, guest.id, guest.phone).then((data) => {
      if (data) {
        setOrder(mapSupabaseOrderRow(data as Record<string, unknown>));
      } else {
        setNotFound(true);
      }
      setLoading(false);
    });
  }, [currentUser, router, supabase]);

  const isCancelled = order && (order.status === 'cancelled' || order.status === 'rejected');
  const currentStepIdx = order ? TIMELINE_STEPS.findIndex((s) => s.key === order.status) : -1;

  const openInvoice = () => {
    if (!order) return;
    window.dispatchEvent(new CustomEvent(GENERATE_INVOICE_EVENT, {
      detail: { orderId: order.id, phone: order.customer?.phone, ctx: 'guest-track' },
    }));
  };

  const handleOpenLogin = () => {
    setLoginOpen(true);
  };

  if (currentUser) return null;

  return (
    <>
      <Navbar
        showHomeButton
        sticky={false}
        cartCount={cartQty}
        wishCount={wishQty}
        currentUser={currentUser}
        onCartClick={() => window.dispatchEvent(new CustomEvent(OPEN_CART_EVENT))}
        onWishClick={() => window.dispatchEvent(new CustomEvent(OPEN_WISHLIST_EVENT))}
        onLoginClick={() => setLoginOpen(true)}
        onAccountClick={() => window.dispatchEvent(new CustomEvent(OPEN_ACCOUNT_EVENT))}
      />

      <div className="mx-auto w-full max-w-[500px] px-5 pb-16 pt-8">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-brand-light text-white shadow-xs">
            <PackageSvgIcon />
          </div>
          <h1 className="font-body text-xl font-extrabold text-ink">
            {lang === 'en' ? 'Track Your Order' : 'অর্ডার ট্র্যাক করুন'}
          </h1>
          <p className="mt-1 font-body text-[13px] text-muted">
            {lang === 'en'
              ? 'Orders placed in this browser will appear here automatically.'
              : 'আপনি এই ব্রাউজারে যে অর্ডার করেছেন সেটি এখানে স্বয়ংক্রিয়ভাবে দেখা যাবে।'}
          </p>
        </div>

        {/* Main Card Container */}
        <div className="rounded-[28px] border border-white/80 bg-gradient-to-b from-brand-bg/40 via-[#EFF6FE] to-white p-6 shadow-sh3">
          {loading && (
            <div className="py-12 text-center font-body text-[13px] text-muted">
              <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-brand-light/30 border-t-brand-light" />
              {t('লোড হচ্ছে...')}
            </div>
          )}

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

          {!loading && order && (
            <div className="space-y-4">
              {/* Notice Box with SVG Alert */}
              <div className="flex items-start gap-2.5 rounded-2xl border border-amber-200/80 bg-[#FFF7ED]/90 p-3.5 font-body text-[12px] leading-relaxed text-amber-900 shadow-xs backdrop-blur-sm">
                <AlertTriangleSvgIcon />
                <div>
                  {lang === 'en'
                    ? 'This order information is stored only in this browser. Please log in to track from other devices.'
                    : 'এই অর্ডারের তথ্য শুধু এই ব্রাউজারে সংরক্ষিত আছে। অন্য ডিভাইসে ট্র্যাক করতে অ্যাকাউন্টে লগইন করুন।'}
                </div>
              </div>

              {/* Order Meta Box */}
              <div className="flex items-center justify-between rounded-2xl border border-white/80 bg-white/90 p-3.5 shadow-xs backdrop-blur-sm">
                <div>
                  <div className="font-body text-[14px] font-bold text-ink">{order.orderNum}</div>
                  <div className="mt-0.5 font-body text-[11.5px] text-muted">
                    {new Date(order.date).toLocaleDateString(lang === 'en' ? 'en-US' : 'bn-BD', {
                      year: 'numeric', month: 'short', day: 'numeric',
                    })}
                  </div>
                </div>
                <button
                  onClick={openInvoice}
                  className="rounded-full border border-brand-light/40 bg-brand-bg/30 px-3.5 py-1.5 font-body text-xs font-bold text-brand-primary transition-colors hover:bg-brand-bg/60"
                >
                  {lang === 'en' ? 'Invoice' : 'ইনভয়েস'}
                </button>
              </div>

              {/* Cancelled Alert or 4-Step Timeline */}
              {isCancelled ? (
                <div className="flex items-center justify-center gap-2.5 rounded-2xl border border-red-200 bg-red-50/80 p-4 text-center font-body text-sm font-bold text-red-700">
                  <CrossCancelSvg />
                  <span>
                    {t(order.status === 'rejected' ? 'অর্ডারটি বাতিল করা হয়েছে' : 'অর্ডারটি ক্যান্সেল করা হয়েছে')}
                  </span>
                </div>
              ) : (
                <div className="rounded-2xl border border-white/80 bg-white/90 p-4 shadow-xs backdrop-blur-sm">
                  <div className="space-y-0">
                    {TIMELINE_STEPS.map((step, idx) => {
                      const done = idx <= currentStepIdx;
                      const isLast = idx === TIMELINE_STEPS.length - 1;
                      const StepIconComponent = step.icon;

                      return (
                        <div key={step.key} className="flex items-start gap-3.5">
                          <div className="flex flex-col items-center">
                            <div
                              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors ${
                                done
                                  ? 'bg-brand-light text-white shadow-xs'
                                  : 'border border-border-base bg-surface-muted text-muted/50'
                              }`}
                            >
                              <StepIconComponent />
                            </div>
                            {!isLast && (
                              <div
                                className={`w-[2px] ${
                                  idx < currentStepIdx ? 'bg-brand-light' : 'bg-border-base/70'
                                }`}
                                style={{ minHeight: 24 }}
                              />
                            )}
                          </div>
                          <div className={`pb-6 pt-1 font-body text-[13px] font-bold ${done ? 'text-ink' : 'text-muted'}`}>
                            {t(step.label)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Order Summary Card */}
              <div className="rounded-2xl border border-white/80 bg-white/90 p-4 shadow-xs backdrop-blur-sm">
                <div className="mb-2.5 font-body text-[12.5px] font-bold text-ink">
                  {t('অর্ডার সারমর্ম')}
                </div>
                <div className="space-y-2">
                  {(order.items || []).map((i, idx) => (
                    <div key={idx} className="flex items-center justify-between font-body text-[12.5px] text-ink">
                      <span className="min-w-0 flex-1 truncate">{i.name}</span>
                      <span className="ml-2 shrink-0 font-semibold text-muted">
                        {i.qty} × ৳{i.price.toLocaleString('en-US')}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex items-center justify-between border-t border-border-base/70 pt-2.5 font-body text-[13.5px] font-bold text-ink">
                  <span>{t('মোট (শিপিং সহ):')}</span>
                  <span className="text-brand-light font-extrabold">
                    ৳{(order.total || 0).toLocaleString('en-US')}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <Footer />

      <LoginModal isOpen={loginOpen} onClose={() => setLoginOpen(false)} />
      <AccountPage isOpen={accountOpen} onClose={() => setAccountOpen(false)} currentUser={currentUser} />
    </>
  );
}
