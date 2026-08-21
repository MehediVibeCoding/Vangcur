'use client';

import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { createClient } from '@/lib/supabase/client';
import Navbar from '@/app/components/layout/Navbar';
import Footer from '@/app/components/layout/Footer';
import { lookupOrderByNumberAndPhone, ORDER_TRACK_STEPS } from '@/lib/orderStatus';
import { useCartStore, cartCount } from '@/lib/store/cartStore';
import { useWishlistStore } from '@/lib/store/wishlistStore';
import { useAuthStore } from '@/lib/store/authStore';
import { OPEN_CART_EVENT, OPEN_WISHLIST_EVENT, OPEN_ACCOUNT_EVENT } from '@/lib/uiEvents';
import type { Order } from '@/types';

const LoginModal = dynamic(() => import('@/app/components/auth/LoginModal'));
const AccountPage = dynamic(() => import('@/app/components/auth/AccountPage'));

export default function TrackOrderClient() {
  const supabase = useRef(createClient()).current;
  const searchParams = useSearchParams();

  const cartQty = useCartStore((s) => cartCount(s.cart));
  const wishQty = useWishlistStore((s) => s.wishlist.length);
  const currentUser = useAuthStore((s) => s.currentUser);
  const [loginOpen, setLoginOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);

  const [orderNum, setOrderNum] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    const onOpenAccount = () => {
      if (!useAuthStore.getState().currentUser) setLoginOpen(true);
      else setAccountOpen(true);
    };
    window.addEventListener(OPEN_ACCOUNT_EVENT, onOpenAccount);
    return () => window.removeEventListener(OPEN_ACCOUNT_EVENT, onOpenAccount);
  }, []);

  // সাপোর্ট থেকে সরাসরি লিংক দেওয়া যায়: /track-order?order=VC-1082
  useEffect(() => {
    const q = searchParams.get('order');
    if (q) setOrderNum(q);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = async () => {
    setErr('');
    setLoading(true);
    setOrder(null);
    const result = await lookupOrderByNumberAndPhone(supabase, orderNum, phone.trim());
    if (!result.ok || !result.order) {
      setErr(result.error || 'কিছু একটা সমস্যা হয়েছে, একটু পরে আবার চেষ্টা করুন।');
      setLoading(false);
      return;
    }
    setOrder(result.order);
    setLoading(false);
  };

  const isCancelled = order && (order.status === 'cancelled' || order.status === 'rejected');
  const currentStepIdx = order ? ORDER_TRACK_STEPS.findIndex((s) => s.key === order.status) : -1;
  const reset = () => { setOrder(null); setOrderNum(''); setPhone(''); setErr(''); };

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
          অর্ডার নম্বর ও যে মোবাইল নম্বরে অর্ডার করেছিলেন তা দিন — লগইন করার দরকার নেই।
        </p>

        <div className="rounded-brand border border-border-base bg-white p-5 shadow-sh1">
          {!order ? (
            <>
              <div className="mb-3">
                <label className="mb-1.5 block font-body text-[12.5px] font-bold text-ink">অর্ডার নম্বর</label>
                <input
                  type="text" placeholder="যেমন: VC-1082" value={orderNum}
                  onChange={(e) => setOrderNum(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
                  className="w-full rounded-full border border-ink/[0.08] bg-surface-muted px-[18px] py-[12px] font-body text-sm text-ink outline-none focus:border-brand-light/40 focus:bg-white"
                />
              </div>
              <div className="mb-4">
                <label className="mb-1.5 block font-body text-[12.5px] font-bold text-ink">মোবাইল নম্বর</label>
                <input
                  type="tel" placeholder="যে নম্বরে অর্ডার করেছিলেন" value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
                  className="w-full rounded-full border border-ink/[0.08] bg-surface-muted px-[18px] py-[12px] font-body text-sm text-ink outline-none focus:border-brand-light/40 focus:bg-white"
                />
              </div>
              {err && <div className="mb-3 text-center font-body text-[12px] font-semibold text-[#DC2626]">{err}</div>}
              <button
                onClick={handleSearch} disabled={loading}
                className="w-full rounded-full bg-ink py-[13px] font-body text-[15px] font-bold text-white transition-brand duration-brand hover:bg-brand-light disabled:opacity-70"
              >
                {loading ? '⏳ খোঁজা হচ্ছে...' : 'ট্র্যাক করুন'}
              </button>
            </>
          ) : (
            <>
              <div className="mb-4 flex items-center justify-between rounded-[12px] bg-surface-muted px-4 py-3">
                <div>
                  <div className="font-body text-sm font-bold text-ink">{order.orderNum}</div>
                  <div className="font-body text-[11.5px] text-muted">{new Date(order.date).toLocaleDateString('bn-BD', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                </div>
                <button onClick={reset} className="font-body text-[12px] font-semibold text-brand-light hover:underline">অন্য অর্ডার</button>
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
