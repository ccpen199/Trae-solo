import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserInfo } from '@shared/types';

interface AuthState {
  isAuthenticated: boolean;
  token: string | null;
  userInfo: UserInfo | null;
  expiresAt: number | null;
  login: (token: string, userInfo: UserInfo, expiresAt: number) => void;
  logout: () => void;
  refreshToken: (token: string, expiresAt: number) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      token: null,
      userInfo: null,
      expiresAt: null,
      login: (token, userInfo, expiresAt) => {
        set({
          isAuthenticated: true,
          token,
          userInfo,
          expiresAt,
        });
      },
      logout: () => {
        set({
          isAuthenticated: false,
          token: null,
          userInfo: null,
          expiresAt: null,
        });
      },
      refreshToken: (token, expiresAt) => {
        set({
          token,
          expiresAt,
        });
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        token: state.token,
        userInfo: state.userInfo,
        expiresAt: state.expiresAt,
      }),
    }
  )
);
