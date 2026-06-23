import { create } from 'zustand'
import type { Rider } from '@shared/types'
import { mockRider } from '@mock/data'

interface UserStore {
  currentRider: Rider | null
  isLoggedIn: boolean
  setCurrentRider: (rider: Rider) => void
  logout: () => void
  updatePackageBalance: (amount: number) => void
}

export const useUserStore = create<UserStore>((set) => ({
  currentRider: mockRider,
  isLoggedIn: true,
  setCurrentRider: (rider) => set({ currentRider: rider }),
  logout: () => set({ currentRider: null, isLoggedIn: false }),
  updatePackageBalance: (amount) =>
    set((state) => ({
      currentRider: state.currentRider
        ? {
            ...state.currentRider,
            package_balance: Math.max(0, state.currentRider.package_balance + amount),
          }
        : null,
    })),
}))
