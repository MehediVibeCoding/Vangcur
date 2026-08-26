'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { createClient } from '@/lib/supabase/client';
import Navbar from '@/app/components/layout/Navbar';
import Footer from '@/app/components/layout/Footer';
import OrderCard from '@/app/components/orders/OrderCard';
import { fetchMyOrders, orderStats } from '@/lib/accountData';
import { useCartStore, cartCount } from '@/lib/store/cartStore';
import { useWishlistStore } from '@/lib/store/wishlistStore';
import { useAuthStore } from '@/lib/store/authStore';
import {
  OPEN_CART_EVENT, OPEN_WISHLIST_EVENT, OPEN_TRACK_ORDER_EVENT, OPEN_ACCOUNT_EVENT, GENERATE_INVOICE_EVENT,
} from '@/lib/uiEvents';
import { useT } from '@/lib/i18n/useT';
import type { Order } from '@/types';

const LoginModal = dynamic(() => import('@/app/components/auth/LoginModal'));
const AccountPage = dynamic(() => import('@/app/components/auth/AccountPage'));

export default function AccountOrdersClient() {
  const { t } = useT();
  const supabase = useRef(createClient()).current;

  const cartQty = useCartStore((s) => cartCount(s.cart));
  const wishQty = useWishlistStore((s) => s.wishlist.length);
  const currentUser = useAuthStore((s) => s.currentUser);
  const [loginOpen, setLoginOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  useEffect(() => {
    const onOpenAccount = () => {
      if (!useAuthStore.getState().currentUser) setLoginOpen(true);
      else setAccountOpen(true);
    };
    window.addEventListener(OPEN_ACCOUNT_EVENT, onOpenAccount);
    return () => window.removeEventListener(OPEN_ACCOUNT_EVENT, onOpenAccount);
  }, []);

  useEffect(() => {
    if (!currentUser) { setLoading(false); return; }
    setLoading(true);
    fetchMyOrders(supabase, currentUser).then((data) => {
      setOrders(data);
      setLoading(false);
    });
  }, [currentUser, supabase]);

  const stats = useMemo(() => orderStats(orders), [orders]);

  // শুধু order number দিয়ে সার্চ — client-side filter, নতুন কোনো query না;
  // orders আগে থেকেই RLS দিয়ে শুধু নিজের rows-এ scoped, তাই phone-verify
  // করার কোনো দরকার নেই এখানে। phone দিয়ে সার্চ করার অপশন ইচ্ছাকৃতভাবে নেই।
  const filteredOrders = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return orders;
    return orders.filter((o) => String(o.orderNum).toLowerCase().includes(q));
  }, [orders, query]);

  const openInvoice = (orderId: string | number) => window.dispatchEvent(new CustomEvent(GENERATE_INVOICE_EVENT, { detail: { orderId, ctx: 'acc-orders' } }));

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
        onTrackClick={() => window.dispatchEvent(new CustomEvent(OPEN_TRACK_ORDER_EVENT))}
        onLoginClick={() => setLoginOpen(true)}
        onAccountClick={() => window.dispatchEvent(new CustomEvent(OPEN_ACCOUNT_EVENT))}
      />

      <div className="mx-auto w-full max-w-[720px] px-5 pb-16 pt-8">
        {!currentUser ? (
          <div className="mx-auto max-w-[380px] rounded-brand border border-dashed border-border-base py-12 text-center">
            <div className="mb-3 text-[42px]">🔒</div>
            <div className="mb-1.5 font-body text-[15px] font-bold text-ink">{t('অর্ডার দেখতে লগইন করুন')}</div>
            <div className="mb-5 font-body text-[13px] text-muted">{t('আপনার অর্ডার ইতিহাস দেখতে অ্যাকাউন্টে লগইন করা প্রয়োজন।')}</div>
            <button
              onClick={() => setLoginOpen(true)}
              className="rounded-full bg-ink px-6 py-2.5 font-body text-[13.5px] font-bold text-white transition-brand duration-brand hover:bg-brand-light"
            >
              {t('লগইন করুন')}
            </button>
          </div>
        ) : (
          <>
            <div className="mb-5 flex items-center justify-between">
              <h1 className="font-display text-xl font-bold text-ink">📦 {t('আমার অর্ডার সমূহ')}</h1>
              {!loading && orders.length > 0 && (
                <div className="flex gap-2 font-body text-[11.5px] font-semibold text-muted">
                  <span className="rounded-full bg-surface-muted px-2.5 py-1">{t('মোট:')} {stats.total}</span>
                  <span className="rounded-full bg-surface-muted px-2.5 py-1">{t('চলমান:')} {stats.running}</span>
                  <span className="rounded-full bg-surface-muted px-2.5 py-1">{t('সম্পন্ন:')} {stats.completed}</span>
                </div>
              )}
            </div>

            {!loading && orders.length > 0 && (
              <div className="mb-4">
                <input
                  type="text"
                  placeholder={t('অর্ডার নম্বর দিয়ে খুঁজুন (যেমন: VC-1082)')}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full rounded-full border border-ink/[0.08] bg-surface-muted px-[18px] py-[10px] font-body text-[13px] text-ink outline-none focus:border-brand-light/40 focus:bg-white"
                />
              </div>
            )}

            {loading ? (
              <div className="flex flex-col gap-3.5">
                {[0, 1].map((k) => (
                  <div key={k} className="h-[150px] animate-pulse rounded-brand bg-surface-muted" />
                ))}
              </div>
            ) : orders.length === 0 ? (
              <div className="rounded-brand border border-dashed border-border-base py-14 text-center">
                <div className="mb-3 text-[42px]">📦</div>
                <div className="mb-1 font-body text-sm font-bold text-ink">{t('এখনো কোনো অর্ডার নেই')}</div>
                <div className="mb-5 font-body text-xs text-muted">{t('অর্ডার করলে এখানে দেখাবে')}</div>
                <a href="/" className="inline-block rounded-full bg-ink px-6 py-2.5 font-body text-[13px] font-bold text-white transition-brand duration-brand hover:bg-brand-light">{t('কেনাকাটা শুরু করুন')}</a>
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="rounded-brand border border-dashed border-border-base py-10 text-center">
                <div className="mb-2 text-3xl">🔍</div>
                <div className="font-body text-sm font-bold text-ink">{t('এই নম্বরে কোনো অর্ডার পাওয়া যায়নি')}</div>
              </div>
            ) : (
              <div className="flex flex-col gap-3.5">
                {filteredOrders.map((o) => <OrderCard key={o.id} order={o} onInvoice={openInvoice} />)}
              </div>
            )}
          </>
        )}
      </div>

      <Footer />

      <LoginModal isOpen={loginOpen} onClose={() => setLoginOpen(false)} />
      <AccountPage isOpen={accountOpen} onClose={() => setAccountOpen(false)} currentUser={currentUser} />
    </>
  );
}
