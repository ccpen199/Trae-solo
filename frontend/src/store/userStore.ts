import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  id: string
  username: string
  name: string
  role: string
}

interface UserStore {
  user: User | null
  token: string | null
  setUser: (user: User, token: string) => void
  logout: () => void
  isAuthenticated: () => boolean
}

export const useUserStore = create<UserStore>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      setUser: (user, token) => {
        set({ user, token })
      },
      logout: () => {
        set({ user: null, token: null })
      },
      isAuthenticated: () => {
        return !!get().token
      },
    }),
    {
      name: 'hotel-pms-user-storage',
    }
  )
)
