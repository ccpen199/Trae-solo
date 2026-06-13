import { create } from 'zustand'
import { apiPost, apiGet } from '@/utils/api'

interface User {
  id: number
  phone: string
  realName: string
  idCard: string
  role: 'user' | 'organizer' | 'admin'
  creditScore: number
}

interface AuthState {
  user: User | null
  token: string | null
  isLoggedIn: boolean
  loading: boolean
  error: string | null
  login: (phone: string, password: string) => Promise<void>
  register: (data: { phone: string; password: string; realName: string; idCard: string }) => Promise<void>
  logout: () => void
  fetchMe: () => Promise<void>
  setError: (e: string | null) => void
}

const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('token'),
  isLoggedIn: !!localStorage.getItem('token'),
  loading: false,
  error: null,

  login: async (phone, password) => {
    set({ loading: true, error: null })
    try {
      const data = await apiPost<any>('/auth/login', { phone, password })
      localStorage.setItem('token', data.token)
      set({ user: data.user, token: data.token, isLoggedIn: true, loading: false })
    } catch (e: any) {
      set({ error: e.message, loading: false })
      throw e
    }
  },

  register: async (d) => {
    set({ loading: true, error: null })
    try {
      const data = await apiPost<any>('/auth/register', d)
      localStorage.setItem('token', data.token)
      set({ user: data.user, token: data.token, isLoggedIn: true, loading: false })
    } catch (e: any) {
      set({ error: e.message, loading: false })
      throw e
    }
  },

  logout: () => {
    localStorage.removeItem('token')
    set({ user: null, token: null, isLoggedIn: false })
  },

  fetchMe: async () => {
    try {
      const user = await apiGet<User>('/auth/me')
      set({ user })
    } catch (e) {
      localStorage.removeItem('token')
      set({ user: null, isLoggedIn: false, token: null })
    }
  },

  setError: (e) => set({ error: e }),
}))

export default useAuthStore
