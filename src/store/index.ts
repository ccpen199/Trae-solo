import { create } from 'zustand'
import type { CityName } from '@/types'

interface StoreState {
  currentCity: CityName
  setCurrentCity: (city: CityName) => void
  sidebarCollapsed: boolean
  toggleSidebar: () => void
}

export const useStore = create<StoreState>((set) => ({
  currentCity: '成都',
  setCurrentCity: (city) => set({ currentCity: city }),
  sidebarCollapsed: false,
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
}))
