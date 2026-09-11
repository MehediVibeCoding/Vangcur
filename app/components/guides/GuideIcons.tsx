// ফাইলের পাথ: app/components/guides/GuideIcons.tsx
// [NEW] AGENTS.md-এর "নো-ইমোজি পলিসি" মানতে — কার্ড/চেকলিস্ট/CTA-তে ব্যবহারের
// জন্য একগুচ্ছ প্রফেশনাল হ্যান্ড-ড্রন লাইন SVG আইকন, একটা key-ভিত্তিক রেজিস্ট্রিতে।
// অ্যাডমিনে card এডিট করার সময় এই key-গুলোর একটা ড্রপডাউন থেকে বেছে নেওয়া হবে।

import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

function base(children: React.ReactNode, props: IconProps) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {children}
    </svg>
  );
}

const BedroomIcon = (p: IconProps) =>
  base(
    <>
      <path d="M3 18v-6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6" />
      <path d="M3 18v2M21 18v2" />
      <path d="M5 12V8a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
      <path d="M3 15h18" />
    </>,
    p
  );

const ShopIcon = (p: IconProps) =>
  base(
    <>
      <path d="M4 9V6a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v3" />
      <path d="M3 9h18l-1.2 3.6a2 2 0 0 1-1.9 1.4H6.1a2 2 0 0 1-1.9-1.4L3 9Z" />
      <path d="M5 14v6a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-6" />
      <path d="M10 21v-4h4v4" />
    </>,
    p
  );

const CameraIcon = (p: IconProps) =>
  base(
    <>
      <path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z" />
      <circle cx="12" cy="13" r="3.3" />
    </>,
    p
  );

const WalletIcon = (p: IconProps) =>
  base(
    <>
      <path d="M3 7a2 2 0 0 1 2-2h13a1 1 0 0 1 1 1v2" />
      <path d="M3 7v11a2 2 0 0 0 2 2h14a1 1 0 0 0 1-1v-5" />
      <path d="M15 12h4a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-4a2 2 0 0 1 0-4Z" />
    </>,
    p
  );

const StrandIcon = (p: IconProps) =>
  base(
    <>
      <path d="M12 3a7 7 0 0 0-4 12.7c.85.75 1.4 1.8 1.5 3.1h5c.1-1.3.65-2.35 1.5-3.1A7 7 0 0 0 12 3Z" />
      <rect x="9.3" y="19.2" width="5.4" height="1.7" rx="0.8" />
    </>,
    p
  );

const SignboardIcon = (p: IconProps) =>
  base(
    <>
      <rect x="3" y="6" width="18" height="9" rx="1.5" />
      <path d="M9 21h6M12 15v6" />
      <path d="M7 10.5h3M14 10.5h3" />
    </>,
    p
  );

const GlassTubeIcon = (p: IconProps) =>
  base(
    <>
      <path d="M7 4c0 4 10 4 10 8s-10 4-10 8" />
      <path d="M5 4h4M5 20h4" />
    </>,
    p
  );

const RulerIcon = (p: IconProps) =>
  base(
    <>
      <rect x="3" y="9" width="18" height="6" rx="1" transform="rotate(0 12 12)" />
      <path d="M6 9v2M9 9v3M12 9v2M15 9v3M18 9v2" />
    </>,
    p
  );

const ShieldIcon = (p: IconProps) =>
  base(
    <>
      <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3Z" />
      <path d="M9 12l2 2 4-4" />
    </>,
    p
  );

const WrenchIcon = (p: IconProps) =>
  base(
    <>
      <path d="M14.7 6.3a4 4 0 0 0-5.4 4.6L4 16.2V20h3.8l5.3-5.3a4 4 0 0 0 4.6-5.4l-2.7 2.7-2-2 2.7-2.7Z" />
    </>,
    p
  );

const SmartphoneIcon = (p: IconProps) =>
  base(
    <>
      <rect x="6.5" y="2.5" width="11" height="19" rx="2" />
      <path d="M11 19h2" />
    </>,
    p
  );

const CheckCircleIcon = (p: IconProps) =>
  base(
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M8.5 12.3l2.2 2.2 4.8-4.8" />
    </>,
    p
  );

const ArrowRightIcon = (p: IconProps) =>
  base(
    <>
      <path d="M5 12h14" />
      <path d="M13 6l6 6-6 6" />
    </>,
    p
  );

const ChevronDownIcon = (p: IconProps) =>
  base(<path d="M6 9l6 6 6-6" />, p);

const CheckboxIcon = ({ checked = true, ...p }: IconProps & { checked?: boolean }) =>
  base(
    checked ? (
      <>
        <rect x="3.5" y="3.5" width="17" height="17" rx="4.5" />
        <path d="M8 12.3l2.5 2.5L16.5 9" />
      </>
    ) : (
      <rect x="3.5" y="3.5" width="17" height="17" rx="4.5" />
    ),
    p
  );

const SparkIcon = (p: IconProps) =>
  base(
    <>
      <path d="M12 3l1.6 5.4L19 10l-5.4 1.6L12 17l-1.6-5.4L5 10l5.4-1.6L12 3Z" />
    </>,
    p
  );

/** cardGrid/checklist ব্লকে ব্যবহারযোগ্য সব আইকন — অ্যাডমিন এডিটরে এই key-গুলোই ড্রপডাউনে দেখানো হবে */
export const GUIDE_ICON_REGISTRY: Record<string, (p: IconProps) => React.JSX.Element> = {
  bedroom: BedroomIcon,
  shop: ShopIcon,
  camera: CameraIcon,
  wallet: WalletIcon,
  strand: StrandIcon,
  signboard: SignboardIcon,
  glassTube: GlassTubeIcon,
  ruler: RulerIcon,
  shield: ShieldIcon,
  wrench: WrenchIcon,
  smartphone: SmartphoneIcon,
  check: CheckCircleIcon,
  arrowRight: ArrowRightIcon,
  chevronDown: ChevronDownIcon,
  spark: SparkIcon,
};

export function GuideIcon({
  name,
  className = '',
}: {
  name?: string;
  className?: string;
}) {
  const Cmp = (name && GUIDE_ICON_REGISTRY[name]) || SparkIcon;
  return <Cmp className={className} />;
}

export function GuideCheckboxIcon({ className = '' }: { className?: string }) {
  return <CheckboxIcon checked className={className} />;
}

export function GuideChevronIcon({ className = '' }: { className?: string }) {
  return <ChevronDownIcon className={className} />;
}

export function GuideArrowRightIcon({ className = '' }: { className?: string }) {
  return <ArrowRightIcon className={className} />;
}
