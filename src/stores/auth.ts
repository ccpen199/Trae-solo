import { create } from 'zustand'

interface User {
  id: string
  phone: string
  email: string
  nickname: string
  avatar: string
  credit_score: number
  credit_level: string
  help_coins: number
  is_verifier: boolean
  stats?: {
    published_count: number
    accepted_count: number
    completed_count: number
  }
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  login: (phone: string, password: string) => Promise<boolean>
  register: (data: { phone: string; email: string; password: string; nickname: string }) => Promise<boolean>
  logout: () => void
  fetchProfile: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),

  login: async (phone, password) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password }),
      })
      const json = await res.json()
      if (json.success) {
        localStorage.setItem('token', json.data.token)
        set({ user: json.data, token: json.data.token, isAuthenticated: true })
        return true
      }
      return false
    } catch {
      return false
    }
  },

  register: async (data) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (json.success) {
        localStorage.setItem('token', json.data.token)
        set({ user: json.data, token: json.data.token, isAuthenticated: true })
        return true
      }
      return false
    } catch {
      return false
    }
  },

  logout: () => {
    localStorage.removeItem('token')
    set({ user: null, token: null, isAuthenticated: false })
  },

  fetchProfile: async () => {
    const token = get().token
    if (!token) return
    try {
      const res = await fetch('/api/auth/profile', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const json = await res.json()
      if (json.success) {
        set({ user: json.data, isAuthenticated: true })
      }
    } catch {
      // ignore
    }
  },
}))
