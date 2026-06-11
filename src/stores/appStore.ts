import { create } from 'zustand'

interface User {
  id: string
  name: string
  role: 'consumer' | 'admin' | 'technician'
  phone: string
}

interface Order {
  id: string
  status: string
  device: string
  createdAt: string
}

interface AppState {
  user: User | null
  currentOrder: Order | null
  sidebarCollapsed: boolean
  theme: 'dark' | 'light'
  setUser: (user: User | null) => void
  setCurrentOrder: (order: Order | null) => void
  toggleSidebar: () => void
  setTheme: (theme: 'dark' | 'light') => void
}

export const useAppStore = create<AppState>((set) => ({
  user: { id: '1', name: '管理员', role: 'admin', phone: '13800138000' },
  currentOrder: null,
  sidebarCollapsed: false,
  theme: 'dark',
  setUser: (user) => set({ user }),
  setCurrentOrder: (order) => set({ currentOrder: order }),
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setTheme: (theme) => set({ theme }),
}))
