import { create } from 'zustand';
import type { User } from '@neighborhood/shared';
import { mockLogin, type MockUser } from '@/mock/auth';

interface AuthState {
  user: (User & { communityName?: string; subdomain?: string }) | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isHydrated: boolean;
  useMock: boolean;
  login: (phone: string, password: string) => Promise<MockUser>;
  loginWithMock: (phone: string, password: string) => Promise<MockUser>;
  register: (phone: string, code: string, password: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
  loadFromStorage: () => void;
  setUseMock: (useMock: boolean) => void;
}

interface StorageData {
  state: {
    token?: string;
    user?: User & { communityName?: string; subdomain?: string };
    useMock?: boolean;
  };
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  isHydrated: false,
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
      set({ user, token, isAuthenticated: true, isLoading: false, isHydrated: true });
      localStorage.setItem(
        'auth-storage',
        JSON.stringify({ state: { token, user, useMock: isMockMode } })
      );
      return user;
    } catch (error) {
      set({ isLoading: false, isHydrated: true });
      throw error;
    }
  },

  loginWithMock: async (phone, password) => {
    set({ isLoading: true });
    try {
      const { token, user } = mockLogin(phone, password);
      const enrichedUser = {
        ...user,
        communityName: user.communityName,
        subdomain: user.subdomain,
      };
      set({
        user: enrichedUser,
        token,
        isAuthenticated: true,
        isLoading: false,
        useMock: true,
        isHydrated: true,
      });
      localStorage.setItem(
        'auth-storage',
        JSON.stringify({ state: { token, user: enrichedUser, useMock: true } })
      );
      return user;
    } catch (error) {
      set({ isLoading: false, isHydrated: true });
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
      set({ user, token, isAuthenticated: true, isLoading: false, isHydrated: true });
      localStorage.setItem(
        'auth-storage',
        JSON.stringify({ state: { token, user } })
      );
    } catch (error) {
      set({ isLoading: false, isHydrated: true });
      throw error;
    }
  },

  logout: () => {
    set({ user: null, token: null, isAuthenticated: false, isHydrated: true });
    localStorage.removeItem('auth-storage');
  },

  setUser: (user) => {
    const enriched = {
      ...user,
      communityName: (user as any).communityName,
      subdomain: (user as any).subdomain,
    };
    set({ user: enriched });
    const { token, useMock: isMockMode } = get();
    localStorage.setItem(
      'auth-storage',
      JSON.stringify({ state: { token, user: enriched, useMock: isMockMode } })
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
          set({
            user,
            token,
            isAuthenticated: true,
            useMock: isMockMode,
            isHydrated: true,
          });
          return;
        } else {
          set({ useMock: isMockMode, isHydrated: true });
          return;
        }
      }
    } catch {
      // ignore parse errors
    }
    set({ isHydrated: true });
  },

  setUseMock: (useMock) => {
    set({ useMock });
  },
}));
