export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .slice(0, 500);
}

export function validatePhone(phone: string): { valid: boolean; message?: string } {
  const cleaned = phone.replace(/[\s-]/g, '');
  const regex = /^01[3-9]\d{8}$/;
  if (!regex.test(cleaned)) {
    return { valid: false, message: 'সঠিক ১১ সংখ্যার মোবাইল নম্বর দিন (01XXXXXXXXX)' };
  }
  return { valid: true };
}

export function validateName(name: string): { valid: boolean; message?: string } {
  const trimmed = name.trim();
  if (trimmed.length < 2) {
    return { valid: false, message: 'নাম কমপক্ষে ২ অক্ষরের হতে হবে' };
  }
  if (trimmed.length > 100) {
    return { valid: false, message: 'নাম অনেক বড় — ১০০ অক্ষরের মধ্যে দিন' };
  }
  return { valid: true };
}

export function validateAddress(addr: string): { valid: boolean; message?: string } {
  const trimmed = addr.trim();
  if (trimmed.length < 10) {
    return { valid: false, message: 'সম্পূর্ণ ঠিকানা দিন (কমপক্ষে ১০ অক্ষর)' };
  }
  if (trimmed.length > 300) {
    return { valid: false, message: 'ঠিকানা অনেক বড় — ৩০০ অক্ষরের মধ্যে দিন' };
  }
  return { valid: true };
}

export function validateTxnId(txn: string): { valid: boolean; message?: string } {
  const cleaned = txn.trim().toUpperCase();
  if (!/^[A-Z0-9]{8,12}$/.test(cleaned)) {
    return { valid: false, message: 'সঠিক Transaction ID দিন' };
  }
  return { valid: true };
}
