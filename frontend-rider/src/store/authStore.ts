import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Rider } from '@shared/types';
import { authService } from '@/services/auth.service';

interface AuthState {
  token: string | null;
  user: Rider | null;
  loading: boolean;
  login: (phone: string, password: string, code?: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  fetchProfile: () => Promise<void>;
  updateUser: (user: Partial<Rider>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      loading: false,

      login: async (phone: string, password: string, code?: string) => {
        set({ loading: true });
        try {
          const result = await authService.login({ phone, password, code });
          set({
            token: result.token,
            user: result.rider,
            loading: false,
          });
        } catch (error) {
          set({ loading: false });
          throw error;
        }
      },

      register: async (data: any) => {
        set({ loading: true });
        try {
          const user = await authService.register(data);
          set({ user, loading: false });
        } catch (error) {
          set({ loading: false });
          throw error;
        }
      },

      logout: async () => {
        try {
          await authService.logout();
        } catch (error) {
          console.error('Logout error:', error);
        }
        set({ token: null, user: null });
      },

      fetchProfile: async () => {
        try {
          const user = await authService.getProfile();
          set({ user });
        } catch (error) {
          console.error('Fetch profile error:', error);
        }
      },

      updateUser: (user: Partial<Rider>) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...user } : null,
        }));
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
      }),
    }
  )
);
