import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isAuthenticated: false,

      setAuth: (token, user) => {
        set({
          token,
          user,
          isAuthenticated: true,
        });
      },

      updateUser: (user) => {
        set({ user });
      },

      logout: () => {
        set({
          token: null,
          user: null,
          isAuthenticated: false,
        });
      },

      getToken: () => get().token,
      getUser: () => get().user,
    }),
    {
      name: 'auth-storage',
    }
  )
);
