import { create } from 'zustand'

export interface Rider {
  id: number
  name: string
  phone: string
  role: 'rider' | 'admin'
  credit_score: number
  balance: number
  frozen_balance: number
  real_name_verified: number
  insurance_id: string | null
  status: string
  avatar?: string
  created_at?: string
  updated_at?: string
  [key: string]: any
}

interface AuthState {
  token: string | null
  rider: Rider | null
  loading: boolean
  setAuth: (token: string, rider: Rider) => void
  logout: () => void
  updateRider: (data: Partial<Rider>) => void
  fetchUser: () => Promise<void>
}

const getStoredRider = (): Rider | null => {
  try {
    const stored = localStorage.getItem('rider')
    return stored ? JSON.parse(stored) : null
  } catch {
    return null
  }
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: localStorage.getItem('token'),
  rider: getStoredRider(),
  loading: false,

  setAuth: (token, rider) => {
    localStorage.setItem('token', token)
    localStorage.setItem('rider', JSON.stringify(rider))
    set({ token, rider })
  },

  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('rider')
    set({ token: null, rider: null })
  },

  updateRider: (data) => {
    set((state) => {
      if (!state.rider) return state
      const updatedRider = { ...state.rider, ...data }
      localStorage.setItem('rider', JSON.stringify(updatedRider))
      return { rider: updatedRider }
    })
  },

  fetchUser: async () => {
    const { token, rider } = get()
    if (!token || rider) return

    set({ loading: true })
    try {
      const { auth } = await import('../api')
      const userData = await auth.getMe()
      if (userData) {
        localStorage.setItem('rider', JSON.stringify(userData))
        set({ rider: userData })
      }
    } catch (err) {
      get().logout()
    } finally {
      set({ loading: false })
    }
  },
}))
