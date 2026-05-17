import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useStore = create(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isOnline: true,
      hasSeenGuide: false,

      setToken: (token) => set({ token, isLoggedIn: !!token }),
      setUser: (user) => set({ user }),
      setOnline: (isOnline) => set({ isOnline }),
      setHasSeenGuide: (hasSeenGuide) => set({ hasSeenGuide }),

      logout: () => set({ token: null, user: null, isLoggedIn: false }),

      isLoggedIn: false,
    }),
    {
      name: 'library-storage',
    }
  )
)

export default useStore
