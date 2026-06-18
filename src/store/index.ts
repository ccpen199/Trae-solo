import { create } from 'zustand'

interface User {
  id: string
  name: string
  role: string
  avatar?: string
  identityType?: string
  insuredLocation?: string
  insuredYears?: number
  insuredMonths?: number
  todoCount?: number
  processingCount?: number
  monthlyBenefit?: number
}

interface Notification {
  id: string
  title: string
  message: string
  read: boolean
  createdAt: string
}

interface AppState {
  user: User | null
  sidebarCollapsed: boolean
  notifications: Notification[]
  setUser: (user: User | null) => void
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
  addNotification: (notification: Omit<Notification, 'id' | 'read' | 'createdAt'>) => void
  markNotificationRead: (id: string) => void
  clearNotifications: () => void
}

export const useStore = create<AppState>((set) => ({
  user: null,
  sidebarCollapsed: false,
  notifications: [],
  setUser: (user) => set({ user }),
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  addNotification: (notification) =>
    set((state) => ({
      notifications: [
        { ...notification, id: crypto.randomUUID(), read: false, createdAt: new Date().toISOString() },
        ...state.notifications,
      ],
    })),
  markNotificationRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
    })),
  clearNotifications: () => set({ notifications: [] }),
}))
