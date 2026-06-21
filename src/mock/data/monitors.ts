import type { ServiceMonitor, MonitorAlert, MonitorDetail, AlertRule, SystemMetrics, ApiEndpoint } from '@/types'
import { generateId } from '@/utils'

const generateResponseTrend = (baseTime: string, baseValue: number, days: number) => {
  const result: { time: string; p50: number; p95: number; p99: number }[] = []
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(baseTime)
    date.setDate(date.getDate() - i)
    const variation = (Math.random() - 0.5) * 0.4
    const p50 = Math.round(baseValue * (1 + variation * 0.3))
    const p95 = Math.round(baseValue * 1.8 * (1 + variation * 0.5))
    const p99 = Math.round(baseValue * 3 * (1 + variation * 0.6))
    result.push({
      time: `${date.getMonth() + 1}/${date.getDate()}`,
      p50,
      p95,
      p99
    })
  }
  return result
}

const generateEndpoints = (count: number, baseCalls: number) => {
  const endpoints: ApiEndpoint[] = []
  const names = [
    '获取列表', '获取详情', '创建申请', '提交审核', '查询状态',
    '上传材料', '下载文件', '发送通知', '用户认证', '数据同步',
    '统计查询', '导出报表', '缓存刷新', '日志查询', '配置读取'
  ]
  const paths = [
    '/api/list', '/api/detail', '/api/create', '/api/submit', '/api/status',
    '/api/upload', '/api/download', '/api/notify', '/api/auth', '/api/sync',
    '/api/stats', '/api/export', '/api/cache/refresh', '/api/logs', '/api/config'
  ]
  for (let i = 0; i < Math.min(count, names.length); i++) {
    const callCount = Math.round(baseCalls * (1 + (Math.random() - 0.5) * 0.8))
    const successRate = 95 + Math.random() * 5
    const avgResponse = 50 + Math.random() * 200
    endpoints.push({
      id: 'ep_' + (i + 1).toString().padStart(3, '0'),
      name: names[i],
      path: paths[i],
      method: i % 3 === 0 ? 'POST' : 'GET',
      callCount,
      successCount: Math.round(callCount * successRate / 100),
      failCount: callCount - Math.round(callCount * successRate / 100),
      successRate: Math.round(successRate * 100) / 100,
      avgResponseTime: Math.round(avgResponse),
      p50ResponseTime: Math.round(avgResponse * 0.7),
      p95ResponseTime: Math.round(avgResponse * 1.8),
      p99ResponseTime: Math.round(avgResponse * 3)
    })
  }
  return endpoints.sort((a, b) => b.callCount - a.callCount)
}

const managers = [
  { name: '张建国', phone: '13800138001' },
  { name: '李志强', phone: '13800138002' },
  { name: '王晓东', phone: '13800138003' },
  { name: '陈海涛', phone: '13800138004' },
  { name: '刘明军', phone: '13800138005' }
]

export const mockMonitors: ServiceMonitor[] = [
  {
    id: 'm_001',
    name: '社保业务系统',
    departmentId: 'd_001',
    departmentName: '抚州市人力资源和社会保障局',
    status: 'healthy',
    availability: 99.98,
    avgResponseTime: 125,
    p99ResponseTime: 320,
    errorRate: 0.02,
    totalRequests: 156820,
    successRequests: 156789,
    failedRequests: 31,
    lastCheckTime: '2024-01-15 10:30:00',
    lastSuccessTime: '2024-01-15 10:30:00',
    warningThreshold: 500,
    criticalThreshold: 1000,
    alerts: []
  },
  {
    id: 'm_002',
    name: '医保业务系统',
    departmentId: 'd_002',
    departmentName: '抚州市医疗保障局',
    status: 'healthy',
    availability: 99.95,
    avgResponseTime: 156,
    p99ResponseTime: 420,
    errorRate: 0.05,
    totalRequests: 203450,
    successRequests: 203348,
    failedRequests: 102,
    lastCheckTime: '2024-01-15 10:30:00',
    lastSuccessTime: '2024-01-15 10:30:00',
    warningThreshold: 600,
    criticalThreshold: 1200,
    alerts: []
  },
  {
    id: 'm_003',
    name: '教育报名系统',
    departmentId: 'd_003',
    departmentName: '抚州市教育体育局',
    status: 'warning',
    availability: 98.50,
    avgResponseTime: 680,
    p99ResponseTime: 1580,
    errorRate: 1.50,
    totalRequests: 89560,
    successRequests: 88217,
    failedRequests: 1343,
    lastCheckTime: '2024-01-15 10:30:00',
    lastSuccessTime: '2024-01-15 10:28:00',
    lastFailTime: '2024-01-15 10:25:00',
    lastErrorMessage: '数据库查询超时',
    warningThreshold: 500,
    criticalThreshold: 1000,
    alerts: [
      {
        id: 'ma_001',
        monitorId: 'm_003',
        level: 'warning',
        title: '教育报名系统响应时间偏高',
        message: '系统平均响应时间达到680ms，超过500ms阈值',
        status: 'active',
        createTime: '2024-01-15 09:45:00'
      },
      {
        id: 'ma_002',
        monitorId: 'm_003',
        level: 'warning',
        title: '教育报名系统错误率偏高',
        message: '系统错误率达到1.5%，请及时排查',
        status: 'acknowledged',
        createTime: '2024-01-15 10:00:00',
        resolver: '系统管理员'
      }
    ]
  },
  {
    id: 'm_004',
    name: '公积金业务系统',
    departmentId: 'd_004',
    departmentName: '抚州市住房公积金管理中心',
    status: 'healthy',
    availability: 99.92,
    avgResponseTime: 185,
    p99ResponseTime: 480,
    errorRate: 0.08,
    totalRequests: 178920,
    successRequests: 178777,
    failedRequests: 143,
    lastCheckTime: '2024-01-15 10:30:00',
    lastSuccessTime: '2024-01-15 10:30:00',
    warningThreshold: 500,
    criticalThreshold: 1000,
    alerts: []
  },
  {
    id: 'm_005',
    name: '交通业务系统',
    departmentId: 'd_005',
    departmentName: '抚州市交通运输局',
    status: 'healthy',
    availability: 99.85,
    avgResponseTime: 210,
    p99ResponseTime: 520,
    errorRate: 0.15,
    totalRequests: 95680,
    successRequests: 95537,
    failedRequests: 143,
    lastCheckTime: '2024-01-15 10:30:00',
    lastSuccessTime: '2024-01-15 10:30:00',
    warningThreshold: 600,
    criticalThreshold: 1200,
    alerts: []
  },
  {
    id: 'm_006',
    name: '文旅预约系统',
    departmentId: 'd_006',
    departmentName: '抚州市文化广电新闻出版旅游局',
    status: 'critical',
    availability: 85.60,
    avgResponseTime: 2150,
    p99ResponseTime: 5800,
    errorRate: 14.40,
    totalRequests: 42350,
    successRequests: 36255,
    failedRequests: 6095,
    lastCheckTime: '2024-01-15 10:30:00',
    lastSuccessTime: '2024-01-15 10:15:00',
    lastFailTime: '2024-01-15 10:29:00',
    lastErrorMessage: '服务连接超时 (504 Gateway Timeout)',
    warningThreshold: 800,
    criticalThreshold: 2000,
    alerts: [
      {
        id: 'ma_003',
        monitorId: 'm_006',
        level: 'critical',
        title: '文旅预约系统严重故障',
        message: '系统可用性降至85.6%，大量用户无法正常访问',
        status: 'active',
        createTime: '2024-01-15 09:30:00'
      },
      {
        id: 'ma_004',
        monitorId: 'm_006',
        level: 'critical',
        title: '文旅预约系统响应时间严重超标',
        message: 'P99响应时间达到5800ms，严重影响用户体验',
        status: 'active',
        createTime: '2024-01-15 09:35:00'
      }
    ]
  },
  {
    id: 'm_007',
    name: '民政业务系统',
    departmentId: 'd_007',
    departmentName: '抚州市民政局',
    status: 'healthy',
    availability: 99.90,
    avgResponseTime: 145,
    p99ResponseTime: 380,
    errorRate: 0.10,
    totalRequests: 67890,
    successRequests: 67822,
    failedRequests: 68,
    lastCheckTime: '2024-01-15 10:30:00',
    lastSuccessTime: '2024-01-15 10:30:00',
    warningThreshold: 500,
    criticalThreshold: 1000,
    alerts: []
  },
  {
    id: 'm_008',
    name: '税务征管系统',
    departmentId: 'd_008',
    departmentName: '国家税务总局抚州市税务局',
    status: 'healthy',
    availability: 99.99,
    avgResponseTime: 95,
    p99ResponseTime: 250,
    errorRate: 0.01,
    totalRequests: 312560,
    successRequests: 312529,
    failedRequests: 31,
    lastCheckTime: '2024-01-15 10:30:00',
    lastSuccessTime: '2024-01-15 10:30:00',
    warningThreshold: 400,
    criticalThreshold: 800,
    alerts: []
  },
  {
    id: 'm_009',
    name: '市场监管系统',
    departmentId: 'd_009',
    departmentName: '抚州市市场监督管理局',
    status: 'warning',
    availability: 97.20,
    avgResponseTime: 580,
    p99ResponseTime: 1280,
    errorRate: 2.80,
    totalRequests: 112680,
    successRequests: 109525,
    failedRequests: 3155,
    lastCheckTime: '2024-01-15 10:30:00',
    lastSuccessTime: '2024-01-15 10:29:00',
    lastFailTime: '2024-01-15 10:20:00',
    lastErrorMessage: '接口限流，请稍后重试',
    warningThreshold: 500,
    criticalThreshold: 1000,
    alerts: [
      {
        id: 'ma_005',
        monitorId: 'm_009',
        level: 'warning',
        title: '市场监管系统错误率偏高',
        message: '系统错误率达到2.8%，主要原因为接口限流',
        status: 'acknowledged',
        createTime: '2024-01-15 08:30:00',
        resolver: '系统管理员'
      }
    ]
  },
  {
    id: 'm_010',
    name: '公安户政系统',
    departmentId: 'd_010',
    departmentName: '抚州市公安局',
    status: 'offline',
    availability: 0,
    avgResponseTime: 0,
    p99ResponseTime: 0,
    errorRate: 100,
    totalRequests: 2890,
    successRequests: 0,
    failedRequests: 2890,
    lastCheckTime: '2024-01-15 10:30:00',
    lastSuccessTime: '2024-01-15 06:00:00',
    lastFailTime: '2024-01-15 06:15:00',
    lastErrorMessage: '数据库服务不可用 - 计划维护',
    warningThreshold: 500,
    criticalThreshold: 1000,
    alerts: [
      {
        id: 'ma_006',
        monitorId: 'm_010',
        level: 'info',
        title: '公安户政系统计划维护',
        message: '系统定于2024-01-15 06:00-12:00进行计划维护，期间服务暂停',
        status: 'acknowledged',
        createTime: '2024-01-14 18:00:00',
        resolver: '系统管理员'
      }
    ]
  },
  {
    id: 'm_011',
    name: '司法服务系统',
    departmentId: 'd_011',
    departmentName: '抚州市司法局',
    status: 'healthy',
    availability: 99.80,
    avgResponseTime: 195,
    p99ResponseTime: 450,
    errorRate: 0.20,
    totalRequests: 34560,
    successRequests: 34491,
    failedRequests: 69,
    lastCheckTime: '2024-01-15 10:30:00',
    lastSuccessTime: '2024-01-15 10:30:00',
    warningThreshold: 600,
    criticalThreshold: 1200,
    alerts: []
  },
  {
    id: 'm_012',
    name: '卫健业务系统',
    departmentId: 'd_012',
    departmentName: '抚州市卫生健康委员会',
    status: 'healthy',
    availability: 99.75,
    avgResponseTime: 220,
    p99ResponseTime: 560,
    errorRate: 0.25,
    totalRequests: 78920,
    successRequests: 78723,
    failedRequests: 197,
    lastCheckTime: '2024-01-15 10:30:00',
    lastSuccessTime: '2024-01-15 10:30:00',
    warningThreshold: 700,
    criticalThreshold: 1400,
    alerts: []
  }
]

export const mockMonitorDetails: Record<string, MonitorDetail> = {}

mockMonitors.forEach((monitor, index) => {
  const mgr = managers[index % managers.length]
  mockMonitorDetails[monitor.id] = {
    ...monitor,
    manager: mgr.name,
    managerPhone: mgr.phone,
    launchTime: `2022-0${(index % 9) + 1}-15 09:00:00`,
    serverAddress: `192.168.${index + 10}.${(index % 5) + 100}:8080`,
    metrics: {
      cpuUsage: 30 + Math.round(Math.random() * 40),
      memoryUsage: 40 + Math.round(Math.random() * 35),
      diskUsage: 50 + Math.round(Math.random() * 30),
      networkIn: Math.round(100 + Math.random() * 500),
      networkOut: Math.round(50 + Math.random() * 300)
    } as SystemMetrics,
    endpoints: generateEndpoints(10, monitor.totalRequests / 30),
    responseTrend: generateResponseTrend('2024-01-15', monitor.avgResponseTime, 7),
    errorTrend: Array.from({ length: 7 }, (_, i) => {
      const date = new Date('2024-01-15')
      date.setDate(date.getDate() - (6 - i))
      return {
        time: `${date.getMonth() + 1}/${date.getDate()}`,
        errorRate: Math.max(0, monitor.errorRate * (0.8 + Math.random() * 0.4))
      }
    }),
    topErrors: [
      { endpoint: '创建申请', count: Math.round(monitor.failedRequests * 0.35), rate: 2.5 + Math.random() * 2 },
      { endpoint: '提交审核', count: Math.round(monitor.failedRequests * 0.25), rate: 1.8 + Math.random() * 1.5 },
      { endpoint: '上传材料', count: Math.round(monitor.failedRequests * 0.2), rate: 1.5 + Math.random() * 1 },
      { endpoint: '数据同步', count: Math.round(monitor.failedRequests * 0.12), rate: 1 + Math.random() * 0.8 },
      { endpoint: '查询状态', count: Math.round(monitor.failedRequests * 0.08), rate: 0.5 + Math.random() * 0.5 }
    ],
    alertHistory: [
      {
        id: 'mah_001_' + index,
        monitorId: monitor.id,
        level: 'warning',
        title: `${monitor.name}响应时间偏高`,
        message: '系统平均响应时间超过警告阈值',
        status: 'resolved',
        createTime: '2024-01-14 14:30:00',
        resolveTime: '2024-01-14 15:10:00',
        resolver: '系统管理员'
      },
      {
        id: 'mah_002_' + index,
        monitorId: monitor.id,
        level: 'info',
        title: `${monitor.name}计划维护通知`,
        message: '系统将于本周六凌晨进行例行维护',
        status: 'resolved',
        createTime: '2024-01-12 09:00:00',
        resolveTime: '2024-01-12 09:00:00',
        resolver: '系统管理员'
      },
      ...(monitor.alerts || [])
    ]
  }
})

export const mockAlertRules: AlertRule[] = mockMonitors.map((m, i) => ({
  id: 'ar_' + (i + 1).toString().padStart(3, '0'),
  monitorId: m.id,
  monitorName: m.name,
  responseTimeWarning: m.warningThreshold,
  responseTimeCritical: m.criticalThreshold,
  errorRateWarning: 1,
  errorRateCritical: 5,
  availabilityWarning: 97,
  availabilityCritical: 90,
  notifySms: true,
  notifyEmail: true,
  notifySite: true
}))
