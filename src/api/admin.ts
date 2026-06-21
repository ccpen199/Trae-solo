import type { ApiResponse, ServiceMonitor, Report, PageParams, PageResult, ReportType } from '@/types'
import { mockMonitors } from '@/mock/data/monitors'
import { mockReports } from '@/mock/data/reports'
import { mockApplications } from '@/mock/data/applications'
import { mockTickets } from '@/mock/data/tickets'
import { mockEvaluations } from '@/mock/data/evaluations'
import { mockUsers } from '@/mock/data/users'
import { sleep, paginate, generateId } from '@/utils'

function success<T>(data: T): ApiResponse<T> {
  return {
    code: 0,
    message: 'success',
    data,
    timestamp: Date.now(),
    traceId: generateId()
  }
}

export async function getDashboardStats(): Promise<ApiResponse<{
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
}>> {
  await sleep(400)
  const rated = mockEvaluations.filter(e => e.overallRating > 0)
  const avgRating = rated.length > 0 ? rated.reduce((s, e) => s + e.overallRating, 0) / rated.length : 0
  const completed = mockApplications.filter(a => a.status === 'completed').length
  const dates = ['01-09', '01-10', '01-11', '01-12', '01-13', '01-14', '01-15']
  return success({
    overview: {
      totalUsers: mockUsers.length,
      todayApplications: 1234,
      todayTickets: 178,
      avgRating: Number(avgRating.toFixed(2)),
      completionRate: Number(((completed / mockApplications.length) * 100).toFixed(1))
    },
    applicationTrend: dates.map((d, i) => ({ date: d, count: 800 + i * 120, completed: 700 + i * 100 })),
    ticketTrend: dates.map((d, i) => ({ date: d, count: 100 + i * 20, resolved: 90 + i * 18 })),
    departmentDistribution: [
      { name: '市人社局', value: 6780 },
      { name: '市医保局', value: 5860 },
      { name: '市公积金中心', value: 4520 },
      { name: '市教体局', value: 3890 },
      { name: '市公安局', value: 3450 },
      { name: '其他部门', value: 5200 }
    ],
    categoryDistribution: [
      { name: '社会保障', value: 25 },
      { name: '医疗保险', value: 22 },
      { name: '住房公积金', value: 18 },
      { name: '教育服务', value: 12 },
      { name: '交通出行', value: 10 },
      { name: '其他', value: 13 }
    ]
  })
}

export async function getMonitorList(params?: PageParams & { status?: string; departmentId?: string }): Promise<ApiResponse<PageResult<ServiceMonitor>>> {
  await sleep(300)
  let list = [...mockMonitors]
  if (params?.status) {
    list = list.filter(m => m.status === params.status)
  }
  if (params?.departmentId) {
    list = list.filter(m => m.departmentId === params.departmentId)
  }
  const page = params?.page || 1
  const pageSize = params?.pageSize || 20
  return success(paginate(list, page, pageSize))
}

export async function getMonitorById(id: string): Promise<ApiResponse<ServiceMonitor | null>> {
  await sleep(200)
  const m = mockMonitors.find(x => x.id === id) || null
  return success(m)
}

export async function getMonitorAlerts(monitorId?: string): Promise<ApiResponse<Array<{
  id: string
  monitorId: string
  monitorName: string
  level: 'info' | 'warning' | 'critical'
  title: string
  message: string
  status: 'active' | 'acknowledged' | 'resolved'
  createTime: string
}>>> {
  await sleep(300)
  const allAlerts: Array<any> = []
  mockMonitors.forEach(m => {
    if (!monitorId || m.id === monitorId) {
      m.alerts.forEach(a => {
        allAlerts.push({ ...a, monitorId: m.id, monitorName: m.name })
      })
    }
  })
  return success(allAlerts)
}

export async function getReportList(params: PageParams & { type?: ReportType; period?: string }): Promise<ApiResponse<PageResult<Report>>> {
  await sleep(400)
  let list = [...mockReports]
  if (params.type) {
    list = list.filter(r => r.type === params.type)
  }
  return success(paginate(list, params.page, params.pageSize))
}

export async function getReportById(id: string): Promise<ApiResponse<Report | null>> {
  await sleep(300)
  const report = mockReports.find(r => r.id === id) || null
  return success(report)
}

export async function generateReport(type: ReportType, startDate: string, endDate: string): Promise<ApiResponse<Report>> {
  await sleep(1500)
  const report = mockReports[0] || {
    id: 'r_new',
    title: '新生成的报告',
    type,
    period: `${startDate} ~ ${endDate}`,
    startDate,
    endDate,
    summary: {
      totalApplications: 0, completedApplications: 0, completionRate: 0, avgProcessingDays: 0,
      totalTickets: 0, completedTickets: 0, avgTicketHours: 0, avgRating: 0, totalEvaluations: 0, goodRate: 0
    },
    departmentRankings: [],
    serviceRankings: [],
    trendData: [],
    hotIssues: [],
    recommendations: [],
    creator: '系统管理员',
    createTime: new Date().toISOString().replace('T', ' ').slice(0, 19)
  }
  return success(report)
}

export async function exportReport(id: string, format: 'pdf' | 'excel' = 'pdf'): Promise<ApiResponse<{ url: string; filename: string }>> {
  await sleep(600)
  return success({
    url: `/api/reports/${id}/export`,
    filename: `效能报告_${id}.${format}`
  })
}

export async function getAdminStats(): Promise<ApiResponse<{
  applications: { total: number; processing: number; completed: number; pending: number; rejected: number; avgDays: number }
  tickets: { total: number; submitted: number; processing: number; resolved: number; closed: number; overdue: number; avgHours: number }
  evaluations: { total: number; avgRating: number; goodRate: number; badCount: number; rectifiedCount: number }
  users: { total: number; citizen: number; enterprise: number; department: number; verified: number; todayActive: number }
}>> {
  await sleep(400)
  const apps = mockApplications
  const ticks = mockTickets
  const evals = mockEvaluations
  const users = mockUsers
  const completedApps = apps.filter(a => a.status === 'completed')
  const ratedEvals = evals.filter(e => e.overallRating > 0)
  const avgRating = ratedEvals.length > 0 ? ratedEvals.reduce((s, e) => s + e.overallRating, 0) / ratedEvals.length : 0
  const goodRate = ratedEvals.length > 0 ? (ratedEvals.filter(e => e.overallRating >= 4).length / ratedEvals.length) * 100 : 0

  return success({
    applications: {
      total: apps.length,
      processing: apps.filter(a => ['submitted', 'accepted', 'reviewing', 'approved'].includes(a.status)).length,
      completed: completedApps.length,
      pending: apps.filter(a => a.status === 'supplement').length,
      rejected: apps.filter(a => a.status === 'rejected').length,
      avgDays: 2.3
    },
    tickets: {
      total: ticks.length,
      submitted: ticks.filter(t => t.status === 'pending' || t.status === 'assigned').length,
      processing: ticks.filter(t => t.status === 'processing' || t.status === 'replied').length,
      resolved: ticks.filter(t => t.status === 'completed').length,
      closed: ticks.filter(t => t.status === 'closed').length,
      overdue: ticks.filter(t => t.isOverdue).length,
      avgHours: 4.5
    },
    evaluations: {
      total: evals.length,
      avgRating: Number(avgRating.toFixed(2)),
      goodRate: Number(goodRate.toFixed(1)),
      badCount: evals.filter(e => e.overallRating <= 2).length,
      rectifiedCount: evals.filter(e => e.isRectified).length
    },
    users: {
      total: users.length,
      citizen: users.filter(u => u.role === 'citizen').length,
      enterprise: users.filter(u => u.role === 'enterprise').length,
      department: users.filter(u => u.role === 'department_admin').length,
      verified: users.filter(u => u.verified).length,
      todayActive: 256
    }
  })
}
