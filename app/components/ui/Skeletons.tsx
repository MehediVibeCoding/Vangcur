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

/** একটা OrderCard-এর শেপ নকল করা স্কেলেটন — আসল OrderCard-এর মতোই বর্ডার+radius+padding-ওয়ালা
 * বক্স (আগে এটা শুধু নিচে বর্ডার-লাইন দেওয়া প্লেইন রো ছিল, বক্স-শেপ ছিল না), প্লাস স্ট্যাটাস
 * টাইমলাইনের ৪টা ধাপের জায়গাও রাখা হয়েছে যাতে কনটেন্ট আসার পর হাইট না বাড়ে */
function OrderCardSkeleton() {
  return (
    <div className="rounded-2xl border border-border-base p-4">
      {/* Header: অর্ডার# + নাম|তারিখ */}
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 pb-2.5">
        <Bar className="h-3.5 w-20" />
        <div className="flex items-center gap-2">
          <Bar className="h-2.5 w-16" />
          <Bar className="h-2.5 w-14" />
        </div>
      </div>

      {/* স্ট্যাটাস টাইমলাইন (৪ ধাপ) */}
      <div className="mb-3.5 flex items-start justify-between px-0.5">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex flex-1 flex-col items-center gap-1">
            <Block className="h-5 w-5 !rounded-full" />
            <Bar className="h-[7px] w-8" />
          </div>
        ))}
      </div>

      {/* আইটেম */}
      <div className="flex items-start gap-3">
        <Block className="h-12 w-12 shrink-0 !rounded-xl" />
        <div className="min-w-0 flex-1 space-y-1.5 pt-0.5">
          <Bar className="h-3 w-4/5" />
          <Bar className="h-2.5 w-1/2" />
        </div>
        <Bar className="h-3.5 w-12 shrink-0" />
      </div>

      {/* Footer: টোটাল + ইনভয়েস বাটন */}
      <div className="mt-3.5 flex items-center justify-between pt-2">
        <Bar className="h-4 w-28" />
        <Bar className="h-7 w-[84px] !rounded-full" />
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

/** অ্যাকাউন্ট ড্যাশবোর্ডের "আমার অর্ডার সমূহ" সেকশন — এখানে আসলে পুরো
 * OrderCard-ই রেন্ডার হয় (আলাদা কোনো compact/ছোট সারি না), তাই এখানেও
 * একই OrderCardSkeleton ব্যবহার করা হচ্ছে যাতে লোড হওয়ার পর হঠাৎ বড়
 * বক্স-শেপ কার্ডে বদলে গিয়ে জাম্প না করে */
export function CompactOrderListSkeleton({ count = 2 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-4" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <OrderCardSkeleton key={i} />
      ))}
    </div>
  );
}

/** ৩-কার্ড কভারফ্লো রিভিউ গ্যালারির স্কেলেটন — আসল কার্ডের height/width/radius এর সাথে হুবহু মেলানো, যাতে লোড হওয়ার পর হাইট "জাম্প" না করে */
export function ReviewGallerySkeleton() {
  return (
    <div className="mx-auto w-full max-w-[960px] overflow-hidden py-2" aria-hidden="true">
      <div className="flex h-[410px] items-center justify-center gap-3 sm:h-[440px] sm:gap-4 md:h-[470px]">
        <Block className="hidden h-[323px] w-[196px] shrink-0 opacity-60 min-[400px]:block sm:h-[357px] sm:w-[230px] md:h-[383px] md:w-[247px] !rounded-[24px]" />
        <Block className="h-[380px] w-[230px] shrink-0 min-[400px]:w-[245px] sm:h-[420px] sm:w-[270px] md:h-[450px] md:w-[290px] !rounded-[24px]" />
        <Block className="hidden h-[323px] w-[196px] shrink-0 opacity-60 min-[400px]:block sm:h-[357px] sm:w-[230px] md:h-[383px] md:w-[247px] !rounded-[24px]" />
      </div>
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

/** ইনভয়েস পেজ পুরো-স্ক্রিন লোডিং স্কেলেটন — আসল ইনভয়েস পেজের (sticky header +
 * status banner + ৪৮০px রিসিট কার্ড: লোগো/হেডার, কাস্টমার ডিটেইলস, অর্ডার
 * আইটেম+টোটাল, পেমেন্ট/কুরিয়ার ব্যাজ, নোটিস, ফুটার) সাথে হুবহু সাইজ/শেপ
 * মেলানো — যাতে ছোট popup-এর মতো না দেখিয়ে বড় বিস্তারিত ইনভয়েসের শেপেই
 * লোড হয় এবং কনটেন্ট আসার পর কোনো জাম্প না হয়। */
export function InvoiceLoadingSkeleton() {
  return (
    <div
      className="sleek-scrollbar relative flex min-h-dvh flex-col justify-between overflow-x-hidden bg-gradient-to-b from-brand-bg via-[#DCEBFD] to-white sm:min-h-screen"
      aria-hidden="true"
    >
      {/* উপরের sticky বার: ফিরে যান + ডাউনলোড বাটন */}
      <div className="sticky top-0 z-20 w-full border-b border-ink/10 bg-white/95 px-4 py-2.5 shadow-xs backdrop-blur-md sm:py-3">
        <div className="mx-auto flex max-w-[520px] items-center justify-between gap-3">
          <Bar className="h-9 w-[92px] !rounded-full" />
          <Bar className="h-9 w-[132px] !rounded-full bg-brand-light/30" />
        </div>
      </div>

      {/* স্ট্যাটাস ব্যানার ("ইনভয়েস প্রস্তুত হচ্ছে...") */}
      <div className="relative z-10 flex shrink-0 items-center justify-center gap-2 border-b border-brand-light/20 bg-brand-bg/40 py-2">
        <Bar className="h-3.5 w-56 bg-brand-light/25" />
      </div>

      {/* বড় ইনভয়েস কার্ড — আসল কার্ডের সাথে ফিক্সড ৪৮০px width রেশিও */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-start px-3 py-4 sm:p-7">
        <div className="w-full max-w-[480px] overflow-hidden rounded-[20px] border border-[#E2E8F0] bg-white shadow-[0_8px_30px_rgba(68,167,252,0.12)]">
          <div className="px-[22px] pb-[26px] pt-6">
            {/* হেডার: লোগো + ট্যাগলাইন + অর্ডার# পিল */}
            <div className="mb-4 border-b border-[#F1F5F9] pb-3.5 text-center">
              <div className="mb-2 flex justify-center">
                <Block className="h-[34px] w-[110px]" />
              </div>
              <Bar className="mx-auto mb-2.5 h-2 w-48" />
              <Bar className="mx-auto h-6 w-40 !rounded-full" />
            </div>

            {/* কাস্টমার ডিটেইলস */}
            <div className="mb-4">
              <Bar className="mb-1.5 h-2.5 w-32" />
              <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-3.5">
                <div className="mb-2.5 flex gap-3">
                  <Bar className="h-3 w-1/2" />
                  <Bar className="h-3 w-1/2" />
                </div>
                <div className="flex gap-3">
                  <Bar className="h-3 w-1/2" />
                  <Bar className="h-3 w-1/2" />
                </div>
              </div>
            </div>

            {/* অর্ডার আইটেম + টোটাল বক্স */}
            <div className="mb-3.5 rounded-[14px] border border-[#E2E8F0] bg-[#F8FAFC] p-3.5">
              <Bar className="mb-2.5 h-2.5 w-28" />
              <div className="mb-2.5 space-y-3 border-b border-[#E2E8F0] pb-2.5">
                {[1, 2].map((i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Block className="h-8 w-8 shrink-0 !rounded-lg" />
                    <Bar className="h-3 flex-1" />
                    <Bar className="h-3 w-12 shrink-0" />
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between"><Bar className="h-2.5 w-16" /><Bar className="h-2.5 w-12" /></div>
                <div className="flex items-center justify-between"><Bar className="h-2.5 w-28" /><Bar className="h-2.5 w-10" /></div>
                <div className="my-2 border-t border-dashed border-[#CBD5E1]" />
                <div className="flex items-center justify-between"><Bar className="h-3.5 w-16" /><Bar className="h-3.5 w-16" /></div>
                <div className="flex items-center justify-between"><Bar className="h-2.5 w-28" /><Bar className="h-2.5 w-12" /></div>
                <div className="flex items-center justify-between border-t border-[#E2E8F0] pt-1.5"><Bar className="h-3.5 w-28" /><Bar className="h-3.5 w-14" /></div>
              </div>
            </div>

            {/* পেমেন্ট/কুরিয়ার ব্যাজ */}
            <Bar className="mb-3.5 h-7 w-full !rounded-full bg-brand-bg/50" />

            {/* নোটিস বক্স */}
            <Block className="mb-3.5 h-11 w-full !rounded-xl bg-brand-bg/40" />

            {/* ফুটার: কন্টাক্ট + সোশ্যাল আইকন + ব্র্যান্ড নাম */}
            <div className="border-t border-[#F1F5F9] pt-3 text-center">
              <Bar className="mx-auto mb-2.5 h-2.5 w-52" />
              <div className="flex items-center justify-center gap-1.5">
                <Block className="h-[22px] w-[22px] !rounded-full" />
                <Block className="h-[22px] w-[22px] !rounded-full" />
                <Block className="h-[22px] w-[22px] !rounded-full" />
                <Block className="h-[22px] w-[22px] !rounded-full" />
                <Bar className="ml-1.5 h-3 w-24" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
