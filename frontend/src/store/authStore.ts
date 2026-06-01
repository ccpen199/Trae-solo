import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, LoginRequest, LoginResponse } from '../types';
import { authApi } from '../api/client';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  login: (data: LoginRequest) => Promise<boolean>;
  logout: () => void;
  fetchMe: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isLoading: false,
      error: null,

      login: async (data: LoginRequest) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authApi.login(data) as LoginResponse;
          set({
            user: response.user,
            token: response.token,
            isLoading: false,
          });
          return true;
        } catch (err: unknown) {
          const error = err as { response?: { data?: { message?: string } } };
          set({
            error: error.response?.data?.message || '登录失败，请检查用户名和密码',
            isLoading: false,
          });
          return false;
        }
      },

      logout: () => {
        set({ user: null, token: null, error: null });
      },

      fetchMe: async () => {
        const token = useAuthStore.getState().token;
        if (!token) return;

        try {
          const user = await authApi.me() as User;
          set({ user });
        } catch {
          set({ user: null, token: null });
        }
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ token: state.token, user: state.user }),
    }
  )
);
