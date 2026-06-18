import { create } from 'zustand';
import type { User } from '@/types';

const STORAGE_KEY = 'auth-storage-v1';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  _ready: boolean;
  init: () => void;
  login: (user: User) => void;
  logout: () => void;
  updateUser: (data: Partial<User>) => void;
}

function readFromStorage(): { user: User | null } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { user: parsed?.user || null };
    }
  } catch (e) {
  }
  return { user: null };
}

function writeToStorage(user: User | null) {
  try {
    if (user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ user }));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch (e) {
  }
}

const initial = readFromStorage();

export const useAuthStore = create<AuthState>((set) => ({
  user: initial.user,
  isAuthenticated: !!initial.user,
  _ready: true,
  init: () => set({ _ready: true }),
  login: (user: User) => {
    writeToStorage(user);
    set({ user, isAuthenticated: true });
  },
  logout: () => {
    writeToStorage(null);
    set({ user: null, isAuthenticated: false });
  },
  updateUser: (data: Partial<User>) =>
    set((state) => {
      const next = state.user ? { ...state.user, ...data } : null;
      if (next) writeToStorage(next);
      return { user: next };
    }),
}));
