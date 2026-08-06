// আগে এখানে body-কে position:fixed + negative top offset দিয়ে লক করা হতো
// (iOS Safari rubber-band scroll ঠেকানোর জন্য সাধারণ একটা পুরনো কৌশল)। কিন্তু
// এই কৌশলটাই Navbar-এর sticky positioning ভেঙে দিচ্ছিল — body position:fixed
// হওয়ার সাথে সাথে sticky element-এর reference frame গণ্ডগোল হয়ে যেত, ফলে
// modal বন্ধ করার পর Navbar আর সঠিকভাবে viewport-এর উপরে আটকে থাকত না, বরং
// যেখানে scroll ছিল সেখানেই "আটকে" যেত (স্ক্রিনশটে যেটা ফুটারে দেখা গিয়েছিল)।
//
// এখন শুধু overflow:hidden + overscroll-behavior:contain ব্যবহার করা হচ্ছে —
// Android Chrome-এ এটা যথেষ্ট, আর sticky element-এর কোনো ক্ষতি করে না।
// একাধিক modal একসাথে খোলা থাকলে (যেমন checkout-এর ভিতরে login) একটা বন্ধ
// হলে অন্যটা যেন lock না হারায়, তাই reference-count রাখা হচ্ছে।
let lockCount = 0;

export function lockBody(): void {
  if (typeof document === 'undefined') return;
  lockCount += 1;
  if (lockCount > 1) return;
  document.documentElement.style.overflow = 'hidden';
  document.body.style.overflow = 'hidden';
  document.body.style.overscrollBehavior = 'contain';
}

export function unlockBody(): void {
  if (typeof document === 'undefined') return;
  lockCount = Math.max(0, lockCount - 1);
  if (lockCount > 0) return;
  document.documentElement.style.overflow = '';
  document.body.style.overflow = '';
  document.body.style.overscrollBehavior = '';
}
