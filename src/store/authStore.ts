import { create } from 'zustand';
import type { User } from '../../shared/types';
import { api } from '../utils/api';

const demoAdminUser: User = {
  id: 'local-admin',
  username: 'admin',
  avatar: '',
  role: 'admin',
  bio: '平台管理员',
  followerCount: 0,
  followingCount: 0,
  rating: 5,
  verified: true,
  location: '本地演示',
  createdAt: '2026-06-15T00:00:00.000Z',
};

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string, role?: string) => Promise<void>;
  logout: () => void;
  fetchProfile: () => Promise<void>;
  setUser: (user: User | null) => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: localStorage.getItem('token') ? null : demoAdminUser,
  token: localStorage.getItem('token') || 'local-demo-admin',
  isAuthenticated: true,
  isLoading: false,
  error: null,

  login: async (username: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const response: any = await api.auth.login(username, password);
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      set({ user, token, isAuthenticated: true, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  register: async (username: string, password: string, role?: string) => {
    set({ isLoading: true, error: null });
    try {
      const response: any = await api.auth.register(username, password, role);
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      set({ user, token, isAuthenticated: true, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ user: demoAdminUser, token: 'local-demo-admin', isAuthenticated: true });
  },

  fetchProfile: async () => {
    if (!get().token) return;

    set({ isLoading: true });
    try {
      const response: any = await api.auth.getProfile();
      set({ user: response.data, isLoading: false });
    } catch (error) {
      localStorage.removeItem('token');
      set({ user: demoAdminUser, token: 'local-demo-admin', isAuthenticated: true, isLoading: false });
    }
  },

  setUser: (user) => set({ user }),
  
  clearError: () => set({ error: null }),
}));

interface AppState {
  categories: string[];
  orderStatuses: { value: string; label: string; color: string }[];
  platformFeeRate: number;
  initConfig: () => Promise<void>;
}

export const useAppStore = create<AppState>((set) => ({
  categories: [],
  orderStatuses: [],
  platformFeeRate: 0.15,

  initConfig: async () => {
    try {
      const response: any = await api.config();
      const data = response.data;
      set({
        categories: data.categories,
        orderStatuses: data.orderStatuses,
        platformFeeRate: data.platformFeeRate,
      });
    } catch (error) {
      console.error('Failed to load config:', error);
    }
  },
}));
