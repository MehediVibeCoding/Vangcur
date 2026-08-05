'use client';

// Cloudflare Turnstile — invisible bot-protection widget loader।
// লগইন/রেজিস্ট্রেশন ফর্মে ব্যবহৃত হয়; ভেরিফিকেশন সবসময় সার্ভার-সাইডে হয় (app/api/verify-turnstile)।

export interface TurnstileRenderOptions {
  sitekey: string;
  callback?: (token: string) => void;
  'error-callback'?: () => void;
  'expired-callback'?: () => void;
  size?: 'normal' | 'invisible' | 'flexible';
  appearance?: 'always' | 'execute' | 'interaction-only';
}

interface TurnstileApi {
  render: (container: string | HTMLElement, options: TurnstileRenderOptions) => string;
  reset: (widgetId?: string) => void;
  remove: (widgetId?: string) => void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
    __turnstileLoadPromise?: Promise<void>;
  }
}

const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js';

export function loadTurnstileScript(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.turnstile) return Promise.resolve();
  if (window.__turnstileLoadPromise) return window.__turnstileLoadPromise;

  window.__turnstileLoadPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Turnstile script load failed'));
    document.head.appendChild(script);
  });
  return window.__turnstileLoadPromise;
}

export async function verifyTurnstileToken(token: string): Promise<boolean> {
  try {
    const res = await fetch('/api/verify-turnstile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    return !!data.success;
  } catch {
    return false;
  }
  }
