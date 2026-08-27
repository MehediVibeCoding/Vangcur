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
  shippingCost: number;
  paymentTxn?: string;
  paymentLast4?: string;
}

export async function sendTelegramOrderNotification(order: TelegramOrderNotification): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    return;
  }

  const itemsText = order.items
    .map((i, idx) => `${idx + 1}. <b>${i.name}</b> x${i.qty} — ৳${(i.price * i.qty).toLocaleString()}`)
    .join('\n');

  const paymentInfo = order.paymentTxn
    ? `TxnID: <code>${order.paymentTxn}</code>`
    : order.paymentLast4
    ? `Last 4 digits: <code>${order.paymentLast4}</code>`
    : 'N/A';

  const message = `🛍️ <b>নতুন অর্ডার এসেছে!</b>\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `📦 <b>অর্ডার নং:</b> ${order.orderNum}\n` +
    `👤 <b>কাস্টমার:</b> ${order.name}\n` +
    `📞 <b>ফোন:</b> <code>${order.phone}</code>\n` +
    `📍 <b>ঠিকানা:</b> ${order.district ? `${order.district}, ` : ''}${order.address}\n` +
    `${order.email ? `✉️ <b>ইমেইল:</b> ${order.email}\n` : ''}` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `🛒 <b>পণ্যসমূহ:</b>\n${itemsText}\n` +
    `━━━━━━━━━━━━━━━━━━━━\n` +
    `🚚 <b>শিপিং চার্জ:</b> ৳${order.shippingCost}\n` +
    `💰 <b>সর্বমোট বিল:</b> ৳${order.total.toLocaleString()}\n` +
    `💳 <b>বিকাশ তথ্য:</b> ${paymentInfo}\n` +
    `💵 <b>বাকি বিল (COD):</b> ৳${Math.max(0, order.total - 200).toLocaleString()}\n` +
    `━━━━━━━━━━━━━━━━━━━━`;

  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML',
      }),
      signal: AbortSignal.timeout(5000),
    });
  } catch (err) {
    logWarn('[Telegram] Failed to send order notification:', err);
  }
}
