import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import type { UserInfo, UserRole } from '../../shared/types.js';

interface AuthState {
  token: string | null;
  user: UserInfo | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
  login: (token: string, user: UserInfo) => void;
  logout: () => void;
  init: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  isAuthenticated: false,
  isInitialized: false,
  login: (token, user) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    set({ token, user, isAuthenticated: true, isInitialized: true });
  },
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ token: null, user: null, isAuthenticated: false, isInitialized: true });
  },
  init: () => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr) as UserInfo;
        set({ token, user, isAuthenticated: true, isInitialized: true });
        return;
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    set({ isInitialized: true });
  },
}));

export function useAuthShallow<T extends (state: AuthState) => any>(selector: T): ReturnType<T> {
  return useAuthStore(useShallow(selector));
}

export function getUserRole(): UserRole | null {
  const userStr = localStorage.getItem('user');
  if (!userStr) return null;
  try {
    const user = JSON.parse(userStr) as UserInfo;
    return user.role;
  } catch {
    return null;
  }
}
