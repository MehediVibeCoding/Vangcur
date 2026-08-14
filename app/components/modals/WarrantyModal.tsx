'use client';

import { useEffect, useMemo } from 'react';
import { getWarrantyModalContent } from '@/lib/warrantyData';
import { lockBody, unlockBody } from '@/lib/bodyScrollLock';

interface WarrantyModalProps {
  isOpen: boolean;
  onClose: () => void;
  warrantyText?: string;
}

export default function WarrantyModal({ isOpen, onClose, warrantyText }: WarrantyModalProps) {
  const content = useMemo(() => getWarrantyModalContent(warrantyText), [warrantyText]);

  useEffect(() => {
    if (isOpen) lockBody();
    else unlockBody();
    return () => unlockBody();
  }, [isOpen]);

  return (
    <div
      className={`fixed inset-0 z-[70] transition-opacity duration-brand ${isOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'}`}
    >
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div
        className={`absolute inset-x-0 bottom-0 mx-auto max-h-[85vh] w-full max-w-[480px] overflow-y-auto rounded-t-[20px] bg-white px-5 pb-6 pt-3 shadow-sh3 transition-transform duration-brand ${isOpen ? 'translate-y-0' : 'translate-y-full'}`}
      >
        <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-border-base" />
        <div className="mb-2.5 inline-block rounded-full bg-brand-bg px-2.5 py-1 text-[11px] font-bold text-brand-light">
          🛡️ ওয়ারেন্টি তথ্য
        </div>
        <div className="mb-2 font-display text-[17px] font-bold text-ink">{content.title}</div>
        <p className="mb-4 text-[13px] leading-[1.7] text-muted">{content.body}</p>
        <ul className="mb-5 flex flex-col gap-2.5">
          {content.rules.map((r, i) => (
            <li key={i} className="flex items-start gap-2.5 text-[13px] leading-[1.6] text-ink">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-bg text-[11px] font-bold text-brand-light">
                {i + 1}
              </span>
              <span>{r}</span>
            </li>
          ))}
        </ul>
        <button
          className="w-full rounded-[9px] border-none bg-ink py-3 font-body text-sm font-bold text-white transition-brand duration-brand hover:bg-brand-light"
          onClick={onClose}
        >
          বুঝেছি
        </button>
      </div>
    </div>
  );
}
