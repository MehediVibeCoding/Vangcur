import DOMPurify from 'isomorphic-dompurify';

export function sanitizeSvgHtml(html?: string | null): string {
  if (!html) return '';
  return DOMPurify.sanitize(html, {
    USE_PROFILES: { svg: true, svgFilters: true },
    ADD_TAGS: ['svg', 'path', 'circle', 'rect', 'polygon', 'line', 'g'],
  });
}

export { sanitizeHref } from './security';
