import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, UserRole } from 'shared/types';
import { get as apiGet, post as apiPost } from '@/utils/api';

const TOKEN_KEY = 'token';

interface LoginResponse {
  token: string;
  user: User;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  isLoading: boolean;
}

interface AuthActions {
  login: (username: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  getCurrentUser: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
  initialize: () => void;
  checkAuth: () => boolean;
  hasRole: (roles: UserRole[]) => boolean;
}

const getInitialToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(TOKEN_KEY);
  }
  return null;
};

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set, get) => ({
      user: null,
      token: getInitialToken(),
      isAuthenticated: !!getInitialToken(),
      loading: false,
      isLoading: false,

      initialize: () => {
        const token = getInitialToken();
        if (token) {
          get().getCurrentUser().catch(() => {
            localStorage.removeItem(TOKEN_KEY);
            set({ user: null, token: null, isAuthenticated: false });
          });
        }
      },

      login: async (username: string, password: string) => {
        set({ loading: true, isLoading: true });
        try {
          const data = await apiPost<LoginResponse>('/auth/login', { username, password });
          const { token, user } = data;
          localStorage.setItem(TOKEN_KEY, token);
          set({ token, user, isAuthenticated: true, loading: false, isLoading: false });
          return { success: true };
        } catch (error: any) {
          set({ loading: false, isLoading: false });
          return { success: false, message: error.message || '用户名或密码错误' };
        }
      },

      logout: () => {
        localStorage.removeItem(TOKEN_KEY);
        set({ user: null, token: null, isAuthenticated: false });
      },

      getCurrentUser: async () => {
        set({ loading: true, isLoading: true });
        try {
          const userData = await apiGet<User>('/auth/me');
          set({ user: userData, isAuthenticated: true, loading: false, isLoading: false });
        } catch (error) {
          localStorage.removeItem(TOKEN_KEY);
          set({ user: null, token: null, isAuthenticated: false, loading: false, isLoading: false });
          throw error;
        }
      },

      updateUser: (userData: Partial<User>) => {
        const { user } = get();
        if (user) {
          set({ user: { ...user, ...userData } });
        }
      },

      checkAuth: () => {
        return get().isAuthenticated && !!get().token;
      },

      hasRole: (roles: UserRole[]) => {
        const user = get().user;
        if (!user) return false;
        return roles.includes(user.role);
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, token: state.token, isAuthenticated: state.isAuthenticated }),
    }
  )
);
