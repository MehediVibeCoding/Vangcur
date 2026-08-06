'use client';

interface PreConfirmLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: () => void;
  onRegister: () => void;
  onGoogle: () => void;
  onSkip: () => void;
}

const secondaryBtnClass =
  'mb-2.5 w-full rounded-full border-[1.5px] border-[#E8EAED] bg-white py-[13px] font-body text-sm font-bold text-ink transition-brand duration-brand hover:bg-surface-muted';

export default function PreConfirmLoginModal({
  isOpen, onClose, onLogin, onRegister, onGoogle, onSkip,
}: PreConfirmLoginModalProps) {
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className={`fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4 transition-opacity duration-brand ${isOpen ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'}`}
      onClick={handleBackdropClick}
    >
      <div className={`relative w-full max-w-[400px] overflow-hidden rounded-brand bg-white shadow-sh3 transition-transform duration-brand ${isOpen ? 'scale-100' : 'scale-95'}`}>
        <div className="border-b border-[#EFEFEF] bg-[#F7F8FA] px-7 pb-5 pt-7 text-center">
          <div className="mb-2.5 text-[36px]">🔐</div>
          <h2 className="mb-1.5 font-body text-[17px] font-extrabold text-ink">অর্ডার সুরক্ষিত রাখুন</h2>
          <p className="font-body text-[13px] leading-[1.7] text-muted">
            লগইন করলে পরবর্তীতে আপনার অর্ডার ট্র্যাক, ম্যানেজ ও দেখতে পারবেন।
          </p>
        </div>

        <div className="px-6 pb-6 pt-5">
          <div className="mb-2 font-body text-[11px] font-bold uppercase tracking-wide text-[#aaa]">
            নতুন অ্যাকাউন্ট তৈরি করতে
          </div>
          <button
            onClick={onRegister}
            className="mb-2.5 w-full rounded-full bg-ink py-[13px] font-body text-sm font-bold text-white shadow-[0_4px_16px_rgba(0,0,0,.2)] transition-brand duration-brand hover:bg-brand-primary"
          >
            রেজিস্ট্রেশন করুন
          </button>

          <div className="mb-2 font-body text-[11px] font-bold uppercase tracking-wide text-[#aaa]">
            পূর্বে অ্যাকাউন্ট তৈরি করা থাকলে
          </div>
          <button onClick={onLogin} className={`${secondaryBtnClass} mb-4`}>
            লগইন করুন
          </button>

          <div className="mb-3.5 flex items-center gap-3 font-body text-[11px] font-bold tracking-[1.5px] text-[#C5C9D0]">
            <span className="block h-px flex-1 bg-[#EFEFEF]" />
            অথবা
            <span className="block h-px flex-1 bg-[#EFEFEF]" />
          </div>

          <button
            onClick={onGoogle}
            className="mb-4 flex w-full items-center justify-center gap-2.5 rounded-full border-[1.5px] border-[#E8EAED] bg-white py-3 font-body text-sm font-semibold text-ink transition-brand duration-brand hover:bg-surface-muted"
          >
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Google দিয়ে লগইন করুন
          </button>

          <button
            onClick={onSkip}
            className="w-full bg-transparent p-1.5 text-center font-body text-[13px] font-semibold text-[#aaa]"
          >
            এখন না, অর্ডার করুন →
          </button>
        </div>
      </div>
    </div>
  );
}
