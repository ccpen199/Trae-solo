import { create } from 'zustand'
import type { DashboardStats, TodoItem, MembershipInfo, User } from '../../shared/types'

interface AppState {
  currentUser: User
  sidebarCollapsed: boolean
  sidebarMobileOpen: boolean
  toggleSidebar: () => void
  toggleMobileSidebar: () => void
  setMobileSidebarOpen: (open: boolean) => void
}

export const useAppStore = create<AppState>((set) => ({
  currentUser: {
    id: 'user-001',
    phone: '13800138001',
    name: '张三',
    role: 'individual',
    createdAt: '2024-01-15T08:00:00Z',
  },
  sidebarCollapsed: false,
  sidebarMobileOpen: false,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  toggleMobileSidebar: () => set((s) => ({ sidebarMobileOpen: !s.sidebarMobileOpen })),
  setMobileSidebarOpen: (open) => set({ sidebarMobileOpen: open }),
}))

interface DashboardState {
  stats: DashboardStats | null
  todos: TodoItem[]
  loading: boolean
  fetchStats: () => Promise<void>
  fetchTodos: () => Promise<void>
}

export const useDashboardStore = create<DashboardState>((set) => ({
  stats: null,
  todos: [],
  loading: false,
  fetchStats: async () => {
    try {
      const res = await fetch('/api/dashboard/stats')
      const data = await res.json()
      set({ stats: data })
    } catch {
      console.error('Failed to fetch dashboard stats')
    }
  },
  fetchTodos: async () => {
    try {
      const res = await fetch('/api/dashboard/todos')
      const data = await res.json()
      set({ todos: data })
    } catch {
      console.error('Failed to fetch todos')
    }
  },
}))

interface MembershipState {
  info: MembershipInfo | null
  pointsRecords: { records: any[] } | null
  auditLogs: any[]
  loading: boolean
  fetchInfo: () => Promise<void>
  fetchPoints: () => Promise<void>
  fetchAuditLogs: () => Promise<void>
}

export const useMembershipStore = create<MembershipState>((set) => ({
  info: null,
  pointsRecords: null,
  auditLogs: [],
  loading: false,
  fetchInfo: async () => {
    try {
      const res = await fetch('/api/membership/info')
      const data = await res.json()
      set({ info: data })
    } catch {
      console.error('Failed to fetch membership info')
    }
  },
  fetchPoints: async () => {
    try {
      const res = await fetch('/api/membership/points')
      const data = await res.json()
      set({ pointsRecords: data })
    } catch {
      console.error('Failed to fetch points')
    }
  },
  fetchAuditLogs: async () => {
    try {
      const res = await fetch('/api/membership/audit-logs')
      const data = await res.json()
      set({ auditLogs: data })
    } catch {
      console.error('Failed to fetch audit logs')
    }
  },
}))
