import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useAuthStore = create(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      
      login: (token, user) => {
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
          isAuthenticated: false
        })
      },
      
      updateUser: (userData) => {
        set((state) => ({
          user: { ...state.user, ...userData }
        }))
      },
      
      hasRole: (role) => {
        const { user } = get()
        if (!user) return false
        if (role === 'admin') return user.role === 'admin'
        if (role === 'teacher') return ['teacher', 'admin'].includes(user.role)
        if (role === 'ta') return ['ta', 'teacher', 'admin'].includes(user.role)
        if (role === 'student') return true
        return false
      }
    }),
    {
      name: 'auth-storage'
    }
  )
)

export default useAuthStore
