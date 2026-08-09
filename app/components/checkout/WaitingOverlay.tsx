'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { lockBody, unlockBody } from '@/lib/bodyScrollLock';
import { fetchFullOrder, subscribeOrderRealtime } from '@/lib/orderStatus';
import { mapSupabaseOrderRow } from '@/lib/orderMapping';
import {
  OPEN_WAIT_OVERLAY_EVENT, OPEN_TRACK_ORDER_EVENT, SHOW_BG_CONFIRM_EVENT, SHOW_POST_ORDER_INFO_EVENT,
} from '@/lib/uiEvents';
import type { Order, OrderStatus } from '@/types';

const PENDING_MAX_AGE_MS = 48 * 60 * 60 * 1000;

function clearPendingStorage() {
  try {
    localStorage.removeItem('vc_pending_ls');
    localStorage.removeItem('vc_pending_num_ls');
    localStorage.removeItem('vc_pending_ts');
  } catch {
    // ignore
  }
}

const RESOLVED: OrderStatus[] = ['confirmed', 'shipped', 'delivered', 'cancelled', 'rejected'];

export default function WaitingOverlay() {
  const supabase = useRef(createClient()).current;
  const [visible, setVisible] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [status, setStatus] = useState<OrderStatus>('pending');
  const minimizedRef = useRef(false);
  const orderRef = useRef<Order | null>(null);

  useEffect(() => { minimizedRef.current = minimized; }, [minimized]);
  useEffect(() => { orderRef.current = order; }, [order]);

  const openForPending = useCallback(async (id: string, orderNum: string) => {
    setOrderId(id);
    setVisible(true);
    setMinimized(false);
    setStatus('pending');
    const data = await fetchFullOrder(supabase, id);
    if (data) {
      const mapped = mapSupabaseOrderRow(data as Record<string, unknown>);
      setOrder(mapped);
      setStatus(mapped.status);
    } else {
      setOrder({
        id, orderNum, date: new Date().toISOString(), status: 'pending', total: 0, items: [], customer: {},
      });
    }
  }, [supabase]);

  useEffect(() => {
    try {
      const id = localStorage.getItem('vc_pending_ls');
      const num = localStorage.getItem('vc_pending_num_ls');
      const ts = parseInt(localStorage.getItem('vc_pending_ts') || '0', 10);
      if (id && num && ts && Date.now() - ts < PENDING_MAX_AGE_MS) {
        openForPending(id, num);
      } else if (id) {
        clearPendingStorage();
      }
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onOpen = () => {
      if (orderRef.current) {
        setVisible(true);
        setMinimized(false);
      }
    };
    window.addEventListener(OPEN_WAIT_OVERLAY_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_WAIT_OVERLAY_EVENT, onOpen);
  }, []);

  useEffect(() => {
    if (!orderId) return undefined;
    const unsubscribe = subscribeOrderRealtime(supabase, orderId, (newStatus) => {
      setStatus(newStatus);
      setOrder((prev) => (prev ? { ...prev, status: newStatus } : prev));
      if (RESOLVED.includes(newStatus) && newStatus !== 'pending') {
        clearPendingStorage();
      }
      if (minimizedRef.current && newStatus === 'confirmed') {
        const num = orderRef.current?.orderNum;
        window.dispatchEvent(new CustomEvent(SHOW_BG_CONFIRM_EVENT, { detail: { orderNum: num } }));
      }
    });
    return unsubscribe;
  }, [orderId, supabase]);

  useEffect(() => {
    if (visible && !minimized) lockBody();
    else unlockBody();
  }, [visible, minimized]);

  if (!visible || !order) return null;

  const isPending = status === 'pending';
  const isRejected = status === 'cancelled' || status === 'rejected';
  const isResolvedPositive = status === 'confirmed' || status === 'shipped' || status === 'delivered';

  const dismiss = () => {
    clearPendingStorage();
    setVisible(false);
    setMinimized(false);
  };

  if (minimized) {
    return (
      <button
        onClick={() => setMinimized(false)}
        className="fixed bottom-24 right-4 z-[65] flex items-center gap-2 rounded-full bg-ink px-4 py-2.5 font-body text-[12.5px] font-semibold text-white shadow-sh3 transition-brand duration-brand hover:bg-brand-primary"
      >
        <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-[#F59E0B]" />
        {order.orderNum} প্রসেস হচ্ছে...
      </button>
    );
  }

  return (
    <>
      <div className="fixed inset-0 z-[85] bg-black/55" />
      <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
        <div className="w-full max-w-[420px] overflow-hidden rounded-brand bg-white shadow-sh3">
          <div className="flex items-center justify-between border-b border-border-base px-5 py-4">
            <h3 className="font-display text-base font-bold text-ink">
              {isPending && '⏳ অর্ডার প্রসেস হচ্ছে'}
              {isResolvedPositive && '🎉 অর্ডার কনফার্ম হয়েছে'}
              {isRejected && '❌ অর্ডার বাতিল হয়েছে'}
            </h3>
            <button
              className="flex h-8 w-8 items-center justify-center rounded-full text-lg text-muted hover:bg-surface-muted"
              onClick={() => (isPending ? setMinimized(true) : dismiss())}
              title={isPending ? 'মিনিমাইজ করুন' : 'বন্ধ করুন'}
            >
              {isPending ? '—' : '✕'}
            </button>
          </div>

          <div className="px-5 py-5">
            <div className="mb-4 flex flex-col items-center text-center">
              <div className={`mb-3 flex h-16 w-16 items-center justify-center rounded-full text-3xl ${
                isPending ? 'bg-[#FEF3C7]' : isRejected ? 'bg-[#FEE2E2]' : 'bg-[#D1FAE5]'
              }`}
              >
                {isPending && <span className="inline-block animate-spin">⏳</span>}
                {isResolvedPositive && '🎉'}
                {isRejected && '❌'}
              </div>
              <div className="font-body text-sm font-bold text-ink">{order.orderNum}</div>
              {isPending && (
                <p className="mt-2 font-body text-[13px] leading-[1.6] text-muted">
                  আপনার অর্ডারটি যাচাই করা হচ্ছে। কনফার্ম হলে সাথে সাথে জানিয়ে দেওয়া হবে — চাইলে এই পেজ ছেড়ে যেতে পারেন।
                </p>
              )}
              {isResolvedPositive && (
                <p className="mt-2 font-body text-[13px] leading-[1.6] text-muted">
                  ধন্যবাদ! আপনার অর্ডারটি কনফার্ম করা হয়েছে এবং শীঘ্রই পাঠানো হবে।
                </p>
              )}
              {isRejected && (
                <p className="mt-2 font-body text-[13px] leading-[1.6] text-muted">
                  দুঃখিত, অর্ডারটি বাতিল করা হয়েছে। বিস্তারিত জানতে আমাদের সাথে যোগাযোগ করুন।
                </p>
              )}
            </div>

            <div className="flex gap-[9px]">
              <button
                onClick={() => window.dispatchEvent(new CustomEvent(SHOW_POST_ORDER_INFO_EVENT))}
                className="flex-1 rounded-[10px] bg-surface-muted px-4 py-2.5 font-body text-[12.5px] font-semibold text-ink transition-brand duration-brand hover:bg-border-base"
              >
                এরপর কী হবে?
              </button>
              <button
                onClick={() => window.dispatchEvent(new CustomEvent(OPEN_TRACK_ORDER_EVENT))}
                className="flex-1 rounded-[10px] bg-ink px-4 py-2.5 font-body text-[12.5px] font-bold text-white transition-brand duration-brand hover:bg-brand-primary"
              >
                বিস্তারিত ট্র্যাক করুন
              </button>
            </div>
            {!isPending && (
              <button
                onClick={dismiss}
                className="mt-2.5 w-full rounded-[10px] px-4 py-2 font-body text-[12.5px] font-semibold text-muted hover:underline"
              >
                বন্ধ করুন
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
          }
