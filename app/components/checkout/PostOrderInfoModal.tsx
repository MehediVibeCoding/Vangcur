'use client';

import { useEffect, useState } from 'react';
import { lockBody, unlockBody } from '@/lib/bodyScrollLock';
import { SHOW_POST_ORDER_INFO_EVENT } from '@/lib/uiEvents';

const STEPS = [
  { icon: '🧾', title: 'অর্ডার যাচাই', desc: 'আপনার পেমেন্ট তথ্য যাচাই করে অর্ডারটি কনফার্ম করা হবে (সাধারণত কয়েক ঘণ্টার মধ্যে)।' },
  { icon: '📦', title: 'প্যাকেজিং', desc: 'কনফার্ম হওয়ার পর পণ্যটি সতর্কতার সাথে প্যাক করে কুরিয়ারে পাঠানো হবে।' },
  { icon: '🚚', title: 'ডেলিভারি', desc: 'ঢাকার ভেতরে সাধারণত ১-২ দিন, ঢাকার বাইরে ২-৪ দিন সময় লাগতে পারে।' },
  { icon: '💵', title: 'বাকি বিল পরিশোধ', desc: 'পণ্য হাতে পাওয়ার সময় বাকি বিল ক্যাশ অন ডেলিভারিতে পরিশোধ করবেন।' },
];

export default function PostOrderInfoModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onShow = () => setOpen(true);
    window.addEventListener(SHOW_POST_ORDER_INFO_EVENT, onShow);
    return () => window.removeEventListener(SHOW_POST_ORDER_INFO_EVENT, onShow);
  }, []);

  useEffect(() => {
    if (open) lockBody();
    else unlockBody();
  }, [open]);

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-[95] bg-black/55" onClick={() => setOpen(false)} />
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div className="max-h-[85vh] w-full max-w-[420px] overflow-y-auto rounded-brand bg-white shadow-sh3">
          <div className="flex items-center justify-between border-b border-border-base px-5 py-4">
            <h3 className="font-display text-base font-bold text-ink">এরপর কী হবে?</h3>
            <button className="flex h-8 w-8 items-center justify-center rounded-full text-lg text-muted hover:bg-surface-muted" onClick={() => setOpen(false)}>✕</button>
          </div>
          <div className="px-5 py-4">
            {STEPS.map((s, idx) => (
              <div key={s.title} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-muted text-base">
                    {s.icon}
                  </div>
                  {idx < STEPS.length - 1 && <div className="w-[2px] flex-1 bg-border-base" style={{ minHeight: 20 }} />}
                </div>
                <div className="pb-5 pt-1">
                  <div className="font-body text-[13px] font-bold text-ink">{s.title}</div>
                  <div className="mt-0.5 font-body text-[12px] leading-[1.6] text-muted">{s.desc}</div>
                </div>
              </div>
            ))}
            <div className="mt-1 rounded-[10px] bg-surface-muted px-3.5 py-3 font-body text-[12px] leading-[1.6] text-ink">
              কোনো প্রশ্ন থাকলে ফুটারে দেওয়া নাম্বারে কল বা WhatsApp করুন — আমরা সবসময় পাশে আছি।
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
