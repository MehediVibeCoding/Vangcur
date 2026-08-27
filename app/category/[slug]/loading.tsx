export default function CategoryLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-bg/25 via-white to-white">
      {/* Navbar Placeholder */}
      <div className="mx-2 mb-1.5 mt-[14px] sm:mx-3">
        <div className="mx-auto flex h-[62px] max-w-[1300px] items-center justify-between rounded-[35px] border border-white/60 bg-white/80 px-4 shadow-sh2 backdrop-blur-[8px]">
          <div className="h-7 w-28 animate-pulse rounded-full bg-brand-bg/60" />
          <div className="flex gap-2">
            <div className="h-9 w-9 animate-pulse rounded-full bg-brand-bg/50" />
            <div className="h-9 w-9 animate-pulse rounded-full bg-brand-bg/50" />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1300px] px-5 pt-6">
        <div className="mb-4 h-4 w-28 animate-pulse rounded bg-surface-muted" />
        <div className="mb-5 flex items-center gap-3">
          <div className="h-12 w-12 animate-pulse rounded-full bg-brand-bg" />
          <div className="h-8 w-48 animate-pulse rounded-lg bg-brand-bg/60" />
        </div>
        <div className="mb-7 flex gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-8 w-24 animate-pulse rounded-full bg-brand-bg/30" />
          ))}
        </div>

        {/* Grid Skeleton */}
        <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
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
