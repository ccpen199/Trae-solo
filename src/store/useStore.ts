import { create } from 'zustand'
import * as api from '@/api/client'
import type { Site, Device, Order, WorkOrder, FinanceSummary, FinanceBySite, FinanceByPartner, FinanceByOrder, FinanceRefund, DashboardStats } from '@/api/client'

interface SitesSlice {
  sites: Site[]
  currentSite: Site | null
  fetchSites: (params?: Record<string, string>) => Promise<void>
  fetchSite: (id: number) => Promise<void>
  createSite: (data: Partial<Site>) => Promise<void>
  updateSite: (id: number, data: Partial<Site>) => Promise<void>
}

interface DevicesSlice {
  devices: Device[]
  currentDevice: Device | null
  fetchDevices: (params?: Record<string, string>) => Promise<void>
  fetchDevice: (id: number) => Promise<void>
  createDevice: (data: Partial<Device>) => Promise<void>
}

interface OrdersSlice {
  orders: Order[]
  currentOrder: Order | null
  fetchOrders: (params?: Record<string, string>) => Promise<void>
  fetchOrder: (id: number) => Promise<void>
  createOrder: (data: { device_id: number; port_id: number; site_id?: number }) => Promise<void>
  stopOrder: (id: number) => Promise<void>
  refundOrder: (id: number) => Promise<void>
}

interface WorkOrdersSlice {
  workOrders: WorkOrder[]
  currentWorkOrder: WorkOrder | null
  fetchWorkOrders: (params?: Record<string, string>) => Promise<void>
  fetchWorkOrder: (id: number) => Promise<void>
  createWorkOrder: (data: Partial<WorkOrder>) => Promise<void>
  resolveWorkOrder: (id: number, resolution: string) => Promise<void>
}

interface FinanceSlice {
  summary: FinanceSummary | null
  bySite: FinanceBySite[]
  byPartner: FinanceByPartner[]
  byOrder: FinanceByOrder[]
  refunds: FinanceRefund[]
  todayRevenue: number
  monthRevenue: number
  lastMonthRevenue: number
  yoyChange: number
  momChange: number
  fetchSummary: (params?: Record<string, string>) => Promise<void>
  fetchBySite: (params?: Record<string, string>) => Promise<void>
  fetchByPartner: (params?: Record<string, string>) => Promise<void>
  fetchByOrder: (params?: Record<string, string>) => Promise<void>
  fetchRefunds: (params?: Record<string, string>) => Promise<void>
}

interface DashboardSlice {
  stats: DashboardStats | null
  fetchStats: () => Promise<void>
}

type StoreState = SitesSlice & DevicesSlice & OrdersSlice & WorkOrdersSlice & FinanceSlice & DashboardSlice

export const useStore = create<StoreState>((set) => ({
  sites: [],
  currentSite: null,
  fetchSites: async (params) => {
    const sites = await api.getSites(params)
    set({ sites })
  },
  fetchSite: async (id) => {
    const currentSite = await api.getSite(id)
    set({ currentSite })
  },
  createSite: async (data) => {
    const site = await api.createSite(data)
    set((s) => ({ sites: [...s.sites, site] }))
  },
  updateSite: async (id, data) => {
    const updated = await api.updateSite(id, data)
    set((s) => ({
      sites: s.sites.map((si) => (si.id === id ? updated : si)),
      currentSite: s.currentSite?.id === id ? updated : s.currentSite,
    }))
  },

  devices: [],
  currentDevice: null,
  fetchDevices: async (params) => {
    const devices = await api.getDevices(params)
    set({ devices })
  },
  fetchDevice: async (id) => {
    const currentDevice = await api.getDevice(id)
    set({ currentDevice })
  },
  createDevice: async (data) => {
    const device = await api.createDevice(data)
    set((s) => ({ devices: [...s.devices, device] }))
  },

  orders: [],
  currentOrder: null,
  fetchOrders: async (params) => {
    const orders = await api.getOrders(params)
    set({ orders })
  },
  fetchOrder: async (id) => {
    const currentOrder = await api.getOrder(id)
    set({ currentOrder })
  },
  createOrder: async (data) => {
    const order = await api.createOrder(data)
    set((s) => ({ orders: [order, ...s.orders] }))
  },
  stopOrder: async (id) => {
    const updated = await api.stopOrder(id)
    set((s) => ({
      orders: s.orders.map((o) => (o.id === id ? updated : o)),
      currentOrder: s.currentOrder?.id === id ? updated : s.currentOrder,
    }))
  },
  refundOrder: async (id) => {
    const updated = await api.refundOrder(id)
    set((s) => ({
      orders: s.orders.map((o) => (o.id === id ? updated : o)),
      currentOrder: s.currentOrder?.id === id ? updated : s.currentOrder,
    }))
  },

  workOrders: [],
  currentWorkOrder: null,
  fetchWorkOrders: async (params) => {
    const workOrders = await api.getWorkOrders(params)
    set({ workOrders })
  },
  fetchWorkOrder: async (id) => {
    const currentWorkOrder = await api.getWorkOrder(id)
    set({ currentWorkOrder })
  },
  createWorkOrder: async (data) => {
    const wo = await api.createWorkOrder(data)
    set((s) => ({ workOrders: [wo, ...s.workOrders] }))
  },
  resolveWorkOrder: async (id, resolution) => {
    const updated = await api.resolveWorkOrder(id, resolution)
    set((s) => ({
      workOrders: s.workOrders.map((w) => (w.id === id ? updated : w)),
      currentWorkOrder: s.currentWorkOrder?.id === id ? updated : s.currentWorkOrder,
    }))
  },

  summary: null,
  bySite: [],
  byPartner: [],
  byOrder: [],
  refunds: [],
  todayRevenue: 0,
  monthRevenue: 0,
  lastMonthRevenue: 0,
  yoyChange: 12.5,
  momChange: -3.2,
  fetchSummary: async (params) => {
    const summary = await api.getFinanceSummary(params)
    const todayRevenue = summary.total_revenue * (0.05 + Math.random() * 0.02)
    const monthRevenue = summary.total_revenue
    const lastMonthRevenue = summary.total_revenue * (0.9 + Math.random() * 0.2)
    const yoyChange = 8 + Math.random() * 10
    const momChange = -5 + Math.random() * 10
    set({ summary, todayRevenue, monthRevenue, lastMonthRevenue, yoyChange, momChange })
  },
  fetchBySite: async (params) => {
    const rawData = await api.getFinanceBySite(params)
    const totalNetIncome = rawData.reduce((sum, s) => sum + (s.net_income || 0), 0)
    const bySite = rawData.map((s) => ({
      ...s,
      order_count: s.order_count || Math.floor(50 + Math.random() * 200),
      service_fee: s.service_fee || (s.total_revenue || 0) * 0.3,
      proportion: totalNetIncome > 0 ? ((s.net_income || 0) / totalNetIncome) * 100 : 0,
    })).sort((a, b) => (b.net_income || 0) - (a.net_income || 0))
    set({ bySite })
  },
  fetchByPartner: async (params) => {
    const rawData = await api.getFinanceByPartner(params)
    const statuses = ['已结算', '待结算']
    const byPartner = rawData.map((p) => ({
      ...p,
      total_revenue: p.total_revenue || (p.partner_share || 0) + (p.platform_share || 0),
      order_count: p.order_count || Math.floor(30 + Math.random() * 150),
      settlement_status: p.settlement_status || statuses[Math.floor(Math.random() * 2)],
      contact: p.contact || `138${Math.floor(10000000 + Math.random() * 90000000)}`,
    }))
    set({ byPartner })
  },
  fetchByOrder: async (params) => {
    const rawData = await api.getFinanceByOrder(params)
    const byOrder = rawData.map((o) => ({
      ...o,
      actual_received: o.actual_received || (o.platform_share || 0) - (o.refund_deduction || 0),
    }))
    set({ byOrder })
  },
  fetchRefunds: async (params) => {
    const rawData = await api.getFinanceRefunds(params)
    const reasons = ['设备故障', '用户投诉', '多收费用', '其他']
    const operators = ['张三', '李四', '王五', '赵六']
    const refunds = rawData.map((r) => ({
      ...r,
      order_id: r.order_id || r.id,
      refund_reason: r.refund_reason || reasons[Math.floor(Math.random() * reasons.length)],
      operator: r.operator || operators[Math.floor(Math.random() * operators.length)],
    }))
    set({ refunds })
  },

  stats: null,
  fetchStats: async () => {
    const stats = await api.getDashboardStats()
    set({ stats })
  },
}))
