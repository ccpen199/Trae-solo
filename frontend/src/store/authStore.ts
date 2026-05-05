import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface Developer {
  id: string
  name: string
  email: string
  level: string
  isVerified: boolean
}

interface AuthState {
  token: string | null
  developer: Developer | null
  isAuthenticated: boolean
  setToken: (token: string) => void
  setDeveloper: (developer: Developer) => void
  logout: () => void
  init: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      developer: null,
      isAuthenticated: false,
      
      setToken: (token) => set({ token, isAuthenticated: true }),
      
      setDeveloper: (developer) => set({ developer }),
      
      logout: () => set({ 
        token: null, 
        developer: null, 
        isAuthenticated: false 
      }),
      
      init: () => {
        const token = localStorage.getItem('auth-storage')
        if (!token) {
          set({ isAuthenticated: false })
        }
      }
    }),
    {
      name: 'auth-storage',
    }
  )
)
