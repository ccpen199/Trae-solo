import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authService } from '@/services/auth.service';
import type { AdminLoginResponse } from '@/services/auth.service';

interface AdminUser {
  id: string;
  username: string;
  name: string;
  role: string;
}

interface AuthState {
  token: string | null;
  user: AdminUser | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      loading: false,

      login: async (username: string, password: string) => {
        set({ loading: true });
        try {
          const result: AdminLoginResponse = await authService.login({ username, password });
          set({
            token: result.token,
            user: result.admin,
            loading: false,
          });
        } catch (error) {
          set({ loading: false });
          throw error;
        }
      },

      logout: () => {
        set({ token: null, user: null });
      },
    }),
    {
      name: 'admin-auth-storage',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
      }),
    }
  )
);
