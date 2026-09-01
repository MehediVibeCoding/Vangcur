// GitHub পাথ: app/components/ui/Skeletons.tsx — নতুন ফাইল
/**
 * এই ফাইলে আছে client-state-চালিত (isLoading boolean) জায়গাগুলোর জন্য
 * রিইউজেবল স্কেলেটন প্লেসহোল্ডার — যেগুলো SkeletonTransition এর সাথে
 * ব্যবহার করা হয়। প্রতিটা স্কেলেটন তার আসল কনটেন্টের সাইজ/শেপ মোটামুটি
 * অনুসরণ করে, যাতে ক্রসফেডের সময় লেআউট "জাম্প" না করে।
 */

function Bar({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-full bg-surface-muted ${className}`} />;
}

function Block({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-surface-muted ${className}`} />;
}

/** একটা OrderCard-এর শেপ নকল করা স্কেলেটন সারি */
function OrderCardSkeleton() {
  return (
    <div className="pb-4 border-b border-ink/10 last:border-b-0 last:pb-0">
      <div className="flex items-center justify-between pb-2">
        <Bar className="h-4 w-24" />
        <Bar className="h-5 w-20" />
      </div>
      <div className="mb-3 flex items-center gap-3">
        <Bar className="h-3 w-20" />
        <Bar className="h-3 w-16" />
      </div>
      <div className="flex items-start gap-3">
        <Block className="h-12 w-12 shrink-0 !rounded-xl" />
        <div className="min-w-0 flex-1 space-y-2 pt-0.5">
          <Bar className="h-3 w-4/5" />
          <Bar className="h-3 w-1/2" />
        </div>
        <Bar className="h-4 w-14 shrink-0" />
      </div>
      <div className="mt-3.5 flex items-center justify-between pt-2">
        <Bar className="h-4 w-24" />
        <Bar className="h-7 w-20" />
      </div>
    </div>
  );
}

/** অর্ডার লিস্ট (অ্যাকাউন্ট, ট্র্যাক অর্ডার) — একাধিক OrderCardSkeleton */
export function OrderListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-4" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <OrderCardSkeleton key={i} />
      ))}
    </div>
  );
}

/** কমপ্যাক্ট এক-লাইন অর্ডার লোডিং (অ্যাকাউন্ট ড্যাশবোর্ড ডান কলাম, স্পেস কম) */
export function CompactOrderListSkeleton({ count = 2 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-4" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 pb-4 border-b border-ink/10 last:border-b-0 last:pb-0">
          <Block className="h-11 w-11 shrink-0 !rounded-xl" />
          <div className="min-w-0 flex-1 space-y-2">
            <Bar className="h-3 w-3/4" />
            <Bar className="h-3 w-1/3" />
          </div>
          <Bar className="h-5 w-14 shrink-0" />
        </div>
      ))}
    </div>
  );
}

/** ৩-কার্ড কভারফ্লো রিভিউ গ্যালারির স্কেলেটন */
export function ReviewGallerySkeleton() {
  return (
    <div className="mb-1 flex items-center justify-center gap-3 py-1 sm:gap-6" aria-hidden="true">
      <Block className="h-[150px] w-[110px] shrink-0 opacity-60 sm:h-[190px] sm:w-[150px]" />
      <Block className="h-[210px] w-[160px] shrink-0 sm:h-[270px] sm:w-[220px]" />
      <Block className="h-[150px] w-[110px] shrink-0 opacity-60 sm:h-[190px] sm:w-[150px]" />
    </div>
  );
}

/** প্রশ্নোত্তর (Q&A) কার্ড স্কেলেটন */
function QnACardSkeleton() {
  return (
    <div className="rounded-brand border border-border-base bg-white p-4 shadow-sh1">
      <div className="flex items-start gap-3">
        <Block className="h-9 w-9 shrink-0 !rounded-full" />
        <div className="min-w-0 flex-1 space-y-2">
          <Bar className="h-3 w-1/3" />
          <Bar className="h-3.5 w-full" />
          <Bar className="h-3.5 w-2/3" />
        </div>
      </div>
    </div>
  );
}

export function QnAListSkeleton({ count = 2 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-4" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <QnACardSkeleton key={i} />
      ))}
    </div>
  );
}

/** ইনভয়েস পেজ পুরো-স্ক্রিন লোডিং স্কেলেটন */
export function InvoiceLoadingSkeleton() {
  return (
    <div className="flex min-h-dvh sm:min-h-screen items-center justify-center bg-gradient-to-b from-brand-bg via-[#DCEBFD] to-white p-5" aria-hidden="true">
      <div className="w-full max-w-[380px] overflow-hidden rounded-[22px] bg-white/80 p-6 shadow-sh2 backdrop-blur-md">
        <div className="mb-5 flex items-center justify-between">
          <Bar className="h-5 w-28" />
          <Block className="h-9 w-9 !rounded-full" />
        </div>
        <div className="space-y-2.5">
          <Bar className="h-3.5 w-full" />
          <Bar className="h-3.5 w-4/5" />
        </div>
        <div className="mt-5 flex items-center gap-3">
          <Block className="h-12 w-12 shrink-0 !rounded-xl" />
          <div className="flex-1 space-y-2">
            <Bar className="h-3 w-3/4" />
            <Bar className="h-3 w-1/2" />
          </div>
        </div>
        <Block className="mt-5 h-11 w-full !rounded-full" />
      </div>
    </div>
  );
}
