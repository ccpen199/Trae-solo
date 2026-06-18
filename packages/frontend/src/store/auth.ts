import { create } from 'zustand';
import type { User } from '@neighborhood/shared';
import * as authApi from '@/api/auth';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (phone: string, password: string) => Promise<void>;
  register: (phone: string, code: string, password: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
  loadFromStorage: () => void;
}

interface StorageData {
  state: {
    token?: string;
    user?: User;
  };
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,

  login: async (phone, password) => {
    set({ isLoading: true });
    try {
      const res = await authApi.login(phone, password);
      const { token, user } = res.data.data || res.data;
      set({ user, token, isAuthenticated: true, isLoading: false });
      localStorage.setItem(
        'auth-storage',
        JSON.stringify({ state: { token, user } })
      );
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  register: async (phone, code, password) => {
    set({ isLoading: true });
    try {
      const res = await authApi.register(phone, code, password);
      const { token, user } = res.data.data || res.data;
      set({ user, token, isAuthenticated: true, isLoading: false });
      localStorage.setItem(
        'auth-storage',
        JSON.stringify({ state: { token, user } })
      );
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: () => {
    set({ user: null, token: null, isAuthenticated: false });
    localStorage.removeItem('auth-storage');
  },

  setUser: (user) => {
    set({ user });
  },

  loadFromStorage: () => {
    try {
      const storage = localStorage.getItem('auth-storage');
      if (storage) {
        const parsed: StorageData = JSON.parse(storage);
        const token = parsed?.state?.token;
        const user = parsed?.state?.user;
        if (token && user) {
          set({ user, token, isAuthenticated: true });
        }
      }
    } catch {}
  },
}));
