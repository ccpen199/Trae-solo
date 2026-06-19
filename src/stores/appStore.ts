import { create } from 'zustand'

interface AppState {
  currentRole: 'personal' | 'enterprise' | 'admin'
  sidebarCollapsed: boolean
  setCurrentRole: (role: 'personal' | 'enterprise' | 'admin') => void
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
}

export const useAppStore = create<AppState>((set) => ({
  currentRole: 'personal',
  sidebarCollapsed: false,
  setCurrentRole: (role) => set({ currentRole: role }),
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
}))
