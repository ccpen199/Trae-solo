import { useEffect, useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Activity, PowerOff, ClipboardList, MapPin, Calendar, Zap, Clock, Signal, CheckCircle, AlertCircle, ChevronRight, Timer } from 'lucide-react'
import { useStore } from '@/store/useStore'
import StatusBadge from '@/components/StatusBadge'
import DataTable, { type Column } from '@/components/DataTable'
import type { DevicePort, Order, WorkOrder } from '@/api/client'
import * as api from '@/api/client'
import { cn } from '@/lib/utils'

interface HeartbeatRecord {
  id: number
  timestamp: string
  online: boolean
  signalStrength: number
}

const woTypeLabels: Record<string, string> = {
  device_offline: '设备离线',
  port_damage: '端口损坏',
  charge_interrupt: '充电中断',
  complaint: '用户投诉',
}

const faultCodeLabels: Record<string, string> = {
  E01: '过压',
  E02: '过流',
  E03: '过温',
  E04: '通信故障',
}

const portStatusColor: Record<string, string> = {
  idle: 'bg-slate-100 border-slate-300 hover:border-slate-400',
  charging: 'bg-emerald-100 border-emerald-400 hover:border-emerald-500',
  fault: 'bg-red-100 border-red-400 hover:border-red-500',
  offline: 'bg-gray-200 border-gray-400 hover:border-gray-500',
}

const workOrderFlowSteps = [
  { key: 'pending', label: '创建', icon: AlertCircle },
  { key: 'assigned', label: '指派', icon: ClipboardList },
  { key: 'processing', label: '处理中', icon: Activity },
  { key: 'resolved', label: '已解决', icon: CheckCircle },
]

function generateMockHeartbeats(lastHeartbeat: string | null | undefined): HeartbeatRecord[] {
  const baseTime = lastHeartbeat ? new Date(lastHeartbeat) : new Date()
  const records: HeartbeatRecord[] = []
  
  for (let i = 0; i < 10; i++) {
    const time = new Date(baseTime.getTime() - i * 30 * 60 * 1000)
    records.push({
      id: i + 1,
      timestamp: time.toISOString(),
      online: i < 8 || Math.random() > 0.3,
      signalStrength: Math.floor(Math.random() * 31) + 70,
    })
  }
  
  return records
}

function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${Math.round(minutes)}分钟`
  }
  const hours = Math.floor(minutes / 60)
  const mins = Math.round(minutes % 60)
  return mins > 0 ? `${hours}小时${mins}分钟` : `${hours}小时`
}

export default function DeviceDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { currentDevice, fetchDevice, orders, fetchOrders } = useStore()
  const [ports, setPorts] = useState<DevicePort[]>([])
  const [relatedWorkOrders, setRelatedWorkOrders] = useState<WorkOrder[]>([])
  const [heartbeatRecords, setHeartbeatRecords] = useState<HeartbeatRecord[]>([])

  const deviceId = Number(id)

  useEffect(() => {
    if (deviceId) {
      fetchDevice(deviceId)
      fetchOrders({ device_id: String(deviceId) })
      api.getWorkOrders({ device_id: String(deviceId) }).then(setRelatedWorkOrders).catch(() => {})
    }
  }, [deviceId, fetchDevice, fetchOrders])

  useEffect(() => {
    if (currentDevice?.ports) {
      setPorts(currentDevice.ports)
    } else if (deviceId) {
      fetch(`/api/devices/${deviceId}/ports`)
        .then((r) => r.json())
        .then((data) => { if (Array.isArray(data)) setPorts(data) })
        .catch(() => {})
    }
  }, [deviceId, currentDevice])

  useEffect(() => {
    if (currentDevice) {
      setHeartbeatRecords(generateMockHeartbeats(currentDevice.last_heartbeat))
    }
  }, [currentDevice])

  if (!currentDevice) {
    return <div className="text-center text-slate-400 py-12">加载中...</div>
  }

  const handleHeartbeat = async () => {
    await api.updateHeartbeat(deviceId)
    fetchDevice(deviceId)
  }

  const handleSetOffline = async () => {
    await api.setOffline(deviceId)
    fetchDevice(deviceId)
  }

  const deviceOrders = orders.filter((o) => o.device_id === deviceId).slice(0, 10)

  const chargingOrdersByPort = useMemo(() => {
    const map = new Map<number, Order>()
    orders.forEach((o) => {
      if (o.status === 'charging' && o.device_id === deviceId) {
        map.set(o.port_id, o)
      }
    })
    return map
  }, [orders, deviceId])

  const chargingDurationMinutes = useMemo(() => {
    const map = new Map<number, number>()
    chargingOrdersByPort.forEach((order, portId) => {
      const startTime = new Date(order.start_time)
      const now = new Date()
      const diffMs = now.getTime() - startTime.getTime()
      map.set(portId, diffMs / (1000 * 60))
    })
    return map
  }, [chargingOrdersByPort])

  const workOrderStats = useMemo(() => {
    const pending = relatedWorkOrders.filter((w) => w.status === 'pending' || w.status === 'assigned').length
    const resolved = relatedWorkOrders.filter((w) => w.status === 'resolved').length
    return { pending, resolved, total: relatedWorkOrders.length }
  }, [relatedWorkOrders])

  const mockInstallDate = useMemo(() => {
    const date = new Date()
    date.setMonth(date.getMonth() - Math.floor(Math.random() * 12) - 3)
    return date.toLocaleDateString('zh-CN')
  }, [])

  const mockChargeCount = useMemo(() => {
    return Math.floor(Math.random() * 5000) + 500
  }, [])

  const getWorkOrderFlowProgress = (status: string): number => {
    const statusOrder = ['pending', 'assigned', 'processing', 'resolved']
    const index = statusOrder.indexOf(status)
    return index >= 0 ? index + 1 : 0
  }

  const handlePortClick = (port: DevicePort) => {
    const chargingOrder = chargingOrdersByPort.get(port.id)
    if (chargingOrder) {
      navigate(`/orders/${chargingOrder.id}`)
    }
  }

  const orderColumns: Column<Order>[] = [
    { key: 'id', label: '订单号', render: (r) => <span className="font-mono text-xs">#{r.id}</span> },
    { key: 'start_time', label: '开始时间', render: (r) => new Date(r.start_time).toLocaleString() },
    { key: 'duration', label: '充电时长', render: (r) => r.duration ? formatDuration(r.duration * 60) : '-' },
    { key: 'energy', label: '电量(kWh)', render: (r) => r.energy?.toFixed(2) ?? '-' },
    { key: 'cost', label: '费用', render: (r) => <span className="font-medium">¥{r.cost?.toFixed(2) ?? '0.00'}</span> },
    { key: 'status', label: '状态', render: (r) => <StatusBadge status={r.status} /> },
  ]

  const workOrderColumns: Column<WorkOrder>[] = [
    { key: 'id', label: '工单号', render: (r) => <span className="font-mono text-xs">#{r.id}</span> },
    { key: 'type', label: '类型', render: (r) => woTypeLabels[r.type] || r.type },
    { key: 'priority', label: '优先级', render: (r) => <StatusBadge status={r.priority} type="priority" /> },
    {
      key: 'flow',
      label: '状态流转',
      render: (r) => {
        const progress = getWorkOrderFlowProgress(r.status)
        return (
          <div className="flex items-center gap-1">
            {workOrderFlowSteps.map((step, idx) => {
              const StepIcon = step.icon
              const isActive = idx < progress
              const isCurrent = idx === progress - 1
              return (
                <div key={step.key} className="flex items-center">
                  <div
                    className={cn(
                      'w-6 h-6 rounded-full flex items-center justify-center',
                      isActive ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-400',
                      isCurrent && 'ring-2 ring-blue-300'
                    )}
                    title={step.label}
                  >
                    <StepIcon className="w-3 h-3" />
                  </div>
                  {idx < workOrderFlowSteps.length - 1 && (
                    <div
                      className={cn(
                        'w-4 h-0.5 mx-0.5',
                        idx < progress - 1 ? 'bg-blue-500' : 'bg-gray-200'
                      )}
                    />
                  )}
                </div>
              )
            })}
          </div>
        )
      },
    },
    { key: 'status', label: '当前状态', render: (r) => <StatusBadge status={r.status} /> },
    { key: 'created_at', label: '创建时间', render: (r) => new Date(r.created_at).toLocaleString() },
    {
      key: 'actions',
      label: '操作',
      render: (r) => (
        <button
          onClick={(e) => {
            e.stopPropagation()
            navigate(`/work-orders/${r.id}`)
          }}
          className="text-blue-600 hover:underline text-xs flex items-center gap-0.5"
        >
          详情 <ChevronRight className="w-3 h-3" />
        </button>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate('/devices')}
        className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft className="w-4 h-4" /> 返回设备列表
      </button>

      <div className="bg-white rounded-lg border border-slate-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-slate-800">{currentDevice.name}</h2>
            <StatusBadge status={currentDevice.online ? 'online' : 'offline'} />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleHeartbeat}
              className="flex items-center gap-1 text-cyan-600 border border-cyan-200 px-3 py-1 rounded text-sm hover:bg-cyan-50"
            >
              <Activity className="w-3 h-3" /> 模拟心跳
            </button>
            <button
              onClick={handleSetOffline}
              className="flex items-center gap-1 text-red-600 border border-red-200 px-3 py-1 rounded text-sm hover:bg-red-50"
            >
              <PowerOff className="w-3 h-3" /> 设为离线
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-4 text-sm">
          <div className="flex items-start gap-2">
            <Zap className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
            <div>
              <div className="text-slate-500">型号</div>
              <div className="font-medium">{currentDevice.model}</div>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Activity className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
            <div>
              <div className="text-slate-500">功率</div>
              <div className="font-medium">{currentDevice.power}kW</div>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
            <div>
              <div className="text-slate-500">所属站点</div>
              <button
                onClick={() => navigate(`/sites/${currentDevice.site_id}`)}
                className="font-medium text-blue-600 hover:underline flex items-center gap-0.5"
              >
                {currentDevice.site_name || `站点 #${currentDevice.site_id}`}
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Calendar className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
            <div>
              <div className="text-slate-500">安装时间</div>
              <div className="font-medium">{mockInstallDate}</div>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Clock className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
            <div>
              <div className="text-slate-500">最近心跳</div>
              <div className="font-medium">
                {currentDevice.last_heartbeat ? new Date(currentDevice.last_heartbeat).toLocaleString() : '-'}
              </div>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Timer className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
            <div>
              <div className="text-slate-500">累计充电次数</div>
              <div className="font-medium">{mockChargeCount.toLocaleString()} 次</div>
            </div>
          </div>
          <div className="flex items-start gap-2 sm:col-span-2">
            <AlertCircle className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
            <div>
              <div className="text-slate-500">故障码</div>
              <div>
                {currentDevice.fault_code ? (
                  <div className="flex items-center gap-2">
                    <span className="text-red-600 font-mono font-bold bg-red-50 px-2 py-0.5 rounded">
                      {currentDevice.fault_code}
                    </span>
                    <span className="text-red-600 text-sm">
                      {faultCodeLabels[currentDevice.fault_code] || '未知故障'}
                    </span>
                  </div>
                ) : (
                  <span className="text-emerald-600 font-medium">无故障</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {ports.length > 0 && (
        <div className="bg-white rounded-lg border border-slate-200 p-5">
          <h3 className="font-semibold text-slate-800 mb-4">端口状态</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {ports.map((p) => {
              const chargingOrder = chargingOrdersByPort.get(p.id)
              const duration = chargingDurationMinutes.get(p.id)
              const isClickable = p.status === 'charging' && chargingOrder

              return (
                <div
                  key={p.id}
                  onClick={() => isClickable && handlePortClick(p)}
                  className={cn(
                    'rounded-lg border-2 p-4 transition-colors',
                    portStatusColor[p.status] || 'bg-slate-100 border-slate-300',
                    isClickable && 'cursor-pointer'
                  )}
                >
                  <div className="text-xs text-slate-500 mb-2">端口 {p.port_number}</div>
                  <div className="mb-2">
                    <StatusBadge status={p.status} />
                  </div>
                  <div className="text-xs text-slate-500 font-mono mb-2">{p.connector_type}</div>
                  {chargingOrder && duration !== undefined && (
                    <div className="space-y-1 pt-2 border-t border-emerald-200">
                      <div className="text-xs text-slate-600">
                        订单号：<span className="font-mono text-emerald-700">#{chargingOrder.id}</span>
                      </div>
                      <div className="text-xs text-slate-600 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        已充电：{formatDuration(duration)}
                      </div>
                    </div>
                  )}
                  {isClickable && (
                    <div className="text-xs text-emerald-600 mt-2 flex items-center justify-center gap-0.5">
                      查看详情 <ChevronRight className="w-3 h-3" />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg border border-slate-200 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Signal className="w-4 h-4 text-cyan-500" />
          <h3 className="font-semibold text-slate-800">心跳记录</h3>
          <span className="text-xs text-slate-500">（最近10条）</span>
        </div>
        <div className="relative">
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-200" />
          <div className="space-y-4">
            {heartbeatRecords.map((record, index) => (
              <div key={record.id} className="relative pl-10">
                <div
                  className={cn(
                    'absolute left-2 w-5 h-5 rounded-full border-2 flex items-center justify-center',
                    record.online
                      ? 'bg-emerald-50 border-emerald-400'
                      : 'bg-red-50 border-red-400'
                  )}
                >
                  <div
                    className={cn(
                      'w-2 h-2 rounded-full',
                      record.online ? 'bg-emerald-500' : 'bg-red-500'
                    )}
                  />
                </div>
                <div className="bg-slate-50 rounded-lg p-3 flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-slate-800">
                      {new Date(record.timestamp).toLocaleString()}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <StatusBadge status={record.online ? 'online' : 'offline'} />
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-slate-500">信号强度</div>
                    <div className="flex items-center gap-1">
                      <Signal
                        className={cn(
                          'w-4 h-4',
                          record.signalStrength >= 90
                            ? 'text-emerald-500'
                            : record.signalStrength >= 80
                            ? 'text-amber-500'
                            : 'text-red-500'
                        )}
                      />
                      <span
                        className={cn(
                          'text-sm font-mono font-medium',
                          record.signalStrength >= 90
                            ? 'text-emerald-600'
                            : record.signalStrength >= 80
                            ? 'text-amber-600'
                            : 'text-red-600'
                        )}
                      >
                        {record.signalStrength}%
                      </span>
                    </div>
                  </div>
                </div>
                {index < heartbeatRecords.length - 1 && (
                  <div className="absolute left-4 top-full w-0.5 h-4 bg-slate-200" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200">
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-blue-500" />
            <h3 className="font-semibold text-slate-800">关联工单</h3>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-amber-500" />
              <span className="text-slate-600">待处理：</span>
              <span className="font-semibold text-amber-600">{workOrderStats.pending}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-slate-600">已解决：</span>
              <span className="font-semibold text-emerald-600">{workOrderStats.resolved}</span>
            </div>
            <div className="text-slate-500">
              总计：<span className="font-semibold">{workOrderStats.total}</span>
            </div>
          </div>
        </div>
        <DataTable
          columns={workOrderColumns}
          data={relatedWorkOrders}
          onRowClick={(row) => navigate(`/work-orders/${row.id}`)}
          emptyText="暂无关联工单"
        />
      </div>

      <div className="bg-white rounded-lg border border-slate-200">
        <div className="px-5 py-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500" />
            <h3 className="font-semibold text-slate-800">最近订单</h3>
            <span className="text-xs text-slate-500">（最近10条）</span>
          </div>
        </div>
        <DataTable
          columns={orderColumns}
          data={deviceOrders}
          onRowClick={(row) => navigate(`/orders/${row.id}`)}
          emptyText="暂无订单"
        />
      </div>
    </div>
  )
}
