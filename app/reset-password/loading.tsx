// GitHub পাথ: app/reset-password/loading.tsx — নতুন ফাইল হিসেবে যোগ করবে
export default function ResetPasswordLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-brand-bg via-[#DCEBFD] to-white p-4">
      <div className="relative w-full max-w-[400px] overflow-hidden rounded-[28px] bg-gradient-to-b from-brand-bg via-[#DCEBFD] to-white shadow-sh3">
        {/* ================= হেডার (শিরোনাম + সাবটাইটেল) ================= */}
        <div className="relative overflow-hidden px-7 pb-5 pt-8 text-center">
          <div className="mx-auto mb-2.5 h-[21px] w-[220px] max-w-full animate-pulse rounded-lg bg-white/70" />
          <div className="mx-auto h-3 w-[260px] max-w-full animate-pulse rounded bg-white/50" />
        </div>

        {/* ================= ফর্ম (নতুন পাসওয়ার্ড + কনফার্ম পাসওয়ার্ড) ================= */}
        <div className="px-7 pb-8 pt-2">
          <div className="flex flex-col gap-3.5">
            {/* নতুন পাসওয়ার্ড */}
            <div>
              <div className="mb-1.5 h-[13px] w-28 animate-pulse rounded bg-surface-muted" />
              <div className="h-[46px] w-full animate-pulse rounded-full bg-brand-bg/25" />
            </div>
            {/* পাসওয়ার্ড আবার লিখুন */}
            <div>
              <div className="mb-1.5 h-[13px] w-36 animate-pulse rounded bg-surface-muted" />
              <div className="h-[46px] w-full animate-pulse rounded-full bg-brand-bg/25" />
            </div>
            {/* সাবমিট বাটন */}
            <div className="mt-1 h-[46px] w-full animate-pulse rounded-full bg-brand-light/40" />
          </div>
        </div>
      </div>
    </div>
  );
}
