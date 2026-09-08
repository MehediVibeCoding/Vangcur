// GitHub পাথ: app/components/layout/PageTransition.tsx — এডিট (crossfade ফিক্স)
'use client';

/**
 * PageTransition
 * ─────────────────────────────────────────────────────────────────────
 * পুরো পেজ-টু-পেজ নেভিগেশনের (প্রোডাক্ট পেজ ↔ হোমপেজ ইত্যাদি) জন্য একটা
 * consistent fade transition। এটা ছাড়া Next.js ডিফল্টভাবে কোনো animation
 * ছাড়াই instant DOM swap করে — তাই back করলে কখনো smooth লাগে, কখনো
 * জার্কি/কাটা-কাটা লাগে। এই wrapper সেই randomness বাদ দিয়ে সবসময় একই
 * animation দেখাবে — router.push(), হার্ডওয়্যার ব্যাক বাটন, বা system
 * swipe gesture — যেভাবেই route বদলাক না কেন।
 *
 * ⚠️ আগে mode="wait" ছিল — পুরনো পেজ সম্পূর্ণ fade-out হওয়ার *পরে* নতুন
 * পেজ fade-in শুরু হতো (sequential)। দুটো fade একটার পর একটা চলায় মাঝে
 * ~300ms ধরে কোনো পেজের কন্টেন্টই দৃশ্যমান থাকতো না — শুধু body-র নিচের
 * background gradient আর floating বাটন (PageTransition-এর বাইরের জিনিস)
 * দেখা যেত (খালি নীল স্ক্রিন হিসেবে)।
 *
 * এখন mode বাদ দেওয়া হয়েছে (default "sync") — পুরনো পেজ fade-out আর নতুন
 * পেজ fade-in একসাথে/একই সময়ে চলে (crossfade), তাই যেকোনো মুহূর্তে
 * কমপক্ষে একটা পেজের কন্টেন্ট (বা দুটোর ব্লেন্ড) স্ক্রিনে থাকে — background
 * কখনো ফাঁকা দেখা যায় না।
 *
 * "grid" + প্রতিটা child-কে একই grid cell-এ (col-start-1 row-start-1)
 * বসিয়ে দুটো পেজ ঠিক একই জায়গায় ওভারল্যাপ করে বসানো হচ্ছে — তাই crossfade
 * চলাকালীন দুই পেজের height যোগ হয়ে লে-আউট লাফায় না বা স্ক্রলবার বড়
 * হয়ে যায় না।
 *
 * শুধু pathname বদলালেই (আসল route change) ট্রানজিশন চলে — মডাল/ড্রয়ার
 * ওপেন হওয়ার সময় (useHistoryModal.ts যেভাবে history.pushState করে,
 * pathname না বদলে) এটা ট্রিগার হবে না, যেটাই আমরা চাই।
 */

import { AnimatePresence, motion } from 'motion/react';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

const EASE_BRAND = [0.4, 0, 0.2, 1] as const;

export default function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="grid">
      <AnimatePresence initial={false}>
        <motion.div
          key={pathname}
          className="col-start-1 row-start-1"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { duration: 0.22, ease: EASE_BRAND } }}
          exit={{ opacity: 0, transition: { duration: 0.22, ease: EASE_BRAND } }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
