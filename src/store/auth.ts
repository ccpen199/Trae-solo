import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, UserRole, LoginRequest, LoginResponse } from '@/types';

interface AuthState {
  token: string | null;
  user: User | null;
  permissions: string[];
  isAuthenticated: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => void;
  checkPermission: (permission: string) => boolean;
  checkRole: (roles: UserRole[]) => boolean;
  initialize: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      permissions: [],
      isAuthenticated: false,

      login: async (credentials: LoginRequest) => {
        try {
          const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(credentials),
          });

          const result = await response.json();

          if (result.code !== 200) {
            throw new Error(result.message || '登录失败');
          }

          const data: LoginResponse = result.data;

          set({
            token: data.token,
            user: data.user,
            permissions: data.permissions,
            isAuthenticated: true,
          });
        } catch (error) {
          console.error('Login error:', error);
          throw error;
        }
      },

      logout: () => {
        set({
          token: null,
          user: null,
          permissions: [],
          isAuthenticated: false,
        });
        localStorage.removeItem('auth-storage');
      },

      checkPermission: (permission: string) => {
        const { permissions } = get();
        return permissions.includes(permission);
      },

      checkRole: (roles: UserRole[]) => {
        const { user } = get();
        if (!user) return false;
        return roles.includes(user.role);
      },

      initialize: () => {
        const stored = localStorage.getItem('auth-storage');
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            if (parsed.state?.token && parsed.state?.user) {
              set({
                token: parsed.state.token,
                user: parsed.state.user,
                permissions: parsed.state.permissions || [],
                isAuthenticated: true,
              });
            }
          } catch {
            console.error('Failed to parse auth storage');
          }
        }
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);
