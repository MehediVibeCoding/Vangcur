'use client';

import { useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { lockBody, unlockBody } from '@/lib/bodyScrollLock';
import { mapSupabaseOrderRow } from '@/lib/orderMapping';
import type { Order, OrderStatus } from '@/types';

interface TrackOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const STATUS_STEPS: { key: OrderStatus; label: string; icon: string }[] = [
  { key: 'pending', label: 'অর্ডার গ্রহণ করা হয়েছে', icon: '🧾' },
  { key: 'confirmed', label: 'কনফার্ম হয়েছে', icon: '✅' },
  { key: 'shipped', label: 'পাঠানো হয়েছে', icon: '🚚' },
  { key: 'delivered', label: 'ডেলিভারি সম্পন্ন', icon: '📦' },
];

export default function TrackOrderModal({ isOpen, onClose }: TrackOrderModalProps) {
  const supabase = useRef(createClient()).current;
  const [orderNum, setOrderNum] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (isOpen) lockBody();
    else unlockBody();
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setOrderNum('');
      setPhone('');
      setErr('');
      setOrder(null);
      setLoading(false);
    }
  }, [isOpen]);

  const handleSearch = async () => {
    const num = orderNum.trim().replace(/^#/, '');
    const ph = phone.trim();
    if (!num) { setErr('অর্ডার নম্বর দিন (যেমন VC-1082)'); return; }
    if (!ph || !/^01[3-9]\d{8}$/.test(ph)) { setErr('সঠিক মোবাইল নম্বর দিন (যে নম্বরে অর্ডার করেছিলেন)'); return; }
    setErr('');
    setLoading(true);
    setOrder(null);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .ilike('order_num', num)
        .maybeSingle();

      if (error || !data) {
        setErr('এই অর্ডার নম্বরে কোনো অর্ডার পাওয়া যায়নি। বানান/নম্বর আবার চেক করুন।');
        setLoading(false);
        return;
      }

      const mapped = mapSupabaseOrderRow(data as Record<string, unknown>);
      const orderPhone = (mapped.customer?.phone || '').replace(/\D/g, '');
      if (orderPhone && orderPhone !== ph) {
        setErr('অর্ডার নম্বর ও মোবাইল নম্বর মিলছে না। যে নম্বরে অর্ডার করেছিলেন সেটি দিন।');
        setLoading(false);
        return;
      }
      setOrder(mapped);
    } catch {
      setErr('কিছু একটা সমস্যা হয়েছে, একটু পরে আবার চেষ্টা করুন।');
    }
    setLoading(false);
  };

  const isCancelled = order && (order.status === 'cancelled' || order.status === 'rejected');
  const currentStepIdx = order ? STATUS_STEPS.findIndex((s) => s.key === order.status) : -1;

  const reset = () => { setOrder(null); setOrderNum(''); setPhone(''); setErr(''); };

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
            <h3 className="font-display text-base font-bold text-ink">📦 অর্ডার ট্র্যাক করুন</h3>
            <button className="flex h-8 w-8 items-center justify-center rounded-full text-lg text-muted hover:bg-surface-muted" onClick={onClose}>✕</button>
          </div>

          <div className="px-5 py-4">
            {!order ? (
              <>
                <div className="mb-3">
                  <label className="mb-1.5 block font-body text-[12.5px] font-bold text-ink">অর্ডার নম্বর</label>
                  <input
                    type="text" placeholder="যেমন: VC-1082" value={orderNum}
                    onChange={(e) => setOrderNum(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
                    className="w-full rounded-full border border-ink/[0.08] bg-surface-muted px-[18px] py-[12px] font-body text-sm text-ink outline-none focus:border-brand-primary/40 focus:bg-white"
                  />
                </div>
                <div className="mb-4">
                  <label className="mb-1.5 block font-body text-[12.5px] font-bold text-ink">মোবাইল নম্বর</label>
                  <input
                    type="tel" placeholder="যে নম্বরে অর্ডার করেছিলেন" value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
                    className="w-full rounded-full border border-ink/[0.08] bg-surface-muted px-[18px] py-[12px] font-body text-sm text-ink outline-none focus:border-brand-primary/40 focus:bg-white"
                  />
                </div>
                {err && <div className="mb-3 text-center font-body text-[12px] font-semibold text-[#DC2626]">{err}</div>}
                <button
                  onClick={handleSearch} disabled={loading}
                  className="w-full rounded-full bg-ink py-[13px] font-body text-[15px] font-bold text-white transition-brand duration-brand hover:bg-brand-primary disabled:opacity-70"
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
                  <button onClick={reset} className="font-body text-[12px] font-semibold text-brand-primary hover:underline">অন্য অর্ডার</button>
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
                    {STATUS_STEPS.map((step, idx) => {
                      const done = idx <= currentStepIdx;
                      const isLast = idx === STATUS_STEPS.length - 1;
                      return (
                        <div key={step.key} className="flex gap-3">
                          <div className="flex flex-col items-center">
                            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm ${done ? 'bg-brand-primary text-white' : 'bg-surface-muted text-muted'}`}>
                              {step.icon}
                            </div>
                            {!isLast && <div className={`w-[2px] flex-1 ${idx < currentStepIdx ? 'bg-brand-primary' : 'bg-border-base'}`} style={{ minHeight: 24 }} />}
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
                        <span className="ml-2 whitespace-nowrap font-semibold">{i.qty} × ৳{i.price.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 flex items-center justify-between border-t border-border-base pt-2 font-body text-[13px] font-bold text-ink">
                    <span>মোট (শিপিং সহ):</span><span>৳{(order.total || 0).toLocaleString()}</span>
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
