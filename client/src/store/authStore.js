import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useAuthStore = create(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      menus: [],
      buttonPermissions: [],
      isAuthenticated: false,

      setToken: (token) => set({ token, isAuthenticated: !!token }),
      
      setUser: (user) => set({ user }),
      
      setMenus: (menus) => set({ menus }),
      
      setButtonPermissions: (permissions) => set({ buttonPermissions: permissions }),
      
      login: (data) => {
        const { token, user } = data
        set({
          token,
          user,
          isAuthenticated: true
        })
      },
      
      logout: () => {
        set({
          token: null,
          user: null,
          menus: [],
          buttonPermissions: [],
          isAuthenticated: false
        })
      },
      
      hasPermission: (permissionCode) => {
        const { buttonPermissions, user } = get()
        if (user?.isRoot) return true
        return buttonPermissions.includes(permissionCode)
      },
      
      hasAnyPermission: (permissionCodes) => {
        const { buttonPermissions, user } = get()
        if (user?.isRoot) return true
        return permissionCodes.some(code => buttonPermissions.includes(code))
      },
      
      hasAllPermissions: (permissionCodes) => {
        const { buttonPermissions, user } = get()
        if (user?.isRoot) return true
        return permissionCodes.every(code => buttonPermissions.includes(code))
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
)

export default useAuthStore
