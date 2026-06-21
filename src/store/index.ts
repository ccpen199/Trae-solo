import { create } from 'zustand'
import type {
  DashboardKPI,
  CargoOrder,
  Capacity,
  Waybill,
  Alert,
  InsurancePolicy,
  Claim,
  ServiceOrder,
  EtcCard,
  FuelCard,
  MaintenanceOrder,
  TrendData,
  DistributionItem,
} from '@/types'
import {
  mockKPI,
  mockFreightTrend,
  mockOnTimeTrend,
  mockCargoTypeDistribution,
  mockCargoOrders,
  mockCapacities,
  mockWaybills,
  mockAlerts,
  mockInsurancePolicies,
  mockClaims,
  mockServiceOrders,
  mockEtcCards,
  mockFuelCards,
  mockMaintenanceOrders,
  mockVehicleMapData,
} from '@/mock/data'

interface AppState {
  // 用户状态
  currentUser: {
    id: string
    name: string
    role: 'enterprise' | 'driver' | 'admin' | 'insurance'
    company: string
    avatar: string
  }
  sidebarCollapsed: boolean
  currentRoute: string

  // 数据
  kpi: DashboardKPI
  freightTrend: TrendData[]
  onTimeTrend: TrendData[]
  cargoTypeDistribution: DistributionItem[]
  cargoOrders: CargoOrder[]
  capacities: Capacity[]
  waybills: Waybill[]
  alerts: Alert[]
  insurancePolicies: InsurancePolicy[]
  claims: Claim[]
  serviceOrders: ServiceOrder[]
  etcCards: EtcCard[]
  fuelCards: FuelCard[]
  maintenanceOrders: MaintenanceOrder[]
  vehicleMapData: typeof mockVehicleMapData

  // Actions
  toggleSidebar: () => void
  setCurrentRoute: (route: string) => void
  markAlertResolved: (id: string) => void
  updateAlertHandler: (id: string, handler: string, resolution: string) => void
  addCargoOrder: (order: CargoOrder) => void
  updateCargoOrderStatus: (id: string, status: CargoOrder['status']) => void
}

export const useAppStore = create<AppState>((set) => ({
  currentUser: {
    id: 'ent-001',
    name: '张明',
    role: 'enterprise',
    company: '华为技术有限公司 供应链部',
    avatar: '',
  },
  sidebarCollapsed: false,
  currentRoute: '/dashboard',

  kpi: mockKPI,
  freightTrend: mockFreightTrend,
  onTimeTrend: mockOnTimeTrend,
  cargoTypeDistribution: mockCargoTypeDistribution,
  cargoOrders: mockCargoOrders,
  capacities: mockCapacities,
  waybills: mockWaybills,
  alerts: mockAlerts,
  insurancePolicies: mockInsurancePolicies,
  claims: mockClaims,
  serviceOrders: mockServiceOrders,
  etcCards: mockEtcCards,
  fuelCards: mockFuelCards,
  maintenanceOrders: mockMaintenanceOrders,
  vehicleMapData: mockVehicleMapData,

  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setCurrentRoute: (route) => set({ currentRoute: route }),
  markAlertResolved: (id) =>
    set((s) => ({
      alerts: s.alerts.map((a) =>
        a.id === id ? { ...a, status: 'resolved' as const, resolvedAt: new Date().toISOString().replace('T', ' ').slice(0, 19) } : a
      ),
    })),
  updateAlertHandler: (id, handler, resolution) =>
    set((s) => ({
      alerts: s.alerts.map((a) =>
        a.id === id ? { ...a, status: 'processing' as const, handler, resolution } : a
      ),
    })),
  addCargoOrder: (order) => set((s) => ({ cargoOrders: [order, ...s.cargoOrders] })),
  updateCargoOrderStatus: (id, status) =>
    set((s) => ({
      cargoOrders: s.cargoOrders.map((o) => (o.id === id ? { ...o, status, updatedAt: new Date().toISOString().replace('T', ' ').slice(0, 19) } : o)),
    })),
}))
