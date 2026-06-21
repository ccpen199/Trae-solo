import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../../shared/types';
import { UserRole } from '../../shared/types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (phone: string, password: string) => Promise<void>;
  register: (phone: string, password: string, nickname?: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (phone: string, _password: string) => {
        try {
          set({ isLoading: true, error: null });
          await new Promise((resolve) => setTimeout(resolve, 800));
          const mockUser: User = {
            id: 'user_001',
            phone,
            nickname: '藏家小王',
            avatar: '',
            role: UserRole.USER,
            createdAt: new Date().toISOString(),
          };
          const mockToken = 'mock_jwt_token_' + Date.now();
          set({
            user: mockUser,
            token: mockToken,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (err) {
          set({
            error: err instanceof Error ? err.message : '登录失败',
            isLoading: false,
          });
        }
      },

      register: async (phone: string, _password: string, nickname?: string) => {
        try {
          set({ isLoading: true, error: null });
          await new Promise((resolve) => setTimeout(resolve, 800));
          const mockUser: User = {
            id: 'user_' + Date.now(),
            phone,
            nickname: nickname || '新用户',
            avatar: '',
            role: UserRole.USER,
            createdAt: new Date().toISOString(),
          };
          const mockToken = 'mock_jwt_token_' + Date.now();
          set({
            user: mockUser,
            token: mockToken,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (err) {
          set({
            error: err instanceof Error ? err.message : '注册失败',
            isLoading: false,
          });
        }
      },

      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null,
        });
      },

      setUser: (user: User) => {
        set({ user });
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
