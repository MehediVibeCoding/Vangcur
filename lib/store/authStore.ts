import { create } from 'zustand';
import type { CurrentUser } from '@/types';

const USER_KEY = 'vc_user';

function loadUser(): CurrentUser | null {
  if (typeof window === 'undefined') return null;
  try {
    return JSON.parse(localStorage.getItem(USER_KEY) || 'null');
  } catch {
    return null;
  }
}

function persist(user: CurrentUser | null): void {
  try {
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
    else localStorage.removeItem(USER_KEY);
  } catch {
    // storage unavailable, ignore
  }
}

interface AuthState {
  currentUser: CurrentUser | null;
  setCurrentUser: (user: CurrentUser | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  currentUser: loadUser(),

  setCurrentUser: (user) => {
    persist(user);
    set({ currentUser: user });
  },
}));
