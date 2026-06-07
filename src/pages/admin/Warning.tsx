import { useEffect, useState } from 'react'
import { AlertTriangle, TrendingDown, TrendingUp } from 'lucide-react'
import DataTable from '@/components/DataTable'
import StatusBadge from '@/components/StatusBadge'
import { api } from '@/utils/api'

interface WarningItem {
  id: string
  route: string
  type: 'supply_shortage' | 'demand_surge' | 'price_anomaly' | 'capacity_overflow'
  severity: 'danger' | 'warning' | 'info'
  message: string
  metric: string
  change: number
  createdAt: string
}

interface ApiWarningItem {
  id?: string | number
  route?: string
  from_city?: string
  to_city?: string
  type?: WarningItem['type']
  severity?: WarningItem['severity']
  warning_level?: 'low' | 'medium' | 'high' | 'critical'
  description?: string
  message?: string
  supply_demand_ratio?: number
  created_at?: string
  createdAt?: string
}

const defaultWarnings: WarningItem[] = [
  { id: '1', route: '上海→杭州', type: 'supply_shortage', severity: 'danger', message: '运力严重不足，在线司机仅 12 人', metric: '运力缺口', change: -45, createdAt: '2026-06-01 08:30' },
  { id: '2', route: '广州→深圳', type: 'demand_surge', severity: 'warning', message: '货量突增 60%，建议调派额外运力', metric: '货量增幅', change: 60, createdAt: '2026-06-01 09:15' },
  { id: '3', route: '北京→天津', type: 'price_anomaly', severity: 'warning', message: '运价异常波动，较昨日上涨 25%', metric: '运价波动', change: 25, createdAt: '2026-06-01 10:00' },
  { id: '4', route: '武汉→长沙', type: 'capacity_overflow', severity: 'info', message: '运力过剩，建议调整定价策略', metric: '运力冗余', change: 30, createdAt: '2026-06-01 11:30' },
  { id: '5', route: '成都→重庆', type: 'supply_shortage', severity: 'warning', message: '冷藏车运力紧张，缺口约 8 车', metric: '冷链缺口', change: -20, createdAt: '2026-06-01 12:00' },
  { id: '6', route: '西安→郑州', type: 'price_anomaly', severity: 'danger', message: '运价暴跌 35%，可能存在恶性竞争', metric: '运价下跌', change: -35, createdAt: '2026-06-01 13:20' },
]

const severityBadge: Record<string, { status: 'danger' | 'warning' | 'info'; label: string }> = {
  danger: { status: 'danger', label: '严重' },
  warning: { status: 'warning', label: '警告' },
  info: { status: 'info', label: '提示' },
}

const typeLabels: Record<string, string> = {
  supply_shortage: '运力不足',
  demand_surge: '需求激增',
  price_anomaly: '价格异常',
  capacity_overflow: '运力过剩',
}

export default function Warning() {
  const [warnings, setWarnings] = useState<WarningItem[]>(defaultWarnings)
  const [severityFilter, setSeverityFilter] = useState<string>('all')

  useEffect(() => {
    api.get<WarningItem[] | { warnings: ApiWarningItem[] }>('/admin/warnings')
      .then((data) => {
        const rows = Array.isArray(data) ? data : data.warnings
        if (!Array.isArray(rows)) return
        setWarnings(rows.map((w, index) => {
          const level = w.warning_level
          const severity = w.severity ?? (level === 'critical' || level === 'high' ? 'danger' : level === 'medium' ? 'warning' : 'info')
          const ratio = w.supply_demand_ratio ?? 1
          return {
            id: String(w.id ?? index + 1),
            route: w.route ?? `${w.from_city ?? '全国'}→${w.to_city ?? '重点线路'}`,
            type: w.type ?? (ratio < 0.8 ? 'supply_shortage' : ratio > 1.2 ? 'capacity_overflow' : 'demand_surge'),
            severity,
            message: w.message ?? w.description ?? '线路供需出现波动，请关注运力调度',
            metric: '供需比',
            change: Number(((ratio - 1) * 100).toFixed(1)),
            createdAt: w.createdAt ?? w.created_at ?? '',
          }
        }))
      })
      .catch(() => {})
  }, [])

  const filtered = warnings.filter((w) => {
    if (severityFilter !== 'all' && w.severity !== severityFilter) return false
    return true
  })

  const columns = [
    { key: 'route', title: '线路', sortable: true, render: (row: WarningItem) => (
      <span className="font-medium text-primary">{row.route}</span>
    )},
    { key: 'type', title: '类型', render: (row: WarningItem) => (
      <span className="px-2 py-0.5 rounded bg-gray-100 text-xs">{typeLabels[row.type]}</span>
    )},
    { key: 'severity', title: '级别', render: (row: WarningItem) => <StatusBadge {...severityBadge[row.severity]} /> },
    { key: 'message', title: '预警信息', render: (row: WarningItem) => (
      <span className="text-sm text-primary max-w-xs truncate block">{row.message}</span>
    )},
    { key: 'metric', title: '指标', render: (row: WarningItem) => (
      <span className="flex items-center gap-1 text-xs font-medium">
        {row.change > 0 ? (
          <><TrendingUp size={12} className="text-mint" /> +{row.change}%</>
        ) : (
          <><TrendingDown size={12} className="text-coral" /> {row.change}%</>
        )}
      </span>
    )},
    { key: 'createdAt', title: '时间', sortable: true },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-primary">供需预警</h1>
        <p className="text-sm text-secondary mt-0.5">监控线路供需异常</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="card flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg gradient-coral flex items-center justify-center text-white">
            <AlertTriangle size={18} />
          </div>
          <div>
            <p className="text-2xl font-bold text-coral">{warnings.filter((w) => w.severity === 'danger').length}</p>
            <p className="text-xs text-secondary">严重预警</p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg gradient-accent flex items-center justify-center text-white">
            <AlertTriangle size={18} />
          </div>
          <div>
            <p className="text-2xl font-bold text-accent">{warnings.filter((w) => w.severity === 'warning').length}</p>
            <p className="text-xs text-secondary">一般预警</p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center text-white">
            <AlertTriangle size={18} />
          </div>
          <div>
            <p className="text-2xl font-bold text-primary">{warnings.filter((w) => w.severity === 'info').length}</p>
            <p className="text-xs text-secondary">提示信息</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs text-secondary">级别:</span>
        {['all', 'danger', 'warning', 'info'].map((s) => (
          <button
            key={s}
            onClick={() => setSeverityFilter(s)}
            className={`px-2.5 py-1 rounded-md text-xs transition-colors ${
              severityFilter === s ? 'bg-primary text-white' : 'bg-gray-100 text-secondary hover:bg-gray-200'
            }`}
          >
            {s === 'all' ? '全部' : severityBadge[s]?.label || s}
          </button>
        ))}
      </div>

      <div className="card">
        <DataTable
          columns={columns}
          data={filtered}
        />
      </div>
    </div>
  )
}
