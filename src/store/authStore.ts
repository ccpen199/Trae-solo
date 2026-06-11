import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi } from '../lib/api';
import type { User, LoginRequest } from '../../shared/types';

interface AuthState {
  user: (User & { permissions: string[] }) | null;
  token: string | null;
  refreshToken: string | null;
  loading: boolean;
  error: string | null;
  login: (data: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  fetchCurrentUser: () => Promise<void>;
  clearError: () => void;
  hasPermission: (permission: string) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      loading: false,
      error: null,

      login: async (data: LoginRequest) => {
        set({ loading: true, error: null });
        try {
          const response = await authApi.login(data);
          const { token, refreshToken, user } = response.data;
          localStorage.setItem('wenlv_token', token);
          localStorage.setItem('wenlv_refreshToken', refreshToken);
          set({
            token,
            refreshToken,
            user: { ...user, permissions: response.data.permissions || [] },
            loading: false,
          });
        } catch (err) {
          set({
            error: err instanceof Error ? err.message : '登录失败',
            loading: false,
          });
          throw err;
        }
      },

      logout: async () => {
        try {
          await authApi.logout();
        } finally {
          localStorage.removeItem('wenlv_token');
          localStorage.removeItem('wenlv_refreshToken');
          localStorage.removeItem('wenlv_user');
          set({ user: null, token: null, refreshToken: null });
        }
      },

      fetchCurrentUser: async () => {
        try {
          const response = await authApi.getCurrentUser();
          set({ user: response.data });
        } catch (err) {
          console.error('获取用户信息失败:', err);
        }
      },

      clearError: () => set({ error: null }),

      hasPermission: (permission: string) => {
        const { user } = get();
        if (!user) return false;
        if (user.role === 'super_admin') return true;
        return user.permissions?.includes(permission) || false;
      },
    }),
    {
      name: 'wenlv-auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
      }),
    },
  ),
);
