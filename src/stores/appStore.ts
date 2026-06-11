import { create } from 'zustand'

interface Notification {
  id: string
  title: string
  message: string
  type: 'info' | 'warning' | 'error'
  read: boolean
  createdAt: string
}

interface AppState {
  sidebarCollapsed: boolean
  currentOrgId: string | null
  currentOrgName: string | null
  notifications: Notification[]
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
  setCurrentOrg: (id: string, name: string) => void
  addNotification: (n: Omit<Notification, 'id' | 'read' | 'createdAt'>) => void
  markNotificationRead: (id: string) => void
  unreadCount: () => number
}

export const useAppStore = create<AppState>((set, get) => ({
  sidebarCollapsed: false,
  currentOrgId: null,
  currentOrgName: null,
  notifications: [],
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  setCurrentOrg: (id, name) => set({ currentOrgId: id, currentOrgName: name }),
  addNotification: (n) => set((s) => ({
    notifications: [
      { ...n, id: Date.now().toString(), read: false, createdAt: new Date().toISOString() },
      ...s.notifications,
    ],
  })),
  markNotificationRead: (id) => set((s) => ({
    notifications: s.notifications.map((n) => n.id === id ? { ...n, read: true } : n),
  })),
  unreadCount: () => get().notifications.filter((n) => !n.read).length,
}))
