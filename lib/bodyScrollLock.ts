// আগে এখানে body-কে position:fixed + negative top offset দিয়ে লক করা হতো
// (iOS Safari rubber-band scroll ঠেকানোর জন্য সাধারণ একটা পুরনো কৌশল)। কিন্তু
// এই কৌশলটাই Navbar-এর sticky positioning ভেঙে দিচ্ছিল — body position:fixed
// হওয়ার সাথে সাথে sticky element-এর reference frame গণ্ডগোল হয়ে যেত।
//
// এরপর overflow:hidden (html + body) দিয়ে লক করা শুরু হয়েছিল, যেটা sticky
// Navbar ভাঙত না ঠিকই, কিন্তু এতে একটা নতুন বড় বাগ তৈরি হয়েছিল: ইউজার যদি
// পেজে আগে থেকেই একটু স্ক্রল করে নিচে নেমে থাকে (যেমন ফুটার সেকশনে), তাহলে
// overflow:hidden সেট করার সাথে সাথে ব্রাউজার ডকুমেন্টের স্ক্রলযোগ্য এরিয়া
// মুছে ফেলে scroll position 0-তে রিসেট করে দিত — পুরো পেজ চোখের সামনে হুট করে
// উপরে "লাফিয়ে" উঠে যেত, ফলে সার্চ ইনপুট/ড্রপডাউন যেখানে ছিল সেখান থেকে সরে
// গিয়ে "গায়েব" হয়ে যাচ্ছে বলে মনে হতো (আর তখন স্ক্রলও ব্লকড থাকায় উপরে কী
// হচ্ছে দেখাও যেত না)।
//
// এখন CSS-এর কোনো overflow/position একদম পরিবর্তন না করে সরাসরি wheel/touch/
// keyboard ইভেন্ট আটকে (preventDefault) স্ক্রল লক করা হচ্ছে। এতে ডকুমেন্টের
// আসল scrollTop কখনোই বদলায় না (কোনো জাম্প নেই), sticky Navbar পুরোপুরি
// স্বাভাবিকভাবে কাজ করে (কারণ কোনো CSS-ই ছোঁয়া হয়নি), আর scrollbar
// disappear করে না বলে আগের মতো width-shift compensate করারও দরকার নেই।
// মডাল/ড্রয়ারের নিজস্ব ভিতরের স্ক্রলযোগ্য অংশ (cart list, dropdown result
// list ইত্যাদি) স্বয়ংক্রিয়ভাবেই সনাক্ত হয়ে স্বাভাবিক স্ক্রল করা যায় — শুধু
// তার বাইরের মূল পেজটাই লক থাকে।

let lockCount = 0;
let touchStartY = 0;

function findScrollableAncestor(start: EventTarget | null): Element | null {
  let node: Element | null = start instanceof Element ? start : null;
  while (node && node !== document.documentElement) {
    const style = window.getComputedStyle(node);
    const canScrollY = /(auto|scroll)/.test(style.overflowY) && node.scrollHeight > node.clientHeight;
    if (canScrollY) return node;
    node = node.parentElement;
  }
  return null;
}

// নির্দিষ্ট এলিমেন্টের ভিতরে স্ক্রল করলেও, একদম উপরে/নিচে (বাউন্ডারিতে) পৌঁছে
// গেলে আরও স্ক্রল করলে সেটা যেন বাইরের মূল পেজে "leak" করে চলে না যায়
// (browser-এর native scroll chaining), তাই বাউন্ডারিতে থাকলে পরের স্ক্রলযোগ্য
// পূর্বপুরুষ (থাকলে) খোঁজা হয়, না থাকলে ব্লক করে দেওয়া হয়।
function findUsableScrollTarget(start: EventTarget | null, delta: number): Element | null {
  let node = findScrollableAncestor(start);
  while (node) {
    const atTop = node.scrollTop <= 0;
    const atBottom = node.scrollHeight - node.scrollTop <= node.clientHeight + 1;
    const blocked = (delta < 0 && atTop) || (delta > 0 && atBottom);
    if (!blocked) return node;
    node = findScrollableAncestor(node.parentElement);
  }
  return null;
}

function onWheel(e: WheelEvent) {
  if (!findUsableScrollTarget(e.target, e.deltaY)) e.preventDefault();
}

function onTouchStart(e: TouchEvent) {
  touchStartY = e.touches[0]?.clientY ?? 0;
}

function onTouchMove(e: TouchEvent) {
  const touch = e.touches[0];
  if (!touch) return;
  const delta = touchStartY - touch.clientY; // আঙুল উপরে সরলে (স্ক্রল-ডাউন) পজিটিভ
  if (!findUsableScrollTarget(e.target, delta)) e.preventDefault();
}

const SCROLL_KEYS = new Set(['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' ']);

function onKeyDown(e: KeyboardEvent) {
  if (!SCROLL_KEYS.has(e.key)) return;
  const target = e.target as HTMLElement | null;
  // ইনপুট/টেক্সটএরিয়াতে টাইপ বা কার্সর-মুভমেন্ট করার সময় ব্লক করা উচিত না
  if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
  const delta = e.key === 'ArrowUp' || e.key === 'PageUp' || e.key === 'Home' ? -1 : 1;
  if (!findUsableScrollTarget(target, delta)) e.preventDefault();
}

export function lockBody(): void {
  if (typeof document === 'undefined') return;
  lockCount += 1;
  if (lockCount > 1) return;
  document.addEventListener('wheel', onWheel, { passive: false });
  document.addEventListener('touchstart', onTouchStart, { passive: true });
  document.addEventListener('touchmove', onTouchMove, { passive: false });
  document.addEventListener('keydown', onKeyDown, { passive: false });
}

export function unlockBody(): void {
  if (typeof document === 'undefined') return;
  lockCount = Math.max(0, lockCount - 1);
  if (lockCount > 0) return;
  document.removeEventListener('wheel', onWheel);
  document.removeEventListener('touchstart', onTouchStart);
  document.removeEventListener('touchmove', onTouchMove);
  document.removeEventListener('keydown', onKeyDown);
}
