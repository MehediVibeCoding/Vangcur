// GitHub পাথ: app/account/orders/loading.tsx — পুরো ফাইলটা এটা দিয়ে replace করবে
export default function OrdersLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-bg/25 via-white to-white">
      {/* ================= Navbar Skeleton (showHomeButton, track-order আইকনসহ) ================= */}
      <div className="mx-2 mb-1.5 mt-[14px] max-[400px]:mx-1.5 sm:mx-3">
        <div className="navbar-glass relative rounded-[35px] border border-white/60 bg-white/80 shadow-sh2 backdrop-blur-[8px]">
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

      {/* ================= শিরোনাম + স্ট্যাটাস ব্যাজ ================= */}
      <div className="mx-auto w-full max-w-[720px] px-5 pb-16 pt-8">
        <div className="mb-5 flex items-center justify-between">
          <div className="h-6 w-44 animate-pulse rounded-lg bg-brand-bg/60" />
          <div className="flex gap-2">
            <div className="h-[22px] w-16 animate-pulse rounded-full bg-surface-muted" />
            <div className="h-[22px] w-16 animate-pulse rounded-full bg-surface-muted" />
            <div className="h-[22px] w-16 animate-pulse rounded-full bg-surface-muted" />
          </div>
        </div>

        {/* সার্চ বার */}
        <div className="mb-4 h-[42px] w-full animate-pulse rounded-full bg-surface-muted" />

        {/* অর্ডার কার্ড — অ্যাপের নিজস্ব ইন-কম্পোনেন্ট loading স্টেটের সাথে হুবহু মিল রেখে */}
        <div className="flex flex-col gap-3.5">
          <div className="h-[150px] animate-pulse rounded-brand bg-surface-muted" />
          <div className="h-[150px] animate-pulse rounded-brand bg-surface-muted" />
          <div className="h-[150px] animate-pulse rounded-brand bg-surface-muted" />
        </div>
      </div>
    </div>
  );
}
