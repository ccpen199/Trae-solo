import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthUser, LoginRequest } from '@shared/types';
import { mockAuthService } from '../services/mockService';

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      login: async (credentials) => {
        set({ isLoading: true, error: null });
        try {
          const user = await mockAuthService.login(credentials);
          set({ user, isAuthenticated: true, isLoading: false });
        } catch (err) {
          set({ error: err instanceof Error ? err.message : '登录失败', isLoading: false });
          throw err;
        }
      },
      logout: () => {
        set({ user: null, isAuthenticated: false, error: null });
      },
      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);
