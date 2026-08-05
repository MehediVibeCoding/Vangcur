export const MIN_SCORE = 3;

export interface PasswordStrength {
  score: number;
  label: string;
  color: string;
  ok: boolean;
  minLenOk: boolean;
  hint: string;
  warning?: string;
}

const LABELS = ['খুবই দুর্বল', 'দুর্বল', 'মোটামুটি', 'ভালো', 'শক্তিশালী'];
const COLORS = ['#DC2626', '#F59E0B', '#F59E0B', '#16A34A', '#15803D'];

function buildHint(password: string, score: number): string {
  if (password.length < 8) return 'কমপক্ষে ৮ অক্ষর ব্যবহার করুন';
  if (!/[0-9]/.test(password)) return 'একটি সংখ্যা যোগ করুন (যেমন: 7, 42)';
  if (!/[^A-Za-z0-9]/.test(password)) return 'একটি চিহ্ন যোগ করুন (যেমন: _ @ # !)';
  if (!/[A-Z]/.test(password) && /[a-z]/.test(password)) return 'একটি বড় হাতের ইংরেজি অক্ষর যোগ করুন (A-Z)';
  if (score >= MIN_SCORE) return 'চমৎকার! এটি একটি শক্তিশালী পাসওয়ার্ড';
  return 'আরেকটু ভিন্ন ও দীর্ঘ কিছু ব্যবহার করুন';
}

let zxcvbnPromise: Promise<(password: string) => { score: number; feedback?: { warning?: string } }> | null = null;
function loadZxcvbn() {
  if (!zxcvbnPromise) {
    zxcvbnPromise = import('zxcvbn').then((m) => (m.default || m) as (password: string) => { score: number; feedback?: { warning?: string } });
  }
  return zxcvbnPromise;
}

export async function checkPasswordStrength(password: string): Promise<PasswordStrength> {
  const minLenOk = password.length >= 8;
  if (!password) return { score: 0, label: '', color: '#E5E7EB', ok: false, minLenOk: false, hint: '' };
  const zxcvbn = await loadZxcvbn();
  const result = zxcvbn(password);
  return {
    score: result.score,
    label: LABELS[result.score],
    color: COLORS[result.score],
    ok: minLenOk && result.score >= MIN_SCORE,
    minLenOk,
    hint: buildHint(password, result.score),
    warning: result.feedback?.warning || '',
  };
}
