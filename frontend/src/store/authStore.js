import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      permissions: null,
      
      login: (user, token, permissions) => {
        set({ user, token, isAuthenticated: true, permissions })
      },
      
      logout: () => {
        set({ user: null, token: null, isAuthenticated: false, permissions: null })
      },
      
      updateUser: (userData) => {
        set({ user: { ...get().user, ...userData } })
      },
    }),
    {
      name: 'auth-storage',
    }
  )
)

export default useAuthStore
