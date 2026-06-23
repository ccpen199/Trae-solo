import { useEffect, useState } from 'react'
import {
  Truck,
  AlertTriangle,
  MapPin,
  Package,
  Gauge,
  CheckCircle2,
  Clock,
  AlertCircle,
  Circle,
  ChevronRight,
  Navigation,
} from 'lucide-react'
import { PageHeader } from '../components/ui/Breadcrumb'
import { StatCard } from '../components/ui/StatCard'
import { Section } from '../components/ui/Section'
import { DataTable } from '../components/ui/DataTable'
import { Tag } from '../components/ui/Tag'
import { mockOrders, mockTrackingEvents, mockAlerts, mockCapacity } from '../data/mock'
import { formatDateTime, statusColor, cn } from '../utils'
import type { TrackingEvent, AbnormalAlert } from '../types'

interface RoutePoint {
  name: string
  x: number
  y: number
}

const routes: { id: string; from: RoutePoint; to: RoutePoint; color: string; orderId: string; orderNo: string; plate: string }[] = [
  {
    id: 'route_001',
    from: { name: '上海', x: 640, y: 255 },
    to: { name: '广州', x: 555, y: 490 },
    color: '#6366f1',
    orderId: 'ord_001',
    orderNo: 'YDL202606210001',
    plate: '沪A·38729',
  },
  {
    id: 'route_002',
    from: { name: '深圳', x: 545, y: 510 },
    to: { name: '长沙', x: 550, y: 395 },
    color: '#f59e0b',
    orderId: 'ord_005',
    orderNo: 'YDL202606210005',
    plate: '粤B·H8839',
  },
]

const waypointsOnMap: { x: number; y: number; name: string }[] = [
  { x: 620, y: 290, name: '嘉兴' },
  { x: 595, y: 355, name: '金华' },
  { x: 575, y: 415, name: '赣州' },
]

const eventIconMap: Record<string, typeof Circle> = {
  order_created: Package,
  order_published: Package,
  order_matched: CheckCircle2,
  vehicle_arrived_pickup: MapPin,
  cargo_loaded: Package,
  departed_origin: Navigation,
  waypoint_passed: MapPin,
  abnormal_detected: AlertCircle,
  arrived_destination: MapPin,
  cargo_unloaded: Package,
  order_completed: CheckCircle2,
}

export default function Tracking() {
  const [selectedOrderId, setSelectedOrderId] = useState<string>('ord_001')
  const [vehiclePositions, setVehiclePositions] = useState<Record<string, number>>({
    route_001: 0.55,
    route_002: 0.35,
  })

  useEffect(() => {
    const timer = setInterval(() => {
      setVehiclePositions((prev) => {
        const next: Record<string, number> = {}
        for (const key of Object.keys(prev)) {
          let val = prev[key] + 0.003
          if (val > 0.95) val = 0.05
          next[key] = val
        }
        return next
      })
    }, 80)
    return () => clearInterval(timer)
  }, [])

  const inTransitOrders = mockOrders.filter((o) => o.status === 'in_transit' || o.status === 'exception')
  const unresolvedAlerts = mockAlerts.filter((a) => !a.resolved)
  const onlineFleet = mockCapacity.filter((v) => v.gpsStatus === 'online').length
  const avgOnTimeRate = mockCapacity.reduce((s, v) => s + v.onTimeRate, 0) / mockCapacity.length

  const selectedOrderEvents = mockTrackingEvents
    .filter((e) => e.orderId === selectedOrderId)
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

  const getPointOnRoute = (from: RoutePoint, to: RoutePoint, t: number) => ({
    x: from.x + (to.x - from.x) * t,
    y: from.y + (to.y - from.y) * t,
  })

  const renderAlertSeverity = (severity: string) => {
    const map: Record<string, 'danger' | 'warning' | 'info'> = {
      high: 'danger',
      medium: 'warning',
      low: 'info',
    }
    return map[severity] || 'info'
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="在途可视化"
        subtitle="实时监控全国在途运输车辆、订单轨迹与异常告警"
        breadcrumbs={[{ label: '工作台', href: '#', icon: Package }, { label: '在途可视化' }]}
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="在途订单"
          value={inTransitOrders.length}
          trend={
            <span className="flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-green-400" /> GPS实时追踪中
            </span>
          }
          icon={<Package className="h-5 w-5" />}
          iconColor="bg-indigo-500/15 text-indigo-400"
        />
        <StatCard
          label="异常告警"
          value={unresolvedAlerts.length}
          trend={
            <span className="flex items-center gap-1 text-red-400">
              <AlertTriangle className="h-3 w-3" /> {mockAlerts.filter((a) => !a.resolved && a.severity === 'high').length} 项高风险
            </span>
          }
          icon={<AlertTriangle className="h-5 w-5" />}
          iconColor="bg-red-500/15 text-red-400"
        />
        <StatCard
          label="GPS在线率"
          value={`${((onlineFleet / mockCapacity.length) * 100).toFixed(1)}%`}
          trend={
            <span className="flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-green-400" /> {onlineFleet}/{mockCapacity.length} 辆车在线
            </span>
          }
          icon={<Navigation className="h-5 w-5" />}
          iconColor="bg-cyan-500/15 text-cyan-400"
        />
        <StatCard
          label="平均准点率"
          value={`${avgOnTimeRate.toFixed(1)}%`}
          trend={
            <span className="flex items-center gap-1 text-green-400">
              <CheckCircle2 className="h-3 w-3" /> 高于行业均值 3.2%
            </span>
          }
          icon={<Gauge className="h-5 w-5" />}
          iconColor="bg-emerald-500/15 text-emerald-400"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <Section
          title="在途地图"
          subtitle="全国运输路线实时监控"
          className="lg:col-span-3"
          actions={
            <div className="flex items-center gap-2">
              {routes.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setSelectedOrderId(r.orderId)}
                  className={cn(
                    'flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs transition-colors',
                    selectedOrderId === r.orderId
                      ? 'border-primary-500/50 bg-primary-500/15 text-primary-400'
                      : 'border-logistics-border bg-logistics-bg text-logistics-muted hover:border-primary-500/30 hover:text-logistics-text'
                  )}
                >
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: r.color }} />
                  {r.from.name}→{r.to.name}
                </button>
              ))}
            </div>
          }
        >
          <div className="relative h-[520px] w-full overflow-hidden rounded-lg border border-logistics-border/60 bg-logistics-bg">
            <svg viewBox="0 0 800 600" className="h-full w-full">
              <defs>
                <linearGradient id="mapBg" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#0a1428" />
                  <stop offset="100%" stopColor="#0f1b36" />
                </linearGradient>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                {routes.map((r) => (
                  <linearGradient key={`grad-${r.id}`} id={`gradient-${r.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor={r.color} stopOpacity="0.9" />
                    <stop offset="100%" stopColor={r.color} stopOpacity="0.4" />
                  </linearGradient>
                ))}
              </defs>

              <rect x="0" y="0" width="800" height="600" fill="url(#mapBg)" />

              <g stroke="#1e2d4a" strokeWidth="0.8" fill="none" opacity="0.7">
                <path d="M200,150 L260,130 L320,140 L380,120 L440,135 L500,115 L560,130 L620,120 L680,150 L700,180 L690,240 L720,290 L700,350 L680,400 L700,460 L670,510 L620,540 L560,550 L500,560 L440,545 L380,560 L320,545 L260,555 L200,530 L150,500 L120,440 L100,380 L110,320 L90,260 L120,200 L150,170 Z" />
                <path d="M250,200 L310,190 L370,200 L430,185 L490,195 L550,185 L610,200 L640,250 L620,310 L600,370 L620,430 L580,490 L520,510 L460,500 L400,510 L340,495 L280,505 L220,475 L180,420 L170,350 L190,290 L170,240 Z" />
                <path d="M300,240 L360,235 L420,245 L480,235 L540,250 L580,300 L560,360 L540,420 L500,470 L440,465 L380,475 L320,455 L270,410 L250,345 L270,285 Z" />
              </g>

              <g stroke="#1e2d4a" strokeWidth="0.5" fill="none" opacity="0.4">
                {Array.from({ length: 12 }).map((_, i) => (
                  <line key={`v-${i}`} x1={i * 70} y1="0" x2={i * 70} y2="600" strokeDasharray="2,4" />
                ))}
                {Array.from({ length: 9 }).map((_, i) => (
                  <line key={`h-${i}`} x1="0" y1={i * 70} x2="800" y2={i * 70} strokeDasharray="2,4" />
                ))}
              </g>

              {routes.map((r) => {
                const midX = (r.from.x + r.to.x) / 2
                const midY = Math.min(r.from.y, r.to.y) - 60
                return (
                  <g key={`path-${r.id}`}>
                    <path
                      d={`M ${r.from.x} ${r.from.y} Q ${midX} ${midY} ${r.to.x} ${r.to.y}`}
                      stroke={`url(#gradient-${r.id})`}
                      strokeWidth="3"
                      fill="none"
                      strokeLinecap="round"
                      opacity={selectedOrderId === r.orderId ? 1 : 0.55}
                      filter={selectedOrderId === r.orderId ? 'url(#glow)' : undefined}
                    />
                    <path
                      d={`M ${r.from.x} ${r.from.y} Q ${midX} ${midY} ${r.to.x} ${r.to.y}`}
                      stroke={r.color}
                      strokeWidth="1.5"
                      fill="none"
                      strokeDasharray="6,8"
                      opacity="0.5"
                    >
                      <animate attributeName="stroke-dashoffset" from="0" to="-28" dur="1.5s" repeatCount="indefinite" />
                    </path>
                  </g>
                )
              })}

              {waypointsOnMap.map((wp, idx) => (
                <g key={`wp-${idx}`}>
                  <circle cx={wp.x} cy={wp.y} r="5" fill="#1e2d4a" stroke="#3b82f6" strokeWidth="1.5" />
                  <circle cx={wp.x} cy={wp.y} r="2" fill="#3b82f6" />
                  <text x={wp.x + 10} y={wp.y + 4} fill="#94a3b8" fontSize="10">{wp.name}</text>
                </g>
              ))}

              {routes.map((r) => {
                const midX = (r.from.x + r.to.x) / 2
                const midY = Math.min(r.from.y, r.to.y) - 60
                const t = vehiclePositions[r.id]
                const bezierT = t
                const oneMinusT = 1 - bezierT
                const vx = oneMinusT * oneMinusT * r.from.x + 2 * oneMinusT * bezierT * midX + bezierT * bezierT * r.to.x
                const vy = oneMinusT * oneMinusT * r.from.y + 2 * oneMinusT * bezierT * midY + bezierT * bezierT * r.to.y

                return (
                  <g key={`vehicle-${r.id}`}>
                    <circle cx={vx} cy={vy} r="14" fill={r.color} opacity="0.15">
                      <animate attributeName="r" values="10;18;10" dur="2s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.3;0.05;0.3" dur="2s" repeatCount="indefinite" />
                    </circle>
                    <circle cx={vx} cy={vy} r="9" fill={r.color} opacity="0.3" />
                    <circle cx={vx} cy={vy} r="6" fill={r.color} />
                    <g transform={`translate(${vx - 6}, ${vy - 6})`}>
                      <Truck className="h-3 w-3 text-white" />
                    </g>
                  </g>
                )
              })}

              {routes.map((r) => (
                <g key={`endpoints-${r.id}`}>
                  <g>
                    <circle cx={r.from.x} cy={r.from.y} r="10" fill="#0f1b36" stroke={r.color} strokeWidth="2" />
                    <circle cx={r.from.x} cy={r.from.y} r="4" fill={r.color} />
                    <rect x={r.from.x - 28} y={r.from.y - 30} width="56" height="20" rx="4" fill="#111a2e" stroke="#1e2d4a" />
                    <text x={r.from.x} y={r.from.y - 16} textAnchor="middle" fill="#e2e8f0" fontSize="11" fontWeight="500">
                      {r.from.name}
                    </text>
                  </g>
                  <g>
                    <circle cx={r.to.x} cy={r.to.y} r="10" fill="#0f1b36" stroke={r.color} strokeWidth="2" />
                    <circle cx={r.to.x} cy={r.to.y} r="4" fill="#10b981" />
                    <rect x={r.to.x - 28} y={r.to.y + 12} width="56" height="20" rx="4" fill="#111a2e" stroke="#1e2d4a" />
                    <text x={r.to.x} y={r.to.y + 26} textAnchor="middle" fill="#e2e8f0" fontSize="11" fontWeight="500">
                      {r.to.name}
                    </text>
                  </g>
                </g>
              ))}

              {mockAlerts.filter((a) => !a.resolved && a.severity === 'high').map((a) => {
                const ax = 542
                const ay = 445
                return (
                  <g key={a.id}>
                    <circle cx={ax} cy={ay} r="16" fill="#ef4444" opacity="0.15">
                      <animate attributeName="r" values="12;22;12" dur="1.5s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.4;0.05;0.4" dur="1.5s" repeatCount="indefinite" />
                    </circle>
                    <circle cx={ax} cy={ay} r="9" fill="#ef4444" opacity="0.4" />
                    <circle cx={ax} cy={ay} r="6" fill="#ef4444" />
                    <g transform={`translate(${ax - 4}, ${ay - 4})`}>
                      <AlertTriangle className="h-2 w-2 text-white" />
                    </g>
                  </g>
                )
              })}
            </svg>

            <div className="absolute bottom-4 left-4 rounded-lg border border-logistics-border/60 bg-logistics-panel/90 px-3 py-2.5 backdrop-blur-sm">
              <div className="space-y-1.5 text-xs">
                {routes.map((r) => (
                  <div key={`legend-${r.id}`} className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: r.color }} />
                    <span className="text-logistics-muted">{r.from.name}→{r.to.name}</span>
                    <span className="font-mono text-logistics-text">{r.plate}</span>
                  </div>
                ))}
                <div className="flex items-center gap-2 pt-1 border-t border-logistics-border/50">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
                  <span className="text-logistics-muted">异常告警点</span>
                </div>
              </div>
            </div>

            <div className="absolute right-4 top-4 rounded-lg border border-logistics-border/60 bg-logistics-panel/90 px-3 py-2 backdrop-blur-sm">
              <div className="flex items-center gap-1.5 text-xs text-green-400">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
                </span>
                实时数据刷新中
              </div>
            </div>
          </div>
        </Section>

        <Section
          title="订单跟踪时间轴"
          subtitle={`订单 ${mockOrders.find((o) => o.id === selectedOrderId)?.orderNo || ''} 全流程节点`}
          className="lg:col-span-2"
        >
          {selectedOrderEvents.length > 0 && (
            <div className="mb-4 rounded-lg border border-logistics-border/60 bg-logistics-bg p-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm text-primary-400">
                      {mockOrders.find((o) => o.id === selectedOrderId)?.orderNo}
                    </span>
                    <Tag className={statusColor(mockOrders.find((o) => o.id === selectedOrderId)?.status || '')}>
                      {mockOrders.find((o) => o.id === selectedOrderId)?.statusLabel}
                    </Tag>
                  </div>
                  <div className="mt-1 text-xs text-logistics-muted">
                    {mockOrders.find((o) => o.id === selectedOrderId)?.originCity}
                    <ChevronRight className="inline h-3 w-3" />
                    {mockOrders.find((o) => o.id === selectedOrderId)?.destCity}
                    <span className="mx-2">·</span>
                    {mockOrders.find((o) => o.id === selectedOrderId)?.cargo.name}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-logistics-muted">承运车辆</div>
                  <div className="font-mono text-sm text-logistics-text">
                    {mockOrders.find((o) => o.id === selectedOrderId)?.vehiclePlate || '-'}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="relative max-h-[430px] overflow-y-auto pr-2">
            {selectedOrderEvents.length === 0 ? (
              <div className="py-12 text-center text-sm text-logistics-muted">暂无跟踪事件</div>
            ) : (
              <div className="relative">
                <div className="absolute left-[11px] top-1 bottom-1 w-px bg-logistics-border" />
                {selectedOrderEvents.map((event: TrackingEvent, idx: number) => {
                  const isLast = idx === selectedOrderEvents.length - 1
                  const EventIcon = eventIconMap[event.eventType] || Circle
                  return (
                    <div key={event.id} className="relative flex gap-3 pb-5 last:pb-0">
                      <div className="relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-logistics-bg bg-primary-500/20">
                        <EventIcon className="h-3 w-3 text-primary-400" />
                      </div>
                      <div className="min-w-0 flex-1 pt-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-logistics-text">{event.eventLabel}</span>
                          {isLast && <Tag variant="primary" dot>最新</Tag>}
                        </div>
                        <div className="mt-0.5 flex items-center gap-2 text-xs text-logistics-muted">
                          <MapPin className="h-3 w-3" />
                          <span>{event.location}</span>
                        </div>
                        {event.remark && (
                          <p className="mt-1.5 rounded-md bg-logistics-bg px-2 py-1.5 text-xs text-logistics-muted">
                            {event.remark}
                          </p>
                        )}
                        <div className="mt-1 flex items-center gap-3 text-[11px] text-logistics-muted">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDateTime(event.timestamp)}
                          </span>
                          {event.operator && <span>操作人：{event.operator}</span>}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </Section>
      </div>

      <Section
        title="异常告警列表"
        subtitle={`共 ${mockAlerts.length} 条告警记录，${unresolvedAlerts.length} 条待处理`}
        actions={
          <div className="flex items-center gap-2">
            <Tag variant="danger" dot>高风险 {mockAlerts.filter((a) => a.severity === 'high' && !a.resolved).length}</Tag>
            <Tag variant="warning" dot>中风险 {mockAlerts.filter((a) => a.severity === 'medium' && !a.resolved).length}</Tag>
            <button className="btn-ghost">导出</button>
          </div>
        }
      >
        <DataTable
          columns={[
            {
              key: 'alertId',
              title: '告警编号',
              width: '120px',
              render: (r) => <span className="font-mono text-xs text-primary-400">{(r as AbnormalAlert).id.toUpperCase()}</span>,
            },
            {
              key: 'orderNo',
              title: '关联订单',
              width: '150px',
              render: (r) => <span className="font-mono text-xs text-logistics-text">{(r as AbnormalAlert).orderNo}</span>,
            },
            {
              key: 'type',
              title: '告警类型',
              render: (r) => (
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-logistics-muted" />
                  <span>{(r as AbnormalAlert).typeLabel}</span>
                </div>
              ),
            },
            {
              key: 'severity',
              title: '风险等级',
              align: 'center',
              width: '100px',
              render: (r) => (
                <Tag variant={renderAlertSeverity((r as AbnormalAlert).severity)} dot>
                  {(r as AbnormalAlert).severityLabel}
                </Tag>
              ),
            },
            {
              key: 'location',
              title: '告警位置',
              render: (r) => (
                <div className="flex items-center gap-1.5 text-sm">
                  <MapPin className="h-3.5 w-3.5 text-logistics-muted" />
                  <span>{(r as AbnormalAlert).location}</span>
                </div>
              ),
            },
            {
              key: 'detectedAt',
              title: '检测时间',
              width: '140px',
              render: (r) => <span className="text-xs text-logistics-muted">{formatDateTime((r as AbnormalAlert).detectedAt)}</span>,
            },
            {
              key: 'resolved',
              title: '状态',
              align: 'center',
              width: '90px',
              render: (r) =>
                (r as AbnormalAlert).resolved ? (
                  <Tag variant="success">已处理</Tag>
                ) : (
                  <Tag variant="warning">待处理</Tag>
                ),
            },
            {
              key: 'remark',
              title: '告警详情',
              render: (r) => (
                <span className="text-xs text-logistics-muted line-clamp-1">{(r as AbnormalAlert).remark}</span>
              ),
            },
            {
              key: 'action',
              title: '操作',
              align: 'center',
              width: '100px',
              render: (r) =>
                !(r as AbnormalAlert).resolved ? (
                  <div className="flex items-center justify-center gap-1.5">
                    <button className="btn-primary !px-2.5 !py-1 !text-xs">处理</button>
                    <button className="btn-ghost !px-2 !py-1 !text-xs">详情</button>
                  </div>
                ) : (
                  <span className="text-xs text-logistics-muted">{(r as AbnormalAlert).resolver}</span>
                ),
            },
          ]}
          data={mockAlerts}
          rowKey={(r) => (r as AbnormalAlert).id}
        />
      </Section>
    </div>
  )
}
