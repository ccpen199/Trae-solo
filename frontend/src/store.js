import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      needRefreshProfile: false,
      login: (user, token) => set({ user, token }),
      logout: () => set({ user: null, token: null }),
      updateUser: (userData) => set((state) => ({ user: { ...state.user, ...userData } })),
      triggerProfileRefresh: () => set((state) => ({ needRefreshProfile: !state.needRefreshProfile })),
    }),
    {
      name: 'qianhe-storage',
    }
  )
);
