import { create } from 'zustand'
import { apiFetch } from '@/lib/api'

interface AuthState {
  user: any | null
  isLoggedIn: boolean
  login: (phone: string, password: string) => Promise<void>
  logout: () => void
  fetchMe: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoggedIn: false,

  login: async (phone: string, password: string) => {
    const data = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ phone, password }),
    })
    const user = data.user || data
    localStorage.setItem('auth-user', JSON.stringify(user))
    set({ user, isLoggedIn: true })
  },

  logout: () => {
    localStorage.removeItem('auth-user')
    set({ user: null, isLoggedIn: false })
  },

  fetchMe: async () => {
    try {
      const data = await apiFetch('/auth/me')
      const user = data.user || data
      localStorage.setItem('auth-user', JSON.stringify(user))
      set({ user, isLoggedIn: true })
    } catch {
      localStorage.removeItem('auth-user')
      set({ user: null, isLoggedIn: false })
    }
  },
}))
