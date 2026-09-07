function CheckIconSvg({ className = '' }: { className?: string }) {
  return (
    <svg className={className} width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
    </svg>
  );
}

// 🔵 Vangcur টিম/মডারেটরদের জন্য — শুধুমাত্র is_admin ইউজাররাই পান
export function TeamVerifiedBadge() {
  return (
    <span
      title="ভাঙচুর টিম ভেরিফিকেশন ব্যাজ"
      className="inline-flex h-[15px] w-[15px] shrink-0 items-center justify-center rounded-full bg-brand-light text-white shadow-xs"
    >
      <CheckIconSvg />
    </span>
  );
}

// 🟢 কাস্টমারের জন্য — যাদের প্রোফাইল (নাম+ফোন+জেলা+ঠিকানা) সম্পূর্ণ, তারাই পান।
// টিমের নীল ব্যাজ থেকে আলাদা রঙে যাতে দুটো গুলিয়ে না যায়।
export function VerifiedCustomerBadge() {
  return (
    <span
      title="প্রোফাইল ভেরিফায়েড কাস্টমার"
      className="inline-flex h-[15px] w-[15px] shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white shadow-xs"
    >
      <CheckIconSvg />
    </span>
  );
}
