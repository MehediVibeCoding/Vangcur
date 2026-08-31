export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastDetail {
  message: string;
  type: ToastType;
  id: number;
}

export const TOAST_EVENT = 'vc:showToast';

let toastSeq = 0;

/**
 * টেক্সট থেকে কাঁচা ইমোজি ও অপ্রয়োজনীয় চিহ্ন সরিয়ে প্রমিত ও ঝরঝরে টেক্সট তৈরি করা
 */
export function cleanToastMessage(msg: string): string {
  if (!msg) return '';
  return msg
    .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '') // কাঁচা ইমোজি রিমুভ
    .replace(/^[✅❌❤️🔔🎉⚠️ℹ️✓✕\s•\-]+/, '') // প্রিফিক্স চিহ্ন ও ইমোজি রিমুভ
    .trim();
}

/**
 * মেসেজের ভেতরের কি-ওয়ার্ডের ওপর ভিত্তি করে স্বয়ংক্রিয়ভাবে টাইপ (সাকসেস, এরর, ইনফো, ওয়ার্নিং) শনাক্তকরণ
 */
export function detectToastType(msg: string): ToastType {
  const lower = msg.toLowerCase().trim();

  // ১. এরর / ব্যর্থতা শনাক্তকরণ
  if (
    lower.includes('ব্যর্থ') ||
    lower.includes('ভুল') ||
    lower.includes('সমস্যা') ||
    lower.includes('সম্ভব হয়নি') ||
    lower.includes('সম্ভব হয়নি') ||
    lower.includes('যায়নি') ||
    lower.includes('যায়নি') ||
    lower.includes('পাওয়া যাচ্ছে না') ||
    lower.includes('পাওয়া যাচ্ছে না') ||
    lower.includes('পাওয়া যায়নি') ||
    lower.includes('পাওয়া যায়নি') ||
    lower.includes('অস্বাভাবিক') ||
    lower.includes('অবৈধ') ||
    lower.includes('নেই') ||
    lower.includes('শেষ!') ||
    lower.includes('শেষ') ||
    lower.includes('অমিল') ||
    lower.includes('❌') ||
    lower.includes('error') ||
    lower.includes('failed') ||
    lower.includes('invalid') ||
    lower.includes('incorrect')
  ) {
    return 'error';
  }

  // ২. ওয়ার্নিং / সীমা / ইন্টারনেট বিচ্ছিন্ন শনাক্তকরণ
  if (
    lower.includes('সীমা') ||
    lower.includes('সীমায়') ||
    lower.includes('সর্বোচ্চ') ||
    lower.includes('বিচ্ছিন্ন') ||
    lower.includes('অ্যালার্ট') ||
    lower.includes('সতর্ক') ||
    lower.includes('warning') ||
    lower.includes('limit') ||
    lower.includes('offline') ||
    lower.includes('disconnected')
  ) {
    return 'warning';
  }

  // ৩. ইনফো / প্রম্পট / লগইন নির্দেশনা
  if (
    lower.includes('লগইন করুন') ||
    lower.includes('লগআউট') ||
    lower.includes('প্রথমে') ||
    lower.includes('সরানো') ||
    lower.includes('বাতিল') ||
    lower.includes('মুছে') ||
    lower.includes('দয়া করে') ||
    lower.includes('দয়া করে') ||
    lower.includes('অনুরোধ') ||
    lower.includes('লিখুন') ||
    lower.includes('info') ||
    lower.includes('please') ||
    lower.includes('login') ||
    lower.includes('removed')
  ) {
    return 'info';
  }

  // ৪. ডিফল্ট: সাকসেস (যোগ, সফল, যুক্ত, পরিবর্তন, লাইভ, আপডেট ইত্যাদি)
  return 'success';
}

/**
 * পুরো ওয়েবসাইটের কেন্দ্রীয় টোস্ট নোটিফিকেশন ডিসপ্যাচার
 */
export function showToast(message: string, customType?: ToastType): void {
  if (typeof window === 'undefined' || !message) return;

  const cleaned = cleanToastMessage(message);
  if (!cleaned) return;

  const finalType = customType || detectToastType(message);
  const id = ++toastSeq;

  window.dispatchEvent(
    new CustomEvent<ToastDetail>(TOAST_EVENT, {
      detail: {
        message: cleaned,
        type: finalType,
        id,
      },
    })
  );
}
