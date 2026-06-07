import { create } from 'zustand'
import { api } from '@/lib/api'

interface OverviewData {
  riders: {
    total: number
    online: number
    novice: number
  }
  orders: {
    total: number
    pending: number
    delivered: number
    timeout: number
  }
  alerts: {
    active: number
  }
  income: {
    total: number
  }
}

interface AppState {
  overview: OverviewData | null
  loading: boolean
  fetchOverview: () => Promise<void>
}

export const useAppStore = create<AppState>((set) => ({
  overview: null,
  loading: false,
  fetchOverview: async () => {
    set({ loading: true })
    try {
      const data = await api.getOverview()
      set({ overview: data, loading: false })
    } catch (error) {
      set({ loading: false })
      console.error('Failed to fetch overview:', error)
    }
  },
}))
