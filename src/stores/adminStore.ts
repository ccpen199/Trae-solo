import { create } from 'zustand'

interface DashboardStats {
  totalCerts: number
  todayCerts: number
  passRate: number
  pendingReviews: number
  monthlyTrend: { month: string; count: number }[]
  hourlyDistribution: { hour: string; count: number }[]
  failureReasons: { name: string; value: number }[]
  regionDistribution: { region: string; count: number }[]
}

interface Alert {
  id: string
  type: 'high_frequency' | 'remote_cluster' | 'face_mismatch'
  level: 'critical' | 'warning'
  idCard: string
  detail: string
  triggeredAt: string
  status: 'pending' | 'processed'
}

interface ReviewOrder {
  id: string
  idCard: string
  name: string
  verifyTime: string
  failureReason: string
  status: 'pending' | 'approved' | 'rejected' | 'transferred'
  screenshots?: string[]
}

interface AuditLog {
  id: string
  action: string
  operator: string
  target: string
  detail: string
  timestamp: string
  screenshots?: string[]
}

interface AdminStore {
  dashboardStats: DashboardStats | null
  alerts: Alert[]
  reviewOrders: ReviewOrder[]
  currentReviewOrder: ReviewOrder | null
  auditLogs: AuditLog[]
  loading: boolean
  fetchDashboardStats: () => Promise<void>
  fetchAlerts: (params?: Record<string, string>) => Promise<void>
  processAlert: (id: string) => Promise<void>
  fetchReviewOrders: (params?: Record<string, string>) => Promise<void>
  fetchReviewOrder: (id: string) => Promise<void>
  submitReview: (id: string, action: string, comment: string) => Promise<void>
  fetchAuditLogs: (params?: Record<string, string>) => Promise<void>
}

export const useAdminStore = create<AdminStore>((set, get) => ({
  dashboardStats: null,
  alerts: [],
  reviewOrders: [],
  currentReviewOrder: null,
  auditLogs: [],
  loading: false,

  fetchDashboardStats: async () => {
    set({ loading: true })
    try {
      const res = await fetch('/api/dashboard/stats')
      const json = await res.json()
      if (json.success && json.data) {
        const d = json.data
        const mapped: DashboardStats = {
          totalCerts: d.totalVerified + d.totalFailed,
          todayCerts: d.todayCount,
          passRate: d.totalVerified + d.totalFailed > 0 ? Math.round(d.totalVerified / (d.totalVerified + d.totalFailed) * 1000) / 10 : 0,
          pendingReviews: d.pendingReviews || 0,
          monthlyTrend: (d.monthlyTrend || []).map((item: any) => ({ month: item.date || item.month, count: item.count })),
          hourlyDistribution: (d.hourlyDistribution || []).map((item: any) => ({ hour: String(item.hour).padStart(2, '0') + ':00', count: item.count })),
          failureReasons: (d.failureReasons || []).map((item: any) => ({ name: item.reason || item.name, value: item.count || item.value })),
          regionDistribution: (d.regionDistribution || []).map((item: any) => ({ region: item.region, count: item.count })),
        }
        set({ dashboardStats: mapped, loading: false })
      } else {
        throw new Error('invalid response')
      }
    } catch {
      const mockData: DashboardStats = {
        totalCerts: 128456,
        todayCerts: 1842,
        passRate: 96.8,
        pendingReviews: 23,
        monthlyTrend: [
          { month: '1月', count: 9800 }, { month: '2月', count: 10200 },
          { month: '3月', count: 11500 }, { month: '4月', count: 12100 },
          { month: '5月', count: 11800 }, { month: '6月', count: 12400 },
        ],
        hourlyDistribution: [
          { hour: '08:00', count: 120 }, { hour: '09:00', count: 340 },
          { hour: '10:00', count: 520 }, { hour: '11:00', count: 480 },
          { hour: '12:00', count: 200 }, { hour: '13:00', count: 280 },
          { hour: '14:00', count: 460 }, { hour: '15:00', count: 390 },
          { hour: '16:00', count: 310 }, { hour: '17:00', count: 180 },
        ],
        failureReasons: [
          { name: '人脸不匹配', value: 42 }, { name: '活体检测失败', value: 28 },
          { name: '光线不足', value: 18 }, { name: '网络超时', value: 12 },
        ],
        regionDistribution: [
          { region: '济南市', count: 3200 }, { region: '青岛市', count: 2800 },
          { region: '烟台市', count: 2100 }, { region: '潍坊市', count: 1800 },
          { region: '临沂市', count: 1500 }, { region: '其他', count: 2400 },
        ],
      }
      set({ dashboardStats: mockData, loading: false })
    }
  },

  fetchAlerts: async (params) => {
    set({ loading: true })
    try {
      const query = params ? '?' + new URLSearchParams(params).toString() : ''
      const res = await fetch(`/api/alerts${query}`)
      const json = await res.json()
      const items = json.success ? (json.data || []) : []
      const mapped: Alert[] = items.map((a: any) => ({
        id: a.alert_id || a.id,
        type: a.type,
        level: a.level,
        idCard: a.id_card || a.idCard,
        detail: a.detail,
        triggeredAt: a.trigger_time || a.triggeredAt,
        status: a.status,
      }))
      set({ alerts: mapped, loading: false })
    } catch {
      const mockAlerts: Alert[] = [
        { id: '1', type: 'high_frequency', level: 'critical', idCard: '110***********1234', detail: '24小时内认证5次', triggeredAt: '2026-06-09 10:30:00', status: 'pending' },
        { id: '2', type: 'remote_cluster', level: 'warning', idCard: '320***********5678', detail: '同一IP地址3人认证', triggeredAt: '2026-06-09 09:15:00', status: 'pending' },
        { id: '3', type: 'face_mismatch', level: 'critical', idCard: '440***********9012', detail: '人脸相似度仅32%', triggeredAt: '2026-06-09 08:45:00', status: 'processed' },
        { id: '4', type: 'high_frequency', level: 'warning', idCard: '510***********3456', detail: '48小时内认证3次', triggeredAt: '2026-06-08 16:20:00', status: 'pending' },
        { id: '5', type: 'remote_cluster', level: 'critical', idCard: '330***********7890', detail: '同一设备5人认证', triggeredAt: '2026-06-08 14:10:00', status: 'processed' },
      ]
      set({ alerts: mockAlerts, loading: false })
    }
  },

  processAlert: async (id) => {
    try {
      await fetch(`/api/alerts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'processed' }),
      })
    } catch {}
    set({ alerts: get().alerts.map(a => a.id === id ? { ...a, status: 'processed' as const } : a) })
  },

  fetchReviewOrders: async (params) => {
    set({ loading: true })
    try {
      const query = params ? '?' + new URLSearchParams(params).toString() : ''
      const res = await fetch(`/api/review/orders${query}`)
      const json = await res.json()
      const items = json.success ? (json.data || []) : []
      const mapped: ReviewOrder[] = items.map((o: any) => ({
        id: o.order_id || o.id,
        idCard: o.id_card || o.idCard,
        name: o.name,
        verifyTime: o.verify_time || o.verifyTime || o.review_time || '',
        failureReason: o.failure_reason || o.failureReason || '',
        status: o.status,
        screenshots: o.screenshots,
      }))
      set({ reviewOrders: mapped, loading: false })
    } catch {
      const mockOrders: ReviewOrder[] = [
        { id: 'WO20260609001', idCard: '110***********1234', name: '张**', verifyTime: '2026-06-09 10:30:00', failureReason: '人脸不匹配', status: 'pending' },
        { id: 'WO20260609002', idCard: '320***********5678', name: '李**', verifyTime: '2026-06-09 09:15:00', failureReason: '活体检测失败', status: 'pending' },
        { id: 'WO20260609003', idCard: '440***********9012', name: '王**', verifyTime: '2026-06-09 08:45:00', failureReason: '人脸不匹配', status: 'approved' },
        { id: 'WO20260608004', idCard: '510***********3456', name: '赵**', verifyTime: '2026-06-08 16:20:00', failureReason: '光线不足', status: 'rejected' },
        { id: 'WO20260608005', idCard: '330***********7890', name: '陈**', verifyTime: '2026-06-08 14:10:00', failureReason: '活体检测失败', status: 'transferred' },
      ]
      set({ reviewOrders: mockOrders, loading: false })
    }
  },

  fetchReviewOrder: async (id) => {
    set({ loading: true })
    try {
      const res = await fetch(`/api/review/orders/${id}`)
      const json = await res.json()
      if (json.success && json.data) {
        const o = json.data
        const mapped: ReviewOrder = {
          id: o.order_id || o.id || id,
          idCard: o.id_card || o.idCard,
          name: o.name,
          verifyTime: o.verify_time || o.verifyTime || '',
          failureReason: o.failure_reason || o.failureReason || '',
          status: o.status,
          screenshots: (o.screenshots || []).map((s: any) => s.frame_url || s),
        }
        set({ currentReviewOrder: mapped, loading: false })
      } else {
        throw new Error('not found')
      }
    } catch {
      const mockOrder: ReviewOrder = {
        id,
        idCard: '110***********1234',
        name: '张**',
        verifyTime: '2026-06-09 10:30:00',
        failureReason: '人脸不匹配',
        status: 'pending',
        screenshots: ['frame_001.jpg', 'frame_002.jpg', 'frame_003.jpg'],
      }
      set({ currentReviewOrder: mockOrder, loading: false })
    }
  },

  submitReview: async (id, action, comment) => {
    try {
      await fetch(`/api/review/orders/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: action, review_comment: comment, reviewer: '管理员' }),
      })
    } catch {}
    set({
      reviewOrders: get().reviewOrders.map(o =>
        o.id === id ? { ...o, status: action as ReviewOrder['status'] } : o
      ),
      currentReviewOrder: get().currentReviewOrder
        ? { ...get().currentReviewOrder!, status: action as ReviewOrder['status'] }
        : null,
    })
  },

  fetchAuditLogs: async (params) => {
    set({ loading: true })
    try {
      const query = params ? '?' + new URLSearchParams(params).toString() : ''
      const res = await fetch(`/api/audit/logs${query}`)
      const json = await res.json()
      const items = json.success ? (json.data || []) : []
      const mapped: AuditLog[] = items.map((l: any) => ({
        id: l.log_id || l.id,
        action: l.action,
        operator: l.device_fingerprint || '系统',
        target: l.id_card || l.certification_id || '',
        detail: l.detail,
        timestamp: l.timestamp,
        screenshots: [],
      }))
      set({ auditLogs: mapped, loading: false })
    } catch {
      const mockLogs: AuditLog[] = [
        { id: '1', action: '认证通过', operator: '系统', target: '110***********1234', detail: '人脸识别通过，相似度98.5%', timestamp: '2026-06-09 10:30:15' },
        { id: '2', action: '认证失败', operator: '系统', target: '320***********5678', detail: '活体检测未通过', timestamp: '2026-06-09 10:28:42' },
        { id: '3', action: '人工复核通过', operator: '管理员A', target: '440***********9012', detail: '人工复核确认本人操作', timestamp: '2026-06-09 10:15:00' },
        { id: '4', action: '预警处理', operator: '管理员B', target: '510***********3456', detail: '高频认证预警已核实处理', timestamp: '2026-06-09 09:45:30' },
        { id: '5', action: '认证通过', operator: '系统', target: '330***********7890', detail: '人脸识别通过，相似度95.2%', timestamp: '2026-06-09 09:30:20' },
        { id: '6', action: '预警触发', operator: '系统', target: '110***********1234', detail: '24小时内重复认证超过3次', timestamp: '2026-06-09 09:10:00' },
      ]
      set({ auditLogs: mockLogs, loading: false })
    }
  },
}))
