const SAFE_HREF_PROTOCOLS = ['http:', 'https:', 'tel:', 'mailto:'];

export function sanitizeInput(value: string): string {
  return value
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .trim();
}

export function sanitizeHref(url: string | null | undefined): string {
  if (!url || typeof url !== 'string') return '#';
  const trimmed = url.trim();
  if (trimmed.startsWith('/') || trimmed.startsWith('#') || trimmed.startsWith('?')) {
    return trimmed;
  }
  try {
    const parsed = new URL(trimmed, 'https://vangcur.com');
    return SAFE_HREF_PROTOCOLS.includes(parsed.protocol) ? trimmed : '#';
  } catch {
    return '#';
  }
}

export function validatePhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, '');
  return /^01[3-9]\d{8}$/.test(digits);
}

export function validateEmail(email: string): boolean {
  const trimmed = email.trim();
  if (!trimmed || trimmed.length > 254) return false;
  return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)*\.[a-zA-Z]{2,}$/.test(trimmed);
}

const PLAIN_NAME_REGEX = /^[\p{L}\p{M}\s]*$/u;
export const MAX_NAME_LEN = 30;

export function sanitizePlainName(value: string): string {
  const lettersOnly = Array.from(value)
    .filter((ch) => /[\p{L}\p{M}\s]/u.test(ch))
    .join('');
  return lettersOnly.replace(/\s{2,}/g, ' ').replace(/^\s+/, '').slice(0, MAX_NAME_LEN);
}

export function validateName(name: string): boolean {
  const trimmed = name.trim();
  return trimmed.length >= 2 && trimmed.length <= MAX_NAME_LEN && PLAIN_NAME_REGEX.test(trimmed);
}

export function sanitizeEmailInput(value: string): string {
  return value.replace(/[^\x21-\x7E]/g, '').slice(0, 254);
}

export function validateAddress(address: string): boolean {
  const trimmed = address.trim();
  return trimmed.length >= 10 && trimmed.length <= 300;
}

export const MAX_ADDR_LEN = 300;

export function sanitizeAddressInput(value: string): string {
  return value
    .replace(/[<>`]/g, '')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .slice(0, MAX_ADDR_LEN);
}
