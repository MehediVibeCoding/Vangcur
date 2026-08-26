export function optimizeCloudinaryUrl(url?: string, width = 450): string {
  if (!url || !url.startsWith('http')) return url || '';
  if (!url.includes('res.cloudinary.com')) return url;
  if (/\/upload\/[^/]*w_\d/.test(url)) return url;
  if (url.includes('/q_auto/f_auto/')) {
    return url.replace('/q_auto/f_auto/', `/w_${width},q_auto:good,f_auto/`);
  }
  if (url.includes('/upload/')) {
    return url.replace('/upload/', `/upload/w_${width},q_auto:good,f_auto/`);
  }
  return url;
}
