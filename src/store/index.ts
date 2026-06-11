import { create } from 'zustand'
import type {
  Station,
  ChargingPile,
  ChargingPort,
  User,
  ChargingOrder,
  AlertRecord,
  SettlementDetail,
  FirmwareUpgrade,
  CreditRecord,
  BillingDetail,
  PricingRule,
  ProfitRule,
  SafetyConfig,
  PileStatus,
  UserStatus,
} from '@/types'
import {
  stations as mockStations,
  chargingPiles as mockChargingPiles,
  chargingPorts as mockChargingPorts,
  users as mockUsers,
  chargingOrders as mockChargingOrders,
  alertRecords as mockAlertRecords,
  settlementDetails as mockSettlementDetails,
  firmwareUpgrades as mockFirmwareUpgrades,
  creditRecords as mockCreditRecords,
  billingDetails as mockBillingDetails,
  pricingRules as mockPricingRules,
  profitRules as mockProfitRules,
  safetyConfig as mockSafetyConfig,
} from '@/mock/data'

interface StoreState {
  stations: Station[]
  chargingPiles: ChargingPile[]
  chargingPorts: ChargingPort[]
  users: User[]
  chargingOrders: ChargingOrder[]
  alertRecords: AlertRecord[]
  settlementDetails: SettlementDetail[]
  firmwareUpgrades: FirmwareUpgrade[]
  creditRecords: CreditRecord[]
  billingDetails: BillingDetail[]
  pricingRules: PricingRule[]
  profitRules: ProfitRule[]
  safetyConfig: SafetyConfig
  sidebarCollapsed: boolean
  realtimeUpdateEnabled: boolean
  toggleSidebar: () => void
  toggleRealtimeUpdate: () => void
  updatePileStatus: (pileId: string, status: PileStatus) => void
  updatePortPower: (portId: string, power: number) => void
  handleAlert: (alertId: string) => void
  updateUserStatus: (userId: string, status: UserStatus) => void
  updateSafetyConfig: (config: Partial<SafetyConfig>) => void
  updatePricingRules: (rules: PricingRule[]) => void
  updateProfitRules: (rules: ProfitRule[]) => void
  addAlert: (alert: AlertRecord) => void
  simulateRealtimeUpdate: () => void
}

const PILE_STATUSES: PileStatus[] = ['充电中', '空闲', '故障', '离线']

export const useStore = create<StoreState>((set) => ({
  stations: mockStations,
  chargingPiles: mockChargingPiles,
  chargingPorts: mockChargingPorts,
  users: mockUsers,
  chargingOrders: mockChargingOrders,
  alertRecords: mockAlertRecords,
  settlementDetails: mockSettlementDetails,
  firmwareUpgrades: mockFirmwareUpgrades,
  creditRecords: mockCreditRecords,
  billingDetails: mockBillingDetails,
  pricingRules: mockPricingRules,
  profitRules: mockProfitRules,
  safetyConfig: mockSafetyConfig,
  sidebarCollapsed: false,
  realtimeUpdateEnabled: true,

  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),

  toggleRealtimeUpdate: () => set((s) => ({ realtimeUpdateEnabled: !s.realtimeUpdateEnabled })),

  updatePileStatus: (pileId, status) =>
    set((s) => ({
      chargingPiles: s.chargingPiles.map((p) =>
        p.pile_id === pileId ? { ...p, status } : p
      ),
    })),

  updatePortPower: (portId, power) =>
    set((s) => ({
      chargingPorts: s.chargingPorts.map((p) =>
        p.port_id === portId ? { ...p, current_power: power } : p
      ),
    })),

  handleAlert: (alertId) =>
    set((s) => ({
      alertRecords: s.alertRecords.map((a) =>
        a.alert_id === alertId ? { ...a, status: '已处理' as const } : a
      ),
    })),

  updateUserStatus: (userId, status) =>
    set((s) => ({
      users: s.users.map((u) =>
        u.user_id === userId ? { ...u, status } : u
      ),
    })),

  updateSafetyConfig: (config) =>
    set((s) => ({
      safetyConfig: { ...s.safetyConfig, ...config },
    })),

  updatePricingRules: (rules) => set({ pricingRules: rules }),

  updateProfitRules: (rules) => set({ profitRules: rules }),

  addAlert: (alert) =>
    set((s) => ({
      alertRecords: [alert, ...s.alertRecords],
    })),

  simulateRealtimeUpdate: () =>
    set((s) => {
      const piles = s.chargingPiles.map((p) => {
        if (Math.random() < 0.1) {
          const newStatus = PILE_STATUSES[Math.floor(Math.random() * PILE_STATUSES.length)]
          return { ...p, status: newStatus }
        }
        return p
      })
      const ports = s.chargingPorts.map((p) => {
        if (Math.random() < 0.15) {
          const maxP = p.max_power
          const newPower = Math.round(Math.random() * maxP * 10) / 10
          return { ...p, current_power: newPower }
        }
        return p
      })
      return { chargingPiles: piles, chargingPorts: ports }
    }),
}))
