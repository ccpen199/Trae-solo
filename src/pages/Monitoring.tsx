import { useState, useEffect } from 'react'
import {
  Monitor,
  Droplets,
  Thermometer,
  AlertTriangle,
  CheckCircle,
  Clock,
  Play,
  Square,
  Gauge,
  Eye,
  Wrench,
  FileText,
  LayoutDashboard,
  Zap,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/Table'
import StatusBadge from '@/components/ui/StatusBadge'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import { deviceApi, alarmApi, workOrderApi, recordApi } from '@/services/api'
import type { Device, Alarm, WorkOrder, Record } from '@/types'

type ViewTab = 'dispatch' | 'pump' | 'farmer' | 'supervisor'

const viewTabs: { key: ViewTab; label: string; icon: typeof LayoutDashboard }[] = [
  { key: 'dispatch', label: '调度中心', icon: LayoutDashboard },
  { key: 'pump', label: '泵站值班', icon: Zap },
  { key: 'farmer', label: '农户视图', icon: Droplets },
  { key: 'supervisor', label: '监管视图', icon: Eye },
]

const alarmLevelLabel: Record<string, string> = {
  critical: '紧急',
  high: '高',
  medium: '中',
  low: '低',
}

const alarmLevelStyle: Record<string, string> = {
  critical: 'bg-red-100 text-red-700',
  high: 'bg-orange-100 text-orange-700',
  medium: 'bg-yellow-100 text-yellow-700',
  low: 'bg-blue-100 text-blue-700',
}

const orderTypeLabel: Record<string, string> = {
  repair: '维修',
  maintenance: '维护',
  inspection: '巡检',
  emergency: '应急',
}

const priorityStyle: Record<string, string> = {
  critical: 'bg-red-100 text-red-700',
  high: 'bg-orange-100 text-orange-700',
  medium: 'bg-yellow-100 text-yellow-700',
  low: 'bg-green-100 text-green-700',
}

const priorityLabel: Record<string, string> = {
  critical: '紧急',
  high: '高',
  medium: '中',
  low: '低',
}

const Monitoring = () => {
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<ViewTab>('dispatch')
  const [devices, setDevices] = useState<Device[]>([])
  const [alarms, setAlarms] = useState<Alarm[]>([])
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([])
  const [records, setRecords] = useState<Record[]>([])
  const [error, setError] = useState<string | null>(null)

  const [alarmModalOpen, setAlarmModalOpen] = useState(false)
  const [selectedAlarm, setSelectedAlarm] = useState<Alarm | null>(null)
  const [alarmAction, setAlarmAction] = useState<{
    type: 'acknowledge' | 'resolve'
    reason: string
  }>({ type: 'acknowledge', reason: '' })

  const [workOrderModalOpen, setWorkOrderModalOpen] = useState(false)
  const [selectedWorkOrder, setSelectedWorkOrder] = useState<WorkOrder | null>(null)
  const [workOrderAction, setWorkOrderAction] = useState<{
    type: 'assign' | 'start' | 'complete'
    assignee: string
    notes: string
  }>({ type: 'assign', assignee: '', notes: '' })

  const [controlModalOpen, setControlModalOpen] = useState(false)
  const [controlTarget, setControlTarget] = useState<{
    deviceType: string
    deviceId: number
    deviceCode: string
    action: string
  } | null>(null)

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      const [devicesRes, alarmsRes, workOrdersRes, recordsRes] = await Promise.all([
        deviceApi.getLatest(),
        alarmApi.getList({ status: 'active,acknowledged', pageSize: 50 }),
        workOrderApi.getList({ status: 'pending,assigned,in_progress', pageSize: 50 }),
        recordApi.getList({ pageSize: 20 }),
      ])
      setDevices(devicesRes.data || [])
      setAlarms(alarmsRes.data.list)
      setWorkOrders(workOrdersRes.data.list)
      setRecords(recordsRes.data.list)
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败')
    } finally {
      setLoading(false)
    }
  }

  const gateDevices = devices.filter((d) => d.device_type === 'gate')
  const pumpDevices = devices.filter((d) => d.device_type === 'pump')
  const sensorDevices = devices.filter((d) => d.device_type === 'sensor')

  const waterLevelValue =
    sensorDevices.length > 0
      ? sensorDevices.reduce((s, d) => s + (d.water_level || 0), 0) / sensorDevices.length
      : 0

  const runningGates = gateDevices.filter((d) => d.status === 'running' || d.gate_opening !== null && (d.gate_opening || 0) > 0)
  const runningPumps = pumpDevices.filter((d) => d.pump_status === 'running')
  const criticalAlarms = alarms.filter((a) => a.alarm_level === 'critical' && a.status === 'active')
  const highAlarms = alarms.filter((a) => a.alarm_level === 'high' && a.status === 'active')
  const acknowledgedAlarms = alarms.filter((a) => a.status === 'acknowledged')

  const handleAlarmAcknowledge = async () => {
    if (!selectedAlarm) return
    try {
      await alarmApi.acknowledge(selectedAlarm.id, {
        acknowledged_by: '管理员',
        user_name: '管理员',
      })
      setAlarmModalOpen(false)
      setSelectedAlarm(null)
      setAlarmAction({ type: 'acknowledge', reason: '' })
      fetchData()
    } catch (err) {
      alert(err instanceof Error ? err.message : '操作失败')
    }
  }

  const handleAlarmResolve = async () => {
    if (!selectedAlarm) return
    try {
      await alarmApi.resolve(selectedAlarm.id, {
        resolution: alarmAction.reason,
        user_name: '管理员',
      })
      setAlarmModalOpen(false)
      setSelectedAlarm(null)
      setAlarmAction({ type: 'acknowledge', reason: '' })
      fetchData()
    } catch (err) {
      alert(err instanceof Error ? err.message : '操作失败')
    }
  }

  const openAlarmModal = (alarm: Alarm, action: 'acknowledge' | 'resolve') => {
    setSelectedAlarm(alarm)
    setAlarmAction({ type: action, reason: '' })
    setAlarmModalOpen(true)
  }

  const handleAssignWorkOrder = async () => {
    if (!selectedWorkOrder) return
    try {
      await workOrderApi.assign(selectedWorkOrder.id, {
        assignee: workOrderAction.assignee,
        user_name: '管理员',
      })
      setWorkOrderModalOpen(false)
      setSelectedWorkOrder(null)
      setWorkOrderAction({ type: 'assign', assignee: '', notes: '' })
      fetchData()
    } catch (err) {
      alert(err instanceof Error ? err.message : '操作失败')
    }
  }

  const handleCompleteWorkOrder = async () => {
    if (!selectedWorkOrder) return
    try {
      await workOrderApi.complete(selectedWorkOrder.id, {
        completed_by: '管理员',
        description: workOrderAction.notes,
        user_name: '管理员',
      })
      setWorkOrderModalOpen(false)
      setSelectedWorkOrder(null)
      setWorkOrderAction({ type: 'assign', assignee: '', notes: '' })
      fetchData()
    } catch (err) {
      alert(err instanceof Error ? err.message : '操作失败')
    }
  }

  const openWorkOrderModal = (
    order: WorkOrder,
    action: 'assign' | 'start' | 'complete'
  ) => {
    setSelectedWorkOrder(order)
    setWorkOrderAction({ type: action, assignee: '', notes: '' })
    setWorkOrderModalOpen(true)
  }

  const handleDeviceControl = async () => {
    if (!controlTarget) return
    try {
      if (controlTarget.deviceType === 'gate') {
        if (controlTarget.action === 'start') {
          await recordApi.startIrrigation({
            zone_id: 0,
            gate_id: controlTarget.deviceId,
            operator: '管理员',
            user_name: '管理员',
          })
        }
      }
      setControlModalOpen(false)
      setControlTarget(null)
      fetchData()
    } catch (err) {
      alert(err instanceof Error ? err.message : '操作失败')
    }
  }

  const openControlModal = (
    deviceType: string,
    deviceId: number,
    deviceCode: string,
    action: string
  ) => {
    setControlTarget({ deviceType, deviceId, deviceCode, action })
    setControlModalOpen(true)
  }

  const formatTime = (t?: string | null) => {
    if (!t) return '-'
    return new Date(t).toLocaleString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const showDeviceSection = activeTab === 'dispatch' || activeTab === 'pump'
  const showAlarmSection = activeTab === 'dispatch' || activeTab === 'supervisor'
  const showWorkOrderSection = activeTab === 'dispatch' || activeTab === 'supervisor'
  const showRecordSection = activeTab === 'dispatch' || activeTab === 'farmer'

  if (loading && devices.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="flex gap-2 border-b border-gray-200 pb-2">
        {viewTabs.map((tab) => {
          const Icon = tab.icon
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${
                activeTab === tab.key
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Icon className="h-4 w-4 mr-2" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {activeTab === 'dispatch' && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">水位</p>
                  <p className="text-3xl font-bold mt-1">
                    {waterLevelValue.toFixed(2)} m
                  </p>
                  <p className="text-blue-100 text-xs mt-1">正常范围: 110-140 m</p>
                </div>
                <Gauge className="h-12 w-12 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">运行闸门</p>
                  <p className="text-3xl font-bold mt-1">
                    {runningGates.length}/{gateDevices.length}
                  </p>
                  <p className="text-green-100 text-xs mt-1">
                    总流量:{' '}
                    {runningGates
                      .reduce((s, g) => s + (g.flow_rate || 0), 0)
                      .toFixed(1)}{' '}
                    m³/h
                  </p>
                </div>
                <Droplets className="h-12 w-12 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-100 text-sm">运行泵站</p>
                  <p className="text-3xl font-bold mt-1">
                    {runningPumps.length}/{pumpDevices.length}
                  </p>
                  <p className="text-yellow-100 text-xs mt-1">
                    平均温度:{' '}
                    {runningPumps.length > 0
                      ? (
                          runningPumps.reduce(
                            (s, p) => s + (p.temperature || 0),
                            0
                          ) / runningPumps.length
                        ).toFixed(1)
                      : '-'}
                    °C
                  </p>
                </div>
                <Thermometer className="h-12 w-12 text-yellow-200" />
              </div>
            </CardContent>
          </Card>

          <Card
            className={`bg-gradient-to-br ${
              criticalAlarms.length > 0
                ? 'from-red-500 to-red-600'
                : 'from-gray-500 to-gray-600'
            } text-white`}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-100 text-sm">活动告警</p>
                  <p className="text-3xl font-bold mt-1">{alarms.filter((a) => a.status === 'active').length}</p>
                  <p className="text-red-100 text-xs mt-1">
                    紧急: {criticalAlarms.length} | 高: {highAlarms.length} | 已确认: {acknowledgedAlarms.length}
                  </p>
                </div>
                <AlertTriangle className="h-12 w-12 text-white/80" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'pump' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-100 text-sm">运行泵站</p>
                  <p className="text-3xl font-bold mt-1">
                    {runningPumps.length}/{pumpDevices.length}
                  </p>
                </div>
                <Zap className="h-12 w-12 text-yellow-200" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm">最高温度</p>
                  <p className="text-3xl font-bold mt-1">
                    {pumpDevices.length > 0
                      ? Math.max(...pumpDevices.map((p) => p.temperature || 0)).toFixed(1)
                      : '-'}
                    °C
                  </p>
                </div>
                <Thermometer className="h-12 w-12 text-orange-200" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">总流量</p>
                  <p className="text-3xl font-bold mt-1">
                    {pumpDevices
                      .reduce((s, p) => s + (p.flow_rate || 0), 0)
                      .toFixed(1)}
                  </p>
                  <p className="text-blue-100 text-xs mt-1">m³/h</p>
                </div>
                <Droplets className="h-12 w-12 text-blue-200" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'farmer' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">灌溉记录</p>
                  <p className="text-3xl font-bold mt-1">{records.length}</p>
                </div>
                <FileText className="h-12 w-12 text-green-200" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">总计划水量</p>
                  <p className="text-3xl font-bold mt-1">
                    {records
                      .reduce((s, r) => s + r.planned_volume, 0)
                      .toFixed(0)}
                  </p>
                  <p className="text-blue-100 text-xs mt-1">m³</p>
                </div>
                <Droplets className="h-12 w-12 text-blue-200" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-teal-500 to-teal-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-teal-100 text-sm">平均完成率</p>
                  <p className="text-3xl font-bold mt-1">
                    {records.length > 0
                      ? (
                          records.filter((r) => r.actual_volume !== undefined).length > 0
                            ? (records
                                .filter((r) => r.actual_volume !== undefined && r.planned_volume > 0)
                                .reduce(
                                  (s, r) =>
                                    s + ((r.actual_volume || 0) / r.planned_volume) * 100,
                                  0
                                ) /
                              records.filter(
                                (r) => r.actual_volume !== undefined && r.planned_volume > 0
                              ).length)
                            : 0
                        ).toFixed(1)
                      : '-'}
                    %
                  </p>
                </div>
                <Gauge className="h-12 w-12 text-teal-200" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'supervisor' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-100 text-sm">紧急告警</p>
                  <p className="text-3xl font-bold mt-1">{criticalAlarms.length}</p>
                </div>
                <AlertTriangle className="h-12 w-12 text-red-200" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm">待处理工单</p>
                  <p className="text-3xl font-bold mt-1">
                    {workOrders.filter((o) => o.status === 'pending').length}
                  </p>
                </div>
                <Wrench className="h-12 w-12 text-orange-200" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm">已确认告警</p>
                  <p className="text-3xl font-bold mt-1">
                    {acknowledgedAlarms.length}
                  </p>
                </div>
                <Eye className="h-12 w-12 text-purple-200" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {showDeviceSection && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Monitor className="h-5 w-5 mr-2 text-blue-500" />
                闸门状态
                {activeTab === 'pump' && (
                  <span className="ml-2 text-xs font-normal text-gray-400">（辅助参考）</span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {gateDevices.map((device) => (
                  <div
                    key={device.id}
                    className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${
                      activeTab === 'pump' ? 'opacity-60' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-medium">{device.device_code}</h4>
                        <p className="text-xs text-gray-500">
                          ID: {device.device_id}
                        </p>
                      </div>
                      <StatusBadge
                        status={
                          device.gate_opening && device.gate_opening > 0
                            ? 'open'
                            : 'closed'
                        }
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                      <div>
                        <p className="text-gray-500 text-xs">开度</p>
                        <p className="font-medium">
                          {device.gate_opening ?? 0}%
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs">流量</p>
                        <p className="font-medium">
                          {device.flow_rate ?? 0} m³/h
                        </p>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          device.gate_opening && device.gate_opening > 0
                            ? 'bg-green-500'
                            : 'bg-gray-400'
                        }`}
                        style={{
                          width: `${Math.min(device.gate_opening ?? 0, 100)}%`,
                        }}
                      />
                    </div>
                    <div className="text-xs text-gray-400 mb-2">
                      更新: {formatTime(device.timestamp)}
                    </div>
                    {activeTab !== 'pump' && (
                      <div className="flex gap-2">
                        {(!device.gate_opening || device.gate_opening === 0) && (
                          <Button
                            size="sm"
                            variant="success"
                            className="flex-1"
                            onClick={() =>
                              openControlModal(
                                'gate',
                                device.device_id,
                                device.device_code,
                                'start'
                              )
                            }
                          >
                            <Play className="h-3 w-3 mr-1" /> 开启
                          </Button>
                        )}
                        {device.gate_opening && device.gate_opening > 0 && (
                          <Button
                            size="sm"
                            variant="danger"
                            className="flex-1"
                            onClick={() =>
                              openControlModal(
                                'gate',
                                device.device_id,
                                device.device_code,
                                'stop'
                              )
                            }
                          >
                            <Square className="h-3 w-3 mr-1" /> 关闭
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
                {gateDevices.length === 0 && (
                  <div className="col-span-2 text-center py-8 text-gray-500">
                    暂无闸门数据
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Thermometer className="h-5 w-5 mr-2 text-orange-500" />
                泵站状态
                {activeTab === 'pump' && (
                  <span className="ml-2 text-xs font-normal text-orange-500">● 重点监控</span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {pumpDevices.map((device) => {
                  const temp = device.temperature || 0
                  const isRunning = device.pump_status === 'running'
                  return (
                    <div
                      key={device.id}
                      className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${
                        activeTab === 'pump' ? 'ring-2 ring-orange-200' : ''
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-medium">{device.device_code}</h4>
                          <p className="text-xs text-gray-500">
                            ID: {device.device_id}
                          </p>
                        </div>
                        <StatusBadge
                          status={isRunning ? 'running' : 'stopped'}
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-sm mb-3">
                        <div>
                          <p className="text-gray-500 text-xs">流量</p>
                          <p className="font-medium">
                            {device.flow_rate ?? 0} m³/h
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs">温度</p>
                          <p
                            className={`font-medium ${
                              temp > 70 ? 'text-red-600' : ''
                            }`}
                          >
                            {temp}°C
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs">电压</p>
                          <p className="font-medium">
                            {device.voltage?.toFixed(0) ?? '-'}V
                          </p>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            temp > 80
                              ? 'bg-red-500'
                              : temp > 60
                              ? 'bg-yellow-500'
                              : isRunning
                              ? 'bg-green-500'
                              : 'bg-gray-400'
                          }`}
                          style={{
                            width: `${Math.min((temp / 100) * 100, 100)}%`,
                          }}
                        />
                      </div>
                      <div className="text-xs text-gray-400 mb-2">
                        更新: {formatTime(device.timestamp)}
                      </div>
                      <div className="flex gap-2">
                        {!isRunning && (
                          <Button
                            size="sm"
                            variant="success"
                            className="flex-1"
                            onClick={() =>
                              openControlModal(
                                'pump',
                                device.device_id,
                                device.device_code,
                                'start'
                              )
                            }
                          >
                            <Play className="h-3 w-3 mr-1" /> 启动
                          </Button>
                        )}
                        {isRunning && (
                          <Button
                            size="sm"
                            variant="danger"
                            className="flex-1"
                            onClick={() =>
                              openControlModal(
                                'pump',
                                device.device_id,
                                device.device_code,
                                'stop'
                              )
                            }
                          >
                            <Square className="h-3 w-3 mr-1" /> 停止
                          </Button>
                        )}
                      </div>
                    </div>
                  )
                })}
                {pumpDevices.length === 0 && (
                  <div className="col-span-2 text-center py-8 text-gray-500">
                    暂无泵站数据
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {showAlarmSection && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-red-500" />
              告警管理
              <span className="ml-2 text-xs font-normal text-gray-400">
                生命周期: 未处理 → 已确认 → 已解决
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>状态</TableHead>
                  <TableHead>级别</TableHead>
                  <TableHead>设备</TableHead>
                  <TableHead>告警内容</TableHead>
                  <TableHead>告警时间</TableHead>
                  <TableHead>确认信息</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {alarms.map((alarm) => (
                  <TableRow
                    key={alarm.id}
                    className={
                      alarm.alarm_level === 'critical' && alarm.status === 'active'
                        ? 'bg-red-50'
                        : alarm.status === 'acknowledged'
                        ? 'bg-yellow-50'
                        : ''
                    }
                  >
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {alarm.status === 'active' && (
                          <StatusBadge status="alarm_active" />
                        )}
                        {alarm.status === 'acknowledged' && (
                          <StatusBadge status="acknowledged" variant="warning" />
                        )}
                        {alarm.status === 'resolved' && (
                          <StatusBadge status="resolved" variant="success" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          alarmLevelStyle[alarm.alarm_level] || 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {alarmLevelLabel[alarm.alarm_level] || alarm.alarm_level}
                      </span>
                    </TableCell>
                    <TableCell className="font-medium">
                      {alarm.device_code || '-'}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {alarm.alarm_message}
                    </TableCell>
                    <TableCell className="text-xs text-gray-500">
                      {formatTime(alarm.created_at)}
                    </TableCell>
                    <TableCell className="text-xs text-gray-500">
                      {alarm.status === 'acknowledged' && (
                        <div>
                          <span className="text-blue-600">
                            {alarm.acknowledged_by}
                          </span>
                          <br />
                          {formatTime(alarm.acknowledged_at)}
                        </div>
                      )}
                      {alarm.status === 'resolved' && (
                        <div>
                          <span className="text-green-600">已解决</span>
                          <br />
                          {formatTime(alarm.resolved_at)}
                        </div>
                      )}
                      {alarm.status === 'active' && '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {alarm.status === 'active' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              openAlarmModal(alarm, 'acknowledge')
                            }
                            title="确认告警"
                          >
                            <CheckCircle className="h-4 w-4 text-blue-500" />
                          </Button>
                        )}
                        {alarm.status === 'acknowledged' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              openAlarmModal(alarm, 'resolve')
                            }
                            title="解决告警"
                          >
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {alarms.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center py-8 text-gray-500"
                    >
                      暂无活动告警
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {showWorkOrderSection && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="h-5 w-5 mr-2 text-purple-500" />
              工单管理
              <span className="ml-2 text-xs font-normal text-gray-400">
                流程: 待处理 → 已分配 → 处理中 → 已完成
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>状态</TableHead>
                  <TableHead>类型</TableHead>
                  <TableHead>描述</TableHead>
                  <TableHead>优先级</TableHead>
                  <TableHead>设备</TableHead>
                  <TableHead>处理人</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {workOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>
                      <StatusBadge status={order.status} />
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                        {orderTypeLabel[order.order_type] || order.order_type}
                      </span>
                    </TableCell>
                    <TableCell className="font-medium max-w-xs truncate">
                      {order.description}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          priorityStyle[order.priority] || 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {priorityLabel[order.priority] || order.priority}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm">
                      {order.device_code}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {order.assignee || '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {order.status === 'pending' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              openWorkOrderModal(order, 'assign')
                            }
                            title="分配工单"
                          >
                            <Clock className="h-4 w-4 text-blue-500" />
                          </Button>
                        )}
                        {order.status === 'assigned' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              openWorkOrderModal(order, 'start')
                            }
                            title="开始处理"
                          >
                            <Play className="h-4 w-4 text-orange-500" />
                          </Button>
                        )}
                        {order.status === 'in_progress' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              openWorkOrderModal(order, 'complete')
                            }
                            title="完成工单"
                          >
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {workOrders.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center py-8 text-gray-500"
                    >
                      暂无待处理工单
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {showRecordSection && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="h-5 w-5 mr-2 text-teal-500" />
              灌溉记录
              <span className="ml-2 text-xs font-normal text-gray-400">
                计划 vs 实际对比
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>状态</TableHead>
                  <TableHead>灌区</TableHead>
                  <TableHead>闸门</TableHead>
                  <TableHead>开始时间</TableHead>
                  <TableHead>计划水量(m³)</TableHead>
                  <TableHead>实际水量(m³)</TableHead>
                  <TableHead>损耗</TableHead>
                  <TableHead>缺额</TableHead>
                  <TableHead>完成率</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map((rec) => {
                  const actual = rec.actual_volume ?? 0
                  const planned = rec.planned_volume || 0
                  const waterLoss = actual > planned ? actual - planned : 0
                  const deficit = actual < planned ? planned - actual : 0
                  const completionRate =
                    planned > 0 ? ((actual / planned) * 100).toFixed(1) : '-'
                  return (
                    <TableRow key={rec.id}>
                      <TableCell>
                        <StatusBadge status={rec.status} />
                      </TableCell>
                      <TableCell className="text-sm">
                        {rec.zone_name || `Zone#${rec.zone_id}`}
                      </TableCell>
                      <TableCell className="text-sm">
                        {rec.gate_name || `Gate#${rec.gate_id}`}
                      </TableCell>
                      <TableCell className="text-xs text-gray-500">
                        {formatTime(rec.start_time)}
                      </TableCell>
                      <TableCell className="font-medium">
                        {planned.toFixed(1)}
                      </TableCell>
                      <TableCell className="font-medium">
                        {rec.actual_volume !== undefined
                          ? actual.toFixed(1)
                          : '-'}
                      </TableCell>
                      <TableCell>
                        {waterLoss > 0 ? (
                          <span className="text-orange-600 text-sm">
                            +{waterLoss.toFixed(1)}
                          </span>
                        ) : (
                          <span className="text-gray-400">0</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {deficit > 0 ? (
                          <span className="text-red-600 text-sm">
                            -{deficit.toFixed(1)}
                          </span>
                        ) : (
                          <span className="text-gray-400">0</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {completionRate !== '-' ? (
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${
                                  Number(completionRate) >= 90
                                    ? 'bg-green-500'
                                    : Number(completionRate) >= 60
                                    ? 'bg-yellow-500'
                                    : 'bg-red-500'
                                }`}
                                style={{
                                  width: `${Math.min(Number(completionRate), 100)}%`,
                                }}
                              />
                            </div>
                            <span
                              className={`text-sm font-medium ${
                                Number(completionRate) >= 90
                                  ? 'text-green-600'
                                  : Number(completionRate) >= 60
                                  ? 'text-yellow-600'
                                  : 'text-red-600'
                              }`}
                            >
                              {completionRate}%
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
                {records.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={9}
                      className="text-center py-8 text-gray-500"
                    >
                      暂无灌溉记录
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Modal
        isOpen={controlModalOpen}
        onClose={() => setControlModalOpen(false)}
        title={
          controlTarget?.action === 'start'
            ? `开启 ${controlTarget?.deviceCode}`
            : `关闭 ${controlTarget?.deviceCode}`
        }
        size="md"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setControlModalOpen(false)}
            >
              取消
            </Button>
            <Button
              variant={controlTarget?.action === 'start' ? 'success' : 'danger'}
              onClick={handleDeviceControl}
            >
              {controlTarget?.action === 'start' ? '确认开启' : '确认关闭'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            确定要{controlTarget?.action === 'start' ? '开启' : '关闭'}{' '}
            {controlTarget?.deviceCode} 吗？
          </p>
        </div>
      </Modal>

      <Modal
        isOpen={alarmModalOpen}
        onClose={() => setAlarmModalOpen(false)}
        title={alarmAction.type === 'acknowledge' ? '确认告警' : '解决告警'}
        size="md"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setAlarmModalOpen(false)}
            >
              取消
            </Button>
            <Button
              variant={alarmAction.type === 'acknowledge' ? 'primary' : 'success'}
              onClick={
                alarmAction.type === 'acknowledge'
                  ? handleAlarmAcknowledge
                  : handleAlarmResolve
              }
            >
              {alarmAction.type === 'acknowledge' ? '确认' : '解决'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {selectedAlarm && (
            <div className="bg-gray-50 p-4 rounded-md">
              <div className="flex items-center gap-2 mb-2">
                <StatusBadge status={selectedAlarm.status} />
                <span
                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    alarmLevelStyle[selectedAlarm.alarm_level]
                  }`}
                >
                  {alarmLevelLabel[selectedAlarm.alarm_level]}
                </span>
              </div>
              <p className="text-sm font-medium text-gray-900">
                {selectedAlarm.alarm_message}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                设备: {selectedAlarm.device_code} | 时间:{' '}
                {formatTime(selectedAlarm.created_at)}
              </p>
              {selectedAlarm.acknowledged_by && (
                <p className="text-xs text-blue-600 mt-1">
                  确认人: {selectedAlarm.acknowledged_by} | 确认时间:{' '}
                  {formatTime(selectedAlarm.acknowledged_at)}
                </p>
              )}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {alarmAction.type === 'acknowledge' ? '确认说明' : '解决说明'} *
            </label>
            <textarea
              value={alarmAction.reason}
              onChange={(e) =>
                setAlarmAction({ ...alarmAction, reason: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder={
                alarmAction.type === 'acknowledge'
                  ? '请输入确认说明...'
                  : '请输入解决措施...'
              }
            />
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={workOrderModalOpen}
        onClose={() => setWorkOrderModalOpen(false)}
        title={
          workOrderAction.type === 'assign'
            ? '分配工单'
            : workOrderAction.type === 'start'
            ? '开始处理'
            : '完成工单'
        }
        size="md"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setWorkOrderModalOpen(false)}
            >
              取消
            </Button>
            <Button
              variant="success"
              onClick={
                workOrderAction.type === 'assign'
                  ? handleAssignWorkOrder
                  : handleCompleteWorkOrder
              }
            >
              {workOrderAction.type === 'assign'
                ? '分配'
                : workOrderAction.type === 'start'
                ? '开始'
                : '完成'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {selectedWorkOrder && (
            <div className="bg-gray-50 p-4 rounded-md">
              <div className="flex items-center gap-2 mb-2">
                <StatusBadge status={selectedWorkOrder.status} />
                <span
                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    priorityStyle[selectedWorkOrder.priority]
                  }`}
                >
                  {priorityLabel[selectedWorkOrder.priority]}
                </span>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                  {orderTypeLabel[selectedWorkOrder.order_type] ||
                    selectedWorkOrder.order_type}
                </span>
              </div>
              <p className="text-sm font-medium text-gray-900">
                {selectedWorkOrder.description}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                设备: {selectedWorkOrder.device_code}
                {selectedWorkOrder.assignee &&
                  ` | 处理人: ${selectedWorkOrder.assignee}`}
              </p>
            </div>
          )}
          {workOrderAction.type === 'assign' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                指派给 *
              </label>
              <input
                type="text"
                value={workOrderAction.assignee}
                onChange={(e) =>
                  setWorkOrderAction({
                    ...workOrderAction,
                    assignee: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="请输入处理人姓名"
              />
            </div>
          )}
          {(workOrderAction.type === 'start' ||
            workOrderAction.type === 'complete') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {workOrderAction.type === 'complete' ? '完成说明 *' : '处理说明'}
              </label>
              <textarea
                value={workOrderAction.notes}
                onChange={(e) =>
                  setWorkOrderAction({
                    ...workOrderAction,
                    notes: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder={
                  workOrderAction.type === 'complete'
                    ? '请输入完成说明...'
                    : '请输入处理说明...'
                }
              />
            </div>
          )}
        </div>
      </Modal>
    </div>
  )
}

export default Monitoring
