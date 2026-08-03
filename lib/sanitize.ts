import DOMPurify from 'isomorphic-dompurify';

export function sanitizeSvgHtml(html?: string | null): string {
  if (!html) return '';
  return DOMPurify.sanitize(html, {
    USE_PROFILES: { svg: true, svgFilters: true },
    ADD_TAGS: ['svg', 'path', 'circle', 'rect', 'polygon', 'line', 'g'],
  });
}

const SAFE_PROTOCOLS = ['http:', 'https:', 'tel:', 'mailto:'];

export function sanitizeHref(url?: string | null): string {
  if (!url || typeof url !== 'string') return '#';
  const trimmed = url.trim();
  if (trimmed.startsWith('/') || trimmed.startsWith('#') || trimmed.startsWith('?')) return trimmed;
  try {
    const parsed = new URL(trimmed, 'https://vangcur.netlify.app');
    return SAFE_PROTOCOLS.includes(parsed.protocol) ? trimmed : '#';
  } catch {
    return '#';
  }
}
