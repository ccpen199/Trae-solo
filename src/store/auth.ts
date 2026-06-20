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
  login: (username: string, password: string, role: UserRole) => Promise<{ success: boolean; message?: string }>;
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

const mockUsers: Record<UserRole, { user: User; token: string }> = {
  courier: {
    user: {
      id: '1',
      username: 'courier',
      name: '张快递',
      role: 'courier',
      phone: '13800138001',
      avatar: '',
      outletId: '1',
      outletName: '朝阳区网点',
      certificationStatus: 'approved',
      createdAt: '2024-01-01T00:00:00Z',
      lastLoginAt: new Date().toISOString(),
    },
    token: 'mock-token-courier',
  },
  admin: {
    user: {
      id: '2',
      username: 'admin',
      name: '李管理',
      role: 'admin',
      phone: '13800138002',
      avatar: '',
      certificationStatus: 'approved',
      createdAt: '2024-01-01T00:00:00Z',
      lastLoginAt: new Date().toISOString(),
    },
    token: 'mock-token-admin',
  },
  operator: {
    user: {
      id: '3',
      username: 'operator',
      name: '王运营',
      role: 'operator',
      phone: '13800138003',
      avatar: '',
      outletId: '1',
      outletName: '朝阳区网点',
      certificationStatus: 'approved',
      createdAt: '2024-01-01T00:00:00Z',
      lastLoginAt: new Date().toISOString(),
    },
    token: 'mock-token-operator',
  },
};

const credentials: Record<UserRole, { username: string; password: string }> = {
  courier: { username: 'courier', password: '123456' },
  admin: { username: 'admin', password: '123456' },
  operator: { username: 'operator', password: '123456' },
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
          get().getCurrentUser();
        }
      },

      login: async (username: string, password: string, role: UserRole) => {
        set({ loading: true, isLoading: true });
        try {
          const data = await apiPost<LoginResponse>('/auth/login', { username, password, role });
          const { token, user } = data;
          localStorage.setItem(TOKEN_KEY, token);
          set({ token, user, isAuthenticated: true, loading: false, isLoading: false });
          return { success: true };
        } catch (error: any) {
          const valid = credentials[role];
          if (username === valid.username && password === valid.password) {
            const mockData = mockUsers[role];
            localStorage.setItem(TOKEN_KEY, mockData.token);
            set({
              token: mockData.token,
              user: mockData.user,
              isAuthenticated: true,
              loading: false,
              isLoading: false,
            });
            return { success: true };
          }

          set({ loading: false, isLoading: false });
          return { success: false, message: error.message || '登录失败' };
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
          set({ user: userData, loading: false, isLoading: false });
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
