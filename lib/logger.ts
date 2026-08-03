const isDev = process.env.NODE_ENV !== 'production';

export function logWarn(...args: unknown[]): void {
  if (isDev) console.warn(...args);
}

export function logError(...args: unknown[]): void {
  if (isDev) console.error(...args);
}
