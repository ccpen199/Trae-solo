import { create } from 'zustand';
import type { User } from '@pet/shared/types';
import {
  getToken,
  setToken,
  removeToken,
  getRefreshToken,
  setRefreshToken,
  removeRefreshToken,
  getStoredUser,
  setStoredUser,
  removeStoredUser,
  clearAuth,
} from '@/lib/auth';
import api from '@/lib/api';

interface AuthState {
  token: string | null;
  user: User | null;
  isLoading: boolean;
  login: (phone: string, password: string) => Promise<void>;
  loginWithSms: (phone: string, code: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
  refreshUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: getToken(),
  user: getStoredUser(),
  isLoading: false,

  login: async (phone: string, password: string) => {
    set({ isLoading: true });
    try {
      const data = await api.post('/auth/login', { phone, password });
      const { accessToken, refreshToken, user } = data as {
        accessToken: string;
        refreshToken: string;
        user: User;
      };
      setToken(accessToken);
      setRefreshToken(refreshToken);
      setStoredUser(user);
      set({ token: accessToken, user, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  loginWithSms: async (phone: string, code: string) => {
    set({ isLoading: true });
    try {
      const data = await api.post('/auth/login/sms', { phone, smsCode: code });
      const { accessToken, refreshToken, user } = data as {
        accessToken: string;
        refreshToken: string;
        user: User;
      };
      setToken(accessToken);
      setRefreshToken(refreshToken);
      setStoredUser(user);
      set({ token: accessToken, user, isLoading: false });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: () => {
    clearAuth();
    set({ token: null, user: null });
  },

  setUser: (user: User) => {
    setStoredUser(user);
    set({ user });
  },

  refreshUser: async () => {
    try {
      const user = await api.get('/user/profile');
      setStoredUser(user as User);
      set({ user: user as User });
    } catch {
      clearAuth();
      set({ token: null, user: null });
    }
  },
}));
