import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { UserInfo, MenuItem, login, getCurrentUser, LoginParams } from '../api/auth'

interface AuthState {
  token: string | null
  user: UserInfo | null
  roles: string[]
  permissions: string[]
  menus: MenuItem[]
  isInitialized: boolean

  setToken: (token: string) => void
  setUser: (user: UserInfo | null) => void
  setRoles: (roles: string[]) => void
  setPermissions: (permissions: string[]) => void
  setMenus: (menus: MenuItem[]) => void
  setInitialized: (initialized: boolean) => void

  login: (params: LoginParams) => Promise<void>
  logout: () => void
  fetchCurrentUser: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      roles: [],
      permissions: [],
      menus: [],
      isInitialized: false,

      setToken: (token) => set({ token }),
      setUser: (user) => set({ user }),
      setRoles: (roles) => set({ roles }),
      setPermissions: (permissions) => set({ permissions }),
      setMenus: (menus) => set({ menus }),
      setInitialized: (initialized) => set({ isInitialized: initialized }),

      login: async (params: LoginParams) => {
        const result = await login(params)
        localStorage.setItem('token', result.token)
        set({
          token: result.token,
          user: result.user,
          roles: result.roles,
          permissions: result.permissions,
          menus: result.menus,
          isInitialized: true,
        })
      },

      logout: () => {
        localStorage.removeItem('token')
        set({
          token: null,
          user: null,
          roles: [],
          permissions: [],
          menus: [],
          isInitialized: false,
        })
      },

      fetchCurrentUser: async () => {
        const result = await getCurrentUser()
        set({
          user: result.user,
          roles: result.roles,
          permissions: result.permissions,
          menus: result.menus,
          isInitialized: true,
        })
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        token: state.token,
        user: state.user,
      }),
    }
  )
)
