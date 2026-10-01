import DOMPurify from 'dompurify';

export function sanitizeSvgHtml(html?: string | null): string {
  if (!html) return '';

  // সার্ভার-সাইড (SSR) এ ভারী ও ত্রুটিপূর্ণ jsdom বাইপাস করে দ্রুত ও নিরাপদ স্যানিটাইজেশন
  if (typeof window === 'undefined') {
    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/on\w+\s*=\s*(?:'[^']*'|"[^"]*"|[^\s>]+)/gi, '')
      .replace(/href\s*=\s*(?:'javascript:[^']*'|"javascript:[^"]*"|javascript:[^\s>]+)/gi, '');
  }

  // ক্লায়েন্ট ব্রাউজারে সম্পূর্ণ DOMPurify দিয়ে স্যানিটাইজেশন
  return DOMPurify.sanitize(html, {
    USE_PROFILES: { svg: true, svgFilters: true },
    ADD_TAGS: ['svg', 'path', 'circle', 'rect', 'polygon', 'line', 'g', 'defs', 'linearGradient', 'radialGradient', 'stop', 'ellipse'],
  });
}

export { sanitizeHref } from './security';
