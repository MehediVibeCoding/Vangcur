export default function ProductLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-bg/25 via-white to-white">
      {/* Navbar Placeholder */}
      <div className="mx-2 mb-1.5 mt-[14px] sm:mx-3">
        <div className="mx-auto flex h-[62px] max-w-[1300px] items-center justify-between rounded-[35px] border border-white/60 bg-white/80 px-4 shadow-sh2 backdrop-blur-[8px]">
          <div className="h-7 w-28 animate-pulse rounded-full bg-brand-bg/60" />
          <div className="flex gap-2">
            <div className="h-9 w-9 animate-pulse rounded-full bg-brand-bg/50" />
            <div className="h-9 w-9 animate-pulse rounded-full bg-brand-bg/50" />
            <div className="h-9 w-20 animate-pulse rounded-full bg-brand-bg/60" />
          </div>
        </div>
      </div>

      {/* Main Skeleton Grid */}
      <div className="mx-auto grid max-w-[1100px] grid-cols-1 gap-8 px-4 pb-6 pt-5 md:grid-cols-2 md:px-8 md:pb-10">
        {/* Left Column: Image Skeleton */}
        <div>
          <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-brand border border-border-base bg-white p-8 shadow-sh1">
            <div className="h-3/4 w-3/4 animate-pulse rounded-2xl bg-brand-bg/40" />
          </div>
          <div className="mt-4 flex justify-center gap-2">
            <div className="h-2 w-8 animate-pulse rounded-full bg-brand-bg/50" />
            <div className="h-2 w-2 animate-pulse rounded-full bg-brand-bg/30" />
            <div className="h-2 w-2 animate-pulse rounded-full bg-brand-bg/30" />
          </div>
        </div>

        {/* Right Column: Info Skeleton */}
        <div className="flex flex-col gap-4">
          <div className="h-7 w-3/4 animate-pulse rounded-lg bg-surface-muted" />
          <div className="h-5 w-1/2 animate-pulse rounded-lg bg-surface-muted" />

          <div className="my-1 flex items-baseline gap-3">
            <div className="h-9 w-28 animate-pulse rounded-lg bg-brand-bg/50" />
            <div className="h-5 w-16 animate-pulse rounded-lg bg-surface-muted" />
          </div>

          <div className="h-10 w-full animate-pulse rounded-[10px] bg-emerald-50" />

          {/* Quick Specs Skeleton */}
          <div className="space-y-2 pt-2">
            <div className="h-4 w-36 animate-pulse rounded bg-surface-muted" />
            <div className="flex flex-wrap gap-2">
              <div className="h-7 w-24 animate-pulse rounded-full bg-brand-bg/30" />
              <div className="h-7 w-32 animate-pulse rounded-full bg-brand-bg/30" />
              <div className="h-7 w-28 animate-pulse rounded-full bg-brand-bg/30" />
            </div>
          </div>

          {/* Quantity & CTA Skeleton */}
          <div className="mt-4 flex gap-3">
            <div className="h-12 w-32 animate-pulse rounded-full bg-brand-bg/30" />
            <div className="h-12 flex-1 animate-pulse rounded-[10px] bg-brand-bg/50" />
          </div>
          <div className="h-12 w-full animate-pulse rounded-[10px] bg-brand-light/40" />
        </div>
      </div>
    </div>
  );
}
