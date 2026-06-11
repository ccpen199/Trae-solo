import { create } from 'zustand'
import type { UserRole } from '@/types'

interface AppState {
  currentRole: UserRole
  setCurrentRole: (role: UserRole) => void
  sidebarCollapsed: boolean
  toggleSidebar: () => void
  diagnosisMode: boolean
  setDiagnosisMode: (v: boolean) => void
}

export const useAppStore = create<AppState>((set) => ({
  currentRole: 'user',
  setCurrentRole: (role) => set({ currentRole: role }),
  sidebarCollapsed: false,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  diagnosisMode: false,
  setDiagnosisMode: (v) => set({ diagnosisMode: v }),
}))
