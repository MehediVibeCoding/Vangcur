// ফাইলের পাথ: lib/linkedText.tsx
// সব SEO কনটেন্টের ভেতরে (প্রোডাক্ট Description/Features/Extra Info/FAQ,
// গাইড পেজের RichText/Checklist/CardGrid/FAQ ইত্যাদি) ৩ ধরনের ইনলাইন
// মার্কডাউন থাকতে পারে:
//   ১. `[লেখা](/url)`   — লিংক
//   ২. `**লেখা**`        — বোল্ড/emphasis (গুরুত্বপূর্ণ কথা হাইলাইট করতে)
//   ৩. `*লেখা*`          — italic (কম ব্যবহৃত, তবু সাপোর্টেড)
// renderLinkedText() এই তিনটাই একসাথে পার্স করে আসল React নোডে বদলে দেয়।
// আগে শুধু লিংক পার্স হতো — **bold** সিনট্যাক্স লেখা থাকলেও raw `**` অক্ষর
// হিসেবেই সাইটে দেখা যেত (স্ক্রিনশটে যে বাগ রিপোর্ট হয়েছিল, ঠিক এটাই)।
//
// এছাড়া AGENTS.md-এর "নো-ইমোজি পলিসি" রেন্ডার-টাইমেও একটা সেফটি-নেট হিসেবে
// জোরদার করা হয়েছে — raw pictograph/emoji অক্ষর (থাকলে, ভুলে থেকে গেলেও)
// এখান থেকে স্ট্রিপ হয়ে যায়। তীরচিহ্ন (→ ইত্যাদি, "...দেখুন →" স্টাইলের CTA-তে
// ইচ্ছাকৃতভাবে ব্যবহৃত) এই রেঞ্জের বাইরে, তাই অক্ষত থাকে।
//
// ব্যবহার: plain text-এর জায়গায় {renderLinkedText(text)} বসালেই হবে —
// উপরের কোনো সিনট্যাক্স না থাকলে আগের মতোই প্লেইন স্ট্রিং হিসেবে রেন্ডার হবে।

import Link from 'next/link';

const LINK_PATTERN = /\[([^\]\n]+)\]\(([^)\s]+)\)/g;
const BOLD_PATTERN = /\*\*([^*\n]+)\*\*/g;
const ITALIC_PATTERN = /(?:^|[^*])\*([^*\n]+)\*(?!\*)/g;
// raw ইমোজি/পিকটোগ্রাফ রেঞ্জ — তীরচিহ্ন (U+2190–21FF) ও সাধারণ পাংচুয়েশন এর
// বাইরে, তাই "...দেখুন →" এর মতো ইচ্ছাকৃত ব্যবহার প্রভাবিত হয় না
const EMOJI_PATTERN = /[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}\u{200D}]/gu;
// দ্রুত early-exit: লিংক/বোল্ড/ইতালিক/ইমোজি — এই ৪টার একটাও না থাকলে বাকি কোনো প্রসেসিং লাগবে না
const HAS_ANYTHING_TO_PARSE = /\]\(|\*|[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}]/u;

function stripEmoji(s: string): string {
  return s.replace(EMOJI_PATTERN, '');
}

/** একটা প্লেইন টেক্সট খণ্ডের ভেতরে বোল্ড ও ইতালিক মার্কডাউন পার্স করে নোড-অ্যারেতে বদলায় */
function renderEmphasis(text: string, keyRef: { n: number }): React.ReactNode[] {
  const cleaned = stripEmoji(text);
  if (!cleaned) return [];
  if (!cleaned.includes('*')) return [cleaned];

  const out: React.ReactNode[] = [];
  let lastIndex = 0;
  const boldRe = new RegExp(BOLD_PATTERN);
  let m: RegExpExecArray | null;

  while ((m = boldRe.exec(cleaned)) !== null) {
    if (m.index > lastIndex) out.push(...renderItalic(cleaned.slice(lastIndex, m.index), keyRef));
    out.push(
      <strong key={keyRef.n++} className="font-bold text-ink">
        {m[1]}
      </strong>
    );
    lastIndex = m.index + m[0].length;
  }
  if (lastIndex < cleaned.length) out.push(...renderItalic(cleaned.slice(lastIndex), keyRef));
  return out;
}

function renderItalic(text: string, keyRef: { n: number }): React.ReactNode[] {
  if (!text) return [];
  if (!text.includes('*')) return [text];

  const out: React.ReactNode[] = [];
  let lastIndex = 0;
  const italicRe = new RegExp(ITALIC_PATTERN);
  let m: RegExpExecArray | null;

  while ((m = italicRe.exec(text)) !== null) {
    // m[0] তে leading non-* ক্যারেক্টারটাও ধরা পড়ে (^|[^*]) — তাই আসল * শুরুর
    // পজিশন বের করে সেই আগের অক্ষরটা প্লেইন টেক্সট হিসেবে রাখা হচ্ছে
    const starIdx = m.index + m[0].indexOf('*');
    if (starIdx > lastIndex) out.push(text.slice(lastIndex, starIdx));
    out.push(<em key={keyRef.n++}>{m[1]}</em>);
    lastIndex = starIdx + m[1].length + 2;
    italicRe.lastIndex = lastIndex;
  }
  if (lastIndex < text.length) out.push(text.slice(lastIndex));
  return out;
}

export function renderLinkedText(text: string | undefined | null): React.ReactNode {
  if (!text) return text ?? '';
  if (!HAS_ANYTHING_TO_PARSE.test(text)) return text; // বেশিরভাগ লাইনেই কিছু পার্স করার থাকে না

  const keyRef = { n: 0 };
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  const re = new RegExp(LINK_PATTERN);
  let match: RegExpExecArray | null;

  while ((match = re.exec(text)) !== null) {
    const [full, label, href] = match;
    if (match.index > lastIndex) {
      parts.push(...renderEmphasis(text.slice(lastIndex, match.index), keyRef));
    }

    const isInternal = href.startsWith('/');
    const linkClass =
      'font-semibold text-brand-light underline decoration-brand-light/40 underline-offset-2 hover:decoration-brand-light';
    const cleanLabel = stripEmoji(label);

    parts.push(
      isInternal ? (
        <Link key={keyRef.n++} href={href} className={linkClass}>
          {cleanLabel}
        </Link>
      ) : (
        <a key={keyRef.n++} href={href} target="_blank" rel="noopener noreferrer" className={linkClass}>
          {cleanLabel}
        </a>
      )
    );

    lastIndex = match.index + full.length;
  }

  if (lastIndex < text.length) parts.push(...renderEmphasis(text.slice(lastIndex), keyRef));
  return parts;
}
