import { create } from 'zustand'
import { requestRaw } from '@/utils/api'

interface User {
  id: string
  phone: string
  name: string
  role: 'driver' | 'shipper' | 'admin'
  avatar?: string
  created_at?: string
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  profile: any | null
  login: (phone: string, code: string, role: 'driver' | 'shipper') => Promise<void>
  logout: () => void
  loadUser: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),
  profile: null,

  login: async (phone, code, role) => {
    const res = await requestRaw<{ success: boolean; token: string; user: User; error?: string; message?: string }>('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, code, role }),
    })
    if (!res.success || !res.token || !res.user) {
      throw new Error(res.error || res.message || '登录失败，请检查手机号、验证码或角色')
    }
    localStorage.setItem('token', res.token)
    localStorage.setItem('userRole', res.user.role)
    set({ token: res.token, user: res.user, isAuthenticated: true })
  },

  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('userRole')
    set({ token: null, user: null, isAuthenticated: false, profile: null })
  },

  loadUser: async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token || token === 'undefined' || token === 'null') {
        localStorage.removeItem('token')
        localStorage.removeItem('userRole')
        set({ user: null, token: null, isAuthenticated: false, profile: null })
        return
      }
      const res = await requestRaw<{ success: boolean; user: User; profile: any; error?: string; message?: string }>('/api/auth/me', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      })
      if (!res.success || !res.user) {
        localStorage.removeItem('token')
        localStorage.removeItem('userRole')
        set({ token: null, user: null, isAuthenticated: false, profile: null })
        throw new Error(res.error || res.message || '登录已过期')
      }
      localStorage.setItem('userRole', res.user.role)
      set({ user: res.user, profile: res.profile, isAuthenticated: true })
    } catch {
      localStorage.removeItem('token')
      localStorage.removeItem('userRole')
      set({ token: null, user: null, isAuthenticated: false, profile: null })
    }
  },
}))
