import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { userApi } from '@/services/api';

export interface User {
  id: string;
  code: string;
  username: string;
  name: string;
  organizationId?: string;
  storeId?: string;
  roles?: Role[];
}

export interface Role {
  id: string;
  code: string;
  name: string;
}

export interface MenuItem {
  id: string;
  code: string;
  name: string;
  icon?: string;
  path?: string;
  sortOrder: number;
  children?: MenuItem[];
}

interface UserState {
  user: User | null;
  token: string | null;
  menus: MenuItem[];
  setUser: (user: User) => void;
  setToken: (token: string) => void;
  setMenus: (menus: MenuItem[]) => void;
  clearUserInfo: () => void;
  initUserInfo: () => Promise<void>;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      menus: [],
      
      setUser: (user) => set({ user }),
      setToken: (token) => set({ token }),
      setMenus: (menus) => set({ menus }),
      
      clearUserInfo: () => {
        set({ user: null, token: null, menus: [] });
        localStorage.removeItem('user-store');
      },
      
      initUserInfo: async () => {
        const [profileRes, menusRes] = await Promise.all([
          userApi.getProfile(),
          userApi.getMenus(),
        ]);
        
        set({
          user: profileRes.data,
          menus: menusRes.data,
        });
      },
    }),
    {
      name: 'user-store',
      partialize: (state) => ({ token: state.token }),
    }
  )
);
