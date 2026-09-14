// [NEW] ফাইলের পাথ: app/[...segments]/loading.tsx
// সব প্রোগ্রামেটিক SEO গাইড/টেমপ্লেট পেজ (পিলার, কম্প্যারিজন, ইনস্টলেশন, অ্যাপ ও
// রিমোট, ডিজাইন সিস্টেম ইত্যাদি — আরও নতুন টেমপ্লেট ভবিষ্যতে যোগ হলেও) এই
// একটামাত্র root-level catch-all রুট (app/[...segments]/page.tsx) দিয়েই চলে, তাই
// Next.js-এর loading.tsx কনভেনশন অনুযায়ী পুরো রুটের জন্য একটাই স্কেলিটন ফাইল হয় —
// কোন URL কোন টেমপ্লেটে যাবে সেটা DB থেকে ফেচ করেই বোঝা যায় (এই ফাইলটা ঠিক সেই
// ফেচ শেষ হওয়ার আগ পর্যন্ত দেখানো হয়), তাই ফেচের আগেই টেমপ্লেট-নির্দিষ্ট আলাদা
// স্কেলিটন বানানো সম্ভব না। তাই এখানে একটা "ইউনিভার্সাল" স্কেলিটন বানানো হলো যেটা
// সবগুলো টেমপ্লেটে বাস্তবে ব্যবহৃত ব্লকগুলোর (GuideBlocks.tsx) সাধারণ কাঠামো
// অনুযায়ী তৈরি — Navbar, ব্রেডক্রাম্ব, Hero, তারপর একটা মিশ্র কন্টেন্ট ব্লক
// (কার্ড-গ্রিড/টেবিল ধাঁচের) ও একটা FAQ-ধাঁচের ব্লক — যাতে যেকোনো টেমপ্লেটেই
// লোড হওয়ার সময় এটা স্বাভাবিক ও প্রাসঙ্গিক দেখায়, খালি সাদা স্ক্রিন না দেখায়।
export default function GuidePageLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-bg/25 via-white to-white">
      {/* ================= Navbar Skeleton (showHomeButton ভ্যারিয়েন্ট) ================= */}
      <div className="mx-2 mb-1.5 mt-[14px] max-[400px]:mx-1.5 sm:mx-3">
        <div className="navbar-glass relative rounded-[35px] border border-white/60 bg-white/80 shadow-sh1 backdrop-blur-[8px]">
          <div className="mx-auto flex h-[62px] max-w-[1300px] items-center gap-[14px] px-3 max-[400px]:gap-2 sm:px-5 2xl:max-w-[1560px]">
            <div className="flex w-full items-center justify-between gap-2 max-[400px]:gap-1.5 sm:gap-3">
              <div className="flex shrink-0 items-center gap-1.5">
                <div className="h-[23px] w-[23px] animate-pulse rounded bg-brand-bg/60" />
                <div className="h-4 w-8 animate-pulse rounded bg-brand-bg/50" />
              </div>
              <div className="flex items-center gap-2 md:gap-3">
                <div className="hidden h-10 animate-pulse rounded-full bg-brand-bg/30 md:block md:w-[240px] lg:w-[300px]" />
                <div className="flex items-center gap-1.5">
                  <div className="h-9 w-9 animate-pulse rounded-[9px] bg-brand-bg/50" />
                  <div className="h-9 w-9 animate-pulse rounded-[9px] bg-brand-bg/50" />
                  <div className="h-9 w-[74px] animate-pulse rounded-full bg-brand-light/30 sm:w-20" />
                  <div className="hidden h-9 w-9 animate-pulse rounded-[9px] bg-brand-bg/50 min-[401px]:block" />
                  <div className="h-9 w-9 animate-pulse rounded-[9px] bg-brand-bg/50 md:hidden" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ================= ব্রেডক্রাম্ব Skeleton ================= */}
      <div className="mx-auto max-w-[1100px] px-4 pt-4 sm:px-5">
        <div className="mb-3 flex items-center gap-1.5">
          <div className="h-3 w-9 animate-pulse rounded bg-surface-muted" />
          <div className="h-3 w-2 rounded bg-surface-muted" />
          <div className="h-3 w-24 animate-pulse rounded bg-surface-muted" />
        </div>
      </div>

      {/* ================= Hero ব্লক Skeleton ================= */}
      <div className="border-b border-border-base bg-gradient-to-b from-brand-bg/35 via-[#DCEBFD]/45 to-white">
        <div className="mx-auto grid max-w-[1100px] gap-8 px-4 py-10 sm:px-5 sm:py-14 md:grid-cols-[1.1fr_0.9fr] md:items-center">
          <div>
            <div className="mb-3 h-6 w-32 animate-pulse rounded-full bg-white/80" />
            <div className="space-y-2.5">
              <div className="h-7 w-full animate-pulse rounded-lg bg-white/70 sm:h-8" />
              <div className="h-7 w-4/5 animate-pulse rounded-lg bg-white/70 sm:h-8" />
            </div>
            <div className="mt-4 space-y-2">
              <div className="h-3.5 w-full animate-pulse rounded bg-white/50" />
              <div className="h-3.5 w-11/12 animate-pulse rounded bg-white/50" />
              <div className="h-3.5 w-2/3 animate-pulse rounded bg-white/50" />
            </div>
          </div>
          <div className="aspect-[5/4] w-full animate-pulse rounded-2xl bg-white/40" />
        </div>
      </div>

      {/* ================= মিশ্র কন্টেন্ট ব্লক Skeleton (টেবিল/কার্ড-গ্রিড ধাঁচের) ================= */}
      <div className="mx-auto max-w-[1100px] px-4 py-8 sm:px-5">
        <div className="mb-4 h-6 w-56 animate-pulse rounded-lg bg-surface-muted" />
        <div className="overflow-hidden rounded-2xl border border-border-base shadow-xs">
          <div className="grid grid-cols-3 gap-px bg-border-base">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className={`h-11 animate-pulse ${i < 3 ? 'bg-brand-bg/40' : i % 2 ? 'bg-white' : 'bg-brand-bg/10'}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ================= কার্ড-গ্রিড ব্লক Skeleton ================= */}
      <div className="mx-auto max-w-[1100px] px-4 pb-8 sm:px-5">
        <div className="mb-4 h-6 w-48 animate-pulse rounded-lg bg-surface-muted" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-2xl border border-border-base bg-white/95 p-5 shadow-xs">
              <div className="mb-3 h-10 w-10 animate-pulse rounded-full bg-brand-bg/50" />
              <div className="mb-2 h-4 w-3/4 animate-pulse rounded bg-surface-muted" />
              <div className="space-y-1.5">
                <div className="h-3 w-full animate-pulse rounded bg-surface-muted" />
                <div className="h-3 w-5/6 animate-pulse rounded bg-surface-muted" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ================= FAQ ব্লক Skeleton ================= */}
      <div className="mx-auto max-w-[880px] px-4 pb-12 sm:px-5">
        <div className="mb-4 h-6 w-40 animate-pulse rounded-lg bg-surface-muted" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 animate-pulse rounded-[16px] border border-border-base bg-white/95 shadow-xs" />
          ))}
        </div>
      </div>
    </div>
  );
                                                 }
