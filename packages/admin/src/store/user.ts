import { create } from 'zustand';

export interface UserInfo {
  id: string;
  phone: string;
  nickname: string;
  avatar?: string;
  realName?: string;
  role: string;
}

interface UserState {
  token: string | null;
  user: UserInfo | null;
  setToken: (token: string) => void;
  setUser: (user: UserInfo) => void;
  logout: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  token: 'admin-token',
  user: {
    id: 'admin-1',
    phone: '138****0001',
    nickname: '超级管理员',
    realName: '系统管理员',
    role: 'SUPER_ADMIN',
  },
  setToken: (token) => set({ token }),
  setUser: (user) => set({ user }),
  logout: () => set({ token: null, user: null }),
}));
