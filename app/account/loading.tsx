// GitHub পাথ: app/account/loading.tsx — পুরো ফাইলটা এটা দিয়ে replace করবে
import { OrderListSkeleton } from '@/app/components/ui/Skeletons';

export default function AccountLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-bg/25 via-white to-white">
      {/* Navbar Skeleton */}
      <div className="sticky top-[14px] z-[900] mx-2 mb-1.5 mt-[14px] max-[400px]:mx-1.5 sm:mx-3">
        <div className="navbar-glass relative rounded-[35px] border border-white/70 bg-white/80 shadow-sh1 backdrop-blur-[10px]">
          <div className="mx-auto flex h-[62px] max-w-[1300px] items-center gap-[14px] px-3 max-[400px]:gap-2 sm:px-5 2xl:max-w-[1560px]">
            <div className="flex w-full items-center justify-between gap-2 max-[400px]:gap-1.5 sm:gap-3">
              <div className="flex shrink-0 items-center gap-1.5 min-[420px]:gap-2 rounded-full border border-border-base/70 bg-white/80 py-1.5 pl-2 pr-3 shadow-xs max-[400px]:pr-2 max-[400px]:pl-1.5 min-[420px]:pr-3.5">
                <div className="h-7 w-7 shrink-0 animate-pulse rounded-full bg-brand-light/40" />
                <div className="hidden h-3.5 w-16 animate-pulse rounded bg-brand-bg/50 min-[420px]:block" />
                <div className="h-3.5 w-9 animate-pulse rounded bg-brand-bg/50 min-[420px]:hidden" />
              </div>
              <div className="flex items-center gap-2 md:gap-3">
                {/* ডেস্কটপ: লেবেলযুক্ত AccountNavTabs পিল + নোটিফিকেশন বেল (কোনো সার্চ বার নেই) */}
                <div className="hidden items-center gap-2 md:flex">
                  <div className="h-10 w-[300px] animate-pulse rounded-full border border-border-base/70 bg-surface-muted/50 lg:w-[340px]" />
                  <div className="h-9 w-9 animate-pulse rounded-[9px] bg-brand-bg/50" />
                </div>
                {/* মোবাইল: ৪টা আইকন বাটন (উইশলিস্ট, কার্ট, মেম্বারশিপ, ট্র্যাক অর্ডার) + নোটিফিকেশন বেল */}
                <div className="flex items-center gap-1.5 md:hidden">
                  <div className="h-9 w-9 animate-pulse rounded-[9px] bg-brand-bg/50" />
                  <div className="h-9 w-9 animate-pulse rounded-[9px] bg-brand-bg/50" />
                  <div className="h-9 w-9 animate-pulse rounded-[9px] bg-brand-bg/50" />
                  <div className="h-9 w-9 animate-pulse rounded-[9px] bg-brand-bg/50" />
                  <div className="h-9 w-9 animate-pulse rounded-[9px] bg-brand-bg/50" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Content Skeleton */}
      <div className="mx-auto max-w-[1100px] px-4 pb-16 pt-4 md:px-6">
        {/* Header Title — শিরোনাম + শুভেচ্ছা লাইন + সময়/তারিখ লাইন (৩ লাইন, আগে ৩য়টা মিসিং ছিল) */}
        <div className="mb-6 text-center">
          <div className="mx-auto h-6 w-48 animate-pulse rounded-lg bg-brand-bg/60 sm:h-7" />
          <div className="mx-auto mt-1.5 h-3.5 w-40 animate-pulse rounded bg-surface-muted" />
          <div className="mx-auto mt-1 h-3 w-32 animate-pulse rounded bg-surface-muted" />
        </div>

        {/* 2-Column Dashboard Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[360px_1fr]">
          {/* Left Column Skeleton */}
          <div className="flex flex-col gap-4">
            {/* Weather/Celestial Card — আসলটার সাথে মিলিয়ে minHeight:280px + shadow-sh2 */}
            <div className="w-full animate-pulse rounded-[24px] bg-brand-bg/40 shadow-sh2" style={{ minHeight: 280 }} />

            {/* ৩টা স্ট্যাট চিপ — আসলটার মতো সাদা ফ্রস্টেড-গ্লাস কার্ড (flat gray না) */}
            <div className="grid grid-cols-3 gap-2.5">
              <div className="h-[68px] animate-pulse rounded-[20px] border border-white/80 bg-white/85 shadow-xs" />
              <div className="h-[68px] animate-pulse rounded-[20px] border border-white/80 bg-white/85 shadow-xs" />
              <div className="h-[68px] animate-pulse rounded-[20px] border border-white/80 bg-white/85 shadow-xs" />
            </div>

            {/* ভাষা উইজেট — radius 22px, border+shadow-xs সহ */}
            <div className="h-[108px] w-full animate-pulse rounded-[22px] border border-white/80 bg-white/85 shadow-xs" />
          </div>

          {/* Right Column Skeleton */}
          <div className="flex flex-col gap-4">
            <div className="mb-0 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 shrink-0 animate-pulse rounded-full bg-brand-light/40" />
                <div className="h-4 w-32 animate-pulse rounded bg-brand-bg/50" />
              </div>
              <div className="h-3.5 w-16 animate-pulse rounded bg-surface-muted" />
            </div>

            <div className="rounded-[24px] border border-white/80 bg-white/85 p-5 shadow-xs backdrop-blur-md">
              <OrderListSkeleton count={2} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
