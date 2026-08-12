'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { fetchFullOrder } from '@/lib/orderStatus';
import { mapSupabaseOrderRow } from '@/lib/orderMapping';
import { lockBody, unlockBody } from '@/lib/bodyScrollLock';
import { GENERATE_INVOICE_EVENT } from '@/lib/uiEvents';
import type { Order, OrderStatus } from '@/types';

const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: 'পেন্ডিং',
  confirmed: 'কনফার্ম হয়েছে',
  shipped: 'পাঠানো হয়েছে',
  delivered: 'ডেলিভারি সম্পন্ন',
  cancelled: 'বাতিল',
  rejected: 'প্রত্যাখ্যাত',
};

export default function InvoiceModal() {
  const [orderId, setOrderId] = useState<string | number | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const onOpen = (e: Event) => {
      const d = (e as CustomEvent<{ orderId: string | number }>).detail;
      if (d?.orderId !== undefined) setOrderId(d.orderId);
    };
    window.addEventListener(GENERATE_INVOICE_EVENT, onOpen);
    return () => window.removeEventListener(GENERATE_INVOICE_EVENT, onOpen);
  }, []);

  useEffect(() => {
    if (orderId === null) { setOrder(null); return; }
    setLoading(true);
    const supabase = createClient();
    fetchFullOrder(supabase, orderId).then((row) => {
      setOrder(row ? mapSupabaseOrderRow(row as Record<string, unknown>) : null);
      setLoading(false);
    });
  }, [orderId]);

  useEffect(() => {
    if (orderId !== null) lockBody();
    else unlockBody();
    return () => unlockBody();
  }, [orderId]);

  const isOpen = orderId !== null;
  const close = () => { setOrderId(null); setOrder(null); };
  const balance = order ? Math.max(0, order.total - (order.advancePaid || 0)) : 0;

  return (
    <>
      <div className={`fixed inset-0 z-[70] bg-black/50 transition-opacity duration-brand print:hidden ${isOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'}`} onClick={close} />
      <div className={`fixed inset-0 z-[75] flex items-center justify-center p-4 transition-opacity duration-brand ${isOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'}`}>
        <div className="max-h-[90vh] w-full max-w-[440px] overflow-y-auto rounded-brand bg-white shadow-sh3">
          <div className="flex items-center justify-between border-b border-border-base px-5 py-4 print:hidden">
            <h3 className="font-display text-base font-bold text-ink">🧾 ইনভয়েস</h3>
            <div className="flex items-center gap-2">
              <button onClick={() => window.print()} className="rounded-full border border-border-base px-3 py-1.5 font-body text-[12px] font-semibold text-ink hover:bg-surface-muted">প্রিন্ট</button>
              <button className="flex h-8 w-8 items-center justify-center rounded-full text-lg text-muted hover:bg-surface-muted" onClick={close}>✕</button>
            </div>
          </div>
          <div className="px-5 py-4">
            {loading && <div className="py-8 text-center font-body text-[13px] text-muted">লোড হচ্ছে...</div>}
            {!loading && !order && <div className="py-8 text-center font-body text-[13px] text-muted">অর্ডার পাওয়া যায়নি</div>}
            {order && (
              <>
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <div className="font-body text-sm font-bold text-ink">{order.orderNum}</div>
                    <div className="font-body text-[11.5px] text-muted">{new Date(order.date).toLocaleDateString('bn-BD', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                  </div>
                  <span className="rounded-full bg-surface-muted px-2.5 py-1 font-body text-[11px] font-semibold text-ink">{STATUS_LABEL[order.status] || order.status}</span>
                </div>
                <div className="mb-3 rounded-[10px] border border-border-base p-3">
                  {order.items.map((i, idx) => (
                    <div key={idx} className="flex justify-between py-1 font-body text-[12.5px] text-ink/80">
                      <span>{i.name} × {i.qty}</span>
                      <span>৳{(i.price * i.qty).toLocaleString()}</span>
                    </div>
                  ))}
                  <div className="my-2 h-px border-t border-dashed border-border-base" />
                  <div className="flex justify-between py-1 font-body text-[12.5px] text-ink/80"><span>Subtotal</span><span>৳{(order.subtotal || 0).toLocaleString()}</span></div>
                  <div className="flex justify-between py-1 font-body text-[12.5px] text-ink/80"><span>শিপিং চার্জ</span><span>৳{(order.shippingCost || 0).toLocaleString()}</span></div>
                  <div className="my-2 h-px border-t-2 border-dashed border-border-base" />
                  <div className="flex justify-between font-body text-[14px] font-extrabold text-ink"><span>সর্বমোট</span><span>৳{order.total.toLocaleString()}</span></div>
                  <div className="flex justify-between py-1 font-body text-[12.5px] font-semibold text-info"><span>Paid (bKash Advance)</span><span>- ৳{(order.advancePaid || 0).toLocaleString()}</span></div>
                  <div className="flex justify-between py-1 font-body text-[13px] font-bold text-ink"><span>বাকি বিল (COD)</span><span>৳{balance.toLocaleString()}</span></div>
                </div>
                <div className="rounded-[10px] border border-border-base p-3">
                  <div className="mb-1.5 font-body text-[11px] font-bold uppercase tracking-wide text-muted">ডেলিভারি ঠিকানা</div>
                  <div className="font-body text-[12.5px] leading-[1.7] text-ink/80">
                    {order.customer.name}<br />
                    {order.customer.phone}<br />
                    {order.customer.district}{order.customer.district && order.customer.address ? ', ' : ''}{order.customer.address}
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
