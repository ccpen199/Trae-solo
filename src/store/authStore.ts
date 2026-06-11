import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, LoginRequest } from '@shared/types';
import { authApi } from '@/api/endpoints';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  rememberMe: boolean;
  savedUsername: string;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  getProfile: () => Promise<void>;
  setRememberMe: (remember: boolean, username?: string) => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      loading: false,
      error: null,
      rememberMe: false,
      savedUsername: '',

      login: async (credentials: LoginRequest) => {
        set({ loading: true, error: null });
        try {
          const response = await authApi.login(credentials);
          set({
            user: response.user,
            token: response.token,
            isAuthenticated: true,
            loading: false,
          });
          localStorage.setItem('token', response.token);
          localStorage.setItem('user', JSON.stringify(response.user));
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : '登录失败',
            loading: false,
          });
          throw error;
        }
      },

      logout: async () => {
        try {
          await authApi.logout();
        } catch (error) {
          console.error('Logout error:', error);
        } finally {
          set({
            user: null,
            token: null,
            isAuthenticated: false,
          });
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      },

      getProfile: async () => {
        try {
          const user = await authApi.getProfile();
          set({ user });
        } catch (error) {
          console.error('Get profile error:', error);
        }
      },

      setRememberMe: (remember: boolean, username?: string) => {
        set({
          rememberMe: remember,
          savedUsername: username || '',
        });
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        rememberMe: state.rememberMe,
        savedUsername: state.savedUsername,
      }),
    }
  )
);
