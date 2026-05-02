import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      permissions: [],
      isAuthenticated: false,

      setAuth: (user, token, permissions = []) => {
        set({
          user,
          token,
          permissions,
          isAuthenticated: true,
        })
      },

      clearAuth: () => {
        set({
          user: null,
          token: null,
          permissions: [],
          isAuthenticated: false,
        })
      },

      updateUser: (user) => {
        set({ user })
      },

      hasPermission: (permissionCode) => {
        const { permissions, user } = get()
        if (user?.role_code === 'ADMIN') return true
        return permissions.some(p => p.code === permissionCode)
      },

      hasRole: (...roleCodes) => {
        const { user } = get()
        if (!user) return false
        return roleCodes.includes(user.role_code)
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        permissions: state.permissions,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)

export const useAppStore = create((set, get) => ({
  collapsed: false,
  currentMenu: 'dashboard',
  notifications: [],
  unreadCount: 0,
  todoCount: 0,

  toggleCollapsed: () => set((state) => ({ collapsed: !state.collapsed })),
  
  setCurrentMenu: (menu) => set({ currentMenu: menu }),
  
  setNotifications: (notifications, unreadCount) => set({ 
    notifications, 
    unreadCount: unreadCount || 0 
  }),
  
  setTodoCount: (count) => set({ todoCount: count }),
  
  incrementUnread: () => set((state) => ({ unreadCount: state.unreadCount + 1 })),
  
  decrementUnread: () => set((state) => ({ unreadCount: Math.max(0, state.unreadCount - 1) })),
}))
