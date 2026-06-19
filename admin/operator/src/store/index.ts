import { create } from 'zustand'

interface User {
  id: string
  username: string
  name: string
  role: string
  avatar?: string
}

interface AppState {
  user: User | null
  token: string | null
  setUser: (user: User) => void
  setToken: (token: string) => void
  logout: () => void
  deviceStats: {
    online: number
    offline: number
    warning: number
    total: number
  }
  setDeviceStats: (stats: AppState['deviceStats']) => void
  workOrderStats: {
    pending: number
    inProgress: number
    completed: number
    todayTotal: number
  }
  setWorkOrderStats: (stats: AppState['workOrderStats']) => void
}

export const useAppStore = create<AppState>((set) => ({
  user: null,
  token: localStorage.getItem('operator_token'),
  setUser: (user) => set({ user }),
  setToken: (token) => {
    localStorage.setItem('operator_token', token)
    set({ token })
  },
  logout: () => {
    localStorage.removeItem('operator_token')
    set({ user: null, token: null })
  },
  deviceStats: {
    online: 0,
    offline: 0,
    warning: 0,
    total: 0
  },
  setDeviceStats: (stats) => set({ deviceStats: stats }),
  workOrderStats: {
    pending: 0,
    inProgress: 0,
    completed: 0,
    todayTotal: 0
  },
  setWorkOrderStats: (stats) => set({ workOrderStats: stats })
}))
