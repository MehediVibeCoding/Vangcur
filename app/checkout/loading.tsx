export default function CheckoutLoading() {
  return (
    <div className="relative min-h-dvh overflow-hidden bg-[#EFF6FE] py-4">
      <div className="mx-auto w-full max-w-[640px] overflow-hidden rounded-[22px] bg-white shadow-sh2 sm:my-6">
        {/* Header Skeleton */}
        <div className="bg-gradient-to-br from-[#90C8FA] to-[#72B2F5] px-5 py-4">
          <div className="flex items-center justify-between">
            <div className="h-6 w-36 animate-pulse rounded-full bg-white/50" />
            <div className="h-8 w-8 animate-pulse rounded-full bg-white/30" />
          </div>
        </div>

        {/* Stepper Skeleton */}
        <div className="flex px-6 py-4">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex flex-1 flex-col items-center gap-2">
              <div className="h-6 w-6 animate-pulse rounded-full bg-brand-bg" />
              <div className="h-3 w-12 animate-pulse rounded bg-surface-muted" />
            </div>
          ))}
        </div>

        {/* Form Body Skeleton */}
        <div className="space-y-4 px-6 py-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-1.5">
              <div className="h-4 w-24 animate-pulse rounded bg-surface-muted" />
              <div className="h-11 w-full animate-pulse rounded-[12px] bg-brand-bg/25" />
            </div>
          ))}
          <div className="h-12 w-full animate-pulse rounded-full bg-brand-light/50 pt-2" />
        </div>
      </div>
    </div>
  );
}
