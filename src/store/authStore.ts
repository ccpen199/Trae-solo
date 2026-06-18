import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, AuthToken, LoginProvider } from '../../shared/types';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  login: (provider: LoginProvider, credentials?: { phone?: string; password?: string; code?: string }) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  setAuth: (user: User, tokens: AuthToken) => void;
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      setAuth: (user: User, tokens: AuthToken) => {
        const userWithLoginTime: User = {
          ...user,
          loginTime: new Date().toISOString(),
        };
        set({
          user: userWithLoginTime,
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
          isAuthenticated: true,
        });
        localStorage.setItem('accessToken', tokens.accessToken);
        localStorage.setItem('refreshToken', tokens.refreshToken);
      },

      login: async (provider, credentials) => {
        try {
          const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ provider, ...credentials }),
          });
          const data: ApiResponse<{ user: User; tokens: AuthToken; token?: AuthToken }> = await response.json();

          if (data.success && data.data) {
            const payload = data.data;
            if (payload && (payload as any).token && !(payload as any).tokens) {
              (payload as any).tokens = (payload as any).token;
            }
            get().setAuth(payload.user, payload.tokens!);
            return { success: true };
          }
          return { success: false, message: data.message || data.error || '登录失败' };
        } catch (error) {
          return { success: false, message: '网络错误，请稍后重试' };
        }
      },

      logout: () => {
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
      },

      refreshUser: async () => {
        try {
          const token = get().accessToken;
          if (!token) return;

          const response = await fetch('/api/auth/me', {
            headers: { Authorization: `Bearer ${token}` },
          });
          const data: ApiResponse<User> = await response.json();

          if (data.success && data.data) {
            set({ user: data.data });
          }
        } catch (error) {
          console.error('Failed to refresh user:', error);
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
