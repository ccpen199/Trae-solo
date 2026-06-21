import { create } from 'zustand';
import type { User, UserRole } from '../../shared/types';
import { authAPI } from '../services/api';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (phone: string, password: string, role: UserRole) => Promise<{ success: boolean; message?: string }>;
  register: (phone: string, password: string, role: UserRole, companyName: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),
  isLoading: false,

  login: async (phone, password, role) => {
    set({ isLoading: true });
    try {
      const response = await authAPI.login(phone, password, role);
      if (response.success && response.data) {
        const { token, user } = response.data;
        localStorage.setItem('token', token);
        set({ user, token, isAuthenticated: true, isLoading: false });
        return { success: true };
      }
      set({ isLoading: false });
      return { success: false, message: response.message || '登录失败' };
    } catch (error) {
      set({ isLoading: false });
      return { success: false, message: error instanceof Error ? error.message : '登录失败' };
    }
  },

  register: async (phone, password, role, companyName) => {
    set({ isLoading: true });
    try {
      const response = await authAPI.register(phone, password, role, companyName);
      set({ isLoading: false });
      return { success: response.success, message: response.message };
    } catch (error) {
      set({ isLoading: false });
      return { success: false, message: error instanceof Error ? error.message : '注册失败' };
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null, isAuthenticated: false });
  },

  checkAuth: async () => {
    set({ isLoading: true });
    const token = localStorage.getItem('token');
    if (!token) {
      set({ isAuthenticated: false, user: null, isLoading: false });
      return;
    }

    try {
      const response = await authAPI.getMe();
      if (response.success && response.data) {
        set({ user: response.data.user, isAuthenticated: true, isLoading: false });
      } else {
        localStorage.removeItem('token');
        set({ isAuthenticated: false, user: null, isLoading: false });
      }
    } catch {
      localStorage.removeItem('token');
      set({ isAuthenticated: false, user: null, token: null, isLoading: false });
    }
  },
}));
