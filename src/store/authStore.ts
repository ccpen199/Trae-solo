import { create } from 'zustand';
import { auth } from '@/api/client';
import type { User } from '../../shared/types';

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (phone: string, password: string) => Promise<void>;
  register: (data: { phone: string; password: string; role: string; name: string; province?: string; relationship?: string; schoolName?: string }) => Promise<void>;
  logout: () => void;
  fetchCurrentUser: () => Promise<void>;
  initAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  isAuthenticated: false,
  loading: false,

  login: async (phone: string, password: string) => {
    set({ loading: true });
    try {
      const response = await auth.login(phone, password);
      if (response.success && response.data) {
        const { token, user } = response.data;
        localStorage.setItem('token', token);
        set({ token, user, isAuthenticated: true, loading: false });
      } else {
        throw new Error(response.message || '登录失败');
      }
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  register: async (data: { phone: string; password: string; role: string; name: string }) => {
    set({ loading: true });
    try {
      const response = await auth.register(data);
      if (response.success && response.data) {
        const { token, user } = response.data;
        localStorage.setItem('token', token);
        set({ token, user, isAuthenticated: true, loading: false });
      } else {
        throw new Error(response.message || '注册失败');
      }
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ token: null, user: null, isAuthenticated: false });
  },

  fetchCurrentUser: async () => {
    set({ loading: true });
    try {
      const response = await auth.getCurrentUser();
      if (response.success && response.data) {
        set({ user: response.data, isAuthenticated: true, loading: false });
      } else {
        set({ loading: false });
      }
    } catch (error) {
      set({ loading: false });
    }
  },

  initAuth: async () => {
    const token = localStorage.getItem('token');
    if (token) {
      set({ token });
      try {
        await useAuthStore.getState().fetchCurrentUser();
        if (useAuthStore.getState().isAuthenticated) {
          return;
        }
        localStorage.removeItem('token');
        set({ token: null, user: null, isAuthenticated: false });
      } catch (error) {
        localStorage.removeItem('token');
        set({ token: null, user: null, isAuthenticated: false });
      }
    }

    if (import.meta.env.DEV) {
      set({ loading: true });
      try {
        const response = await auth.login('13800000005', '123456');
        if (response.success && response.data) {
          const { token, user } = response.data;
          localStorage.setItem('token', token);
          set({ token, user, isAuthenticated: true, loading: false });
          return;
        }
      } catch (error) {
        localStorage.removeItem('token');
      }
      set({ token: null, user: null, isAuthenticated: false, loading: false });
    }
  },
}));
