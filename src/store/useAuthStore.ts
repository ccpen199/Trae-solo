import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User, UserRole } from '@shared/types';

interface OriginalCredentials {
  phone: string;
  password: string;
  role: UserRole;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  impersonateRole: UserRole | null;
  originalCredentials: OriginalCredentials | null;
  login: (user: User, token: string) => void;
  logout: () => void;
  setUser: (user: Partial<User>) => void;
  startImpersonation: (impersonateRole: UserRole, credentials: OriginalCredentials) => void;
  exitImpersonation: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      impersonateRole: null,
      originalCredentials: null,
      login: (user, token) =>
        set({
          user,
          token,
          isAuthenticated: true,
        }),
      logout: () =>
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          impersonateRole: null,
          originalCredentials: null,
        }),
      setUser: (partialUser) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...partialUser } : null,
        })),
      startImpersonation: (impersonateRole, credentials) =>
        set({
          impersonateRole,
          originalCredentials: credentials,
        }),
      exitImpersonation: () =>
        set({
          impersonateRole: null,
          originalCredentials: null,
        }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        impersonateRole: state.impersonateRole,
        originalCredentials: state.originalCredentials,
      }),
    }
  )
);
