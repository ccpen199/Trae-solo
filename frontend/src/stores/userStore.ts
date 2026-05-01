import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface UserInfo {
  id: string
  username: string
  role: string
  name?: string
  phone?: string
  email?: string
  isActive?: boolean
  memberInfo?: {
    memberNo: string
    level: number
    totalConsumption: number
    totalPointsEarned: number
    totalPointsSpent: number
    totalPointsExpired: number
  }
}

interface UserState {
  token: string | null
  user: UserInfo | null
  setToken: (token: string) => void
  setUser: (user: UserInfo) => void
  logout: () => void
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      setToken: (token) => set({ token }),
      setUser: (user) => set({ user }),
      logout: () => set({ token: null, user: null }),
    }),
    {
      name: 'user-storage',
    }
  )
)
