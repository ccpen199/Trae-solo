import { create } from 'zustand';
import type { User } from '@neighborhood/shared';
import { mockLogin } from '@/mock/auth';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  useMock: boolean;
  login: (phone: string, password: string) => Promise<void>;
  loginWithMock: (phone: string, password: string) => Promise<void>;
  register: (phone: string, code: string, password: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
  loadFromStorage: () => void;
  setUseMock: (useMock: boolean) => void;
}

interface StorageData {
  state: {
    token?: string;
    user?: User;
    useMock?: boolean;
  };
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  useMock: true,

  login: async (phone, password) => {
    const { useMock: isMockMode } = get();
    if (isMockMode) {
      return get().loginWithMock(phone, password);
    }
    set({ isLoading: true });
    try {
      const { default: client } = await import('@/api/client');
      const res = await client.post('/auth/login', { phone, password });
      const data = res.data?.data || res.data;
      const { token, user } = data;
      set({ user, token, isAuthenticated: true, isLoading: false });
      localStorage.setItem(
        'auth-storage',
        JSON.stringify({ state: { token, user, useMock: isMockMode } })
      );
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  loginWithMock: async (phone, password) => {
    set({ isLoading: true });
    try {
      const { token, user } = mockLogin(phone, password);
      set({ user, token, isAuthenticated: true, isLoading: false, useMock: true });
      localStorage.setItem(
        'auth-storage',
        JSON.stringify({ state: { token, user, useMock: true } })
      );
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  register: async (phone, code, password) => {
    set({ isLoading: true });
    try {
      const { default: client } = await import('@/api/client');
      const res = await client.post('/auth/register', { phone, code, password });
      const data = res.data?.data || res.data;
      const { token, user } = data;
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
    const { token, useMock: isMockMode } = get();
    localStorage.setItem(
      'auth-storage',
      JSON.stringify({ state: { token, user, useMock: isMockMode } })
    );
  },

  loadFromStorage: () => {
    try {
      const storage = localStorage.getItem('auth-storage');
      if (storage) {
        const parsed: StorageData = JSON.parse(storage);
        const token = parsed?.state?.token;
        const user = parsed?.state?.user;
        const isMockMode = parsed?.state?.useMock ?? true;
        if (token && user) {
          set({ user, token, isAuthenticated: true, useMock: isMockMode });
        } else {
          set({ useMock: isMockMode });
        }
      }
    } catch {
    }
  },

  setUseMock: (useMock) => {
    set({ useMock });
  },
}));
