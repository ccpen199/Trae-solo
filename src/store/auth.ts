import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User, LoginResponse } from '../types'
import { setToken, removeToken } from '../api/client'

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (data: LoginResponse) => void
  logout: () => void
  updateUser: (user: Partial<User>) => void
  setLoading: (loading: boolean) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      login: (data: LoginResponse) => {
        setToken(data.token)
        set({
          user: data.user,
          token: data.token,
          isAuthenticated: true
        })
      },

      logout: () => {
        removeToken()
        set({
          user: null,
          token: null,
          isAuthenticated: false
        })
      },

      updateUser: (user: Partial<User>) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...user } : null
        }))
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading })
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
)

export const useAuth = () => {
  const { user, token, isAuthenticated, isLoading, login, logout, updateUser, setLoading } = useAuthStore()
  
  const hasRole = (role: string | string[]): boolean => {
    if (!user) return false
    if (Array.isArray(role)) {
      return role.includes(user.role)
    }
    return user.role === role
  }

  const isAdmin = (): boolean => hasRole('admin')
  const isAuditor = (): boolean => hasRole(['auditor', 'admin'])
  const isUser = (): boolean => hasRole(['user', 'auditor', 'admin'])

  return {
    user,
    token,
    isAuthenticated,
    isLoading,
    login,
    logout,
    updateUser,
    setLoading,
    hasRole,
    isAdmin,
    isAuditor,
    isUser
  }
}

export default useAuthStore
