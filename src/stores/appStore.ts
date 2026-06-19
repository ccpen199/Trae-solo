import { create } from 'zustand'

interface UserInfo {
  name: string
  idNumber: string
  role: string
  authMethod: string
  matchScore: number
  riskLevel: string
}

interface AppState {
  currentRole: 'personal' | 'enterprise' | 'admin'
  sidebarCollapsed: boolean
  isLoggedIn: boolean
  userInfo: null | UserInfo
  setCurrentRole: (role: 'personal' | 'enterprise' | 'admin') => void
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
  login: (userInfo: UserInfo) => void
  logout: () => void
}

export const useAppStore = create<AppState>((set) => ({
  currentRole: 'personal',
  sidebarCollapsed: false,
  isLoggedIn: false,
  userInfo: null,
  setCurrentRole: (role) => set({ currentRole: role }),
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  login: (userInfo) => set({
    isLoggedIn: true,
    userInfo,
    currentRole: userInfo.role as 'personal' | 'enterprise' | 'admin',
  }),
  logout: () => set({
    isLoggedIn: false,
    userInfo: null,
    currentRole: 'personal',
  }),
}))
