// GitHub পাথ: app/loading.tsx — পুরো ফাইলটা এটা দিয়ে replace করবে
export default function HomeLoading() {
  return (
    <div className="min-h-screen bg-transparent">
      {/* ================= Navbar Skeleton ================= */}
      <div className="mx-2 mb-1.5 mt-[14px] max-[400px]:mx-1.5 sm:mx-3">
        <div className="navbar-glass relative rounded-[35px] border border-white/60 bg-white/80 shadow-sh2 backdrop-blur-[8px]">
          <div className="mx-auto flex h-[62px] max-w-[1300px] items-center gap-[14px] px-3 max-[400px]:gap-2 sm:px-5 2xl:max-w-[1560px]">
            <div className="flex w-full items-center justify-between gap-2 max-[400px]:gap-1.5 sm:gap-3">
              {/* লোগো — Image (140x49) এর h-7/md:h-8 রেশিও অনুযায়ী */}
              <div className="h-7 w-20 shrink-0 animate-pulse rounded-md bg-brand-bg/60 max-[400px]:h-6 max-[400px]:w-[68px] md:h-8 md:w-[92px]" />

              <div className="flex items-center gap-2 md:gap-3">
                {/* ডেস্কটপ সার্চ বার — md:w-[240px] lg:w-[300px] */}
                <div className="hidden h-10 animate-pulse rounded-full bg-brand-bg/30 md:block md:w-[240px] lg:w-[300px]" />

                {/* wishlist, cart, login pill, track-order — একই অর্ডারে */}
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

      {/* ================= Hero Slider Skeleton ================= */}
      <div className="relative mx-auto max-w-[1300px] bg-transparent px-3.5 pt-3.5 sm:px-5 2xl:max-w-[1560px]">
        <div className="relative w-full overflow-hidden">
          <div className="flex gap-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div
                key={i}
                className="aspect-[9/16] w-[calc((100%-12px)/2)] min-h-[220px] shrink-0 animate-pulse rounded-[14px] bg-brand-bg/40 shadow-[0_4px_16px_rgba(0,0,0,.08)] sm:min-h-[280px] md:w-[calc((100%-60px)/6)]"
              />
            ))}
          </div>
        </div>
      </div>

      {/* ================= TrustStrip Skeleton (আগে বাদ পড়েছিল) ================= */}
      <div className="mx-auto mb-[26px] mt-4 max-w-[1300px] px-5">
        <div className="grid grid-cols-3 gap-x-2 gap-y-3 rounded-2xl border border-white/60 bg-white/80 px-4 py-3 shadow-sh2 backdrop-blur-[8px] md:grid-cols-5 md:gap-x-4 md:px-7 md:py-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className={`flex items-center gap-2 ${i > 3 ? 'hidden md:flex' : ''}`}>
              <div className="h-9 w-9 shrink-0 animate-pulse rounded-full bg-brand-bg/50 md:h-10 md:w-10" />
              <div className="min-w-0 flex-1 space-y-1.5">
                <div className="h-2.5 w-4/5 animate-pulse rounded bg-brand-bg/50" />
                <div className="h-2 w-3/5 animate-pulse rounded bg-surface-muted" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ================= Categories Carousel Skeleton ================= */}
      <div className="mx-auto mb-11 min-h-[140px] max-w-[1300px] px-5">
        <div className="mb-5 h-6 w-36 animate-pulse rounded-md bg-brand-bg/50" />

        <div className="relative px-[38px] md:px-[44px]">
          <div className="absolute left-0 top-1/2 h-[30px] w-[30px] -translate-y-1/2 animate-pulse rounded-full border-2 border-border-base bg-white md:h-9 md:w-9" />

          <div className="grid grid-cols-2 gap-[7px] pt-1.5 md:grid-cols-3 md:gap-3 lg:grid-cols-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div
                key={i}
                className={`flex items-center gap-1.5 rounded-2xl border-[1.5px] border-border-base bg-white p-2 md:gap-3 md:p-[13px] ${i > 4 ? 'hidden md:flex' : ''}`}
              >
                <div className="h-11 w-11 shrink-0 animate-pulse rounded-full bg-brand-bg/50 md:h-[52px] md:w-[52px]" />
                <div className="h-3.5 w-14 animate-pulse rounded bg-surface-muted" />
              </div>
            ))}
          </div>

          <div className="absolute right-0 top-1/2 h-[30px] w-[30px] -translate-y-1/2 animate-pulse rounded-full border-2 border-border-base bg-white md:h-9 md:w-9" />
        </div>

        <div className="mt-3.5 flex justify-center gap-1.5">
          <div className="h-2 w-[22px] animate-pulse rounded bg-brand-bg/50" />
          <div className="h-2 w-2 animate-pulse rounded-full bg-brand-bg/40" />
        </div>
      </div>

      {/* ================= Product Grid Skeleton ================= */}
      <div className="mx-auto mb-11 max-w-[1300px] px-5">
        <div className="mb-5 flex items-center justify-between">
          <div className="h-6 w-40 animate-pulse rounded-md bg-brand-bg/50" />
          <div className="h-4 w-20 animate-pulse rounded bg-surface-muted" />
        </div>

        <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="rounded-[18px] bg-white p-1 shadow-[0_4px_14px_rgba(0,88,199,.12)]">
              <div className="relative aspect-[0.57] animate-pulse overflow-hidden rounded-[15px] bg-brand-bg/30">
                {/* wishlist heart placeholder */}
                <div className="absolute right-[4.5%] top-[4.5%] h-7 w-7 rounded-full bg-white/30 sm:h-8 sm:w-8" />
                <div className="absolute inset-x-0 bottom-0 flex flex-col gap-1 p-2 sm:p-3">
                  <div className="h-3 w-4/5 rounded bg-white/60 sm:h-3.5" />
                  <div className="h-2 w-1/3 rounded bg-white/40" />
                  <div className="mt-0.5 h-4 w-2/5 rounded bg-white/70 sm:h-5" />
                  <div className="mt-1 flex items-center gap-1 sm:mt-1.5">
                    <div className="h-8 w-8 shrink-0 rounded-full bg-white/40 sm:h-9 sm:w-9 lg:h-10 lg:w-10" />
                    <div className="h-8 flex-1 rounded-full bg-white/50 sm:h-9 lg:h-10" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
