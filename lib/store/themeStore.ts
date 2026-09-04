import { create } from 'zustand';

export type Theme = 'light' | 'dark';

const THEME_KEY = 'vc_theme';

function applyThemeClass(theme: Theme): void {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
    root.style.colorScheme = 'dark';
  } else {
    root.classList.remove('dark');
    root.style.colorScheme = 'light';
  }
}

function loadTheme(): Theme {
  if (typeof window === 'undefined') return 'light';
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'dark' || saved === 'light') return saved;
    // সিস্টেম ওএস ডার্ক মোড ডিটেকশন
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  } catch {
    return 'light';
  }
}

function persistTheme(theme: Theme): void {
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch {
    // storage blocked/unavailable
  }
  try {
    document.cookie = `${THEME_KEY}=${theme}; path=/; max-age=31536000; samesite=lax`;
  } catch {
    // cookies unavailable
  }
  applyThemeClass(theme);
}

interface ThemeState {
  theme: Theme;
  hydrated: boolean;
  hydrate: () => void;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: 'light',
  hydrated: false,

  hydrate: () => {
    if (get().hydrated) return;
    const initial = loadTheme();
    applyThemeClass(initial);
    set({ theme: initial, hydrated: true });
  },

  setTheme: (theme) => {
    persistTheme(theme);
    set({ theme });
  },

  toggleTheme: () => {
    const nextTheme = get().theme === 'dark' ? 'light' : 'dark';
    persistTheme(nextTheme);
    set({ theme: nextTheme });
  },
}));
