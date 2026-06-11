import { create } from 'zustand'

interface AppState {
  sidebarCollapsed: boolean
  toggleSidebar: () => void
  currentPage: string
  setCurrentPage: (page: string) => void
  currentUser: {
    id: string
    name: string
    role: string
    avatar: string
    region: string
  }
}

export const useAppStore = create<AppState>((set) => ({
  sidebarCollapsed: false,
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  currentPage: 'home',
  setCurrentPage: (page) => set({ currentPage: page }),
  currentUser: {
    id: 'D001',
    name: '李晓芳',
    role: '高级直销经理',
    avatar: '',
    region: '华东大区',
  },
}))
