export default function OffersLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-bg/35 via-[#DCEBFD]/45 to-white">
      {/* ================= Navbar Skeleton ================= */}
      <div className="mx-2 mb-1.5 mt-[14px] max-[400px]:mx-1.5 sm:mx-3">
        <div className="navbar-glass relative rounded-[35px] border border-white/60 bg-white/80 shadow-sh2 backdrop-blur-[8px]">
          <div className="mx-auto flex h-[62px] max-w-[1300px] items-center gap-[14px] px-3 max-[400px]:gap-2 sm:px-5 2xl:max-w-[1560px]">
            <div className="flex w-full items-center justify-between gap-2 max-[400px]:gap-1.5 sm:gap-3">
              {/* হোম বাটন পিল */}
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

      {/* ================= Main Content Skeleton ================= */}
      <div className="mx-auto w-full max-w-[840px] px-4 sm:px-6 pb-16 pt-3.5 sm:pt-5">
        {/* Header Box Skeleton */}
        <div className="relative mb-6 overflow-hidden rounded-[24px] border border-white/80 bg-gradient-to-b from-brand-bg/40 via-[#DCEBFD]/50 to-white/90 p-5 sm:p-7 shadow-sh2 backdrop-blur-md">
          <div className="mb-4 flex items-center justify-between border-b border-ink/10 pb-3.5">
            <div className="h-7 w-20 animate-pulse rounded-full bg-white/80" />
            <div className="h-6 w-32 animate-pulse rounded-full bg-white/60" />
          </div>
          <div className="flex items-center gap-3.5">
            <div className="h-12 w-12 shrink-0 animate-pulse rounded-full border border-brand-light/35 bg-white shadow-xs" />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="h-6 w-3/4 animate-pulse rounded-lg bg-brand-bg/60 sm:h-7" />
              <div className="h-3.5 w-1/2 animate-pulse rounded bg-brand-light/30" />
            </div>
          </div>
        </div>

        {/* Offer Card Skeleton */}
        <div className="overflow-hidden rounded-[24px] border border-white/90 bg-white/90 p-6 sm:p-8 shadow-sh2 backdrop-blur-md">
          <div className="mb-3 flex items-center gap-2">
            <div className="h-5 w-5 animate-pulse rounded-full bg-brand-bg/60" />
            <div className="h-3.5 w-28 animate-pulse rounded bg-surface-muted" />
          </div>
          <div className="mb-4 h-7 w-4/5 animate-pulse rounded-lg bg-brand-bg/50" />
          <div className="space-y-2.5 mb-6">
            <div className="h-3.5 w-full animate-pulse rounded bg-surface-muted" />
            <div className="h-3.5 w-11/12 animate-pulse rounded bg-surface-muted" />
            <div className="h-3.5 w-3/4 animate-pulse rounded bg-surface-muted" />
          </div>
          <div className="h-11 w-44 animate-pulse rounded-full bg-brand-light/40" />
        </div>
      </div>
    </div>
  );
}
