import { create } from 'zustand'
import { api } from '@/lib/api'

interface User {
  id: number
  username: string
  real_name: string
  role: string
  avatar: string
  phone: string
  region_code: string
  status: string
  created_at: string
}

interface AuthState {
  user: User | null
  token: string | null
  isLoggedIn: boolean
  login: (username: string, password: string) => Promise<void>
  register: (username: string, password: string, phone?: string) => Promise<void>
  logout: () => void
  fetchProfile: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('token'),
  isLoggedIn: !!localStorage.getItem('token'),
  login: async (username, password) => {
    const data = await api.post<{ token: string; user: User }>('/auth/login', { username, password })
    localStorage.setItem('token', data.token)
    set({ token: data.token, user: data.user, isLoggedIn: true })
  },
  register: async (username, password, phone) => {
    await api.post('/auth/register', { username, password, phone })
  },
  logout: () => {
    localStorage.removeItem('token')
    set({ token: null, user: null, isLoggedIn: false })
  },
  fetchProfile: async () => {
    try {
      const user = await api.get<User>('/auth/profile')
      set({ user })
    } catch {
      localStorage.removeItem('token')
      set({ token: null, user: null, isLoggedIn: false })
    }
  },
}))
