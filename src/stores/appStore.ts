import { create } from 'zustand'

interface AppState {
  sidebarOpen: boolean
  onlineStatus: boolean
  syncing: boolean
  toggleSidebar: () => void
  setOnlineStatus: (status: boolean) => void
  setSyncing: (status: boolean) => void
}

export const useAppStore = create<AppState>((set) => ({
  sidebarOpen: true,
  onlineStatus: navigator.onLine,
  syncing: false,

  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setOnlineStatus: (status) => set({ onlineStatus: status }),
  setSyncing: (status) => set({ syncing: status }),
}))
