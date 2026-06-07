import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiRequest, type ApiResponse } from '@/utils/api';

export type UserRole = 'admin' | 'property' | 'resident' | 'merchant';

export interface User {
  id: number;
  username: string;
  name: string;
  role: UserRole;
  avatar?: string;
  phone?: string;
  email?: string;
  buildingId?: number;
  unit?: string;
  skills?: string;
  status?: string;
}

interface LoginResponse {
  token: string;
  access_token: string;
  token_type: string;
  expires_in: number;
  user: User;
}

export interface LoginResult {
  success: boolean;
  message: string;
  error?: string;
  user?: User;
  code?: number;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loginError: string;
  loginMessage: string;
  login: (username: string, password: string) => Promise<LoginResult>;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
  clearLoginError: () => void;
  getRoleDashboardPath: (role: UserRole) => string;
}

const roleDashboardPaths: Record<UserRole, string> = {
  admin: '/dashboard/admin',
  property: '/dashboard/property',
  resident: '/dashboard/resident',
  merchant: '/dashboard/merchant',
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      loginError: '',
      loginMessage: '',
      getRoleDashboardPath: (role: UserRole) => roleDashboardPaths[role] || '/',
      login: async (username: string, password: string): Promise<LoginResult> => {
        try {
          set({ loginError: '', loginMessage: '正在验证身份...' });
          const response = await apiRequest.post<LoginResponse>('/auth/login', {
            username,
            password,
          });
          if (response.code === 200 && response.data) {
            const { token, user } = response.data;
            set({
              user,
              token,
              isAuthenticated: true,
              loginError: '',
              loginMessage: response.message || '登录成功',
            });
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));
            return {
              success: true,
              message: response.message || '登录成功',
              user,
              code: 200,
            };
          } else {
            const errorMsg = response.error || response.message || '登录失败，请重试';
            set({ loginError: errorMsg, loginMessage: '' });
            return {
              success: false,
              message: response.message || '登录失败',
              error: errorMsg,
              code: response.code,
            };
          }
        } catch (error: any) {
          console.error('Login failed:', error);
          const errorData = error?.response?.data;
          const errorMsg = errorData?.error || errorData?.message ||
            (error.message === 'Network Error' ? '无法连接到服务器，请检查网络连接' : '登录失败，请稍后重试');
          set({ loginError: errorMsg, loginMessage: '' });
          return {
            success: false,
            message: '登录失败',
            error: errorMsg,
            code: error?.response?.status || 500,
          };
        }
      },
      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          loginError: '',
          loginMessage: '',
        });
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('auth-storage');
      },
      updateUser: (userData: Partial<User>) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...userData } : null,
        }));
      },
      clearLoginError: () => {
        set({ loginError: '', loginMessage: '' });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.token) {
          localStorage.setItem('token', state.token);
        }
        if (state?.user) {
          localStorage.setItem('user', JSON.stringify(state.user));
        }
        if (!state?.isAuthenticated || !state?.token) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      },
    }
  )
);
