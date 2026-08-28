// GitHub পাথ: app/checkout/status/loading.tsx — নতুন ফাইল হিসেবে যোগ করবে
export default function CheckoutStatusLoading() {
  return (
    <div className="mx-auto w-full max-w-[480px] px-7 pb-14 pt-8 text-center">
      {/* ================= স্ট্যাটাস আইকন ================= */}
      <div className="mx-auto mb-5 h-[76px] w-[76px] animate-pulse rounded-full bg-[#FEF3C7]" />

      {/* ================= শিরোনাম + প্যারাগ্রাফ ================= */}
      <div className="mx-auto mb-2 h-[22px] w-28 animate-pulse rounded-lg bg-surface-muted" />
      <div className="mx-auto mb-1.5 h-3 w-full animate-pulse rounded bg-surface-muted" />
      <div className="mx-auto mb-[18px] h-3 w-4/5 animate-pulse rounded bg-surface-muted" />

      {/* ================= অর্ডার নম্বর + কপি বাটন ================= */}
      <div className="mb-4 flex items-center justify-center gap-2">
        <div className="h-[13.5px] w-20 animate-pulse rounded bg-surface-muted" />
        <div className="h-[13.5px] w-14 animate-pulse rounded bg-surface-muted" />
        <div className="h-7 w-[68px] animate-pulse rounded-lg border-[1.5px] border-border-base" />
      </div>

      {/* ================= গেস্ট নোটিশ বক্স ================= */}
      <div className="mb-3.5 rounded-[10px] border border-[#FED7AA] bg-[#FFF7ED] px-3.5 py-[11px]">
        <div className="mx-auto mb-1.5 h-2.5 w-4/5 animate-pulse rounded bg-[#FDBA74]/50" />
        <div className="mx-auto h-2.5 w-3/5 animate-pulse rounded bg-[#FDBA74]/50" />
      </div>

      {/* ================= ৩-ধাপের স্ট্যাটাস টাইমলাইন ================= */}
      <div className="mb-[22px] mt-4 text-left">
        {[1, 2, 3].map((step) => (
          <div
            key={step}
            className={`flex items-center gap-3 py-2.5 ${step < 3 ? 'border-b border-border-base' : ''}`}
          >
            <div className="h-7 w-7 shrink-0 animate-pulse rounded-full bg-surface-muted" />
            <div className="flex-1 space-y-1.5">
              <div className="h-[12.5px] w-32 animate-pulse rounded bg-surface-muted" />
              <div className="h-[11px] w-40 animate-pulse rounded bg-surface-muted" />
            </div>
          </div>
        ))}
      </div>

      {/* ================= টিপ বক্স ================= */}
      <div className="mb-5 space-y-1.5 rounded-xl bg-surface-muted p-3">
        <div className="h-2.5 w-3/4 animate-pulse rounded bg-white" />
        <div className="h-2.5 w-1/2 animate-pulse rounded bg-white" />
      </div>

      {/* ================= সোশ্যাল ফলো আইকন ================= */}
      <div className="mb-5">
        <div className="mx-auto mb-2.5 h-[11px] w-24 animate-pulse rounded bg-surface-muted" />
        <div className="flex justify-center gap-2.5">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-[35px] w-[35px] animate-pulse rounded-[9px] bg-surface-muted" />
          ))}
        </div>
      </div>

      {/* ================= হোমে ফেরার বাটন ================= */}
      <div className="h-[46px] w-full animate-pulse rounded-xl bg-surface-muted" />
    </div>
  );
}
