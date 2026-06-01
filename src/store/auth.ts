import { create } from 'zustand'
import { api } from '@/utils/api'

interface User {
  id: number
  username: string
  name: string
  role: string
  phone: string
}

interface AuthState {
  user: User | null
  token: string | null
  login: (username: string, password: string) => Promise<void>
  logout: () => void
  loadUser: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => {
  const storedToken = localStorage.getItem('token')
  return {
    user: null,
    token: storedToken,
    async login(username: string, password: string) {
      const res = await api.post<{ token: string; user: User }>('/api/auth/login', { username, password })
      localStorage.setItem('token', res.token)
      set({ token: res.token, user: res.user })
    },
    logout() {
      localStorage.removeItem('token')
      set({ user: null, token: null })
    },
    async loadUser() {
      try {
        const res = await api.get<{ user: User }>('/api/auth/me')
        set({ user: res.user })
      } catch {
        localStorage.removeItem('token')
        set({ user: null, token: null })
      }
    },
  }
})

const token = localStorage.getItem('token')
if (token) {
  useAuthStore.getState().loadUser()
}
