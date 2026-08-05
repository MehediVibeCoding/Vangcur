'use client';

import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { loadTurnstileScript } from '@/lib/turnstile';

export interface TurnstileHandle {
  getToken: () => string;
  reset: () => void;
}

interface TurnstileWidgetProps {
  /** ফর্ম/মোডাল বন্ধ থাকলে widget বসাবে না — অহেতুক script লোড এড়াতে */
  active: boolean;
}

/**
 * Invisible Cloudflare Turnstile widget। NEXT_PUBLIC_TURNSTILE_SITE_KEY সেট করা
 * না থাকলে কিছুই render/লোড করে না (graceful degrade — সাইট key যোগ করার আগে
 * লগইন/রেজিস্ট্রেশন ভাঙবে না)।
 */
const TurnstileWidget = forwardRef<TurnstileHandle, TurnstileWidgetProps>(function TurnstileWidget(
  { active },
  ref
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);
  const tokenRef = useRef<string>('');
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  useImperativeHandle(ref, () => ({
    getToken: () => tokenRef.current,
    reset: () => {
      tokenRef.current = '';
      if (window.turnstile && widgetIdRef.current) {
        try {
          window.turnstile.reset(widgetIdRef.current);
        } catch {
          // widget আগেই সরানো হয়ে থাকতে পারে — নিরাপদে ignore
        }
      }
    },
  }));

  useEffect(() => {
    if (!active || !siteKey || !containerRef.current || widgetIdRef.current) return;
    let cancelled = false;

    loadTurnstileScript()
      .then(() => {
        if (cancelled || !window.turnstile || !containerRef.current || widgetIdRef.current) return;
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          size: 'invisible',
          callback: (token: string) => {
            tokenRef.current = token;
          },
          'error-callback': () => {
            tokenRef.current = '';
          },
          'expired-callback': () => {
            tokenRef.current = '';
          },
        });
      })
      .catch(() => {
        // script লোড ব্যর্থ হলে token খালিই থাকবে — কল করা কোড fail-closed আচরণ করবে
      });

    return () => {
      cancelled = true;
      if (window.turnstile && widgetIdRef.current) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          // ignore
        }
        widgetIdRef.current = null;
      }
    };
  }, [active, siteKey]);

  if (!siteKey) return null;
  return <div ref={containerRef} className="hidden" aria-hidden="true" />;
});

export default TurnstileWidget;
