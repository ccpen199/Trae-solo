import { create } from 'zustand'

const useAppStore = create((set, get) => ({
  sidebarCollapsed: false,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),

  notifications: [],
  addNotification: (msg, type = 'info') =>
    set((s) => ({
      notifications: [...s.notifications.slice(-9), { id: Date.now(), msg, type }],
    })),
  removeNotification: (id) =>
    set((s) => ({ notifications: s.notifications.filter((n) => n.id !== id) })),

  currentUser: { name: '管理员', role: 'admin', avatar: null },
}))

export default useAppStore
