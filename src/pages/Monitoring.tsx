import { useState, useEffect, useMemo } from 'react'
import {
  AlertTriangle,
  Thermometer,
  Droplets,
  Navigation,
  Clock,
  Package,
  Snowflake,
  TrendingUp,
  Eye,
  CheckCircle,
  XCircle,
  Settings,
  Edit2,
  X,
  Bell,
  Filter,
  Search,
} from 'lucide-react'
import StatCard from '@/components/StatCard'
import RouteMap from '@/components/RouteMap'
import Chart from '@/components/Chart'
import StatusBadge from '@/components/StatusBadge'
import DataTable from '@/components/DataTable'
import { api } from '@/utils/api'

type TabType = 'realtime' | 'alerts' | 'config'
type AlertType = 'all' | 'temperature' | 'humidity' | 'route' | 'delay'
type AlertSeverity = 'all' | 'danger' | 'warning' | 'info'
type AlertStatus = 'pending' | 'processed' | 'ignored'

interface TrackingOrder {
  id: string
  orderNo: string
  fromCity: string
  toCity: string
  driver: string
  cargoType: string
  status: 'in_transit' | 'pickup' | 'delivered'
  temp?: number
  humidity?: number
  progress: number
  tempRange: { min: number; max: number }
  humidRange: { min: number; max: number }
  departureTime: string
  estimatedArrival: string
}

interface Alert {
  id: string
  type: 'temperature' | 'humidity' | 'delay' | 'route' | 'system'
  message: string
  severity: 'danger' | 'warning' | 'info'
  time: string
  orderId: string
  orderNo: string
  status: AlertStatus
  description: string
  handler?: string
  handleTime?: string
  handleNote?: string
}

interface SensorData {
  labels: string[]
  values: number[]
}

interface CargoConfig {
  id: string
  type: string
  tempMin: number
  tempMax: number
  humidMin: number
  humidMax: number
  needRecorder: boolean
}

interface AlertRule {
  id: string
  name: string
  condition: string
  duration: number
  unit: 'minute' | 'hour'
  severity: 'danger' | 'warning' | 'info'
  enabled: boolean
}

const mapNodes = [
  { x: 0.55, y: 0.35, label: '上海' },
  { x: 0.60, y: 0.50, label: '杭州' },
  { x: 0.58, y: 0.65, label: '广州' },
  { x: 0.57, y: 0.68, label: '深圳' },
  { x: 0.45, y: 0.50, label: '武汉' },
  { x: 0.48, y: 0.60, label: '长沙' },
  { x: 0.52, y: 0.22, label: '北京' },
  { x: 0.50, y: 0.25, label: '天津' },
  { x: 0.35, y: 0.45, label: '成都' },
  { x: 0.62, y: 0.42, label: '南京' },
]

const cityIdx: Record<string, number> = {}
mapNodes.forEach((n, i) => {
  cityIdx[n.label] = i
})

const defaultTracking: TrackingOrder[] = [
  {
    id: '1',
    orderNo: 'CD20240601001',
    fromCity: '上海',
    toCity: '杭州',
    driver: '张伟',
    cargoType: '生鲜',
    status: 'in_transit',
    temp: 4.2,
    humidity: 85,
    progress: 65,
    tempRange: { min: 2, max: 8 },
    humidRange: { min: 70, max: 90 },
    departureTime: '2024-06-01 08:30',
    estimatedArrival: '2024-06-01 14:30',
  },
  {
    id: '2',
    orderNo: 'CD20240601002',
    fromCity: '广州',
    toCity: '深圳',
    driver: '李强',
    cargoType: '冷冻品',
    status: 'in_transit',
    temp: -18.5,
    humidity: 72,
    progress: 40,
    tempRange: { min: -25, max: -15 },
    humidRange: { min: 60, max: 80 },
    departureTime: '2024-06-01 09:00',
    estimatedArrival: '2024-06-01 11:30',
  },
  {
    id: '3',
    orderNo: 'CD20240601003',
    fromCity: '武汉',
    toCity: '长沙',
    driver: '王刚',
    cargoType: '医药',
    status: 'in_transit',
    temp: 6.8,
    humidity: 78,
    progress: 80,
    tempRange: { min: 2, max: 8 },
    humidRange: { min: 65, max: 85 },
    departureTime: '2024-06-01 07:00',
    estimatedArrival: '2024-06-01 12:00',
  },
  {
    id: '4',
    orderNo: 'CD20240601004',
    fromCity: '北京',
    toCity: '天津',
    driver: '赵军',
    cargoType: '乳制品',
    status: 'in_transit',
    temp: 5.2,
    humidity: 82,
    progress: 55,
    tempRange: { min: 2, max: 6 },
    humidRange: { min: 75, max: 90 },
    departureTime: '2024-06-01 10:00',
    estimatedArrival: '2024-06-01 12:30',
  },
  {
    id: '5',
    orderNo: 'CD20240601005',
    fromCity: '成都',
    toCity: '南京',
    driver: '孙明',
    cargoType: '冷链',
    status: 'in_transit',
    temp: 3.5,
    humidity: 88,
    progress: 30,
    tempRange: { min: 0, max: 8 },
    humidRange: { min: 70, max: 95 },
    departureTime: '2024-06-01 06:00',
    estimatedArrival: '2024-06-02 18:00',
  },
]

const defaultAlerts: Alert[] = [
  {
    id: 'a1',
    type: 'temperature',
    message: '温度异常',
    description: '订单 #CD20240601001 温度持续偏高，当前 7.8°C，标准范围 2-8°C，已持续 35 分钟',
    severity: 'warning',
    time: '2分钟前',
    orderId: '1',
    orderNo: 'CD20240601001',
    status: 'pending',
  },
  {
    id: 'a2',
    type: 'delay',
    message: '预计延迟',
    description: '订单 #CD20240601003 遇到交通拥堵，预计延迟 30 分钟到达',
    severity: 'info',
    time: '10分钟前',
    orderId: '3',
    orderNo: 'CD20240601003',
    status: 'processed',
    handler: '调度员李',
    handleTime: '8分钟前',
    handleNote: '已通知客户，安排备用车辆',
  },
  {
    id: 'a3',
    type: 'route',
    message: '路线偏离',
    description: '订单 #CD20240601002 司机偏离规划路线 2km，可能影响交货时间',
    severity: 'danger',
    time: '15分钟前',
    orderId: '2',
    orderNo: 'CD20240601002',
    status: 'pending',
  },
  {
    id: 'a4',
    type: 'humidity',
    message: '湿度异常',
    description: '订单 #CD20240601004 湿度偏低，当前 62%，标准范围 75-90%',
    severity: 'warning',
    time: '25分钟前',
    orderId: '4',
    orderNo: 'CD20240601004',
    status: 'pending',
  },
  {
    id: 'a5',
    type: 'temperature',
    message: '温度严重超标',
    description: '订单 #CD20240601005 温度持续偏高，当前 12.5°C，标准范围 0-8°C，已持续 1 小时 20 分钟',
    severity: 'danger',
    time: '1小时前',
    orderId: '5',
    orderNo: 'CD20240601005',
    status: 'processed',
    handler: '调度员王',
    handleTime: '50分钟前',
    handleNote: '已联系司机检查制冷设备，协调就近冷库中转',
  },
  {
    id: 'a6',
    type: 'system',
    message: '设备离线告警',
    description: '订单 #CD20240601001 温湿度记录仪离线超过 5 分钟',
    severity: 'warning',
    time: '2小时前',
    orderId: '1',
    orderNo: 'CD20240601001',
    status: 'ignored',
  },
  {
    id: 'a7',
    type: 'humidity',
    message: '湿度过高',
    description: '订单 #CD20240601003 湿度偏高，当前 92%，标准范围 65-85%',
    severity: 'warning',
    time: '3小时前',
    orderId: '3',
    orderNo: 'CD20240601003',
    status: 'pending',
  },
  {
    id: 'a8',
    type: 'delay',
    message: '严重延迟',
    description: '订单 #CD20240601002 预计延迟 2 小时到达，可能影响货物品质',
    severity: 'danger',
    time: '4小时前',
    orderId: '2',
    orderNo: 'CD20240601002',
    status: 'pending',
  },
  {
    id: 'a9',
    type: 'temperature',
    message: '温度波动异常',
    description: '订单 #CD20240601004 温度在 1 小时内波动超过 5°C，可能影响货物品质',
    severity: 'warning',
    time: '5小时前',
    orderId: '4',
    orderNo: 'CD20240601004',
    status: 'ignored',
  },
  {
    id: 'a10',
    type: 'route',
    message: '长时间停留',
    description: '订单 #CD20240601005 在某地停留超过 45 分钟，无合理原因',
    severity: 'warning',
    time: '6小时前',
    orderId: '5',
    orderNo: 'CD20240601005',
    status: 'processed',
    handler: '调度员张',
    handleTime: '5小时30分钟前',
    handleNote: '司机称在服务区休息，已提醒注意时效',
  },
  {
    id: 'a11',
    type: 'temperature',
    message: '温度恢复正常',
    description: '订单 #CD20240601001 温度已恢复至正常范围',
    severity: 'info',
    time: '8小时前',
    orderId: '1',
    orderNo: 'CD20240601001',
    status: 'processed',
    handler: '系统',
    handleTime: '8小时前',
    handleNote: '自动恢复通知',
  },
  {
    id: 'a12',
    type: 'humidity',
    message: '湿度恢复正常',
    description: '订单 #CD20240601004 湿度已恢复至正常范围',
    severity: 'info',
    time: '10小时前',
    orderId: '4',
    orderNo: 'CD20240601004',
    status: 'processed',
    handler: '系统',
    handleTime: '10小时前',
    handleNote: '自动恢复通知',
  },
]

const defaultCargoConfigs: CargoConfig[] = [
  { id: 'c1', type: '生鲜水果', tempMin: 2, tempMax: 8, humidMin: 70, humidMax: 90, needRecorder: true },
  { id: 'c2', type: '冷冻肉类', tempMin: -25, tempMax: -15, humidMin: 60, humidMax: 80, needRecorder: true },
  { id: 'c3', type: '医药疫苗', tempMin: 2, tempMax: 8, humidMin: 65, humidMax: 85, needRecorder: true },
  { id: 'c4', type: '乳制品', tempMin: 2, tempMax: 6, humidMin: 75, humidMax: 90, needRecorder: true },
  { id: 'c5', type: '海鲜水产', tempMin: 0, tempMax: 4, humidMin: 80, humidMax: 95, needRecorder: true },
  { id: 'c6', type: '花卉苗木', tempMin: 5, tempMax: 15, humidMin: 60, humidMax: 80, needRecorder: false },
  { id: 'c7', type: '化工原料', tempMin: 10, tempMax: 25, humidMin: 40, humidMax: 60, needRecorder: false },
  { id: 'c8', type: '电子元器件', tempMin: 15, tempMax: 25, humidMin: 30, humidMax: 50, needRecorder: false },
]

const defaultAlertRules: AlertRule[] = [
  { id: 'r1', name: '温度超限告警', condition: '温度超出阈值范围', duration: 30, unit: 'minute', severity: 'warning', enabled: true },
  { id: 'r2', name: '温度严重超限', condition: '温度超出阈值范围 > 5°C', duration: 15, unit: 'minute', severity: 'danger', enabled: true },
  { id: 'r3', name: '湿度超限告警', condition: '湿度超出阈值范围', duration: 60, unit: 'minute', severity: 'warning', enabled: true },
  { id: 'r4', name: '路线偏离告警', condition: '偏离规划路线 > 1km', duration: 5, unit: 'minute', severity: 'warning', enabled: true },
  { id: 'r5', name: '严重路线偏离', condition: '偏离规划路线 > 3km', duration: 10, unit: 'minute', severity: 'danger', enabled: true },
  { id: 'r6', name: '预计延迟告警', condition: '预计到达延迟 > 30 分钟', duration: 0, unit: 'minute', severity: 'info', enabled: true },
  { id: 'r7', name: '严重延迟告警', condition: '预计到达延迟 > 2 小时', duration: 0, unit: 'minute', severity: 'danger', enabled: true },
  { id: 'r8', name: '设备离线告警', condition: '温湿度记录仪离线', duration: 5, unit: 'minute', severity: 'warning', enabled: true },
]

const alertTypeLabels: Record<string, string> = {
  temperature: '温度',
  humidity: '湿度',
  route: '路线',
  delay: '延迟',
  system: '系统',
}

const severityBadge: Record<string, { status: 'danger' | 'warning' | 'info'; label: string }> = {
  danger: { status: 'danger', label: '严重' },
  warning: { status: 'warning', label: '警告' },
  info: { status: 'info', label: '通知' },
}

const alertStatusBadge: Record<AlertStatus, { status: 'pending' | 'completed' | 'cancelled'; label: string }> = {
  pending: { status: 'pending', label: '待处理' },
  processed: { status: 'completed', label: '已处理' },
  ignored: { status: 'cancelled', label: '已忽略' },
}

export default function Monitoring() {
  const [activeTab, setActiveTab] = useState<TabType>('realtime')
  const [tracking, setTracking] = useState<TrackingOrder[]>(defaultTracking)
  const [alerts, setAlerts] = useState<Alert[]>(defaultAlerts)
  const [selectedOrder, setSelectedOrder] = useState<TrackingOrder | null>(defaultTracking[0])
  const [tempData, setTempData] = useState<SensorData>({
    labels: ['10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30'],
    values: [4.0, 3.8, 4.2, 5.1, 7.8, 6.5, 5.8, 4.5],
  })
  const [humidData, setHumidData] = useState<SensorData>({
    labels: ['10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30'],
    values: [82, 84, 85, 83, 88, 86, 84, 82],
  })

  const [alertTypeFilter, setAlertTypeFilter] = useState<AlertType>('all')
  const [alertSeverityFilter, setAlertSeverityFilter] = useState<AlertSeverity>('all')
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null)
  const [alertSidebarOpen, setAlertSidebarOpen] = useState(false)

  const [cargoConfigs, setCargoConfigs] = useState<CargoConfig[]>(defaultCargoConfigs)
  const [alertRules, setAlertRules] = useState<AlertRule[]>(defaultAlertRules)
  const [editingConfig, setEditingConfig] = useState<CargoConfig | null>(null)

  useEffect(() => {
    api.get<TrackingOrder[]>('/monitoring/tracking').then(setTracking).catch(() => {})
    api.get<Alert[]>('/monitoring/alerts').then(setAlerts).catch(() => {})
  }, [])

  useEffect(() => {
    if (!selectedOrder) return
    api
      .get<{ temp: SensorData; humid: SensorData }>(`/monitoring/sensor/${selectedOrder.id}`)
      .then((d) => {
        setTempData(d.temp)
        setHumidData(d.humid)
      })
      .catch(() => {})
  }, [selectedOrder])

  const mapRoutes = useMemo(
    () =>
      tracking.map((t) => ({
        from: cityIdx[t.fromCity] ?? 0,
        to: cityIdx[t.toCity] ?? 0,
        price: t.progress,
        active: selectedOrder?.id === t.id,
      })),
    [tracking, selectedOrder]
  )

  const filteredAlerts = useMemo(() => {
    return alerts.filter((a) => {
      if (alertTypeFilter !== 'all' && a.type !== alertTypeFilter) return false
      if (alertSeverityFilter !== 'all' && a.severity !== alertSeverityFilter) return false
      return true
    })
  }, [alerts, alertTypeFilter, alertSeverityFilter])

  const pendingAlertsCount = alerts.filter((a) => a.status === 'pending').length

  const handleAlertView = (alert: Alert) => {
    setSelectedAlert(alert)
    setAlertSidebarOpen(true)
  }

  const handleAlertProcess = (alertId: string) => {
    setAlerts((prev) =>
      prev.map((a) =>
        a.id === alertId
          ? { ...a, status: 'processed', handler: '当前用户', handleTime: '刚刚', handleNote: '已处理' }
          : a
      )
    )
    if (selectedAlert?.id === alertId) {
      setSelectedAlert((prev) =>
        prev ? { ...prev, status: 'processed', handler: '当前用户', handleTime: '刚刚', handleNote: '已处理' } : null
      )
    }
  }

  const handleAlertIgnore = (alertId: string) => {
    setAlerts((prev) => prev.map((a) => (a.id === alertId ? { ...a, status: 'ignored' } : a)))
    if (selectedAlert?.id === alertId) {
      setSelectedAlert((prev) => (prev ? { ...prev, status: 'ignored' } : null))
    }
  }

  const alertColumns = [
    { key: 'time', title: '时间', sortable: true },
    { key: 'orderNo', title: '订单号', sortable: true },
    {
      key: 'type',
      title: '告警类型',
      render: (row: Alert) => <span className="text-sm">{alertTypeLabels[row.type] || row.type}</span>,
    },
    {
      key: 'severity',
      title: '级别',
      render: (row: Alert) => <StatusBadge {...severityBadge[row.severity]} />,
    },
    { key: 'description', title: '描述' },
    {
      key: 'status',
      title: '处理状态',
      render: (row: Alert) => <StatusBadge {...alertStatusBadge[row.status]} />,
    },
    {
      key: 'actions',
      title: '操作',
      render: (row: Alert) => (
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleAlertView(row)
            }}
            className="p-1.5 rounded hover:bg-gray-100 text-secondary hover:text-primary"
            title="查看详情"
          >
            <Eye size={14} />
          </button>
          {row.status === 'pending' && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleAlertProcess(row.id)
                }}
                className="p-1.5 rounded hover:bg-emerald-50 text-secondary hover:text-emerald-600"
                title="标记处理"
              >
                <CheckCircle size={14} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleAlertIgnore(row.id)
                }}
                className="p-1.5 rounded hover:bg-red-50 text-secondary hover:text-red-500"
                title="忽略"
              >
                <XCircle size={14} />
              </button>
            </>
          )}
        </div>
      ),
    },
  ]

  const cargoConfigColumns = [
    { key: 'type', title: '货类', sortable: true },
    {
      key: 'tempRange',
      title: '温度范围 (°C)',
      render: (row: CargoConfig) => (
        <span className="font-mono text-sm">
          {row.tempMin} ~ {row.tempMax}
        </span>
      ),
    },
    {
      key: 'humidRange',
      title: '湿度范围 (%)',
      render: (row: CargoConfig) => (
        <span className="font-mono text-sm">
          {row.humidMin} ~ {row.humidMax}
        </span>
      ),
    },
    {
      key: 'needRecorder',
      title: '是否需要记录仪',
      render: (row: CargoConfig) => (
        <StatusBadge status={row.needRecorder ? 'active' : 'info'} label={row.needRecorder ? '是' : '否'} />
      ),
    },
    {
      key: 'actions',
      title: '操作',
      render: (row: CargoConfig) => (
        <button
          onClick={() => setEditingConfig(row)}
          className="p-1.5 rounded hover:bg-gray-100 text-secondary hover:text-primary"
          title="编辑"
        >
          <Edit2 size={14} />
        </button>
      ),
    },
  ]

  const stats = [
    {
      icon: <Package size={24} />,
      value: '128',
      label: '运输中订单',
      sublabel: '较昨日 +12',
      trend: { value: 10.3, positive: true },
      gradient: 'gradient-primary',
    },
    {
      icon: <Snowflake size={24} />,
      value: '46',
      label: '冷链订单',
      sublabel: '占比 35.9%',
      gradient: 'bg-gradient-to-br from-cyan-500 to-blue-600',
    },
    {
      icon: <AlertTriangle size={24} />,
      value: String(pendingAlertsCount),
      label: '温湿度告警',
      sublabel: `${alerts.filter((a) => a.status === 'pending' && (a.type === 'temperature' || a.type === 'humidity')).length} 条待处理`,
      gradient: 'bg-gradient-to-br from-red-500 to-orange-500',
    },
    {
      icon: <TrendingUp size={24} />,
      value: '98.5%',
      label: '温控达标率',
      sublabel: '较上月 +1.2%',
      trend: { value: 1.2, positive: true },
      gradient: 'bg-gradient-to-br from-emerald-500 to-teal-600',
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-primary">冷链温湿度监控中心</h1>
          <p className="text-sm text-secondary mt-0.5">实时监控冷链运输温湿度状态，确保货物品质安全</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-mint animate-pulse" />
          <span className="text-xs text-mint font-medium">实时监控中</span>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <StatCard key={i} {...stat} />
        ))}
      </div>

      <div className="border-b border-border">
        <div className="flex items-center gap-1">
          {[
            { key: 'realtime' as const, label: '实时监控', icon: <Navigation size={16} /> },
            { key: 'alerts' as const, label: '告警管理', icon: <Bell size={16} />, badge: pendingAlertsCount },
            { key: 'config' as const, label: '冷链配置', icon: <Settings size={16} /> },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors -mb-px ${
                activeTab === tab.key
                  ? 'border-accent text-accent'
                  : 'border-transparent text-secondary hover:text-primary hover:border-gray-300'
              }`}
            >
              {tab.icon}
              {tab.label}
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className="px-1.5 py-0.5 text-xs font-medium rounded-full bg-red-100 text-red-600">
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'realtime' && (
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-5 space-y-4">
            <RouteMap nodes={mapNodes} routes={mapRoutes} height={320} title="运输路线追踪" />

            {selectedOrder && (
              <div className="card">
                <h3 className="text-sm font-semibold text-primary mb-3">订单信息</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-secondary">订单号</span>
                    <span className="text-sm font-medium font-mono">{selectedOrder.orderNo}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-secondary">路线</span>
                    <span className="text-sm font-medium">
                      {selectedOrder.fromCity} → {selectedOrder.toCity}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-secondary">司机</span>
                    <span className="text-sm font-medium">{selectedOrder.driver}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-secondary">货物类型</span>
                    <span className="text-sm font-medium">{selectedOrder.cargoType}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-secondary">出发时间</span>
                    <span className="text-sm font-medium">{selectedOrder.departureTime}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-secondary">预计到达</span>
                    <span className="text-sm font-medium">{selectedOrder.estimatedArrival}</span>
                  </div>
                  <div className="pt-2">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-secondary">运输进度</span>
                      <span className="text-sm font-medium font-mono">{selectedOrder.progress}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-accent to-orange-400 transition-all"
                        style={{ width: `${selectedOrder.progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="col-span-4 space-y-4">
            {selectedOrder && (
              <>
                <Chart
                  type="line"
                  data={tempData}
                  height={200}
                  title={`温度曲线 (°C) - 正常范围 ${selectedOrder.tempRange.min}~${selectedOrder.tempRange.max}°C`}
                  threshold={selectedOrder.tempRange}
                  lineColor="#3B82F6"
                />
                <Chart
                  type="line"
                  data={humidData}
                  height={200}
                  title={`湿度曲线 (%) - 正常范围 ${selectedOrder.humidRange.min}~${selectedOrder.humidRange.max}%`}
                  threshold={selectedOrder.humidRange}
                  lineColor="#06B6D4"
                />
                <div className="grid grid-cols-2 gap-4">
                  <div className="card">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                        <Thermometer size={20} className="text-blue-500" />
                      </div>
                      <div>
                        <p className="text-xs text-secondary">当前温度</p>
                        <p
                          className={`text-lg font-bold ${
                            selectedOrder.temp !== undefined &&
                            (selectedOrder.temp < selectedOrder.tempRange.min ||
                              selectedOrder.temp > selectedOrder.tempRange.max)
                              ? 'text-red-500'
                              : 'text-primary'
                          }`}
                        >
                          {selectedOrder.temp}°C
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="card">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-cyan-100 flex items-center justify-center">
                        <Droplets size={20} className="text-cyan-500" />
                      </div>
                      <div>
                        <p className="text-xs text-secondary">当前湿度</p>
                        <p
                          className={`text-lg font-bold ${
                            selectedOrder.humidity !== undefined &&
                            (selectedOrder.humidity < selectedOrder.humidRange.min ||
                              selectedOrder.humidity > selectedOrder.humidRange.max)
                              ? 'text-red-500'
                              : 'text-primary'
                          }`}
                        >
                          {selectedOrder.humidity}%
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="col-span-3 space-y-4">
            <div className="card">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-primary">运输订单列表</h3>
                <div className="relative">
                  <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-muted" />
                  <input
                    type="text"
                    placeholder="搜索订单"
                    className="pl-7 pr-3 py-1.5 text-xs border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-accent/50 w-32"
                  />
                </div>
              </div>
              <div className="space-y-2 max-h-[560px] overflow-y-auto">
                {tracking.map((order) => {
                  const hasAlert = alerts.some(
                    (a) => a.orderId === order.id && a.status === 'pending' && a.severity === 'danger'
                  )
                  const hasWarning = alerts.some(
                    (a) => a.orderId === order.id && a.status === 'pending' && a.severity === 'warning'
                  )
                  return (
                    <div
                      key={order.id}
                      onClick={() => setSelectedOrder(order)}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        selectedOrder?.id === order.id
                          ? 'border-accent bg-amber-50 shadow-sm'
                          : 'border-border hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-primary">
                          {order.fromCity} → {order.toCity}
                        </span>
                        <div className="flex items-center gap-1">
                          {hasAlert && <AlertTriangle size={12} className="text-red-500" />}
                          {hasWarning && !hasAlert && <AlertTriangle size={12} className="text-orange-500" />}
                          <StatusBadge
                            status={
                              order.status === 'in_transit' ? 'active' : order.status === 'pickup' ? 'pending' : 'completed'
                            }
                            label={order.status === 'in_transit' ? '运输中' : order.status === 'pickup' ? '取货中' : '已送达'}
                          />
                        </div>
                      </div>
                      <div className="text-xs text-secondary mb-2 font-mono">{order.orderNo}</div>
                      <div className="flex items-center gap-3 text-xs text-secondary mb-2">
                        <span className="flex items-center gap-1">
                          <Navigation size={10} />
                          {order.driver}
                        </span>
                        <span>{order.cargoType}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-accent transition-all"
                            style={{ width: `${order.progress}%` }}
                          />
                        </div>
                        <span className="text-xs font-mono text-secondary">{order.progress}%</span>
                      </div>
                      {order.temp !== undefined && (
                        <div className="flex items-center gap-3 mt-2 text-xs">
                          <span
                            className={`flex items-center gap-1 ${
                              order.temp < order.tempRange.min || order.temp > order.tempRange.max
                                ? 'text-red-500 font-medium'
                                : 'text-blue-500'
                            }`}
                          >
                            <Thermometer size={10} />
                            {order.temp}°C
                          </span>
                          <span
                            className={`flex items-center gap-1 ${
                              order.humidity !== undefined &&
                              (order.humidity < order.humidRange.min || order.humidity > order.humidRange.max)
                                ? 'text-red-500 font-medium'
                                : 'text-cyan-500'
                            }`}
                          >
                            <Droplets size={10} />
                            {order.humidity}%
                          </span>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'alerts' && (
        <div className="space-y-4">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Filter size={16} className="text-secondary" />
                <span className="text-sm font-medium text-primary">筛选条件</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-secondary">告警类型：</span>
                  <div className="flex items-center gap-1">
                    {([
                      { key: 'all' as const, label: '全部' },
                      { key: 'temperature' as const, label: '温度' },
                      { key: 'humidity' as const, label: '湿度' },
                      { key: 'route' as const, label: '路线' },
                      { key: 'delay' as const, label: '延迟' },
                    ]).map((item) => (
                      <button
                        key={item.key}
                        onClick={() => setAlertTypeFilter(item.key)}
                        className={`px-3 py-1 text-xs rounded-full transition-colors ${
                          alertTypeFilter === item.key
                            ? 'bg-accent text-white'
                            : 'bg-gray-100 text-secondary hover:bg-gray-200'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-secondary">告警级别：</span>
                  <div className="flex items-center gap-1">
                    {([
                      { key: 'all' as const, label: '全部' },
                      { key: 'danger' as const, label: '严重' },
                      { key: 'warning' as const, label: '警告' },
                      { key: 'info' as const, label: '通知' },
                    ]).map((item) => (
                      <button
                        key={item.key}
                        onClick={() => setAlertSeverityFilter(item.key)}
                        className={`px-3 py-1 text-xs rounded-full transition-colors ${
                          alertSeverityFilter === item.key
                            ? 'bg-accent text-white'
                            : 'bg-gray-100 text-secondary hover:bg-gray-200'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="text-xs text-muted">
              共 {filteredAlerts.length} 条告警，其中待处理 {filteredAlerts.filter((a) => a.status === 'pending').length} 条
            </div>
          </div>

          <div className="card p-0 overflow-hidden">
            <DataTable
              columns={alertColumns}
              data={filteredAlerts}
              pageSize={10}
              onRowClick={handleAlertView}
            />
          </div>
        </div>
      )}

      {activeTab === 'config' && (
        <div className="space-y-6">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-primary">货类温控标准配置</h3>
              <button className="px-3 py-1.5 text-xs font-medium text-white bg-accent rounded-lg hover:bg-accent/90 transition-colors">
                + 新增货类
              </button>
            </div>
            <div className="overflow-x-auto">
              <DataTable columns={cargoConfigColumns} data={cargoConfigs} pageSize={8} />
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-primary">告警规则配置</h3>
              <button className="px-3 py-1.5 text-xs font-medium text-white bg-accent rounded-lg hover:bg-accent/90 transition-colors">
                + 新增规则
              </button>
            </div>
            <div className="space-y-3">
              {alertRules.map((rule) => (
                <div
                  key={rule.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-border hover:border-gray-300 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() =>
                        setAlertRules((prev) =>
                          prev.map((r) => (r.id === rule.id ? { ...r, enabled: !r.enabled } : r))
                        )
                      }
                      className={`relative w-10 h-6 rounded-full transition-colors ${
                        rule.enabled ? 'bg-accent' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                          rule.enabled ? 'left-[18px]' : 'left-0.5'
                        }`}
                      />
                    </button>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-primary">{rule.name}</span>
                        <StatusBadge {...severityBadge[rule.severity]} />
                      </div>
                      <p className="text-xs text-secondary mt-1">
                        {rule.condition}
                        {rule.duration > 0 && `，持续 ${rule.duration} ${rule.unit === 'minute' ? '分钟' : '小时'}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="p-2 rounded-lg hover:bg-gray-100 text-secondary hover:text-primary transition-colors">
                      <Edit2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {alertSidebarOpen && selectedAlert && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setAlertSidebarOpen(false)}
          />
          <div className="relative w-[480px] h-full bg-white shadow-xl overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-border px-6 py-4 flex items-center justify-between z-10">
              <h3 className="text-base font-semibold text-primary">告警详情</h3>
              <button
                onClick={() => setAlertSidebarOpen(false)}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-secondary hover:text-primary transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <StatusBadge {...severityBadge[selectedAlert.severity]} />
                <StatusBadge {...alertStatusBadge[selectedAlert.status]} />
              </div>

              <div>
                <h4 className="text-lg font-semibold text-primary mb-2">{selectedAlert.message}</h4>
                <p className="text-sm text-secondary">{selectedAlert.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="card">
                  <p className="text-xs text-secondary mb-1">告警时间</p>
                  <p className="text-sm font-medium text-primary flex items-center gap-1">
                    <Clock size={12} />
                    {selectedAlert.time}
                  </p>
                </div>
                <div className="card">
                  <p className="text-xs text-secondary mb-1">告警类型</p>
                  <p className="text-sm font-medium text-primary">
                    {alertTypeLabels[selectedAlert.type] || selectedAlert.type}
                  </p>
                </div>
              </div>

              <div className="card">
                <h5 className="text-sm font-semibold text-primary mb-3">关联订单信息</h5>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-secondary">订单号</span>
                    <span className="text-sm font-medium font-mono">{selectedAlert.orderNo}</span>
                  </div>
                  {tracking.find((t) => t.id === selectedAlert.orderId) && (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-secondary">路线</span>
                        <span className="text-sm font-medium">
                          {tracking.find((t) => t.id === selectedAlert.orderId)?.fromCity} →{' '}
                          {tracking.find((t) => t.id === selectedAlert.orderId)?.toCity}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-secondary">司机</span>
                        <span className="text-sm font-medium">
                          {tracking.find((t) => t.id === selectedAlert.orderId)?.driver}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-secondary">货物类型</span>
                        <span className="text-sm font-medium">
                          {tracking.find((t) => t.id === selectedAlert.orderId)?.cargoType}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="card">
                <h5 className="text-sm font-semibold text-primary mb-3">告警历史</h5>
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-2 h-2 rounded-full bg-accent" />
                      <div className="w-px h-full bg-gray-200" />
                    </div>
                    <div className="pb-3">
                      <p className="text-sm text-primary">{selectedAlert.message}</p>
                      <p className="text-xs text-muted mt-1">{selectedAlert.time}</p>
                    </div>
                  </div>
                  {selectedAlert.status !== 'pending' && (
                    <div className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            selectedAlert.status === 'processed' ? 'bg-emerald-500' : 'bg-gray-400'
                          }`}
                        />
                      </div>
                      <div>
                        <p className="text-sm text-primary">
                          {selectedAlert.status === 'processed' ? '已处理' : '已忽略'}
                        </p>
                        <p className="text-xs text-muted mt-1">
                          {selectedAlert.handler} · {selectedAlert.handleTime}
                        </p>
                        {selectedAlert.handleNote && (
                          <p className="text-xs text-secondary mt-2 p-2 bg-gray-50 rounded">
                            {selectedAlert.handleNote}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {tracking.find((t) => t.id === selectedAlert.orderId) && (
                <>
                  <div className="card">
                    <h5 className="text-sm font-semibold text-primary mb-3">温湿度曲线</h5>
                    <div className="space-y-3">
                      <Chart
                        type="line"
                        data={tempData}
                        height={120}
                        threshold={tracking.find((t) => t.id === selectedAlert.orderId)?.tempRange}
                        lineColor="#3B82F6"
                      />
                      <Chart
                        type="line"
                        data={humidData}
                        height={120}
                        threshold={tracking.find((t) => t.id === selectedAlert.orderId)?.humidRange}
                        lineColor="#06B6D4"
                      />
                    </div>
                  </div>

                  <div className="card">
                    <h5 className="text-sm font-semibold text-primary mb-3">处理记录</h5>
                    <div className="space-y-2">
                      {selectedAlert.status !== 'pending' ? (
                        <div className="p-3 rounded-lg bg-gray-50">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-primary">
                              {selectedAlert.status === 'processed' ? '处理人' : '操作人'}：{selectedAlert.handler}
                            </span>
                            <span className="text-xs text-muted">{selectedAlert.handleTime}</span>
                          </div>
                          <p className="text-xs text-secondary">
                            {selectedAlert.status === 'processed' ? '处理说明' : '忽略原因'}：{selectedAlert.handleNote}
                          </p>
                        </div>
                      ) : (
                        <p className="text-xs text-muted text-center py-4">暂无处理记录</p>
                      )}
                    </div>
                  </div>
                </>
              )}

              {selectedAlert.status === 'pending' && (
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => {
                      handleAlertProcess(selectedAlert.id)
                    }}
                    className="flex-1 py-2.5 text-sm font-medium text-white bg-emerald-500 rounded-lg hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2"
                  >
                    <CheckCircle size={16} />
                    标记处理
                  </button>
                  <button
                    onClick={() => {
                      handleAlertIgnore(selectedAlert.id)
                    }}
                    className="flex-1 py-2.5 text-sm font-medium text-secondary border border-border rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                  >
                    <XCircle size={16} />
                    忽略
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {editingConfig && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setEditingConfig(null)} />
          <div className="relative bg-white rounded-xl shadow-xl w-[480px] overflow-hidden">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <h3 className="text-base font-semibold text-primary">编辑货类配置</h3>
              <button
                onClick={() => setEditingConfig(null)}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-secondary hover:text-primary transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-primary mb-1.5">货类名称</label>
                <input
                  type="text"
                  defaultValue={editingConfig.type}
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-accent/50"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-primary mb-1.5">温度下限 (°C)</label>
                  <input
                    type="number"
                    defaultValue={editingConfig.tempMin}
                    className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-accent/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary mb-1.5">温度上限 (°C)</label>
                  <input
                    type="number"
                    defaultValue={editingConfig.tempMax}
                    className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-accent/50"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-primary mb-1.5">湿度下限 (%)</label>
                  <input
                    type="number"
                    defaultValue={editingConfig.humidMin}
                    className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-accent/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary mb-1.5">湿度上限 (%)</label>
                  <input
                    type="number"
                    defaultValue={editingConfig.humidMax}
                    className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-accent/50"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="needRecorder"
                  defaultChecked={editingConfig.needRecorder}
                  className="w-4 h-4 text-accent rounded focus:ring-accent/50"
                />
                <label htmlFor="needRecorder" className="text-sm text-primary">
                  需要温湿度记录仪
                </label>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-border flex justify-end gap-3">
              <button
                onClick={() => setEditingConfig(null)}
                className="px-4 py-2 text-sm font-medium text-secondary border border-border rounded-lg hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
              <button
                onClick={() => {
                  setCargoConfigs((prev) =>
                    prev.map((c) =>
                      c.id === editingConfig.id
                        ? {
                            ...c,
                            type: (document.querySelector('input[type="text"]') as HTMLInputElement)?.value || c.type,
                            tempMin: parseFloat(
                              (document.querySelectorAll('input[type="number"]')[0] as HTMLInputElement)?.value ||
                                String(c.tempMin)
                            ),
                            tempMax: parseFloat(
                              (document.querySelectorAll('input[type="number"]')[1] as HTMLInputElement)?.value ||
                                String(c.tempMax)
                            ),
                            humidMin: parseFloat(
                              (document.querySelectorAll('input[type="number"]')[2] as HTMLInputElement)?.value ||
                                String(c.humidMin)
                            ),
                            humidMax: parseFloat(
                              (document.querySelectorAll('input[type="number"]')[3] as HTMLInputElement)?.value ||
                                String(c.humidMax)
                            ),
                            needRecorder: (document.getElementById('needRecorder') as HTMLInputElement)?.checked || false,
                          }
                        : c
                    )
                  )
                  setEditingConfig(null)
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-accent rounded-lg hover:bg-accent/90 transition-colors"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
