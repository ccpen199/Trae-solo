import { create } from 'zustand'

interface AppState {
  currentUser: any
  sidebarOpen: boolean
  activeMenu: string
  theme: 'dark' | 'light'
  notifications: any[]

  setCurrentUser: (user: any) => void
  setSidebarOpen: (open: boolean) => void
  setActiveMenu: (menu: string) => void
  toggleSidebar: () => void
  addNotification: (notification: any) => void
  removeNotification: (id: string) => void
  clearNotifications: () => void
}

export const useAppStore = create<AppState>((set, get) => ({
  currentUser: null,
  sidebarOpen: true,
  activeMenu: 'dashboard',
  theme: 'dark',
  notifications: [],

  setCurrentUser: (user) => set({ currentUser: user }),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  setActiveMenu: (menu) => set({ activeMenu: menu }),
  toggleSidebar: () => set({ sidebarOpen: !get().sidebarOpen }),
  addNotification: (notification) => set((state) => ({
    notifications: [...state.notifications, { id: Date.now().toString(), ...notification }]
  })),
  removeNotification: (id) => set((state) => ({
    notifications: state.notifications.filter(n => n.id !== id)
  })),
  clearNotifications: () => set({ notifications: [] }),
}))
