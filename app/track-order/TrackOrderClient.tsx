'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { createClient } from '@/lib/supabase/client';
import Navbar from '@/app/components/layout/Navbar';
import Footer from '@/app/components/layout/Footer';
import { fetchFullOrder, readPendingOrder, readLatestGuestOrder, ORDER_TRACK_STEPS } from '@/lib/orderStatus';
import { mapSupabaseOrderRow } from '@/lib/orderMapping';
import { useCartStore, cartCount } from '@/lib/store/cartStore';
import { useWishlistStore } from '@/lib/store/wishlistStore';
import { useAuthStore } from '@/lib/store/authStore';
import { OPEN_CART_EVENT, OPEN_WISHLIST_EVENT, OPEN_ACCOUNT_EVENT, GENERATE_INVOICE_EVENT } from '@/lib/uiEvents';
import type { Order } from '@/types';

const LoginModal = dynamic(() => import('@/app/components/auth/LoginModal'));
const AccountPage = dynamic(() => import('@/app/components/auth/AccountPage'));

// এই পেজও TrackOrderModal-এর মতো একই ৪-স্টেট লজিক অনুসরণ করে — লগইন থাকলে
// /account/orders এ পাঠিয়ে দেয় (state ৩/৪), না থাকলে এই ব্রাউজারে
// সেভ থাকা সাম্প্রতিক guest অর্ডার automatic দেখায় (state ১/২)। এখানেও
// ইচ্ছাকৃতভাবে কোনো phone-সার্চ ইনপুট নেই।
export default function TrackOrderClient() {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  const isCancelled = order && (order.status === 'cancelled' || order.status === 'rejected');
  const currentStepIdx = order ? ORDER_TRACK_STEPS.findIndex((s) => s.key === order.status) : -1;

  const openInvoice = () => {
    if (!order) return;
    window.dispatchEvent(new CustomEvent(GENERATE_INVOICE_EVENT, {
      detail: { orderId: order.id, phone: order.customer?.phone, ctx: 'guest-track' },
    }));
  };

  if (currentUser) return null;

  return (
    <>
      <Navbar
        showHomeButton
        cartCount={cartQty}
        wishCount={wishQty}
        currentUser={currentUser}
        onCartClick={() => window.dispatchEvent(new CustomEvent(OPEN_CART_EVENT))}
        onWishClick={() => window.dispatchEvent(new CustomEvent(OPEN_WISHLIST_EVENT))}
        onLoginClick={() => setLoginOpen(true)}
        onAccountClick={() => window.dispatchEvent(new CustomEvent(OPEN_ACCOUNT_EVENT))}
      />

      <div className="mx-auto w-full max-w-[480px] px-5 pb-16 pt-8">
        <h1 className="mb-1.5 text-center font-display text-xl font-bold text-ink">📦 অর্ডার ট্র্যাক করুন</h1>
        <p className="mb-6 text-center font-body text-[13px] text-muted">
          আপনি এই ব্রাউজারে যে অর্ডার করেছেন সেটি এখানে স্বয়ংক্রিয়ভাবে দেখা যাবে।
        </p>

        <div className="rounded-brand border border-border-base bg-white p-5 shadow-sh1">
          {loading && (
            <div className="py-8 text-center font-body text-[13px] text-muted">⏳ লোড হচ্ছে...</div>
          )}

          {!loading && notFound && (
            <div className="py-6 text-center">
              <div className="mb-2 text-3xl">🧾</div>
              <div className="mb-2 font-body text-sm font-bold text-ink">এখনো কোনো অর্ডার করেননি</div>
              <p className="font-body text-[12.5px] leading-[1.7] text-muted">
                অর্ডার করলে সেটি এখানে স্বয়ংক্রিয়ভাবে দেখা যাবে।<br />
                ভবিষ্যতে যেকোনো ডিভাইস থেকে অর্ডার ট্র্যাক করতে <strong>লগইন</strong> করে রাখুন।
              </p>
              <button
                onClick={() => setLoginOpen(true)}
                className="mt-4 rounded-full bg-ink px-5 py-2.5 font-body text-[13px] font-bold text-white hover:bg-brand-light"
              >
                লগইন করুন
              </button>
            </div>
          )}

          {!loading && order && (
            <>
              <div className="mb-3.5 rounded-[10px] border border-[#FED7AA] bg-[#FFF7ED] px-3.5 py-[10px] font-body text-[11.5px] leading-[1.6] text-[#92400E]">
                ⚠️ এই অর্ডারের তথ্য শুধু এই ব্রাউজারে সংরক্ষিত আছে। অন্য ডিভাইসে ট্র্যাক করতে লগইন করুন, অথবা WhatsApp-এ যোগাযোগ করুন।
              </div>

              <div className="mb-4 flex items-center justify-between rounded-[12px] bg-surface-muted px-4 py-3">
                <div>
                  <div className="font-body text-sm font-bold text-ink">{order.orderNum}</div>
                  <div className="font-body text-[11.5px] text-muted">{new Date(order.date).toLocaleDateString('bn-BD', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                </div>
                <button onClick={openInvoice} className="font-body text-[12px] font-semibold text-brand-light hover:underline">ইনভয়েস</button>
              </div>

              {isCancelled ? (
                <div className="mb-4 rounded-[12px] bg-[#FEE2E2] px-4 py-4 text-center">
                  <div className="mb-1 text-2xl">❌</div>
                  <div className="font-body text-sm font-bold text-[#991B1B]">
                    {order.status === 'rejected' ? 'অর্ডারটি বাতিল করা হয়েছে' : 'অর্ডারটি ক্যান্সেল করা হয়েছে'}
                  </div>
                </div>
              ) : (
                <div className="mb-4 flex flex-col gap-0">
                  {ORDER_TRACK_STEPS.map((step, idx) => {
                    const done = idx <= currentStepIdx;
                    const isLast = idx === ORDER_TRACK_STEPS.length - 1;
                    return (
                      <div key={step.key} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm ${done ? 'bg-brand-light text-white' : 'bg-surface-muted text-muted'}`}>
                            {step.icon}
                          </div>
                          {!isLast && <div className={`w-[2px] flex-1 ${idx < currentStepIdx ? 'bg-brand-light' : 'bg-border-base'}`} style={{ minHeight: 24 }} />}
                        </div>
                        <div className={`pb-6 pt-1 font-body text-[13px] font-semibold ${done ? 'text-ink' : 'text-muted'}`}>
                          {step.label}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="rounded-[12px] border border-border-base p-3">
                <div className="mb-2 font-body text-[12px] font-bold text-ink">অর্ডার সারমর্ম</div>
                <div className="flex flex-col gap-1.5">
                  {(order.items || []).map((i, idx) => (
                    <div key={idx} className="flex items-center justify-between font-body text-[12.5px] text-ink">
                      <span className="min-w-0 flex-1 truncate">{i.name}</span>
                      <span className="ml-2 whitespace-nowrap font-semibold">{i.qty} × ৳{i.price.toLocaleString('en-US')}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-2 flex items-center justify-between border-t border-border-base pt-2 font-body text-[13px] font-bold text-ink">
                  <span>মোট (শিপিং সহ):</span><span>৳{(order.total || 0).toLocaleString('en-US')}</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <Footer />

      <LoginModal isOpen={loginOpen} onClose={() => setLoginOpen(false)} />
      <AccountPage isOpen={accountOpen} onClose={() => setAccountOpen(false)} currentUser={currentUser} />
    </>
  );
}
