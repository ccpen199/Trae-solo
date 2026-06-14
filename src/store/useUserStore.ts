import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@shared/types';

interface UserState {
  user: User | null;
  isLoggedIn: boolean;
  token: string | null;
  loading: boolean;
  error: string | null;
  login: (phone: string, password: string) => Promise<boolean>;
  loginWithToken: (token: string) => Promise<boolean>;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  hasRole: (role: User['role'] | User['role'][]) => boolean;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoggedIn: false,
      token: null,
      loading: false,
      error: null,

      login: async (phone: string, password: string) => {
        set({ loading: true, error: null });
        try {
          const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone, password }),
          });
          const data = await response.json();

          if (data.success && data.data) {
            set({
              user: data.data.user,
              token: data.data.token,
              isLoggedIn: true,
              loading: false,
            });
            return true;
          }
          set({ error: data.message || '登录失败', loading: false });
          return false;
        } catch (error) {
          set({ error: '网络错误，请稍后重试', loading: false });
          return false;
        }
      },

      loginWithToken: async (token: string) => {
        set({ loading: true, error: null });
        try {
          const response = await fetch('/api/auth/me', {
            headers: { Authorization: `Bearer ${token}` },
          });
          const data = await response.json();

          if (data.success && data.data) {
            set({
              user: data.data,
              token,
              isLoggedIn: true,
              loading: false,
            });
            return true;
          }
          set({ error: 'Token 无效', loading: false });
          return false;
        } catch (error) {
          set({ error: '网络错误，请稍后重试', loading: false });
          return false;
        }
      },

      logout: () => {
        set({
          user: null,
          isLoggedIn: false,
          token: null,
          error: null,
        });
      },

      updateUser: (userData: Partial<User>) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...userData } : null,
        })),

      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),

      hasRole: (role) => {
        const { user } = get();
        if (!user) return false;
        if (Array.isArray(role)) {
          return role.includes(user.role);
        }
        return user.role === role;
      },
    }),
    {
      name: 'user-store',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isLoggedIn: state.isLoggedIn,
      }),
    }
  )
);
