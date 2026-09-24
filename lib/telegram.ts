// [REPLACE] ফাইলের পাথ: lib/telegram.ts
import 'server-only';
import { logWarn } from './logger';

interface TelegramOrderNotification {
  orderNum: string;
  name: string;
  phone: string;
  district: string;
  address: string;
  email?: string;
  items: { name: string; qty: number; price: number }[];
  total: number;
  advancePaid?: number;
  shippingCost: number;
  paymentTxn?: string;
  paymentLast4?: string;
}

// 🛡️ ফিক্স (audit P1-12): parse_mode 'HTML'-এ পাঠানোর আগে সব ডাইনামিক
// (কাস্টমার-সরবরাহিত) মান escape করা — নইলে নাম/ইমেইল/ঠিকানায় থাকা `<`/`>`/`&`
// Telegram-এর HTML পার্সার ব্যর্থ করে দিতে পারে এবং পুরো নোটিফিকেশন
// নিঃশব্দে হারিয়ে যায়।
function escapeTelegramHtml(value: string): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export async function sendTelegramOrderNotification(order: TelegramOrderNotification): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    return;
  }

  const e = escapeTelegramHtml;

  const itemsText = order.items
    .map((i, idx) => `${idx + 1}. <b>${e(i.name)}</b> × ${i.qty} — ৳${(i.price * i.qty).toLocaleString('en-US')}`)
    .join('\n');

  const paymentInfo = order.paymentTxn
    ? `TxnID: <code>${e(order.paymentTxn)}</code>`
    : order.paymentLast4
    ? `Last 4 digits: <code>${e(order.paymentLast4)}</code>`
    : 'N/A';

  const advance = Number(order.advancePaid ?? 200);
  const dueCod = Math.max(0, (order.total || 0) - advance);

  // 🧾 ক্লিন, প্রফেশনাল টেক্সট ফরম্যাট — কোনো ইমোজি ছাড়া, শুধু বোল্ড লেবেল,
  // কোড-ব্লক (ফোন/TxnID) ও ডিভাইডার লাইন দিয়ে সাজানো, যাতে মেসেজটা পরিষ্কার
  // ও প্রফেশনাল দেখায়।
  const DIVIDER = '─────────────────────';

  const message = `<b>নতুন অর্ডার এসেছে</b>\n` +
    `${DIVIDER}\n` +
    `<b>অর্ডার নং:</b> ${e(order.orderNum)}\n` +
    `<b>কাস্টমার:</b> ${e(order.name)}\n` +
    `<b>ফোন:</b> <code>${e(order.phone)}</code>\n` +
    `<b>ঠিকানা:</b> ${order.district ? `${e(order.district)}, ` : ''}${e(order.address)}\n` +
    `${order.email ? `<b>ইমেইল:</b> ${e(order.email)}\n` : ''}` +
    `${DIVIDER}\n` +
    `<b>পণ্যসমূহ:</b>\n${itemsText}\n` +
    `${DIVIDER}\n` +
    `<b>শিপিং চার্জ:</b> ৳${order.shippingCost.toLocaleString('en-US')}\n` +
    `<b>সর্বমোট বিল:</b> ৳${order.total.toLocaleString('en-US')}\n` +
    `<b>বিকাশ তথ্য:</b> ${paymentInfo}\n` +
    `<b>অগ্রিম প্রদেয়:</b> ৳${advance.toLocaleString('en-US')}\n` +
    `<b>বাকি বিল (COD):</b> ৳${dueCod.toLocaleString('en-US')}\n` +
    `${DIVIDER}`;

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML',
      }),
      signal: AbortSignal.timeout(5000),
    });

    // 🛡️ ফিক্স: আগে res.ok চেক না করায় Telegram ৪xx/৫xx দিলেও কোথাও লগ হতো
    // না — অর্ডার হয়ে যেত কিন্তু কেউ জানত না। token/chatId কখনো লগ হয় না।
    if (!res.ok) {
      let detail = '';
      try { detail = (await res.text()).slice(0, 300); } catch { /* ignore */ }
      logWarn('[Telegram] sendMessage failed:', res.status, detail, '| order:', order.orderNum);
    }
  } catch (err) {
    logWarn('[Telegram] Failed to send order notification:', err, '| order:', order.orderNum);
  }
}
