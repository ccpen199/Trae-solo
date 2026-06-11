import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, LoginParams, LoginResult } from '@/types';
import { authApi } from '@/api';

interface UserState {
  token: string | null;
  userInfo: User | null;
  isLoggedIn: boolean;
  login: (params: LoginParams) => Promise<LoginResult>;
  logout: () => Promise<void>;
  setUserInfo: (user: User) => void;
  clearUser: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      token: null,
      userInfo: null,
      isLoggedIn: false,

      login: async (params: LoginParams) => {
        const result = await authApi.login(params);
        localStorage.setItem('token', result.token);
        localStorage.setItem('userInfo', JSON.stringify(result.user));
        set({
          token: result.token,
          userInfo: result.user,
          isLoggedIn: true
        });
        return result;
      },

      logout: async () => {
        try {
          await authApi.logout();
        } catch (e) {
          console.error('Logout error:', e);
        }
        set({
          token: null,
          userInfo: null,
          isLoggedIn: false
        });
        localStorage.removeItem('token');
        localStorage.removeItem('userInfo');
      },

      setUserInfo: (user: User) => {
        set({ userInfo: user });
      },

      clearUser: () => {
        set({
          token: null,
          userInfo: null,
          isLoggedIn: false
        });
      }
    }),
    {
      name: 'user-storage',
      partialize: (state) => ({
        token: state.token,
        userInfo: state.userInfo,
        isLoggedIn: state.isLoggedIn
      })
    }
  )
);
