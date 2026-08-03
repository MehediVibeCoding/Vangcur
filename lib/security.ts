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

export function validateName(name: string): boolean {
  const trimmed = name.trim();
  return trimmed.length >= 2 && trimmed.length <= 60;
}

export function validateAddress(address: string): boolean {
  const trimmed = address.trim();
  return trimmed.length >= 10 && trimmed.length <= 300;
}
