import { create } from 'zustand'

interface AppState {
  currentUserId: string
  currentUserRole: 'user' | 'operator' | 'admin'
  sidebarCollapsed: boolean
  selectedStationId: string | null
  currentChargingOrder: string | null
  setSidebarCollapsed: (collapsed: boolean) => void
  setSelectedStationId: (id: string | null) => void
  setCurrentChargingOrder: (id: string | null) => void
}

export const useAppStore = create<AppState>((set) => ({
  currentUserId: 'user-001',
  currentUserRole: 'user',
  sidebarCollapsed: false,
  selectedStationId: null,
  currentChargingOrder: null,
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  setSelectedStationId: (id) => set({ selectedStationId: id }),
  setCurrentChargingOrder: (id) => set({ currentChargingOrder: id }),
}))
