import { create } from 'zustand'
import type { MonitoringStats, Lawyer, LawyerDailyStat } from '@/types'
import { mockApi } from '@/mock/api'

interface MonitoringState {
  stats: MonitoringStats | null
  historyStats: LawyerDailyStat[]
  fetchStats: () => Promise<void>
  freezeLawyer: (lawyerId: string, reason: string) => Promise<Lawyer | null>
}

export const useMonitoringStore = create<MonitoringState>()((set) => ({
  stats: null,
  historyStats: [],

  fetchStats: async () => {
    const stats = await mockApi.getMonitoringStats()
    set({
      stats,
      historyStats: stats.dailyStats,
    })
  },

  freezeLawyer: async (lawyerId, reason) => {
    try {
      const result = await mockApi.freezeLawyer(lawyerId, reason)
      return result
    } catch {
      return null
    }
  },
}))
