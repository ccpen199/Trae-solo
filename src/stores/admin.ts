import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { ServiceMonitor, Report, ReportType, PageParams, PageResult } from '@/types'
import {
  getDashboardStats,
  getMonitorList,
  getMonitorById,
  getMonitorAlerts,
  getReportList,
  getReportById,
  generateReport,
  exportReport,
  getAdminStats
} from '@/api/admin'

interface DashboardData {
  overview: {
    totalUsers: number
    todayApplications: number
    todayTickets: number
    avgRating: number
    completionRate: number
  }
  applicationTrend: Array<{ date: string; count: number; completed: number }>
  ticketTrend: Array<{ date: string; count: number; resolved: number }>
  departmentDistribution: Array<{ name: string; value: number }>
  categoryDistribution: Array<{ name: string; value: number }>
}

interface AdminStatsData {
  applications: { total: number; processing: number; completed: number; pending: number; rejected: number; avgDays: number }
  tickets: { total: number; submitted: number; processing: number; resolved: number; closed: number; overdue: number; avgHours: number }
  evaluations: { total: number; avgRating: number; goodRate: number; badCount: number; rectifiedCount: number }
  users: { total: number; citizen: number; enterprise: number; department: number; verified: number; todayActive: number }
}

interface MonitorAlert {
  id: string
  monitorId: string
  monitorName: string
  level: 'info' | 'warning' | 'critical'
  title: string
  message: string
  status: 'active' | 'acknowledged' | 'resolved'
  createTime: string
}

export const useAdminStore = defineStore('admin', () => {
  const dashboard = ref<DashboardData | null>(null)
  const adminStats = ref<AdminStatsData | null>(null)
  const monitors = ref<ServiceMonitor[]>([])
  const currentMonitor = ref<ServiceMonitor | null>(null)
  const alerts = ref<MonitorAlert[]>([])
  const reports = ref<Report[]>([])
  const currentReport = ref<Report | null>(null)
  const monitorPagination = ref({ page: 1, pageSize: 20, total: 0, totalPages: 0 })
  const reportPagination = ref({ page: 1, pageSize: 10, total: 0, totalPages: 0 })
  const loading = ref(false)
  const error = ref<string | null>(null)

  const healthyMonitors = computed(() => monitors.value.filter(m => m.status === 'healthy'))
  const warningMonitors = computed(() => monitors.value.filter(m => m.status === 'warning'))
  const criticalMonitors = computed(() => monitors.value.filter(m => m.status === 'critical'))
  const offlineMonitors = computed(() => monitors.value.filter(m => m.status === 'offline'))
  const activeAlerts = computed(() => alerts.value.filter(a => a.status !== 'resolved'))
  const criticalAlerts = computed(() => alerts.value.filter(a => a.level === 'critical' && a.status === 'active'))

  async function fetchDashboard(): Promise<DashboardData | null> {
    loading.value = true
    error.value = null
    try {
      const res = await getDashboardStats()
      if (res.code === 0 && res.data) {
        dashboard.value = res.data
        return res.data
      }
      throw new Error(res.message || '获取仪表盘数据失败')
    } catch (e: any) {
      error.value = e.message
      return null
    } finally {
      loading.value = false
    }
  }

  async function fetchAdminStats(): Promise<AdminStatsData | null> {
    loading.value = true
    error.value = null
    try {
      const res = await getAdminStats()
      if (res.code === 0 && res.data) {
        adminStats.value = res.data
        return res.data
      }
      throw new Error(res.message || '获取管理统计失败')
    } catch (e: any) {
      error.value = e.message
      return null
    } finally {
      loading.value = false
    }
  }

  async function fetchMonitors(params?: PageParams & { status?: string; departmentId?: string }): Promise<PageResult<ServiceMonitor>> {
    loading.value = true
    error.value = null
    try {
      const res = await getMonitorList(params)
      if (res.code === 0 && res.data) {
        monitors.value = res.data.list
        monitorPagination.value = {
          page: res.data.page,
          pageSize: res.data.pageSize,
          total: res.data.total,
          totalPages: res.data.totalPages
        }
        return res.data
      }
      throw new Error(res.message || '获取监控列表失败')
    } catch (e: any) {
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function fetchMonitorDetail(id: string): Promise<ServiceMonitor | null> {
    loading.value = true
    error.value = null
    try {
      const res = await getMonitorById(id)
      if (res.code === 0) {
        currentMonitor.value = res.data
        return res.data
      }
      throw new Error(res.message || '获取监控详情失败')
    } catch (e: any) {
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function fetchAlerts(monitorId?: string): Promise<MonitorAlert[]> {
    loading.value = true
    error.value = null
    try {
      const res = await getMonitorAlerts(monitorId)
      if (res.code === 0 && res.data) {
        alerts.value = res.data
        return res.data
      }
      throw new Error(res.message || '获取告警列表失败')
    } catch (e: any) {
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function fetchReports(params: PageParams & { type?: ReportType; period?: string }): Promise<PageResult<Report>> {
    loading.value = true
    error.value = null
    try {
      const res = await getReportList(params)
      if (res.code === 0 && res.data) {
        reports.value = res.data.list
        reportPagination.value = {
          page: res.data.page,
          pageSize: res.data.pageSize,
          total: res.data.total,
          totalPages: res.data.totalPages
        }
        return res.data
      }
      throw new Error(res.message || '获取报告列表失败')
    } catch (e: any) {
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function fetchReportDetail(id: string): Promise<Report | null> {
    loading.value = true
    error.value = null
    try {
      const res = await getReportById(id)
      if (res.code === 0) {
        currentReport.value = res.data
        return res.data
      }
      throw new Error(res.message || '获取报告详情失败')
    } catch (e: any) {
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function doGenerateReport(type: ReportType, startDate: string, endDate: string): Promise<Report> {
    loading.value = true
    error.value = null
    try {
      const res = await generateReport(type, startDate, endDate)
      if (res.code === 0 && res.data) {
        reports.value.unshift(res.data)
        return res.data
      }
      throw new Error(res.message || '生成报告失败')
    } catch (e: any) {
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  async function doExportReport(id: string, format: 'pdf' | 'excel' = 'pdf'): Promise<{ url: string; filename: string }> {
    loading.value = true
    error.value = null
    try {
      const res = await exportReport(id, format)
      if (res.code === 0 && res.data) {
        return res.data
      }
      throw new Error(res.message || '导出报告失败')
    } catch (e: any) {
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  function setCurrentMonitor(monitor: ServiceMonitor | null) {
    currentMonitor.value = monitor
  }

  function setCurrentReport(report: Report | null) {
    currentReport.value = report
  }

  return {
    dashboard,
    adminStats,
    monitors,
    currentMonitor,
    alerts,
    reports,
    currentReport,
    monitorPagination,
    reportPagination,
    loading,
    error,
    healthyMonitors,
    warningMonitors,
    criticalMonitors,
    offlineMonitors,
    activeAlerts,
    criticalAlerts,
    fetchDashboard,
    fetchAdminStats,
    fetchMonitors,
    fetchMonitorDetail,
    fetchAlerts,
    fetchReports,
    fetchReportDetail,
    doGenerateReport,
    doExportReport,
    setCurrentMonitor,
    setCurrentReport
  }
})
