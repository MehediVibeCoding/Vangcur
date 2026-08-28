// GitHub পাথ: app/category/[slug]/loading.tsx — পুরো ফাইলটা এটা দিয়ে replace করবে
export default function CategoryLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-bg/25 via-white to-white">
      {/* ================= Navbar Skeleton (showHomeButton ভ্যারিয়েন্ট) ================= */}
      <div className="mx-2 mb-1.5 mt-[14px] max-[400px]:mx-1.5 sm:mx-3">
        <div className="navbar-glass relative rounded-[35px] border border-white/60 bg-white/80 shadow-sh2 backdrop-blur-[8px]">
          <div className="mx-auto flex h-[62px] max-w-[1300px] items-center gap-[14px] px-3 max-[400px]:gap-2 sm:px-5 2xl:max-w-[1560px]">
            <div className="flex w-full items-center justify-between gap-2 max-[400px]:gap-1.5 sm:gap-3">
              {/* হোম আইকন + "হোম" টেক্সট (লোগোর বদলে) */}
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

      {/* ================= Breadcrumb + ক্যাটাগরি হেডার + Sibling চিপস ================= */}
      <div className="mx-auto max-w-[1300px] px-5 pt-6">
        <div className="mb-4 h-[13px] w-40 animate-pulse rounded bg-surface-muted" />

        <div className="mb-5 flex items-center gap-3">
          <div className="h-12 w-12 shrink-0 animate-pulse rounded-full border-[1.5px] border-border-base bg-brand-bg" />
          <div className="h-7 w-48 animate-pulse rounded-lg bg-brand-bg/60" />
        </div>

        <div className="mb-7 flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-[30px] w-24 animate-pulse rounded-full border border-border-base bg-white" />
          ))}
        </div>
      </div>

      {/* ================= ProductGrid Skeleton (নিজস্ব হেডার + গ্রিড) ================= */}
      <div className="mx-auto mb-11 max-w-[1300px] px-5">
        <div className="mb-5 flex items-center justify-between">
          <div className="h-6 w-40 animate-pulse rounded-md bg-brand-bg/50" />
          <div className="h-4 w-20 animate-pulse rounded bg-surface-muted" />
        </div>

        <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="rounded-[18px] bg-white p-1 shadow-[0_4px_14px_rgba(0,88,199,.12)]">
              <div className="relative aspect-[0.57] animate-pulse overflow-hidden rounded-[15px] bg-brand-bg/30">
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
