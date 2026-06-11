import { create } from 'zustand'
import type { User } from '@/types'
import { api } from '@/lib/api'

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  initialized: boolean
  login: (token: string, user: User) => void
  logout: () => void
  initialize: () => void
  fetchMe: () => Promise<void>
}

const hasStorage = typeof window !== 'undefined'

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  initialized: false,
  login: (token, user) => {
    if (hasStorage) {
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(user))
    }
    set({ token, user, isAuthenticated: true, initialized: true })
  },
  logout: () => {
    if (hasStorage) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    }
    set({ token: null, user: null, isAuthenticated: false })
  },
  initialize: () => {
    if (get().initialized) return
    let authenticated = false
    let userData: User | null = null
    let tokenData: string | null = null
    if (hasStorage) {
      const token = localStorage.getItem('token')
      const userStr = localStorage.getItem('user')
      if (token && userStr) {
        try {
          userData = JSON.parse(userStr) as User
          tokenData = token
          authenticated = true
        } catch {
          localStorage.removeItem('token')
          localStorage.removeItem('user')
        }
      }
    }
    set({ token: tokenData, user: userData, isAuthenticated: authenticated, initialized: true })
  },
  fetchMe: async () => {
    try {
      const user = await api.auth.me()
      if (hasStorage) localStorage.setItem('user', JSON.stringify(user))
      set({ user })
    } catch {
      if (hasStorage) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
      }
      set({ token: null, user: null, isAuthenticated: false })
    }
  },
}))
