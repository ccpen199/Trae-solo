import { create } from 'zustand'

interface AppState {
  sidebarCollapsed: boolean
  toggleSidebar: () => void
  searchQuery: string
  setSearchQuery: (q: string) => void
  selectedField: string
  setSelectedField: (f: string) => void
}

export const useAppStore = create<AppState>((set) => ({
  sidebarCollapsed: false,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  searchQuery: '',
  setSearchQuery: (q) => set({ searchQuery: q }),
  selectedField: '',
  setSelectedField: (f) => set({ selectedField: f }),
}))
