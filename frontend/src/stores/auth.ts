import { create } from 'zustand'
import { api } from '@/utils/api'

interface User {
  id: number
  username: string
  real_name: string
  phone: string
  email: string
  role: 'shipper' | 'driver' | 'carrier' | 'admin'
  company_name: string
  credit_score: number
  status: string
}

interface AuthState {
  token: string | null
  user: User | null
  loading: boolean
  error: string | null
  login: (username: string, password: string) => Promise<void>
  register: (data: Record<string, string>) => Promise<void>
  fetchProfile: () => Promise<void>
  logout: () => void
  clearError: () => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: localStorage.getItem('token'),
  user: null,
  loading: false,
  error: null,

  login: async (username, password) => {
    set({ loading: true, error: null })
    try {
      const res: any = await api.post('/api/auth/login', { username, password })
      localStorage.setItem('token', res.token)
      set({ token: res.token, user: res.user, loading: false, error: null })
    } catch (e: any) {
      const msg = e?.message || '登录失败'
      set({ loading: false, error: msg })
      throw e
    }
  },

  register: async (data) => {
    set({ loading: true, error: null })
    try {
      const res: any = await api.post('/api/auth/register', data)
      localStorage.setItem('token', res.token)
      set({ token: res.token, user: res.user, loading: false, error: null })
    } catch (e: any) {
      const msg = e?.message || '注册失败'
      set({ loading: false, error: msg })
      throw e
    }
  },

  fetchProfile: async () => {
    const { token } = get()
    if (!token) return
    try {
      const res: any = await api.get('/api/auth/profile')
      set({ user: res })
    } catch (e) {
    }
  },

  logout: () => {
    localStorage.removeItem('token')
    set({ token: null, user: null, error: null })
  },

  clearError: () => set({ error: null }),
}))
