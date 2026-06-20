// 用户全局状态：Zustand Store

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types';

interface UserState {
  user: User | null;
  token: string | null;
  login: (user: User, token: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
  updateUser: (patch: Partial<User>) => void;
}

const defaultUser: User = {
  id: 'user_001',
  phone: '138****8888',
  nickname: '环保达人小王',
  avatar: '🧑',
  createdAt: '2024-01-15T10:20:00.000Z',
  role: 'user',
};

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => ({
      user: defaultUser,
      token: 'mock-token-user-001',
      isAuthenticated: true,
      login: (user, token) => set({ user, token, isAuthenticated: true }),
      logout: () => set({ user: null, token: null, isAuthenticated: false }),
      updateUser: (patch) => set({ user: get().user ? { ...get().user!, ...patch } : null }),
    }),
    {
      name: 'user-store',
    },
  ),
);

export default useUserStore;
