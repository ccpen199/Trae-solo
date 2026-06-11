import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface User {
  id: number
  phone: string
  role: 'brand' | 'entrepreneur' | 'admin'
  name: string
  avatar?: string
  status: string
  profile?: any
}

interface AuthState {
  user: User | null
  token: string | null
  login: (phone: string, password: string) => Promise<any>
  logout: () => void
  updateUser: (user: User) => void
}

const API_BASE = '/api'

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      login: async (phone: string, password: string) => {
        const response = await fetch(`${API_BASE}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone, password }),
        })
        const data = await response.json()
        if (data.success) {
          set({ user: data.data, token: data.data.id.toString() })
        }
        return data
      },
      logout: () => {
        set({ user: null, token: null })
      },
      updateUser: (user: User) => {
        set({ user })
      },
    }),
    {
      name: 'auth-storage',
    }
  )
)
