import { create } from 'zustand'

export interface User {
  id: number
  username: string
  name: string
  phone?: string
  role: 'director' | 'manager' | 'agent'
  orgId: number
  certStatus: 'pending' | 'certified' | 'rejected'
  realName?: string
  avatar?: string
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  login: (user: User, token: string) => void
  logout: () => void
  setUser: (user: User) => void
  hasPermission: (roles: Array<'director' | 'manager' | 'agent'>) => boolean
  canEditHouse: (agentId: number) => boolean
  canDeleteHouse: () => boolean
  canVerifyHouse: () => boolean
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),

  login: (user: User, token: string) => {
    localStorage.setItem('token', token)
    set({ user, token, isAuthenticated: true })
  },

  logout: () => {
    localStorage.removeItem('token')
    set({ user: null, token: null, isAuthenticated: false })
  },

  setUser: (user: User) => set({ user }),

  hasPermission: (roles) => {
    const state = get()
    if (!state.user) return false
    return roles.includes(state.user.role)
  },

  canEditHouse: (agentId: number) => {
    const state = get()
    if (!state.user) return false
    const isOwner = state.user.id === agentId
    const isPrivileged = ['director', 'manager'].includes(state.user.role)
    return isOwner || isPrivileged
  },

  canDeleteHouse: () => {
    return get().hasPermission(['director', 'manager'])
  },

  canVerifyHouse: () => {
    return get().hasPermission(['director', 'manager'])
  },
}))

export default useAuthStore
