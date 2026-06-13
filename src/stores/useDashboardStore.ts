import { create } from 'zustand'
import { mockDashboardData, mockHeatmapData } from '../data/mockData'
import type { DashboardData, HeatmapData } from '../types'

interface DashboardState {
  dashboardData: DashboardData | null
  heatmapData: HeatmapData | null
  loading: boolean
  fetchDashboard: () => Promise<DashboardData>
  fetchHeatmap: () => Promise<HeatmapData>
  refreshAll: () => Promise<void>
}

const randomTweak = (base: number, rangePercent = 0.05): number => {
  const delta = base * rangePercent * (Math.random() * 2 - 1)
  return Math.max(0, Math.round(base + delta))
}

const randomTweakFloat = (base: number, rangePercent = 0.1): number => {
  const delta = base * rangePercent * (Math.random() * 2 - 1)
  return Number((base + delta).toFixed(1))
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export const useDashboardStore = create<DashboardState>((set, get) => ({
  dashboardData: null,
  heatmapData: null,
  loading: false,

  fetchDashboard: async () => {
    set({ loading: true })
    await delay(600 + Math.random() * 400)

    const tweaked: DashboardData = {
      todayCount: randomTweak(mockDashboardData.todayCount),
      todayCompletedCount: randomTweak(mockDashboardData.todayCompletedCount),
      avgDurationHours: randomTweakFloat(mockDashboardData.avgDurationHours, 0.1),
      onTimeRate: randomTweakFloat(mockDashboardData.onTimeRate, 0.02),
      satisfactionRate: randomTweakFloat(mockDashboardData.satisfactionRate, 0.02),
      trendPoints: mockDashboardData.trendPoints.map((tp) => ({
        ...tp,
        count: randomTweak(tp.count, 0.08),
        completedCount: randomTweak(tp.completedCount, 0.08),
        avgDurationHours: randomTweakFloat(tp.avgDurationHours, 0.15),
      })),
      bureauOverdues: mockDashboardData.bureauOverdues.map((bo) => ({
        ...bo,
        totalCount: randomTweak(bo.totalCount, 0.06),
        overdueCount: Math.max(0, randomTweak(bo.overdueCount, 0.2)),
        overdueRate: 0,
      })).map((bo) => ({
        ...bo,
        overdueRate: bo.totalCount > 0
          ? Math.round((bo.overdueCount / bo.totalCount) * 10000) / 100
          : 0,
      })),
      sentimentStats: (() => {
        const total = randomTweak(
          mockDashboardData.sentimentStats.reduce((sum, s) => sum + s.count, 0),
          0.05
        )
        const pRatio = 0.7 + Math.random() * 0.06
        const nRatio = 0.16 + Math.random() * 0.06
        const p = Math.round(total * pRatio)
        const n = Math.round(total * nRatio)
        const ne = total - p - n
        return [
          { sentiment: 'positive' as const, label: '正面', count: p, percentage: Math.round((p / total) * 1000) / 10 },
          { sentiment: 'neutral' as const, label: '中性', count: ne, percentage: Math.round((ne / total) * 1000) / 10 },
          { sentiment: 'negative' as const, label: '负面', count: n, percentage: Math.round((n / total) * 1000) / 10 },
        ]
      })(),
      bureauStatuses: mockDashboardData.bureauStatuses.map((bs) => ({
        ...bs,
        responseTimeMs: bs.isConnected
          ? Math.max(50, randomTweak(bs.responseTimeMs, 0.25))
          : 0,
        serviceCount: Math.max(0, randomTweak(bs.serviceCount, 0.3)),
      })),
      lowReviews: mockDashboardData.lowReviews,
      lastUpdated: new Date().toISOString().replace('T', ' ').slice(0, 19),
    }

    set({ dashboardData: tweaked, loading: false })
    return tweaked
  },

  fetchHeatmap: async () => {
    set({ loading: true })
    await delay(500 + Math.random() * 300)

    const tweaked: HeatmapData = {
      districtHeats: mockHeatmapData.districtHeats.map((dh) => ({
        ...dh,
        count: Math.max(1, randomTweak(dh.count, 0.12)),
      })).sort((a, b) => b.count - a.count),
      ageHeats: mockHeatmapData.ageHeats.map((ah) => {
        const total = Math.max(1, randomTweak(ah.count, 0.08))
        const ratio = ah.maleCount / ah.count
        const male = Math.round(total * ratio)
        return {
          ...ah,
          count: total,
          maleCount: male,
          femaleCount: total - male,
        }
      }),
      timeSlotHeats: mockHeatmapData.timeSlotHeats.map((th) => ({
        ...th,
        count: Math.max(0, randomTweak(th.count, 0.15)),
        avgWaitMinutes: Math.max(0, randomTweak(th.avgWaitMinutes, 0.2)),
      })),
      topServices: mockHeatmapData.topServices.map((ts) => ({
        ...ts,
        count: Math.max(1, randomTweak(ts.count, 0.1)),
      })),
      lastUpdated: new Date().toISOString().replace('T', ' ').slice(0, 19),
    }

    set({ heatmapData: tweaked, loading: false })
    return tweaked
  },

  refreshAll: async () => {
    set({ loading: true })
    const [dashboard, heatmap] = await Promise.all([
      get().fetchDashboard(),
      get().fetchHeatmap(),
    ])
    set({
      dashboardData: dashboard,
      heatmapData: heatmap,
      loading: false,
    })
  },
}))
