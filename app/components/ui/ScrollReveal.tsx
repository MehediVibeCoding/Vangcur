// GitHub পাথ: app/components/ui/ScrollReveal.tsx — নতুন ফাইল
'use client';

/**
 * ScrollReveal
 * ─────────────────────────────────────────────────────────────────────
 * হোমপেজের সেকশনগুলো (Categories, ProductGrid, CustomerGallery, FAQ,
 * About) স্ক্রল করে নিচে নামলে একবার নিচ থেকে হালকা glide করে ফুটে উঠবে।
 * Motion-এর built-in `whileInView` ব্যবহার করা হয়েছে বলে আলাদা করে
 * IntersectionObserver লেখার দরকার নেই। `viewport={{ once: true }}`
 * দেওয়া আছে — মানে একবার দেখানোর পর স্ক্রল আপ-ডাউন করলে বারবার রিপ্লে
 * হবে না (বিরক্তিকর লাগবে না)।
 *
 * ব্যবহার: <ScrollReveal><Categories ... /></ScrollReveal>
 */

import { motion } from 'motion/react';
import type { ReactNode } from 'react';

interface ScrollRevealProps {
  children: ReactNode;
  /** একাধিক সেকশন পরপর থাকলে সামান্য ভিন্ন ভিন্ন ডিলে দিতে চাইলে */
  delay?: number;
  className?: string;
}

export default function ScrollReveal({ children, delay = 0, className = '' }: ScrollRevealProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.55, delay, ease: [0.4, 0, 0.2, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
