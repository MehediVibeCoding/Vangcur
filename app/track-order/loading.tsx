// GitHub পাথ: app/track-order/loading.tsx — পুরো ফাইলটা এটা দিয়ে replace করবে
export default function TrackLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-bg/25 via-white to-white">
      {/* ================= Navbar Skeleton (showHomeButton, ট্র্যাক আইকন ছাড়া) ================= */}
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
                  <div className="h-9 w-9 animate-pulse rounded-[9px] bg-brand-bg/50 md:hidden" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ================= শিরোনাম + সাবটাইটেল + কার্ড ================= */}
      <div className="mx-auto w-full max-w-[480px] px-5 pb-16 pt-8">
        <div className="mx-auto mb-1.5 h-6 w-52 animate-pulse rounded-lg bg-brand-bg/60" />
        <div className="mx-auto mb-6 h-3.5 w-full max-w-[320px] animate-pulse rounded bg-surface-muted" />

        <div className="rounded-brand border border-border-base bg-white p-5 shadow-sh1">
          <div className="flex flex-col items-center gap-3 py-8">
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-brand-light/25 border-t-brand-light" />
            <div className="h-3 w-24 animate-pulse rounded bg-surface-muted" />
          </div>
        </div>
      </div>
    </div>
  );
}
