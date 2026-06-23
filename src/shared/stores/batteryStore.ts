import { create } from 'zustand'
import type { Battery, ChargeRecord, BatteryHealthDetail } from '@shared/types'
import { mockBatteries, generateChargeRecords } from '@mock/data'

interface BatteryStore {
  batteries: Battery[]
  selectedBattery: Battery | null
  chargeRecords: Record<string, ChargeRecord[]>
  healthDetails: Record<string, BatteryHealthDetail>
  setSelectedBattery: (battery: Battery | null) => void
  getBatteryById: (id: string) => Battery | undefined
  getChargeRecords: (batteryId: string) => ChargeRecord[]
  getHealthDetail: (batteryId: string) => BatteryHealthDetail | null
  updateBatterySoc: (id: string, soc: number) => void
}

export const useBatteryStore = create<BatteryStore>((set, get) => ({
  batteries: mockBatteries,
  selectedBattery: null,
  chargeRecords: {},
  healthDetails: {},
  setSelectedBattery: (battery) => set({ selectedBattery: battery }),
  getBatteryById: (id) => get().batteries.find((b) => b.battery_id === id),
  getChargeRecords: (batteryId) => {
    if (!get().chargeRecords[batteryId]) {
      const records = generateChargeRecords(batteryId, 30)
      set((state) => ({
        chargeRecords: { ...state.chargeRecords, [batteryId]: records },
      }))
      return records
    }
    return get().chargeRecords[batteryId]
  },
  getHealthDetail: (batteryId) => {
    const battery = get().getBatteryById(batteryId)
    if (!battery) return null

    if (!get().healthDetails[batteryId]) {
      const healthScore = battery.health_score
      let healthLevel: BatteryHealthDetail['health_level'] = 'good'
      if (healthScore >= 90) healthLevel = 'excellent'
      else if (healthScore >= 75) healthLevel = 'good'
      else if (healthScore >= 60) healthLevel = 'fair'
      else healthLevel = 'poor'

      const detail: BatteryHealthDetail = {
        battery_id: batteryId,
        total_cycles: battery.cycle_count,
        capacity_retention: healthScore,
        internal_resistance: 15 + (100 - healthScore) * 0.3,
        resistance_increase_rate: (100 - healthScore) * 0.15,
        voltage_decay_rate: (100 - healthScore) * 0.08,
        estimated_remaining_cycles: Math.floor((healthScore - 60) * 30),
        health_level: healthLevel,
        last_check_date: new Date().toISOString(),
      }

      set((state) => ({
        healthDetails: { ...state.healthDetails, [batteryId]: detail },
      }))
      return detail
    }
    return get().healthDetails[batteryId]
  },
  updateBatterySoc: (id, soc) =>
    set((state) => ({
      batteries: state.batteries.map((b) =>
        b.battery_id === id ? { ...b, current_soc: soc } : b
      ),
    })),
}))
