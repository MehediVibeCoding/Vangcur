'use client';

import { useEffect, useRef, useState } from 'react';
import { WISHLIST_FLY_EVENT, WISHLIST_NAV_HIT_EVENT } from '@/lib/uiEvents';

// ছোঁড়া থেকে Navbar আইকনে পৌঁছাতে যত সময় লাগবে (ms) — Navbar.tsx-এর
// জিগল/লিকুইড-ফিল সিকোয়েন্স এই একই সময়ের সাথে সিঙ্ক করে "হিট" ইভেন্ট শোনে।
const FLIGHT_MS = 620;

interface FlyItem {
  id: number;
  x: number;
  y: number;
  scale: number;
  opacity: number;
}

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && !!window.matchMedia
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// প্রোডাক্ট কার্ড/প্রোডাক্ট পেজের হার্ট বাটনে ক্লিক করে wishlist-এ কিছু যোগ
// করলে (শুধু যোগ হলেই, রিমুভ হলে না — সেটা ডিসপ্যাচ করার সময়ই নিশ্চিত করা
// হয়েছে) এই কম্পোনেন্ট একটা ছোট হার্ট আইকন ওই বাটনের অবস্থান থেকে Navbar-এর
// wishlist আইকন পর্যন্ত উড়িয়ে নিয়ে যায় (একটা হালকা বাঁকা arc পথে, সরাসরি সোজা
// লাইনে না গিয়ে), এবং পৌঁছানোর মুহূর্তে WISHLIST_NAV_HIT_EVENT ফায়ার করে —
// Navbar তখন তার আইকনে জিগল + লিকুইড-ফিল এনিমেশন চালায়।
export default function WishlistFlyOverlay() {
  const [items, setItems] = useState<FlyItem[]>([]);
  const idRef = useRef(0);

  useEffect(() => {
    const onFly = (e: Event) => {
      const detail = (e as CustomEvent<{ x: number; y: number }>).detail;
      if (!detail || typeof detail.x !== 'number' || typeof detail.y !== 'number') return;
      const { x: sx, y: sy } = detail;

      const targetEl = document.getElementById('nav-wishlist-icon');
      if (!targetEl || prefersReducedMotion()) {
        // টার্গেট আইকন খুঁজে না পেলে বা reduced-motion চালু থাকলে দৃশ্যমান
        // উড়ান বাদ দিয়ে সরাসরি হিট ইভেন্ট পাঠানো হচ্ছে — Navbar তাও ফিডব্যাক
        // (জিগল/ফিল) দেখাক, শুধু উড়ন্ত অ্যানিমেশনটা বাদ যাক।
        window.dispatchEvent(new CustomEvent(WISHLIST_NAV_HIT_EVENT));
        return;
      }

      const tRect = targetEl.getBoundingClientRect();
      const tx = tRect.left + tRect.width / 2;
      const ty = tRect.top + tRect.height / 2;
      // সরাসরি সরল রেখায় না গিয়ে একটু উপর দিয়ে "ছুঁড়ে মারার" মতো বাঁক
      // নেওয়ার জন্য quadratic bezier কন্ট্রোল পয়েন্ট
      const cx = (sx + tx) / 2;
      const cy = Math.min(sy, ty) - 90;

      const id = ++idRef.current;
      setItems((prev) => [...prev, { id, x: sx, y: sy, scale: 1, opacity: 1 }]);

      const start = performance.now();
      const tick = (now: number) => {
        const p = Math.min(1, (now - start) / FLIGHT_MS);
        // ধীরে শুরু, শেষের দিকে দ্রুত টান — নিক্ষেপের প্রথমটা আলতো, তারপর
        // টার্গেটের দিকে ত্বরান্বিত হয়ে "হিট" করার মতো অনুভূতি
        const te = p * p;
        const x = (1 - te) * (1 - te) * sx + 2 * (1 - te) * te * cx + te * te * tx;
        const y = (1 - te) * (1 - te) * sy + 2 * (1 - te) * te * cy + te * te * ty;
        const scale = 1 - 0.55 * p;
        const opacity = p < 0.75 ? 1 : 1 - (p - 0.75) / 0.25;
        setItems((prev) => prev.map((it) => (it.id === id ? { ...it, x, y, scale, opacity } : it)));
        if (p < 1) {
          requestAnimationFrame(tick);
        } else {
          setItems((prev) => prev.filter((it) => it.id !== id));
          window.dispatchEvent(new CustomEvent(WISHLIST_NAV_HIT_EVENT));
        }
      };
      requestAnimationFrame(tick);
    };

    window.addEventListener(WISHLIST_FLY_EVENT, onFly);
    return () => window.removeEventListener(WISHLIST_FLY_EVENT, onFly);
  }, []);

  if (items.length === 0) return null;

  return (
    <>
      {items.map((it) => (
        <div
          key={it.id}
          className="pointer-events-none fixed left-0 top-0 z-[1400]"
          style={{
            transform: `translate3d(${it.x - 11}px, ${it.y - 11}px, 0) scale(${it.scale})`,
            opacity: it.opacity,
            willChange: 'transform, opacity',
          }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="#FF5A6E" stroke="none">
            <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
          </svg>
        </div>
      ))}
    </>
  );
}
