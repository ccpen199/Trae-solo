import { create } from 'zustand';
import type { User } from '../../shared/types';
import { authApi } from '../utils/api';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<boolean>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: true,

  login: async (username: string, password: string) => {
    try {
      const res = await authApi.login({ username, password });
      if (res.success && res.data) {
        set({ user: res.data.user, token: res.data.token, isLoading: false });
        return true;
      }
      return false;
    } catch {
      return false;
    }
  },

  logout: async () => {
    await authApi.logout();
    set({ user: null, token: null });
  },

  checkAuth: async () => {
    try {
      const res = await authApi.me();
      if (res.success && res.data) {
        set({ user: res.data, isLoading: false });
        return true;
      }
    } catch {
    }
    set({ user: null, isLoading: false });
    return false;
  },
}));
