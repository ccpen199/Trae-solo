import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface UserInfo {
  id: string;
  username: string;
  realName: string;
  avatar: string;
  phone: string;
  email: string;
  department: string;
  role: string;
  roleId: string;
  permissions: string[];
}

interface UserState {
  token: string;
  userInfo: UserInfo | null;
  setToken: (token: string) => void;
  setUserInfo: (userInfo: UserInfo) => void;
  clearUser: () => void;
  updateUserInfo: (partial: Partial<UserInfo>) => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      token: '',
      userInfo: null,
      setToken: (token) => set({ token }),
      setUserInfo: (userInfo) => set({ userInfo }),
      clearUser: () => set({ token: '', userInfo: null }),
      updateUserInfo: (partial) =>
        set((state) => ({
          userInfo: state.userInfo ? { ...state.userInfo, ...partial } : null,
        })),
    }),
    {
      name: 'user-storage',
      partialize: (state) => ({
        token: state.token,
        userInfo: state.userInfo,
      }),
    }
  )
);
