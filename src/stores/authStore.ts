import { create } from 'zustand'
import { apiFetch } from '@/lib/api'

interface AuthState {
  user: any | null
  isLoggedIn: boolean
  loading: boolean
  error: string | null
  login: (phone: string, password: string) => Promise<void>
  logout: () => void
  fetchMe: () => Promise<void>
  verifyRealName: (data: { real_name: string; id_number: string; id_card_images?: string[] }) => Promise<void>
  clearError: () => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoggedIn: false,
  loading: false,
  error: null,

  login: async (phone: string, password: string) => {
    set({ loading: true, error: null })
    try {
      const data = await apiFetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ phone, password }),
      })
      const user = data.data?.data?.user || data.data?.data || data.data?.user || data.data || data.user || data
      localStorage.setItem('auth-user', JSON.stringify(user))
      set({ user, isLoggedIn: true })
    } catch (err: any) {
      set({ error: err.message })
      throw err
    } finally {
      set({ loading: false })
    }
  },

  logout: () => {
    localStorage.removeItem('auth-user')
    set({ user: null, isLoggedIn: false })
  },

  fetchMe: async () => {
    set({ loading: true })
    try {
      const data = await apiFetch('/auth/me')
      const user = data.data?.data?.user || data.data?.data || data.data?.user || data.data || data.user || data
      localStorage.setItem('auth-user', JSON.stringify(user))
      set({ user, isLoggedIn: true })
    } catch {
      localStorage.removeItem('auth-user')
      set({ user: null, isLoggedIn: false })
    } finally {
      set({ loading: false })
    }
  },

  verifyRealName: async (d: any) => {
    set({ loading: true, error: null })
    try {
      await apiFetch('/auth/verify', {
        method: 'POST',
        body: JSON.stringify(d),
      })
      await get().fetchMe()
    } catch (err: any) {
      set({ error: err.message })
      throw err
    } finally {
      set({ loading: false })
    }
  },

  clearError: () => {
    set({ error: null })
  },
}))
