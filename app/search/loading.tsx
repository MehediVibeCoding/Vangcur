export default function SearchLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-bg/25 via-white to-white">
      <div className="mx-2 mb-1.5 mt-[14px] sm:mx-3">
        <div className="mx-auto flex h-[62px] max-w-[1300px] items-center gap-3 rounded-[35px] border border-white/60 bg-white/80 px-4 shadow-sh2">
          <div className="h-10 w-10 animate-pulse rounded-full bg-brand-bg" />
          <div className="h-11 flex-1 animate-pulse rounded-full bg-brand-bg/30" />
        </div>
      </div>
      <div className="mx-auto max-w-[1300px] px-5 pt-6">
        <div className="mb-4 h-4 w-32 animate-pulse rounded bg-surface-muted" />
        <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="rounded-[18px] bg-white p-1 shadow-sh1">
              <div className="aspect-[0.57] animate-pulse rounded-[15px] bg-brand-bg/30" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
