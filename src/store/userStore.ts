import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { auth } from '@/api';
import type { User, LoginRequest } from '@/types';

interface UserState {
  token: string | null;
  user: User | null;
  isLoggedIn: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => void;
  fetchProfile: () => Promise<void>;
}

const TOKEN_KEY = 'token';

const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isLoggedIn: false,

      login: async (credentials: LoginRequest) => {
        const response = await auth.login(credentials);
        if (response.success) {
          const { token, user } = response.data;
          localStorage.setItem(TOKEN_KEY, token);
          set({
            token,
            user,
            isLoggedIn: true,
          });
        }
      },

      logout: () => {
        localStorage.removeItem(TOKEN_KEY);
        set({
          token: null,
          user: null,
          isLoggedIn: false,
        });
      },

      fetchProfile: async () => {
        const response = await auth.getProfile();
        if (response.success) {
          set({
            user: response.data,
            isLoggedIn: true,
          });
        }
      },
    }),
    {
      name: 'user-storage',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isLoggedIn: state.isLoggedIn,
      }),
    }
  )
);

export default useUserStore;
