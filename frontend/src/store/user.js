import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useUserStore = create(
  persist(
    (set) => ({
      token: 'local-demo-admin',
      user: {
        id: 1,
        username: 'admin',
        name: '演示管理员',
        type: 'admin',
        phone: '13800138000'
      },
      isElderMode: false,
      
      login: (token, user) => set({ token, user }),
      logout: () => set({ token: null, user: null }),
      toggleElderMode: () => set((state) => ({ isElderMode: !state.isElderMode })),
      setElderMode: (value) => set({ isElderMode: value })
    }),
    {
      name: 'user-storage'
    }
  )
);
