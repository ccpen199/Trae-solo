import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AuthState {
  token: string | null
  user: any | null
  login: (token: string, user: any) => void
  logout: () => void
  getToken: () => string | null
  isAuthenticated: () => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      login: (token: string, user: any) => set({ token, user }),
      logout: () => set({ token: null, user: null }),
      getToken: () => get().token,
      isAuthenticated: () => !!get().token,
    }),
    {
      name: 'delivery-auth-storage',
    }
  )
)
