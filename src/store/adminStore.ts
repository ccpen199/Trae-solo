import { create } from 'zustand';
import type { AdminUser } from '@/types';
import { storage } from '@/utils/storage';
import { adminApi } from '@/services/admin';

interface AdminState {
  admin: AdminUser | null;
  token: string | null;
  isLogin: boolean;

  setAdmin: (admin: AdminUser) => void;
  setToken: (token: string) => void;
  login: (username: string, password: string, captcha?: string) => Promise<void>;
  logout: () => void;
  fetchAdminInfo: () => Promise<void>;
}

export const useAdminStore = create<AdminState>((set) => ({
  admin: storage.getAdminUser(),
  token: storage.getAdminToken(),
  isLogin: !!storage.getAdminToken(),

  setAdmin: (admin) => {
    storage.setAdminUser(admin);
    set({ admin });
  },

  setToken: (token) => {
    storage.setAdminToken(token);
    set({ token, isLogin: !!token });
  },

  login: async (username, password, captcha) => {
    const res: any = await adminApi.login({ username, password, captcha });
    const { token, userInfo } = res;
    storage.setAdminToken(token);
    storage.setAdminUser(userInfo);
    set({ token, admin: userInfo, isLogin: true });
  },

  logout: () => {
    storage.clearAdminAll();
    set({ admin: null, token: null, isLogin: false });
  },

  fetchAdminInfo: async () => {
    const admin: any = await adminApi.getAdminInfo();
    storage.setAdminUser(admin);
    set({ admin });
  },
}));
