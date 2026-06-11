import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { api } from './apiClient';

export type UserRole = 'employer' | 'provider' | 'admin';

export interface User {
  id: number;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
  phone?: string;
  createdAt?: string;
}

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  login: (email: string, password: string, role: UserRole) => Promise<void>;
  logout: () => void;
  getCurrentUser: () => Promise<void>;
  clearError: () => void;
}

interface LoginResponse {
  token: string;
  user: User;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (email: string, password: string, role: UserRole) => {
        set({ isLoading: true, error: null });
        try {
          const response = await api.post<LoginResponse>('/auth/login', {
            email,
            password,
            role,
          }, { requireAuth: false });

          set({
            token: response.token,
            user: response.user,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (err) {
          set({
            error: err instanceof Error ? err.message : '登录失败',
            isLoading: false,
          });
          throw err;
        }
      },

      logout: () => {
        set({
          token: null,
          user: null,
          isAuthenticated: false,
          error: null,
        });
        localStorage.removeItem('auth-storage');
        window.dispatchEvent(new CustomEvent('auth:logout'));
      },

      getCurrentUser: async () => {
        if (!get().token) return;

        set({ isLoading: true });
        try {
          const user = await api.get<User>('/auth/me');
          set({ user, isAuthenticated: true, isLoading: false });
        } catch (err) {
          set({
            error: err instanceof Error ? err.message : '获取用户信息失败',
            isLoading: false,
          });
        }
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

export const useAuth = () => {
  const { token, user, isAuthenticated, isLoading, error, login, logout, getCurrentUser, clearError } =
    useAuthStore();
  return { token, user, isAuthenticated, isLoading, error, login, logout, getCurrentUser, clearError };
};
