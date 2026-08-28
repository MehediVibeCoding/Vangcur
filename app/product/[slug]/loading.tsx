// GitHub পাথ: app/product/[slug]/loading.tsx — পুরো ফাইলটা এটা দিয়ে replace করবে
export default function ProductLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-bg/25 via-white to-white">
      {/* ================= Navbar Skeleton (showHomeButton ভ্যারিয়েন্ট) ================= */}
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

      {/* ================= মূল গ্রিড: গ্যালারি + ইনফো কলাম ================= */}
      <div className="mx-auto grid max-w-[1100px] grid-cols-1 gap-8 px-4 pb-6 pt-5 md:grid-cols-2 md:px-8 md:pb-10">
        {/* ---------- বাম কলাম: ছবি গ্যালারি ---------- */}
        <div>
          <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-brand border border-border-base bg-white p-6 shadow-sh1 sm:p-8">
            <div className="h-full w-full animate-pulse rounded-2xl bg-brand-bg/30" />
          </div>
          {/* ইমেজ ডট ইন্ডিকেটর */}
          <div className="mt-4 flex justify-center gap-1.5">
            <div className="h-1.5 w-6 animate-pulse rounded-full bg-brand-light/40" />
            <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-border-base" />
            <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-border-base" />
          </div>
          {/* থাম্বনেইল স্ট্রিপ */}
          <div className="mt-3 flex gap-2.5 overflow-x-auto pb-1">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 w-16 shrink-0 animate-pulse rounded-[10px] border-[1.5px] border-border-base bg-brand-bg/25 p-1" />
            ))}
          </div>
        </div>

        {/* ---------- ডান কলাম: টাইটেল, দাম, ওয়ারেন্টি, স্পেক, বাটন ---------- */}
        <div className="flex flex-col">
          <div className="mb-3 space-y-2">
            <div className="h-6 w-full animate-pulse rounded-lg bg-surface-muted sm:h-7" />
            <div className="h-6 w-2/3 animate-pulse rounded-lg bg-surface-muted sm:h-7" />
          </div>

          <div className="mb-3 flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
            <div className="h-8 w-28 animate-pulse rounded-lg bg-brand-light/30 sm:h-9" />
            <div className="h-4 w-16 animate-pulse rounded bg-surface-muted" />
          </div>

          <div className="mb-3 h-4 w-44 animate-pulse rounded bg-surface-muted" />

          {/* ওয়ারেন্টি ব্যানার */}
          <div className="mb-5 h-11 w-full animate-pulse rounded-[10px] border border-success/30 bg-success/10" />

          {/* কুইক স্পেক পিলস */}
          <div className="mb-5">
            <div className="mb-2.5 h-2.5 w-36 animate-pulse rounded bg-surface-muted" />
            <div className="flex flex-wrap gap-2">
              <div className="h-7 w-24 animate-pulse rounded-full bg-brand-bg/35" />
              <div className="h-7 w-32 animate-pulse rounded-full bg-brand-bg/35" />
              <div className="h-7 w-28 animate-pulse rounded-full bg-brand-bg/35" />
              <div className="h-7 w-20 animate-pulse rounded-full bg-brand-bg/35" />
            </div>
          </div>

          {/* পরিমাণ + wishlist + WhatsApp */}
          <div className="mb-5 flex items-center gap-3">
            <div className="h-9 w-[108px] animate-pulse rounded-full bg-brand-bg/35" />
            <div className="ml-auto flex items-center gap-1">
              <div className="h-9 w-9 animate-pulse rounded-[10px] bg-brand-bg/35" />
              <div className="h-9 w-9 animate-pulse rounded-[10px] bg-[#25D366]/30" />
            </div>
          </div>

          {/* কার্ট + অর্ডার বাটন */}
          <div className="mt-auto flex flex-col gap-2.5">
            <div className="h-[50px] w-full animate-pulse rounded-[10px] border-[1.5px] border-brand-light/30 bg-brand-bg/25" />
            <div className="h-[50px] w-full animate-pulse rounded-[10px] bg-brand-light/50" />
          </div>
        </div>
      </div>
    </div>
  );
}
