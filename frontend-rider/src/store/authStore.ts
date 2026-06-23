import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Rider } from '@shared/types';
import { authService } from '@/services/auth.service';

interface AuthState {
  token: string | null;
  user: Rider | null;
  loading: boolean;
  _hasHydrated: boolean;
  login: (phone: string, password: string, code?: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  fetchProfile: () => Promise<void>;
  updateUser: (user: Partial<Rider>) => void;
  _setHasHydrated: (v: boolean) => void;
  _forceSetAuth: (token: string, user: Rider) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      loading: false,
      _hasHydrated: false,

      _setHasHydrated: (v: boolean) => set({ _hasHydrated: v }),

      _forceSetAuth: (token: string, user: Rider) => {
        set({ token, user, loading: false, _hasHydrated: true });
      },

      login: async (phone: string, password: string, code?: string) => {
        set({ loading: true });
        try {
          const result = await authService.login({ phone, password, code });
          const riderWithDefaults = {
            ...result.rider,
            role: (result.rider as any).role ?? 'rider',
            realNameAuditStatus: result.rider.realNameAuditStatus ?? 'pending',
            qualificationAuditStatus: (result.rider as any).qualificationAuditStatus ?? (result.rider as any).auditStatus ?? 'pending',
          };
          set({
            token: result.token,
            user: riderWithDefaults,
            loading: false,
            _hasHydrated: true,
          });
          try {
            localStorage.setItem('auth-storage', JSON.stringify({
              state: { token: result.token, user: riderWithDefaults, _hasHydrated: true },
              version: 0,
            }));
          } catch {}
        } catch (error: any) {
          set({ loading: false });
          const errorMessage = error?.message || error?.msg || '登录失败，请重试';
          throw new Error(errorMessage);
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
        _hasHydrated: state._hasHydrated,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state._hasHydrated = true;
        }
      },
    }
  )
);
