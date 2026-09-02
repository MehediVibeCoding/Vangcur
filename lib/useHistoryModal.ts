'use client';

import { useEffect, useRef } from 'react';

/**
 * useHistoryModal
 * ─────────────────────────────────────────────────────────────────────
 * মোবাইলের ফিজিক্যাল/জেসচার ব্যাক বাটন অথবা ব্রাউজারের ব্যাক বাটন
 * চাপলে ওয়েবসাইট ব্যাকে না গিয়ে ওপেন থাকা মডাল/ড্রয়ারটি বন্ধ করার
 * সেন্ট্রালাইজড ইউনিভার্সাল হুক।
 *
 * ব্যবহার:
 *   useHistoryModal(isOpen, onClose);
 */
export function useHistoryModal(isOpen: boolean, onClose: () => void, modalKey?: string) {
  const isPushedRef = useRef(false);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (isOpen) {
      window.history.pushState({ modalOpen: true, key: modalKey || 'vc-modal' }, '');
      isPushedRef.current = true;

      const onPopState = () => {
        if (isPushedRef.current) {
          isPushedRef.current = false;
          onCloseRef.current();
        }
      };

      window.addEventListener('popstate', onPopState);

      return () => {
        window.removeEventListener('popstate', onPopState);
        if (isPushedRef.current) {
          isPushedRef.current = false;
          window.history.back();
        }
      };
    } else {
      isPushedRef.current = false;
    }
  }, [isOpen, modalKey]);
}

export default useHistoryModal;
