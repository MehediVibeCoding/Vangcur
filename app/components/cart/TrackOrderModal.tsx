'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { lockBody, unlockBody } from '@/lib/bodyScrollLock';
import { fetchFullOrder, readPendingOrder, readLatestGuestOrder, ORDER_TRACK_STEPS } from '@/lib/orderStatus';
import { mapSupabaseOrderRow } from '@/lib/orderMapping';
import { useAuthStore } from '@/lib/store/authStore';
import { GENERATE_INVOICE_EVENT } from '@/lib/uiEvents';
import { useT } from '@/lib/i18n/useT';
import type { Order } from '@/types';

interface TrackOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// এই মডালটা এখন লগইন-স্ট্যাটাস অনুযায়ী ৪টা অবস্থা হ্যান্ডেল করে:
// ১. লগইন নেই + কখনো অর্ডার করেনি      → "এখনো অর্ডার করেননি" নোটিশ
// ২. লগইন নেই + এই ব্রাউজারে অর্ডার আছে → সেই অর্ডার automatic দেখায়
// ৩ ও ৪. লগইন আছে (অর্ডার থাকুক বা না থাকুক) → /account/orders এ রিডাইরেক্ট
//        (ওখানে state ৩/৪ already সঠিকভাবে হ্যান্ডেল করা আছে)
//
// ইচ্ছাকৃতভাবে কোনো phone-সার্চ ইনপুট নেই — guest-এর নিজের অর্ডার automatic
// শনাক্ত হয় (checkout করার সময় স্থানীয়ভাবে সেভ হওয়া phone দিয়ে, একটা
// SECURITY DEFINER RPC-এর মাধ্যমে), ইউজারকে টাইপ করতে হয় না।
export default function TrackOrderModal({ isOpen, onClose }: TrackOrderModalProps) {
  const { t } = useT();
  const router = useRouter();
  const supabase = useRef(createClient()).current;
  const currentUser = useAuthStore((s) => s.currentUser);
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<Order | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (isOpen) lockBody();
    else unlockBody();
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
  }, [isOpen, currentUser]);

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
      <div
        className={`fixed inset-0 z-[70] bg-black/50 transition-opacity duration-brand ${isOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'}`}
        onClick={onClose}
      />
      <div
        className={`fixed inset-0 z-[75] flex items-center justify-center p-4 transition-opacity duration-brand ${isOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'}`}
      >
        <div className="max-h-[90vh] w-full max-w-[420px] overflow-y-auto rounded-brand bg-white shadow-sh3">
          <div className="flex items-center justify-between border-b border-border-base px-5 py-4">
            <h3 className="font-display text-base font-bold text-ink">{t('📦 অর্ডার ট্র্যাক করুন')}</h3>
            <button className="flex h-8 w-8 items-center justify-center rounded-full text-lg text-muted hover:bg-surface-muted" onClick={onClose}>✕</button>
          </div>

          <div className="px-5 py-4">
            {loading && (
              <div className="py-8 text-center font-body text-[13px] text-muted">{t('⏳ লোড হচ্ছে...')}</div>
            )}

            {!loading && notFound && (
              <div className="py-6 text-center">
                <div className="mb-2 text-3xl">🧾</div>
                <div className="mb-2 font-body text-sm font-bold text-ink">{t('এখনো কোনো অর্ডার করেননি')}</div>
                <p className="font-body text-[12.5px] leading-[1.7] text-muted">
                  {t('অর্ডার করলে সেটি এখানে স্বয়ংক্রিয়ভাবে দেখা যাবে।')}<br />
                  {t('ভবিষ্যতে যেকোনো ডিভাইস থেকে অর্ডার ট্র্যাক করতে ওয়েবসাইটের')}{' '}
                  <strong>{t('লগইন বাটন')}</strong>{t('-এ ক্লিক করে লগইন করে রাখুন।')}
                </p>
              </div>
            )}

            {!loading && order && (
              <>
                <div className="mb-3.5 rounded-[10px] border border-[#FED7AA] bg-[#FFF7ED] px-3.5 py-[10px] font-body text-[11.5px] leading-[1.6] text-[#92400E]">
                  {t('⚠️ এই অর্ডারের তথ্য শুধু এই ব্রাউজারে সংরক্ষিত আছে। অন্য ডিভাইসে ট্র্যাক করতে লগইন করুন, অথবা WhatsApp-এ যোগাযোগ করুন।')}
                </div>

                <div className="mb-4 flex items-center justify-between rounded-[12px] bg-surface-muted px-4 py-3">
                  <div>
                    <div className="font-body text-sm font-bold text-ink">{order.orderNum}</div>
                    <div className="font-body text-[11.5px] text-muted">{new Date(order.date).toLocaleDateString('bn-BD', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                  </div>
                  <button onClick={openInvoice} className="font-body text-[12px] font-semibold text-brand-light hover:underline">{t('ইনভয়েস')}</button>
                </div>

                {isCancelled ? (
                  <div className="mb-4 rounded-[12px] bg-[#FEE2E2] px-4 py-4 text-center">
                    <div className="mb-1 text-2xl">❌</div>
                    <div className="font-body text-sm font-bold text-[#991B1B]">
                      {t(order.status === 'rejected' ? 'অর্ডারটি বাতিল করা হয়েছে' : 'অর্ডারটি ক্যান্সেল করা হয়েছে')}
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
                            {t(step.label)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="rounded-[12px] border border-border-base p-3">
                  <div className="mb-2 font-body text-[12px] font-bold text-ink">{t('অর্ডার সারমর্ম')}</div>
                  <div className="flex flex-col gap-1.5">
                    {(order.items || []).map((i, idx) => (
                      <div key={idx} className="flex items-center justify-between font-body text-[12.5px] text-ink">
                        <span className="min-w-0 flex-1 truncate">{i.name}</span>
                        <span className="ml-2 whitespace-nowrap font-semibold">{i.qty} × ৳{i.price.toLocaleString('en-US')}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 flex items-center justify-between border-t border-border-base pt-2 font-body text-[13px] font-bold text-ink">
                    <span>{t('মোট (শিপিং সহ):')}</span><span>৳{(order.total || 0).toLocaleString('en-US')}</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
