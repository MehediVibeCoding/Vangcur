'use client';

import { useEffect, useRef } from 'react';
import type { MutableRefObject } from 'react';

/**
 * FAQ/অ্যাকর্ডিয়নে একটা আইটেম খোলা রেখে স্ক্রল করে চলে গেলে (উপরে বা নিচে — আইটেমের
 * কার্ড পুরোপুরি স্ক্রিনের বাইরে গেলে) সেটা অটো-বন্ধ করে দেয়।
 *
 * একটা সূক্ষ্ম সমস্যা: আইটেমটা স্ক্রিনের *উপরে* থাকা অবস্থায় বন্ধ হলে তার উত্তরের
 * উচ্চতা বাদ যায়, ফলে নিচের কনটেন্ট হঠাৎ উপরে লাফিয়ে ওঠে (iOS Safari-তে scroll
 * anchoring নেই)। তাই এই ক্ষেত্রে ফেড-ক্লোজ চলাকালীন প্রতি ফ্রেমে উচ্চতার
 * পরিবর্তন মেপে window-কে ঠিক সমপরিমাণ স্ক্রল করে দেওয়া হয় — ব্যবহারকারী কোনো
 * লাফ টের পায় না।
 *
 * ব্যবহার:
 *   const itemRefs = useRef<(HTMLElement | null)[]>([]);
 *   useCloseWhenOffscreen(openIndex, itemRefs, () => setOpenIndex(null));
 *   ... <div ref={(el) => { itemRefs.current[i] = el; }}> ... </div>
 */
export default function useCloseWhenOffscreen(
  openIndex: number | null,
  itemRefs: MutableRefObject<(HTMLElement | null)[]>,
  onClose: () => void,
): void {
  const onCloseRef = useRef(onClose);
  const rafRef = useRef(0);
  useEffect(() => { onCloseRef.current = onClose; }, [onClose]);
  // কম্পোনেন্ট আনমাউন্ট হলে চলমান স্ক্রল-কম্পেনসেশন লুপ থামাই
  useEffect(() => () => { cancelAnimationFrame(rafRef.current); }, []);

  useEffect(() => {
    if (openIndex === null) return undefined;
    const el = itemRefs.current[openIndex];
    if (!el || typeof IntersectionObserver === 'undefined') return undefined;

    const observer = new IntersectionObserver((entries) => {
      const entry = entries[entries.length - 1];
      if (!entry || entry.isIntersecting) return;

      const wasAbove = entry.boundingClientRect.bottom <= 0;
      let lastHeight = el.offsetHeight;
      onCloseRef.current();

      if (!wasAbove) return; // নিচে থাকলে স্ক্রল পজিশনে কোনো প্রভাব পড়ে না

      const startedAt = performance.now();
      const tick = () => {
        const h = el.offsetHeight;
        if (h !== lastHeight) {
          window.scrollBy({ top: h - lastHeight, left: 0, behavior: 'instant' as ScrollBehavior });
          lastHeight = h;
        }
        if (performance.now() - startedAt < 450) rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    }, { threshold: 0 });

    observer.observe(el);
    // cleanup-এ rafRef ইচ্ছাকৃতভাবে cancel করা হয় না: openIndex null হয়ে এই cleanup চললেও
    // কম্পেনসেশন লুপটা নিজে ৪৫০ms-এ শেষ হওয়া পর্যন্ত চলতে দিতে হবে।
    return () => observer.disconnect();
  }, [openIndex, itemRefs]);
}
