// GitHub পাথ: app/components/ui/SkeletonTransition.tsx — নতুন ফাইল
'use client';

/**
 * SkeletonTransition
 * ─────────────────────────────────────────────────────────────────────
 * স্কেলেটন হঠাৎ উধাও হয়ে আসল কনটেন্ট হঠাৎ পপ করে আসা — এই "ধাক্কা"
 * এড়াতে এই wrapper ব্যবহার করা হবে। skeleton আর content দুটোই একই
 * জায়গায় (absolute grid-stack) বসানো থাকে, তাই সাইজ/পজিশন মিলে যায়
 * এবং AnimatePresence দিয়ে opacity ক্রসফেড overlap করে — একটা সেকেন্ডের
 * জন্যও স্ক্রিন খালি বা "জাম্প" করা লাগে না।
 *
 * এটা client-state-চালিত loading (isLoading বুলিয়ান আছে এমন কম্পোনেন্ট,
 * যেমন CartSidebar-এর আইটেম লিস্ট, প্রোডাক্ট গ্যালারি) এর জন্য। রুট-লেভেল
 * app/loading.tsx (Suspense fallback) আলাদা মেকানিজম — সেটার জন্য
 * ভবিষ্যতে Next.js-এর View Transitions ইন্টিগ্রেশন আলাদাভাবে দেখা হবে।
 *
 * ব্যবহার:
 *   <SkeletonTransition isReady={!isLoading} skeleton={<MySkeleton />}>
 *     <ActualContent />
 *   </SkeletonTransition>
 */

import { AnimatePresence, motion } from 'motion/react';
import type { ReactNode } from 'react';

interface SkeletonTransitionProps {
  isReady: boolean;
  skeleton: ReactNode;
  children: ReactNode;
  className?: string;
}

const EASE_BRAND = [0.4, 0, 0.2, 1] as const;

const fade = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.26, ease: EASE_BRAND } },
  exit: { opacity: 0, transition: { duration: 0.22, ease: EASE_BRAND } },
};

export default function SkeletonTransition({
  isReady,
  skeleton,
  children,
  className = '',
}: SkeletonTransitionProps) {
  return (
    // mode দেওয়া হয়নি ইচ্ছাকৃতভাবে — ডিফল্ট "sync" মোডে exiting skeleton
    // আর entering content একসাথে ওভারল্যাপ করে ফেড হয়, যেটাই crossfade।
    <AnimatePresence initial={false}>
      {!isReady ? (
        <motion.div key="skeleton" {...fade} className={className}>
          {skeleton}
        </motion.div>
      ) : (
        <motion.div key="content" {...fade} className={className}>
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
