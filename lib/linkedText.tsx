// ফাইলের পাথ: lib/linkedText.tsx
// [NEW] সব SEO কনটেন্টের ভেতরে (প্রোডাক্ট Description/Features/Extra Info/FAQ,
// গাইড পেজের RichText/Checklist/CardGrid/FAQ ইত্যাদি) `[লেখা](/url)` ফরম্যাটে
// লেখা ইনলাইন মার্কডাউন-লিংক থাকে — অ্যাডমিন থেকে কনটেন্ট লেখার সময় ঠিক এই
// ফরম্যাটেই লিংক বসানো হয় (দেখুন lib/guide-content-parser.ts আর
// lib/smart-parser.ts এর কমেন্ট)। কিন্তু আগে কোনো রেন্ডারার-ই এই সিনট্যাক্স
// পার্স করত না — তাই raw `[টেক্সট](url)` স্ট্রিং হিসেবেই সাইটে দেখা যেত,
// ক্লিকযোগ্য লিংক হতো না। renderLinkedText() এই একই কাজ সব জায়গায় করে —
// টেক্সট স্ক্যান করে প্রতিটা `[টেক্সট](url)` কে আসল <Link>/<a>-এ বদলে দেয়,
// বাকি টেক্সট অক্ষত রাখে।
//
// ব্যবহার: plain text-এর জায়গায় {renderLinkedText(text)} বসালেই হবে —
// লিংক না থাকলে আগের মতোই স্ট্রিং হিসেবে রেন্ডার হবে, কোনো পার্থক্য পড়বে না।

import Link from 'next/link';

const LINK_PATTERN = /\[([^\]\n]+)\]\(([^)\s]+)\)/g;

export function renderLinkedText(text: string | undefined | null): React.ReactNode {
  if (!text) return text ?? '';
  if (!text.includes('](')) return text; // দ্রুত early-exit, বেশিরভাগ লাইনেই লিংক থাকে না

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let key = 0;
  const re = new RegExp(LINK_PATTERN);
  let match: RegExpExecArray | null;

  while ((match = re.exec(text)) !== null) {
    const [full, label, href] = match;
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index));

    const isInternal = href.startsWith('/');
    const linkClass =
      'font-semibold text-brand-light underline decoration-brand-light/40 underline-offset-2 hover:decoration-brand-light';

    parts.push(
      isInternal ? (
        <Link key={key++} href={href} className={linkClass}>
          {label}
        </Link>
      ) : (
        <a key={key++} href={href} target="_blank" rel="noopener noreferrer" className={linkClass}>
          {label}
        </a>
      )
    );

    lastIndex = match.index + full.length;
  }

  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts;
}
