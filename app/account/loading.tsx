export default function AccountLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-bg/25 via-white to-white">
      {/* Navbar Skeleton */}
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

      {/* Profile Content Skeleton */}
      <div className="mx-auto max-w-[1100px] px-4 pb-16 pt-4 md:px-6">
        {/* Header Title */}
        <div className="mb-6 text-center">
          <div className="mx-auto h-7 w-48 animate-pulse rounded-lg bg-brand-bg/60" />
          <div className="mx-auto mt-2 h-4 w-36 animate-pulse rounded bg-surface-muted" />
        </div>

        {/* 2-Column Dashboard Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[360px_1fr]">
          {/* Left Column Skeleton */}
          <div className="flex flex-col gap-4">
            {/* Weather Card */}
            <div className="h-[240px] w-full animate-pulse rounded-[24px] bg-brand-bg/40 shadow-sh1" />

            {/* 3 Stats Chips */}
            <div className="grid grid-cols-3 gap-2.5">
              <div className="h-[68px] animate-pulse rounded-[18px] bg-surface-muted" />
              <div className="h-[68px] animate-pulse rounded-[18px] bg-surface-muted" />
              <div className="h-[68px] animate-pulse rounded-[18px] bg-surface-muted" />
            </div>

            {/* Language Widget */}
            <div className="h-[100px] w-full animate-pulse rounded-[20px] bg-surface-muted" />
          </div>

          {/* Right Column Skeleton */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="h-5 w-36 animate-pulse rounded bg-brand-bg/50" />
              <div className="h-4 w-16 animate-pulse rounded bg-surface-muted" />
            </div>

            <div className="rounded-[24px] border border-white/80 bg-white/80 p-5 shadow-xs">
              <div className="flex flex-col gap-4">
                {[1, 2, 3].map((k) => (
                  <div key={k} className="h-[130px] animate-pulse rounded-[16px] bg-surface-muted" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
