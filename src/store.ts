import { create } from 'zustand'

export interface Battery {
  id: string
  code: string
  model: string
  supplier: string
  purchase_batch: string
  capacity: number
  warranty_date: string
  initial_test_result: string
  status: string
  created_at: string
  updated_at: string
  hasHighRiskAlerts?: boolean
  riskAlerts?: { id: string; alert_type: string; severity: string; status: string; description: string; alert_at: string }[]
}

export interface UsageRecord {
  id: string
  battery_id: string
  vehicle_id: string
  station_id: string
  order_id: string
  charge_cycles: number
  temperature: number
  soc: number
  soh: number
  has_anomaly: number
  anomaly_desc: string
  recorded_at: string
  created_at: string
  battery_code?: string
}

export interface MaintenancePlan {
  id: string
  battery_id: string
  trigger_type: string
  trigger_condition: string
  task_type: string
  status: string
  priority: string
  description: string
  scheduled_at: string
  completed_at: string
  completed_by: string
  result: string
  created_at: string
  battery_code?: string
}

export interface SafetyAlert {
  id: string
  battery_id: string
  alert_type: string
  severity: string
  status: string
  description: string
  resolution: string
  disposition: string
  reviewer: string
  reviewed_at: string
  alert_at: string
  resolved_at: string
  created_at: string
  battery_code?: string
}

export interface DashboardData {
  totalBatteries: number
  byStatus: { status: string; count: number }[]
  openAlerts: number
  openHighCriticalAlerts: number
  highRiskCount: number
  pendingReviewCount: number
  recallCount: number
  pendingRetireCount: number
  pendingCascadeCount: number
  pendingMaintenance: number
  extendedStatus: { key: string; count: number }[]
  recentAlerts: (SafetyAlert & {
    battery_id: string
    battery_code: string
    battery_model: string
    battery_status: string
    plan_id: string
    plan_status: string
    plan_priority: string
    disposition?: string
    reviewer?: string
    reviewed_at?: string
    resolution?: string
  })[]
  recentMaintenance: (MaintenancePlan & {
    battery_id: string
    battery_code: string
    battery_model: string
    battery_status: string
    alert_id: string
    alert_type: string
    alert_severity: string
  })[]
}

export interface PaginatedResponse<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
}

interface StoreState {
  batteries: Battery[]
  batteriesTotal: number
  currentBattery: Battery | null
  usageRecords: UsageRecord[]
  usageRecordsTotal: number
  maintenancePlans: MaintenancePlan[]
  maintenancePlansTotal: number
  safetyAlerts: SafetyAlert[]
  safetyAlertsTotal: number
  dashboard: DashboardData | null
  loading: Record<string, boolean>
  setLoading: (key: string, value: boolean) => void
  fetchBatteries: (params?: Record<string, string>) => Promise<void>
  fetchBattery: (id: string) => Promise<void>
  createBattery: (data: Partial<Battery>) => Promise<boolean>
  updateBattery: (id: string, data: Partial<Battery>) => Promise<boolean>
  deleteBattery: (id: string) => Promise<boolean>
  fetchUsageRecords: (params?: Record<string, string>) => Promise<void>
  createUsageRecord: (data: Partial<UsageRecord>) => Promise<boolean>
  updateUsageRecord: (id: string, data: Partial<UsageRecord>) => Promise<boolean>
  deleteUsageRecord: (id: string) => Promise<boolean>
  fetchMaintenancePlans: (params?: Record<string, string>) => Promise<void>
  fetchMaintenancePlan: (id: string) => Promise<void>
  createMaintenancePlan: (data: Partial<MaintenancePlan>) => Promise<boolean>
  updateMaintenancePlan: (id: string, data: Partial<MaintenancePlan>) => Promise<boolean>
  deleteMaintenancePlan: (id: string) => Promise<boolean>
  fetchSafetyAlerts: (params?: Record<string, string>) => Promise<void>
  fetchSafetyAlert: (id: string) => Promise<void>
  createSafetyAlert: (data: Partial<SafetyAlert>) => Promise<boolean>
  updateSafetyAlert: (id: string, data: Partial<SafetyAlert>) => Promise<boolean>
  fetchDashboard: () => Promise<void>
  currentMaintenancePlan: MaintenancePlan | null
  currentAlert: SafetyAlert | null
  inventoryValue: { total: { count: number; capacity: number }; byStatus: { status: string; count: number; total_capacity: number }[] } | null
  healthDistribution: { range: string; count: number }[] | null
  retirementForecast: { sixMonths: { warrantyExpiring: Battery[]; sohCritical: Battery[] }; twelveMonths: { warrantyExpiring: Battery[]; sohCritical: Battery[] } } | null
  supplierQuality: { supplier: string; battery_count: number; avg_soh: number; fault_rate: number; fault_count: number; total_records: number }[] | null
  fetchInventoryValue: () => Promise<void>
  fetchHealthDistribution: () => Promise<void>
  fetchRetirementForecast: () => Promise<void>
  fetchSupplierQuality: () => Promise<void>
  checkBatteryRisk: (id: string) => Promise<{ isHighRisk: boolean; riskAlerts: SafetyAlert[] } | null>
  createUsageRecordError: string | null
}

const api = async <T>(url: string, options?: RequestInit): Promise<T> => {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  const json = await res.json()
  return json.data !== undefined ? json.data as T : json as T
}

const buildQuery = (params?: Record<string, string>) => {
  if (!params) return ''
  const search = new URLSearchParams(Object.entries(params).filter(([, v]) => v)).toString()
  return search ? `?${search}` : ''
}

export const useStore = create<StoreState>((set, get) => ({
  batteries: [],
  batteriesTotal: 0,
  currentBattery: null,
  usageRecords: [],
  usageRecordsTotal: 0,
  maintenancePlans: [],
  maintenancePlansTotal: 0,
  safetyAlerts: [],
  safetyAlertsTotal: 0,
  dashboard: null,
  loading: {},
  currentMaintenancePlan: null,
  currentAlert: null,
  inventoryValue: null,
  healthDistribution: null,
  retirementForecast: null,
  supplierQuality: null,
  createUsageRecordError: null,

  setLoading: (key, value) =>
    set((s) => ({ loading: { ...s.loading, [key]: value } })),

  fetchBatteries: async (params) => {
    get().setLoading('batteries', true)
    try {
      const res = await api<PaginatedResponse<Battery>>(`/api/batteries${buildQuery(params)}`)
      set({ batteries: res.list, batteriesTotal: res.total })
    } finally {
      get().setLoading('batteries', false)
    }
  },

  fetchBattery: async (id) => {
    get().setLoading('battery', true)
    try {
      const res = await api<Battery>(`/api/batteries/${id}`)
      set({ currentBattery: res })
    } finally {
      get().setLoading('battery', false)
    }
  },

  createBattery: async (data) => {
    try {
      await api('/api/batteries', { method: 'POST', body: JSON.stringify(data) })
      return true
    } catch {
      return false
    }
  },

  updateBattery: async (id, data) => {
    try {
      await api(`/api/batteries/${id}`, { method: 'PUT', body: JSON.stringify(data) })
      return true
    } catch {
      return false
    }
  },

  deleteBattery: async (id) => {
    try {
      await api(`/api/batteries/${id}`, { method: 'DELETE' })
      return true
    } catch {
      return false
    }
  },

  fetchUsageRecords: async (params) => {
    get().setLoading('usageRecords', true)
    try {
      const res = await api<PaginatedResponse<UsageRecord>>(`/api/usage-records${buildQuery(params)}`)
      set({ usageRecords: res.list, usageRecordsTotal: res.total })
    } finally {
      get().setLoading('usageRecords', false)
    }
  },

  createUsageRecord: async (data) => {
    set({ createUsageRecordError: null })
    try {
      await api('/api/usage-records', { method: 'POST', body: JSON.stringify(data) })
      return true
    } catch (err: any) {
      set({ createUsageRecordError: err.message || '创建失败' })
      return false
    }
  },

  updateUsageRecord: async (id, data) => {
    try {
      await api(`/api/usage-records/${id}`, { method: 'PUT', body: JSON.stringify(data) })
      return true
    } catch {
      return false
    }
  },

  deleteUsageRecord: async (id) => {
    try {
      await api(`/api/usage-records/${id}`, { method: 'DELETE' })
      return true
    } catch {
      return false
    }
  },

  fetchMaintenancePlans: async (params) => {
    get().setLoading('maintenancePlans', true)
    try {
      const res = await api<PaginatedResponse<MaintenancePlan>>(`/api/maintenance-plans${buildQuery(params)}`)
      set({ maintenancePlans: res.list, maintenancePlansTotal: res.total })
    } finally {
      get().setLoading('maintenancePlans', false)
    }
  },

  fetchMaintenancePlan: async (id) => {
    get().setLoading('maintenancePlan', true)
    try {
      const res = await api<MaintenancePlan>(`/api/maintenance-plans/${id}`)
      set({ currentMaintenancePlan: res })
    } finally {
      get().setLoading('maintenancePlan', false)
    }
  },

  createMaintenancePlan: async (data) => {
    try {
      await api('/api/maintenance-plans', { method: 'POST', body: JSON.stringify(data) })
      return true
    } catch {
      return false
    }
  },

  updateMaintenancePlan: async (id, data) => {
    try {
      await api(`/api/maintenance-plans/${id}`, { method: 'PUT', body: JSON.stringify(data) })
      return true
    } catch {
      return false
    }
  },

  deleteMaintenancePlan: async (id) => {
    try {
      await api(`/api/maintenance-plans/${id}`, { method: 'DELETE' })
      return true
    } catch {
      return false
    }
  },

  fetchSafetyAlerts: async (params) => {
    get().setLoading('safetyAlerts', true)
    try {
      const res = await api<PaginatedResponse<SafetyAlert>>(`/api/safety-alerts${buildQuery(params)}`)
      set({ safetyAlerts: res.list, safetyAlertsTotal: res.total })
    } finally {
      get().setLoading('safetyAlerts', false)
    }
  },

  fetchSafetyAlert: async (id) => {
    get().setLoading('safetyAlert', true)
    try {
      const res = await api<SafetyAlert>(`/api/safety-alerts/${id}`)
      set({ currentAlert: res })
    } finally {
      get().setLoading('safetyAlert', false)
    }
  },

  createSafetyAlert: async (data) => {
    try {
      await api('/api/safety-alerts', { method: 'POST', body: JSON.stringify(data) })
      return true
    } catch {
      return false
    }
  },

  updateSafetyAlert: async (id, data) => {
    try {
      await api(`/api/safety-alerts/${id}`, { method: 'PUT', body: JSON.stringify(data) })
      return true
    } catch {
      return false
    }
  },

  fetchDashboard: async () => {
    get().setLoading('dashboard', true)
    try {
      const res = await api<DashboardData>('/api/dashboard')
      set({ dashboard: res })
    } finally {
      get().setLoading('dashboard', false)
    }
  },

  fetchInventoryValue: async () => {
    try {
      const res = await api<StoreState['inventoryValue']>('/api/reports/inventory-value')
      set({ inventoryValue: res })
    } catch {}
  },

  fetchHealthDistribution: async () => {
    try {
      const res = await api<{ distribution: StoreState['healthDistribution'] }>('/api/reports/health-distribution')
      set({ healthDistribution: res.distribution })
    } catch {}
  },

  fetchRetirementForecast: async () => {
    try {
      const res = await api<StoreState['retirementForecast']>('/api/reports/retirement-forecast')
      set({ retirementForecast: res })
    } catch {}
  },

  fetchSupplierQuality: async () => {
    try {
      const res = await api<StoreState['supplierQuality']>('/api/reports/supplier-quality')
      set({ supplierQuality: res })
    } catch {}
  },

  checkBatteryRisk: async (id) => {
    try {
      const res = await api<{ isHighRisk: boolean; riskAlerts: SafetyAlert[] }>(`/api/batteries/${id}/risk-status`)
      return res
    } catch {
      return null
    }
  },
}))
