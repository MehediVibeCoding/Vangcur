export default function OrdersLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-bg/25 via-white to-white">
      <div className="mx-2 mb-1.5 mt-[14px] sm:mx-3">
        <div className="mx-auto flex h-[62px] max-w-[1300px] items-center justify-between rounded-[35px] border border-white/60 bg-white/80 px-4 shadow-sh2">
          <div className="h-7 w-28 animate-pulse rounded-full bg-brand-bg/60" />
          <div className="h-9 w-20 animate-pulse rounded-full bg-brand-bg/60" />
        </div>
      </div>
      <div className="mx-auto w-full max-w-[720px] px-5 pb-16 pt-8">
        <div className="mb-5 h-7 w-48 animate-pulse rounded-lg bg-brand-bg/60" />
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-36 animate-pulse rounded-brand border border-border-base bg-white p-4 shadow-sm" />
          ))}
        </div>
      </div>
    </div>
  );
}
