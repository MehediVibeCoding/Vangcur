let bodyScrollY = 0;

export function lockBody(): void {
  if (typeof document === 'undefined') return;
  if (document.body.dataset.locked) return;
  bodyScrollY = window.scrollY;
  document.body.style.overflow = 'hidden';
  document.body.style.position = 'fixed';
  document.body.style.top = `-${bodyScrollY}px`;
  document.body.style.width = '100%';
  document.body.dataset.locked = '1';
}

export function unlockBody(): void {
  if (typeof document === 'undefined') return;
  if (!document.body.dataset.locked) return;
  const scrollY = bodyScrollY || parseInt(document.body.style.top || '0', 10) * -1;
  document.body.style.overflow = '';
  document.body.style.position = '';
  document.body.style.top = '';
  document.body.style.width = '';
  delete document.body.dataset.locked;
  document.documentElement.style.scrollBehavior = 'auto';
  window.scrollTo(0, scrollY);
  requestAnimationFrame(() => { document.documentElement.style.scrollBehavior = ''; });
}
