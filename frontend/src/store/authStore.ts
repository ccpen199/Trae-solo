import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../types';
import { authApi } from '../services/api';

interface AuthState {
  token: string | null;
  user: User | null;
  isLoading: boolean;
  setToken: (token: string | null) => void;
  setUser: (user: User | null) => void;
  login: (account: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  fetchCurrentUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isLoading: false,

      setToken: (token) => {
        if (token) localStorage.setItem('token', token);
        else localStorage.removeItem('token');
        set({ token });
      },

      setUser: (user) => {
        if (user) localStorage.setItem('user', JSON.stringify(user));
        else localStorage.removeItem('user');
        set({ user });
      },

      login: async (account, password) => {
        set({ isLoading: true });
        try {
          const res: any = await authApi.login({ account, password });
          if (res.success) {
            set({ token: res.data.token, user: res.data.user, isLoading: false });
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('user', JSON.stringify(res.data.user));
          } else {
            throw new Error(res.message);
          }
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      register: async (data) => {
        set({ isLoading: true });
        try {
          const res: any = await authApi.register(data);
          if (res.success) {
            set({ token: res.data.token, user: res.data.user, isLoading: false });
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('user', JSON.stringify(res.data.user));
          } else {
            throw new Error(res.message);
          }
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },

      logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        set({ token: null, user: null });
      },

      fetchCurrentUser: async () => {
        try {
          const res: any = await authApi.getMe();
          if (res.success) {
            set({ user: res.data });
            localStorage.setItem('user', JSON.stringify(res.data));
          }
        } catch (_) {
          // silent
        }
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ token: state.token, user: state.user })
    }
  )
);
