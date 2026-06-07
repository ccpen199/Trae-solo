import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, Package, CheckCircle, Clock, AlertTriangle, Zap, MapPin, Radio, RefreshCw, Brain, Wallet, TrendingUp, Shield, X, ChevronRight, Eye, Play } from 'lucide-react'
import { api } from '@/utils/api'

interface Overview {
  online_riders: number
  pending_orders: number
  today_completed: number
  delivering_orders: number
  total_riders: number
  total_orders: number
  total_alerts: number
  abnormal_trajectories: number
}

interface HeatmapZone {
  id: number
  name: string
  order_count: number
  rider_count: number
  gap: number
  last_dispatch_time?: string
}

interface Alert {
  id: number
  type: string
  description: string
  status: string
  rider_name?: string
  order_no?: string
  created_at: string
  handled_by?: string
  handled_at?: string
}

interface DispatchStats {
  total: number
  success_rate: number
}

interface SettlementStats {
  today_settled: number
  pending_settled: number
}

interface ROIStats {
  roi: number
  investment: number
  output: number
}

interface RiskStats {
  triggered: number
  blocked: number
}

interface BusinessStats {
  dispatch: DispatchStats
  settlement: SettlementStats
  roi: ROIStats
  risk: RiskStats
}

const statCards = [
  { key: 'online_riders' as const, label: '在线骑手', icon: Users, color: 'bg-blue-500', nav: '/riders?status=online' },
  { key: 'pending_orders' as const, label: '待派订单', icon: Package, color: 'bg-orange-500', nav: '/orders?status=pending' },
  { key: 'today_completed' as const, label: '今日完成', icon: CheckCircle, color: 'bg-emerald-500', nav: '/orders?status=completed' },
  { key: 'delivering_orders' as const, label: '平均时长', icon: Clock, color: 'bg-purple-500', nav: null },
  { key: 'total_alerts' as const, label: '告警数', icon: AlertTriangle, color: 'bg-red-500', nav: '/tracking' },
  { key: 'abnormal_trajectories' as const, label: '异常轨迹', icon: Radio, color: 'bg-amber-500', nav: '/tracking' },
]

function ZoneHeatmap({ zones, onZoneClick, selectedZoneId }: { zones: HeatmapZone[]; onZoneClick: (zone: HeatmapZone) => void; selectedZoneId?: number }) {
  const maxOrders = Math.max(...zones.map((z) => z.order_count), 1)
  return (
    <div className="grid grid-cols-3 gap-3 p-4">
      {zones.map((zone) => {
        const intensity = zone.order_count / maxOrders
        const r = Math.round(30 + intensity * 225)
        const g = Math.round(58 + intensity * 50)
        const b = Math.round(95 - intensity * 60)
        const isSelected = selectedZoneId === zone.id
        return (
          <div
            key={zone.id}
            className={`rounded-lg p-3 text-white cursor-pointer transition-all hover:opacity-90 ${isSelected ? 'ring-2 ring-white ring-offset-2' : ''}`}
            style={{ backgroundColor: `rgb(${r},${g},${b})` }}
            onClick={() => onZoneClick(zone)}
          >
            <div className="text-sm font-medium truncate">{zone.name}</div>
            <div className="flex items-center gap-3 mt-2 text-xs opacity-90">
              <span className="flex items-center gap-1">
                <Package size={12} /> {zone.order_count}单
              </span>
              <span className="flex items-center gap-1">
                <Users size={12} /> {zone.rider_count}人
              </span>
            </div>
            {zone.gap > 0 && (
              <div className="text-xs mt-1 text-orange-200">运力缺口 {zone.gap}</div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function ZoneDetailPanel({ zone, onClose, onNavigate }: { zone: HeatmapZone | null; onClose: () => void; onNavigate: (path: string) => void }) {
  if (!zone) return null

  return (
    <div className="bg-gray-50 border-l border-gray-200 p-4 w-72">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">{zone.name}</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X size={18} />
        </button>
      </div>

      <div className="space-y-4">
        <div className="bg-orange-50 rounded-lg p-3">
          <div className="text-xs text-orange-600 font-medium">运力缺口预测</div>
          <div className="text-2xl font-bold text-orange-700 mt-1">{zone.gap}</div>
          <div className="text-xs text-orange-500 mt-1">预计未来2小时内缺少 {zone.gap} 名骑手</div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-blue-50 rounded-lg p-3">
            <div className="text-xs text-blue-600">在线骑手</div>
            <div className="text-xl font-bold text-blue-700 mt-1">{zone.rider_count}</div>
          </div>
          <div className="bg-emerald-50 rounded-lg p-3">
            <div className="text-xs text-emerald-600">待派订单</div>
            <div className="text-xl font-bold text-emerald-700 mt-1">{zone.order_count}</div>
          </div>
        </div>

        {zone.last_dispatch_time && (
          <div className="text-xs text-gray-500">
            最后调度时间: {zone.last_dispatch_time}
          </div>
        )}

        <div className="space-y-2 pt-2">
          <button
            onClick={() => onNavigate(`/riders?zone_id=${zone.id}`)}
            className="w-full btn-primary flex items-center justify-center gap-2"
          >
            <Users size={14} /> 查看骑手
          </button>
          <button
            onClick={() => onNavigate('/dispatch')}
            className="w-full btn-accent flex items-center justify-center gap-2"
          >
            <Zap size={14} /> 智能派单
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [overview, setOverview] = useState<Overview | null>(null)
  const [zones, setZones] = useState<HeatmapZone[]>([])
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedZone, setSelectedZone] = useState<HeatmapZone | null>(null)
  const [businessStats, setBusinessStats] = useState<BusinessStats>({
    dispatch: { total: 128, success_rate: 92 },
    settlement: { today_settled: 15680, pending_settled: 8420 },
    roi: { roi: 2.8, investment: 5000, output: 14000 },
    risk: { triggered: 15, blocked: 3 },
  })

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [ov, hm, al] = await Promise.all([
        api<Overview>('/api/dashboard/overview'),
        api<HeatmapZone[]>('/api/zones/heatmap'),
        api<Alert[]>('/api/alerts?limit=10'),
      ])
      if (!ov.success || !hm.success || !al.success) {
        const errMsg = ov.error || hm.error || al.error || '数据加载失败'
        setError(errMsg)
      } else {
        setOverview(ov.data!)
        setZones(hm.data!)
        setAlerts(al.data!)
      }
    } catch {
      setError('网络连接失败，请检查后重试')
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleStatCardClick = (navPath: string | null) => {
    if (navPath) {
      navigate(navPath)
    }
  }

  const handleAlertClick = (alert: Alert) => {
    navigate('/tracking')
  }

  const getAlertBadge = (status: string, type: string) => {
    if (status === 'pending') {
      return <span className="px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700 rounded-full">待处理</span>
    }
    return <span className="px-2 py-0.5 text-xs font-medium bg-emerald-100 text-emerald-700 rounded-full">已处理</span>
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-gray-400">加载中...</div>
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500 space-y-4">
        <AlertTriangle size={40} className="text-red-400" />
        <div className="text-lg font-medium">{error}</div>
        <button onClick={fetchData} className="btn-primary flex items-center gap-2">
          <RefreshCw size={16} /> 重试
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon
          const isClickable = card.nav !== null
          return (
            <div
              key={card.key}
              className={`card p-5 ${isClickable ? 'cursor-pointer hover:bg-gray-50 transition-colors' : ''}`}
              onClick={() => handleStatCardClick(card.nav)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-500">{card.label}</div>
                  <div className="text-2xl font-bold text-gray-900 mt-1">
                    {card.key === 'delivering_orders' ? '28分钟' : overview?.[card.key] ?? 0}
                  </div>
                </div>
                <div className={`${card.color} p-3 rounded-lg ${isClickable ? 'hover:opacity-80 transition-opacity' : ''}`}>
                  <Icon size={22} className="text-white" />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 card">
          <div className="flex">
            <div className="flex-1">
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                  <MapPin size={16} className="text-primary" /> 区域热力图
                </h2>
              </div>
              {zones.length > 0 ? (
                <ZoneHeatmap
                  zones={zones}
                  onZoneClick={setSelectedZone}
                  selectedZoneId={selectedZone?.id}
                />
              ) : (
                <div className="p-8 text-center text-gray-400">暂无区域数据</div>
              )}
            </div>
            {selectedZone && (
              <ZoneDetailPanel
                zone={selectedZone}
                onClose={() => setSelectedZone(null)}
                onNavigate={navigate}
              />
            )}
          </div>
        </div>

        <div className="card">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2">
              <AlertTriangle size={16} className="text-orange-500" /> 最近告警
            </h2>
          </div>
          <div className="p-4 space-y-3 max-h-[380px] overflow-y-auto">
            {alerts.length > 0 ? (
              alerts.slice(0, 8).map((alert) => (
                <div
                  key={alert.id}
                  className="p-3 rounded-lg hover:bg-gray-50 border border-gray-100"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {getAlertBadge(alert.status, alert.type)}
                        <span className="text-xs text-gray-400">{alert.created_at?.slice(5, 16)}</span>
                      </div>
                      <div className="text-sm text-gray-800">{alert.description}</div>
                      {alert.rider_name && (
                        <div className="text-xs text-gray-500 mt-1">骑手: {alert.rider_name}</div>
                      )}
                      {alert.status === 'handled' && alert.handled_by ? (
                        <div className="text-xs text-emerald-600 mt-1">处理人: {alert.handled_by} · {alert.handled_at?.slice(5, 16)}</div>
                      ) : (
                        <div className="text-xs text-orange-600 mt-1">待处理</div>
                      )}
                      {(alert.type === 'health_code' || alert.type === 'serious_violation') && (
                        <div className="text-xs text-red-600 mt-1 flex items-center gap-1">
                          <AlertTriangle size={10} /> 接单限制: 暂停接单
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => handleAlertClick(alert)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                        title="查看详情"
                      >
                        <Eye size={14} />
                      </button>
                      {alert.status === 'pending' && (
                        <button
                          onClick={() => handleAlertClick(alert)}
                          className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded"
                          title="处理"
                        >
                          <Play size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-400 py-4">暂无告警</div>
            )}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <Zap size={16} className="text-accent" /> 核心业务流程
          </h2>
        </div>
        <div className="p-5 grid grid-cols-2 gap-4">
          <div
            className="rounded-xl p-5 bg-gradient-to-br from-blue-500 to-blue-600 text-white cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => navigate('/dispatch')}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Brain size={20} />
                  <span className="font-semibold">智能派单引擎</span>
                </div>
                <div className="text-2xl font-bold mb-1">
                  {businessStats.dispatch.total} <span className="text-sm font-normal opacity-80">单</span>
                </div>
                <div className="text-sm opacity-80">
                  今日调度 {businessStats.dispatch.total} 单，成功率 {businessStats.dispatch.success_rate}%
                </div>
              </div>
              <ChevronRight size={24} className="opacity-60" />
            </div>
            <button className="mt-4 w-full py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors">
              查看调度日志
            </button>
          </div>

          <div
            className="rounded-xl p-5 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => navigate('/settlement')}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Wallet size={20} />
                  <span className="font-semibold">实时结算</span>
                </div>
                <div className="text-2xl font-bold mb-1">
                  ¥{businessStats.settlement.today_settled.toLocaleString()}
                </div>
                <div className="text-sm opacity-80">
                  今日结算 ¥{businessStats.settlement.today_settled.toLocaleString()}，待结算 ¥{businessStats.settlement.pending_settled.toLocaleString()}
                </div>
              </div>
              <ChevronRight size={24} className="opacity-60" />
            </div>
            <button className="mt-4 w-full py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors">
              查看结算明细
            </button>
          </div>

          <div
            className="rounded-xl p-5 bg-gradient-to-br from-purple-500 to-purple-600 text-white cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => navigate('/dashboard/ops')}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp size={20} />
                  <span className="font-semibold">活动效果分析</span>
                </div>
                <div className="text-2xl font-bold mb-1">
                  ROI {businessStats.roi.roi.toFixed(1)}
                </div>
                <div className="text-sm opacity-80">
                  本月投入 ¥{businessStats.roi.investment.toLocaleString()}，产出 ¥{businessStats.roi.output.toLocaleString()}
                </div>
              </div>
              <ChevronRight size={24} className="opacity-60" />
            </div>
            <button className="mt-4 w-full py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors">
              查看分析
            </button>
          </div>

          <div
            className="rounded-xl p-5 bg-gradient-to-br from-orange-500 to-orange-600 text-white cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => navigate('/risk')}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Shield size={20} />
                  <span className="font-semibold">风控中心</span>
                </div>
                <div className="text-2xl font-bold mb-1">
                  {businessStats.risk.triggered} <span className="text-sm font-normal opacity-80">条</span>
                </div>
                <div className="text-sm opacity-80">
                  今日触发 {businessStats.risk.triggered} 条，拦截 {businessStats.risk.blocked} 单
                </div>
              </div>
              <ChevronRight size={24} className="opacity-60" />
            </div>
            <button className="mt-4 w-full py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-medium transition-colors">
              策略配置
            </button>
          </div>
        </div>
      </div>

      <div className="card p-5">
        <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Zap size={16} className="text-accent" /> 快捷操作
        </h2>
        <div className="flex gap-3">
          <button onClick={() => navigate('/orders/create')} className="btn-accent">创建订单</button>
          <button onClick={() => navigate('/dispatch')} className="btn-primary">区域调度</button>
          <button onClick={() => navigate('/tracking')} className="btn-outline flex items-center gap-2">
            <Radio size={14} /> 查看告警
          </button>
          <button onClick={() => navigate('/dashboard/ops')} className="btn-outline">运营看板</button>
        </div>
      </div>
    </div>
  )
}
