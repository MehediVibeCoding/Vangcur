export const MIN_SCORE = 3;

export interface PasswordStrength {
  score: number;
  label: string;
  color: string;
  ok: boolean;
  minLenOk: boolean;
  warning?: string;
}

const LABELS = ['খুবই দুর্বল', 'দুর্বল', 'মোটামুটি', 'ভালো', 'শক্তিশালী'];
const COLORS = ['#DC2626', '#F59E0B', '#F59E0B', '#16A34A', '#15803D'];

let zxcvbnPromise: Promise<(password: string) => { score: number; feedback?: { warning?: string } }> | null = null;
function loadZxcvbn() {
  if (!zxcvbnPromise) {
    zxcvbnPromise = import('zxcvbn').then((m) => (m.default || m) as (password: string) => { score: number; feedback?: { warning?: string } });
  }
  return zxcvbnPromise;
}

export async function checkPasswordStrength(password: string): Promise<PasswordStrength> {
  const minLenOk = password.length >= 8;
  if (!password) return { score: 0, label: '', color: '#E5E7EB', ok: false, minLenOk: false };
  const zxcvbn = await loadZxcvbn();
  const result = zxcvbn(password);
  return {
    score: result.score,
    label: LABELS[result.score],
    color: COLORS[result.score],
    ok: minLenOk && result.score >= MIN_SCORE,
    minLenOk,
    warning: result.feedback?.warning || '',
  };
}
