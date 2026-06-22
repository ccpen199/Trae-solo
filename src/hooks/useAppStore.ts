import { create } from 'zustand'

interface AppState {
  currentBuildingId: string | null
  setCurrentBuildingId: (id: string | null) => void
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  searchKeyword: string
  setSearchKeyword: (keyword: string) => void
}

export const useAppStore = create<AppState>((set) => ({
  currentBuildingId: null,
  setCurrentBuildingId: (id) => set({ currentBuildingId: id }),
  sidebarOpen: false,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  searchKeyword: '',
  setSearchKeyword: (keyword) => set({ searchKeyword: keyword }),
}))
