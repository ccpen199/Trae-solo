import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User, Lawyer, AdminUser } from '@/types'
import { mockApi } from '@/mock/api'

type CurrentUser = User | Lawyer | AdminUser

interface AuthState {
  currentUser: CurrentUser | null
  login: (type: 'user' | 'lawyer' | 'admin', phone: string, password: string) => Promise<boolean>
  logout: () => void
  isAuthenticated: boolean
  userType: 'user' | 'lawyer' | 'admin' | null
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      currentUser: null,
      isAuthenticated: false,
      userType: null,

      login: async (type, phone, password) => {
        try {
          const user = await mockApi.login({ role: type, phone, password })
          set({
            currentUser: user,
            isAuthenticated: true,
            userType: user.role,
          })
          return true
        } catch {
          return false
        }
      },

      logout: () => {
        set({
          currentUser: null,
          isAuthenticated: false,
          userType: null,
        })
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        currentUser: state.currentUser,
        isAuthenticated: state.isAuthenticated,
        userType: state.userType,
      }),
    }
  )
)
