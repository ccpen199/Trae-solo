import { create } from 'zustand'
import type { Location, CategoryType } from '@/types'

interface AppState {
  location: Location
  setLocation: (location: Location) => void
  selectedCategory: CategoryType | null
  setSelectedCategory: (category: CategoryType | null) => void
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  voiceSearchOpen: boolean
  setVoiceSearchOpen: (open: boolean) => void
}

export const useAppStore = create<AppState>((set) => ({
  location: { province: '北京市', city: '北京市', district: '朝阳区' },
  setLocation: (location) => set({ location }),
  selectedCategory: null,
  setSelectedCategory: (category) => set({ selectedCategory: category }),
  sidebarOpen: false,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  voiceSearchOpen: false,
  setVoiceSearchOpen: (open) => set({ voiceSearchOpen: open }),
}))
