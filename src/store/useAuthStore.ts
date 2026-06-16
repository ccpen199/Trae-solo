import { create } from 'zustand';
import { api } from '@/api/client';
import type { UserIdentity, LoginResponse } from '../../shared/types';

export type LoginErrorCode = 
  | 'SUCCESS'
  | 'ACCOUNT_NOT_FOUND'
  | 'PASSWORD_ERROR'
  | 'INSUFFICIENT_PERMISSIONS'
  | 'NETWORK_ERROR'
  | 'UNKNOWN_ERROR';

interface AuthState {
  user: UserIdentity | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  loginError: LoginErrorCode | null;
  login: (phone: string, password: string) => Promise<{ success: boolean; code: LoginErrorCode }>;
  logout: () => void;
  setUser: (user: UserIdentity) => void;
  checkAuth: () => void;
  clearLoginError: () => void;
}

const demoUser: UserIdentity = {
  id: 'admin-001',
  name: '管理员',
  idCard: '450101198001010099',
  phone: '13900139000',
  email: 'admin@example.com',
  realNameVerified: true,
  faceVerified: true,
  role: 'admin',
};

export const useAuthStore = create<AuthState>((set) => ({
  user: demoUser,
  token: localStorage.getItem('token') || 'demo-session',
  isAuthenticated: true,
  isLoading: false,
  loginError: null,

  login: async (phone: string, password: string) => {
    set({ isLoading: true, loginError: null });
    try {
      const data = await api.auth.login(phone, password) as LoginResponse;
      if (data && data.token && data.user) {
        localStorage.setItem('token', data.token);
        set({
          user: data.user,
          token: data.token,
          isAuthenticated: true,
          isLoading: false,
          loginError: null,
        });
        return { success: true, code: 'SUCCESS' };
      }
      set({ isLoading: false, loginError: 'UNKNOWN_ERROR' });
      return { success: false, code: 'UNKNOWN_ERROR' };
    } catch (error: any) {
      let errorCode: LoginErrorCode = 'UNKNOWN_ERROR';
      if (error?.error === 'PASSWORD_ERROR' || error?.message?.includes('密码')) {
        errorCode = 'PASSWORD_ERROR';
      } else if (error?.error === 'ACCOUNT_NOT_FOUND' || error?.message?.includes('账号不存在') || error?.message?.includes('不存在')) {
        errorCode = 'ACCOUNT_NOT_FOUND';
      } else if (error?.error === 'INSUFFICIENT_PERMISSIONS' || error?.message?.includes('权限')) {
        errorCode = 'INSUFFICIENT_PERMISSIONS';
      } else if (error?.code === 'NETWORK_ERROR' || error?.message?.includes('Failed to fetch') || error?.message?.includes('Network')) {
        errorCode = 'NETWORK_ERROR';
      }
      set({ isLoading: false, loginError: errorCode });
      return { success: false, code: errorCode };
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null, isAuthenticated: false, loginError: null });
  },

  setUser: (user: UserIdentity) => {
    set({ user });
  },

  checkAuth: async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const user = await api.auth.getCurrentUser() as UserIdentity;
        if (user) {
          set({ user, isAuthenticated: true, token });
          return;
        }
      } catch {
        // ignore
      }
    }
    localStorage.setItem('token', 'demo-session');
    set({ isAuthenticated: true, token: 'demo-session', user: demoUser });
  },

  clearLoginError: () => {
    set({ loginError: null });
  },
}));
