import { create } from 'zustand'
import type { UserInfo } from '@/types'

interface AuthState {
  token: string | null
  userInfo: UserInfo | null
  login: (token: string, userInfo: UserInfo) => void
  logout: () => void
  setUserInfo: (userInfo: UserInfo) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  token: localStorage.getItem('admin_token'),
  userInfo: localStorage.getItem('admin_user')
    ? JSON.parse(localStorage.getItem('admin_user')!)
    : null,
  login: (token, userInfo) => {
    localStorage.setItem('admin_token', token)
    localStorage.setItem('admin_user', JSON.stringify(userInfo))
    set({ token, userInfo })
  },
  logout: () => {
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_user')
    set({ token: null, userInfo: null })
  },
  setUserInfo: (userInfo) => {
    localStorage.setItem('admin_user', JSON.stringify(userInfo))
    set({ userInfo })
  }
}))
