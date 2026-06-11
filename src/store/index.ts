import { create } from 'zustand'
import type { User } from '@/types'

interface AppState {
  currentUser: User | null
  sidebarCollapsed: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => void
  toggleSidebar: () => void
}

export const useAppStore = create<AppState>((set) => ({
  currentUser: null,
  sidebarCollapsed: false,
  login: async (username: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })
    if (!res.ok) throw new Error('登录失败')
    const data = await res.json()
    localStorage.setItem('token', data.token)
    set({ currentUser: data.user })
  },
  logout: () => {
    localStorage.removeItem('token')
    set({ currentUser: null })
  },
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
}))
