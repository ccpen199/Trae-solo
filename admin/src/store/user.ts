import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { UserInfo } from '@/types'

interface UserState {
  token: string;
  refreshToken: string;
  userInfo: UserInfo | null;
  setToken: (token: string, refreshToken: string) => void;
  setUserInfo: (userInfo: UserInfo) => void;
  logout: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      token: '',
      refreshToken: '',
      userInfo: null,
      setToken: (token, refreshToken) => set({ token, refreshToken }),
      setUserInfo: (userInfo) => set({ userInfo }),
      logout: () => set({ token: '', refreshToken: '', userInfo: null })
    }),
    {
      name: 'user-storage',
      partialize: (state) => ({
        token: state.token,
        refreshToken: state.refreshToken,
        userInfo: state.userInfo
      })
    }
  )
)
