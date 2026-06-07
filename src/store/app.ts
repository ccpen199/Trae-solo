import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type ThemeMode = 'light' | 'dark' | 'system'
type LayoutMode = 'side' | 'top' | 'mix'
type Language = 'zh-CN' | 'en-US'

interface AppState {
  theme: ThemeMode
  layout: LayoutMode
  language: Language
  sidebarCollapsed: boolean
  breadcrumbs: string[]
  currentPage: string
  loading: boolean
  notifications: NotificationItem[]
  unreadCount: number

  setTheme: (theme: ThemeMode) => void
  setLayout: (layout: LayoutMode) => void
  setLanguage: (language: Language) => void
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
  setBreadcrumbs: (breadcrumbs: string[]) => void
  setCurrentPage: (page: string) => void
  setLoading: (loading: boolean) => void
  addNotification: (notification: Omit<NotificationItem, 'id' | 'createdAt' | 'read'>) => void
  markNotificationRead: (id: string) => void
  markAllNotificationsRead: () => void
  clearNotifications: () => void
}

export interface NotificationItem {
  id: string
  type: 'info' | 'success' | 'warning' | 'error'
  title: string
  content: string
  read: boolean
  createdAt: string
  link?: string
}

const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      theme: 'light',
      layout: 'side',
      language: 'zh-CN',
      sidebarCollapsed: false,
      breadcrumbs: [],
      currentPage: '/',
      loading: false,
      notifications: [],
      unreadCount: 0,

      setTheme: (theme: ThemeMode) => {
        set({ theme })
        if (theme === 'dark') {
          document.documentElement.classList.add('dark')
        } else if (theme === 'light') {
          document.documentElement.classList.remove('dark')
        } else {
          const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
          document.documentElement.classList.toggle('dark', isDark)
        }
      },

      setLayout: (layout: LayoutMode) => {
        set({ layout })
      },

      setLanguage: (language: Language) => {
        set({ language })
        document.documentElement.lang = language
      },

      toggleSidebar: () => {
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed }))
      },

      setSidebarCollapsed: (collapsed: boolean) => {
        set({ sidebarCollapsed: collapsed })
      },

      setBreadcrumbs: (breadcrumbs: string[]) => {
        set({ breadcrumbs })
      },

      setCurrentPage: (page: string) => {
        set({ currentPage: page })
      },

      setLoading: (loading: boolean) => {
        set({ loading })
      },

      addNotification: (notification) => {
        const newNotification: NotificationItem = {
          ...notification,
          id: generateId(),
          read: false,
          createdAt: new Date().toISOString()
        }
        set((state) => ({
          notifications: [newNotification, ...state.notifications],
          unreadCount: state.unreadCount + 1
        }))
      },

      markNotificationRead: (id: string) => {
        set((state) => {
          const notifications = state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          )
          const unreadCount = notifications.filter((n) => !n.read).length
          return { notifications, unreadCount }
        })
      },

      markAllNotificationsRead: () => {
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
          unreadCount: 0
        }))
      },

      clearNotifications: () => {
        set({ notifications: [], unreadCount: 0 })
      }
    }),
    {
      name: 'app-storage',
      partialize: (state) => ({
        theme: state.theme,
        layout: state.layout,
        language: state.language,
        sidebarCollapsed: state.sidebarCollapsed,
        notifications: state.notifications,
        unreadCount: state.unreadCount
      })
    }
  )
)

export const useApp = () => {
  const {
    theme,
    layout,
    language,
    sidebarCollapsed,
    breadcrumbs,
    currentPage,
    loading,
    notifications,
    unreadCount,
    setTheme,
    setLayout,
    setLanguage,
    toggleSidebar,
    setSidebarCollapsed,
    setBreadcrumbs,
    setCurrentPage,
    setLoading,
    addNotification,
    markNotificationRead,
    markAllNotificationsRead,
    clearNotifications
  } = useAppStore()

  return {
    theme,
    layout,
    language,
    sidebarCollapsed,
    breadcrumbs,
    currentPage,
    loading,
    notifications,
    unreadCount,
    setTheme,
    setLayout,
    setLanguage,
    toggleSidebar,
    setSidebarCollapsed,
    setBreadcrumbs,
    setCurrentPage,
    setLoading,
    addNotification,
    markNotificationRead,
    markAllNotificationsRead,
    clearNotifications
  }
}

export default useAppStore
