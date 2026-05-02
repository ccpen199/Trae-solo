import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      
      setAuth: (user, token) => set({
        user,
        token,
        isAuthenticated: true
      }),
      
      clearAuth: () => set({
        user: null,
        token: null,
        isAuthenticated: false
      }),
      
      updateUser: (user) => set({
        user: { ...get().user, ...user }
      }),
      
      getRole: () => get().user?.role,
      getUserId: () => get().user?.id,
      getToken: () => get().token
    }),
    {
      name: 'insurance-auth-storage'
    }
  )
);
