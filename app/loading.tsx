export default function HomeLoading() {
  return (
    <div className="min-h-screen bg-transparent">
      {/* Navbar Skeleton */}
      <div className="mx-2 mb-1.5 mt-[14px] sm:mx-3">
        <div className="mx-auto flex h-[62px] max-w-[1300px] items-center justify-between rounded-[35px] border border-white/60 bg-white/80 px-4 shadow-sh2 backdrop-blur-[8px]">
          <div className="h-7 w-28 animate-pulse rounded-full bg-brand-bg/60" />
          <div className="hidden h-10 w-64 animate-pulse rounded-full bg-brand-bg/40 md:block" />
          <div className="flex gap-2">
            <div className="h-9 w-9 animate-pulse rounded-full bg-brand-bg/50" />
            <div className="h-9 w-9 animate-pulse rounded-full bg-brand-bg/50" />
            <div className="h-9 w-20 animate-pulse rounded-full bg-brand-bg/60" />
          </div>
        </div>
      </div>

      {/* Hero Slider Skeleton Strip */}
      <div className="relative mx-auto max-w-[1300px] p-3.5 pb-0">
        <div className="flex gap-3 overflow-hidden">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="aspect-[9/16] w-[calc((100vw-56px)/2)] max-w-[calc(50vw-8px)] min-h-[220px] shrink-0 animate-pulse rounded-[20px] bg-brand-bg/40 shadow-sm sm:min-h-[300px] md:min-h-[280px] md:w-[calc((100%-60px)/6)] md:max-w-none"
            />
          ))}
        </div>
      </div>

      {/* Categories Carousel Skeleton */}
      <div className="mx-auto mb-8 mt-6 max-w-[1300px] px-5">
        <div className="mb-4 h-6 w-36 animate-pulse rounded-md bg-brand-bg/50" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex h-16 animate-pulse items-center gap-3 rounded-2xl border border-white/60 bg-white/80 p-2.5 shadow-sm">
              <div className="h-11 w-11 shrink-0 rounded-full bg-brand-bg/50" />
              <div className="h-4 flex-1 rounded bg-surface-muted" />
            </div>
          ))}
        </div>
      </div>

      {/* Product Grid Skeleton */}
      <div className="mx-auto mb-11 max-w-[1300px] px-5">
        <div className="mb-5 flex items-center justify-between">
          <div className="h-6 w-40 animate-pulse rounded-md bg-brand-bg/50" />
          <div className="h-4 w-20 animate-pulse rounded bg-surface-muted" />
        </div>

        <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
            <div key={i} className="rounded-[18px] bg-white p-1 shadow-sh1">
              <div className="aspect-[0.57] animate-pulse rounded-[15px] bg-brand-bg/30 p-3">
                <div className="flex h-full flex-col justify-end gap-2">
                  <div className="h-4 w-3/4 rounded bg-white/60" />
                  <div className="h-4 w-1/2 rounded bg-white/60" />
                  <div className="h-8 w-full rounded-full bg-white/80" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
