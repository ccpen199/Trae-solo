import { useAppStore } from '@/store'
import {
  Truck,
  AlertTriangle,
  DollarSign,
  FileWarning,
  Users,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  PlayCircle,
  Shield,
  Navigation,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
} from 'recharts'
import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'

interface KPICardProps {
  icon: any
  label: string
  value: string | number
  unit?: string
  trend?: number
  gradient: string
  iconBg: string
  iconColor: string
}

function KPICard({ icon: Icon, label, value, unit, trend, gradient, iconBg, iconColor }: KPICardProps) {
  return (
    <div className="card-base p-5 relative overflow-hidden group card-hover">
      <div className={`absolute top-0 right-0 w-32 h-32 ${gradient} opacity-5 rounded-full -translate-y-1/3 translate-x-1/3`} />
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className={`w-11 h-11 rounded-xl ${iconBg} flex items-center justify-center`}>
            <Icon className={`w-5 h-5 ${iconColor}`} />
          </div>
          {trend !== undefined && (
            <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
              trend >= 0 ? 'bg-success-50 text-success-600' : 'bg-accent-50 text-accent-600'
            }`}>
              {trend >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              {Math.abs(trend)}%
            </div>
          )}
        </div>
        <div className="space-y-1">
          <div className="text-xs text-slate2-400 font-medium">{label}</div>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-extrabold text-slate2-800 font-mono tracking-tight">{value}</span>
            {unit && <span className="text-sm text-slate2-400 font-medium">{unit}</span>}
          </div>
        </div>
      </div>
    </div>
  )
}

function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-16 h-16 rounded-full bg-slate2-100 flex items-center justify-center mb-4">
        <span className="text-3xl">📊</span>
      </div>
      <p className="text-sm font-medium text-slate2-600">{title}</p>
      {description && <p className="text-xs text-slate2-400 mt-1">{description}</p>}
    </div>
  )
}

export default function Dashboard() {
  const {
    kpi,
    freightTrend,
    onTimeTrend,
    cargoTypeDistribution,
    waybills,
    alerts,
    vehicleMapData,
    cargoOrders,
    capacities,
  } = useAppStore()

  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 100)
    return () => clearTimeout(timer)
  }, [])

  const safeKpi = kpi || {
    totalInTransit: 0,
    monthlyFreightCost: 0,
    insuranceClaimRate: 0,
    capacityPoolSize: 0,
    onTimeDeliveryRate: 0,
  }

  const safeFreightTrend = freightTrend || []
  const safeOnTimeTrend = onTimeTrend || []
  const safeCargoTypeDistribution = cargoTypeDistribution || []
  const safeWaybills = waybills || []
  const safeAlerts = alerts || []
  const safeVehicleMapData = vehicleMapData || []
  const safeCargoOrders = cargoOrders || []
  const safeCapacities = capacities || []

  const pendingAlerts = safeAlerts.filter((a) => a.status !== 'resolved')
  const inTransitWaybills = safeWaybills.filter((w) => w.status === 'in_transit')
  const goldCapacities = safeCapacities.filter((c) => c.level === 'gold')

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-slate2-500">加载中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6 gap-4">
        <KPICard
          icon={Truck}
          label="在途运单数"
          value={safeKpi.totalInTransit || 0}
          unit="单"
          trend={8.2}
          gradient="bg-primary-500"
          iconBg="bg-primary-50"
          iconColor="text-primary-500"
        />
        <KPICard
          icon={AlertTriangle}
          label="待处理告警"
          value={pendingAlerts.length}
          unit="条"
          trend={-15.6}
          gradient="bg-accent-500"
          iconBg="bg-accent-50"
          iconColor="text-accent-500"
        />
        <KPICard
          icon={DollarSign}
          label="本月运费总额"
          value={((safeKpi.monthlyFreightCost || 0) / 10000).toFixed(1)}
          unit="万元"
          trend={12.4}
          gradient="bg-success-500"
          iconBg="bg-success-50"
          iconColor="text-success-600"
        />
        <KPICard
          icon={FileWarning}
          label="保险理赔率"
          value={safeKpi.insuranceClaimRate || 0}
          unit="%"
          trend={-0.3}
          gradient="bg-gradient-kpi-purple"
          iconBg="bg-violet-50"
          iconColor="text-violet-500"
        />
        <KPICard
          icon={Users}
          label="运力池规模"
          value={safeKpi.capacityPoolSize || 0}
          unit="家/人"
          trend={5.8}
          gradient="bg-primary-600"
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
        />
        <KPICard
          icon={CheckCircle2}
          label="准点交付率"
          value={safeKpi.onTimeDeliveryRate || 0}
          unit="%"
          trend={1.2}
          gradient="bg-success-600"
          iconBg="bg-success-50"
          iconColor="text-success-600"
        />
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 xl:col-span-8 space-y-6">
          <div className="card-base overflow-hidden card-hover">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate2-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary-50 flex items-center justify-center">
                  <Navigation className="w-5 h-5 text-primary-500" />
                </div>
                <div>
                  <h3 className="font-bold text-slate2-800">全国实时运输监控</h3>
                  <p className="text-xs text-slate2-400">实时追踪 {inTransitWaybills.length} 辆在途运输车辆</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="hidden lg:flex items-center gap-4 text-xs">
                  <LegendItem color="bg-success-500" label="行驶中" count={safeVehicleMapData.filter(v => v.status === 'moving').length} />
                  <LegendItem color="bg-slate2-400" label="停留" count={safeVehicleMapData.filter(v => v.status === 'stop').length} />
                  <LegendItem color="bg-accent-500" label="异常" count={safeVehicleMapData.filter(v => v.status === 'warning').length} />
                  <LegendItem color="bg-primary-400" label="装卸货" count={safeVehicleMapData.filter(v => ['loading', 'unloading'].includes(v.status)).length} />
                </div>
                <Link
                  to="/tracking"
                  className="text-xs text-primary-500 hover:text-primary-600 font-medium flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary-50 hover:bg-primary-100 transition-colors"
                >
                  查看全部 <ArrowUpRight className="w-3 h-3" />
                </Link>
              </div>
            </div>

            <div className="h-[420px] map-bg relative overflow-hidden">
              {safeVehicleMapData.length > 0 ? (
                <>
                  {safeVehicleMapData.map((v, idx) => {
                    const x = 10 + ((v.lng - 73) / 65) * 80
                    const y = 10 + ((54 - v.lat) / 35) * 80
                    let color = 'bg-success-400'
                    if (v.status === 'warning') color = 'bg-accent-500'
                    if (v.status === 'stop') color = 'bg-amber-400'
                    if (['loading', 'unloading'].includes(v.status)) color = 'bg-primary-400'
                    if (v.status === 'arrived') color = 'bg-success-600'

                    return (
                      <div
                        key={v.id}
                        className="absolute cursor-pointer group"
                        style={{ left: `${x}%`, top: `${y}%` }}
                      >
                        <div className="relative">
                          <div className={`absolute -inset-1.5 rounded-full ${color} opacity-30 animate-pulseRing`} />
                          <div className={`relative w-3 h-3 rounded-full ${color} shadow-lg ring-2 ring-white/20`} />
                        </div>

                        <div className="absolute z-20 left-1/2 -translate-x-1/2 bottom-full mb-2 w-56 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                          <div className="bg-white rounded-xl shadow-cardHover border border-slate2-100 p-3">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-mono font-bold text-sm text-slate2-800">{v.plate}</span>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                                v.status === 'moving' ? 'bg-success-50 text-success-600' :
                                v.status === 'warning' ? 'bg-accent-50 text-accent-600' :
                                'bg-slate2-100 text-slate2-600'
                              }`}>
                                {v.status === 'moving' ? `行驶中 ${v.speed}km/h` :
                                 v.status === 'warning' ? '异常告警' :
                                 v.status === 'stop' ? '已停留' :
                                 v.status === 'arrived' ? '已到达' :
                                 v.status === 'loading' ? '装货中' : '卸货中'}
                              </span>
                            </div>
                            <div className="space-y-1 text-xs">
                              <div className="flex justify-between text-slate2-500">
                                <span>目的地</span>
                                <span className="font-medium text-slate2-700">{v.destination}</span>
                              </div>
                            </div>
                          </div>
                          <div className="absolute left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-r border-b border-slate2-100 rotate-45 -bottom-1.5" />
                        </div>
                      </div>
                    )
                  })}

                  <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="trackGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#16C79A" stopOpacity="0.6" />
                        <stop offset="100%" stopColor="#16C79A" stopOpacity="0.1" />
                      </linearGradient>
                    </defs>
                    <path d="M 30 70 Q 40 50 50 40 T 72 28" fill="none" stroke="url(#trackGrad)" strokeWidth="0.4" strokeDasharray="1 1" />
                    <path d="M 28 68 Q 38 58 48 55 T 62 62" fill="none" stroke="#E94560" strokeWidth="0.3" strokeDasharray="1 0.8" opacity="0.5" />
                    <path d="M 75 65 Q 60 55 50 48 T 25 38" fill="none" stroke="url(#trackGrad)" strokeWidth="0.3" strokeDasharray="1 1" opacity="0.4" />
                  </svg>
                </>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <EmptyState title="暂无运输数据" description="数据加载中或暂无在途车辆" />
                </div>
              )}

              <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur rounded-xl shadow-cardHover border border-slate2-100 px-4 py-3 flex items-center gap-4">
                <button className="w-9 h-9 rounded-full bg-gradient-primary text-white flex items-center justify-center shadow-lg hover:shadow-primary-500/30 transition-shadow">
                  <PlayCircle className="w-5 h-5" />
                </button>
                <div className="flex-1">
                  <div className="flex items-center justify-between text-xs text-slate2-500 mb-1.5">
                    <span>运输轨迹回放</span>
                    <span>2026-06-21 00:00 - 16:30</span>
                  </div>
                  <div className="h-1.5 bg-slate2-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-primary-500 to-success-500 rounded-full" style={{ width: '72%' }}>
                      <div className="w-3 h-3 -mt-0.5 ml-auto rounded-full bg-white border-2 border-primary-500 shadow-lg" />
                    </div>
                  </div>
                </div>
                <div className="hidden md:flex items-center gap-2 text-xs">
                  <span className="px-2 py-1 rounded bg-success-50 text-success-600 font-medium">2x 速度</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card-base p-6 card-hover">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="font-bold text-slate2-800">月度运费趋势</h3>
                  <p className="text-xs text-slate2-400 mt-0.5">单位：万元</p>
                </div>
                <div className="flex items-center gap-2">
                  <button className="text-xs px-2.5 py-1 rounded-md bg-primary-50 text-primary-600 font-medium">月度</button>
                  <button className="text-xs px-2.5 py-1 rounded-md text-slate2-400 hover:bg-slate2-50 hover:text-slate2-600 transition-colors">周度</button>
                </div>
              </div>
              <div className="h-[220px]">
                {safeFreightTrend.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={safeFreightTrend} margin={{ top: 10, right: 5, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="freightColor" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#0F3460" stopOpacity={0.35} />
                          <stop offset="100%" stopColor="#0F3460" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ECEEF1" vertical={false} />
                      <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#808C9C' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: '#808C9C' }} axisLine={false} tickLine={false} />
                      <Tooltip
                        contentStyle={{
                          background: 'white',
                          border: '1px solid #ECEEF1',
                          borderRadius: '10px',
                          boxShadow: '0 10px 25px rgba(15, 52, 96, 0.1)',
                          fontSize: '12px',
                        }}
                      />
                      <Area type="monotone" dataKey="value" stroke="#0F3460" strokeWidth={2.5} fill="url(#freightColor)" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyState title="暂无运费数据" />
                )}
              </div>
            </div>

            <div className="grid grid-rows-2 gap-6">
              <div className="card-base p-6 card-hover">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-slate2-800">本周准点交付率</h3>
                  <span className="text-xs text-success-600 font-medium bg-success-50 px-2 py-0.5 rounded-full">优秀</span>
                </div>
                <div className="h-[120px]">
                  {safeOnTimeTrend.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={safeOnTimeTrend} margin={{ top: 10, right: 5, left: 0, bottom: 0 }}>
                        <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#808C9C' }} axisLine={false} tickLine={false} />
                        <YAxis domain={[90, 100]} tick={{ fontSize: 10, fill: '#808C9C' }} axisLine={false} tickLine={false} />
                        <Tooltip
                          contentStyle={{
                            background: 'white',
                            border: '1px solid #ECEEF1',
                            borderRadius: '10px',
                            boxShadow: '0 10px 25px rgba(15, 52, 96, 0.1)',
                            fontSize: '12px',
                          }}
                        />
                        <Bar dataKey="value" fill="#16C79A" radius={[6, 6, 0, 0]} barSize={24} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <EmptyState title="暂无准点率数据" />
                  )}
                </div>
              </div>

              <div className="card-base p-6 card-hover">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-slate2-800">货源品类占比</h3>
                  <span className="text-xs text-slate2-400">{safeCargoOrders.length} 单</span>
                </div>
                <div className="h-[120px] flex items-center">
                  {safeCargoTypeDistribution.length > 0 ? (
                    <>
                      <div className="w-1/2 h-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={safeCargoTypeDistribution}
                              cx="50%"
                              cy="50%"
                              innerRadius={28}
                              outerRadius={48}
                              paddingAngle={2}
                              dataKey="value"
                            >
                              {safeCargoTypeDistribution.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="w-1/2 space-y-1.5">
                        {safeCargoTypeDistribution.map((item) => (
                          <div key={item.name} className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full" style={{ background: item.color }} />
                            <span className="text-[11px] text-slate2-600 truncate flex-1">{item.name}</span>
                            <span className="text-[11px] font-bold text-slate2-800 font-mono">{item.value}%</span>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <EmptyState title="暂无品类数据" />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-span-12 xl:col-span-4 space-y-6">
          <div className="card-base overflow-hidden card-hover">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate2-100 bg-gradient-to-r from-accent-50 to-transparent">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-accent-50 flex items-center justify-center relative">
                  <AlertTriangle className="w-5 h-5 text-accent-500" />
                  {pendingAlerts.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-accent-500 text-white text-[10px] font-bold flex items-center justify-center animate-blink">
                      {pendingAlerts.length}
                    </span>
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-slate2-800">实时异常告警</h3>
                  <p className="text-xs text-slate2-400">需关注 {pendingAlerts.length} 条告警</p>
                </div>
              </div>
              <Link
                to="/tracking/alerts"
                className="text-xs text-accent-500 hover:text-accent-600 font-medium"
              >
                全部处理 →
              </Link>
            </div>

            <div className="divide-y divide-slate2-50 max-h-[320px] overflow-y-auto">
              {pendingAlerts.length > 0 ? (
                pendingAlerts.slice(0, 5).map((alert) => (
                  <div key={alert.id} className="p-4 hover:bg-slate2-50/80 transition-colors cursor-pointer">
                    <div className="flex items-start gap-3">
                      <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                        alert.severity === 'critical' ? 'bg-accent-500 shadow-alert animate-blink' :
                        alert.severity === 'warning' ? 'bg-amber-500' :
                        'bg-primary-400'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                            alert.type === 'stay_timeout' ? 'bg-accent-50 text-accent-600' :
                            alert.type === 'temperature' ? 'bg-blue-50 text-blue-600' :
                            alert.type === 'accident' ? 'bg-rose-50 text-rose-600' :
                            'bg-amber-50 text-amber-600'
                          }`}>
                            {alertTypeLabel(alert.type)}
                          </span>
                          <span className="text-[10px] text-slate2-400 font-mono">{alert.waybillNo}</span>
                        </div>
                        <div className="text-sm font-semibold text-slate2-800 mb-1 line-clamp-1">{alert.title}</div>
                        <div className="text-xs text-slate2-500 line-clamp-2 mb-2">{alert.description}</div>
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-slate2-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {timeAgo(alert.triggeredAt)}
                          </span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                            alert.status === 'pending' ? 'bg-accent-100 text-accent-700 font-medium' :
                            'bg-primary-50 text-primary-600 font-medium'
                          }`}>
                            {alert.status === 'pending' ? '待处理' : '处理中'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center">
                  <CheckCircle2 className="w-12 h-12 text-success-400 mx-auto mb-2" />
                  <p className="text-sm text-slate2-600">暂无待处理告警</p>
                  <p className="text-xs text-slate2-400 mt-1">所有告警均已处理</p>
                </div>
              )}
            </div>
          </div>

          <div className="card-base p-5 card-hover">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-slate2-800">金牌认证运力</h3>
                  <p className="text-xs text-slate2-400">{goldCapacities.length} 家优质合作伙伴</p>
                </div>
              </div>
              <Link
                to="/capacity"
                className="text-xs text-primary-500 hover:text-primary-600 font-medium"
              >
                运力池 →
              </Link>
            </div>
            <div className="space-y-3">
              {goldCapacities.length > 0 ? (
                goldCapacities.slice(0, 3).map((cap) => (
                  <div
                    key={cap.id}
                    className="p-3 rounded-xl bg-gradient-to-r from-amber-50/50 to-transparent border border-amber-100/50 hover:border-amber-200 hover:shadow-sm transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-white border-2 border-amber-200 flex items-center justify-center font-bold text-amber-600 text-lg">
                        {cap.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="font-semibold text-slate2-800 text-sm truncate">{cap.name}</span>
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-gradient-to-r from-amber-400 to-amber-500 text-white font-bold">GOLD</span>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-slate2-500">
                          <span>履约率 <span className="text-success-600 font-bold font-mono">{cap.fulfillmentRate}%</span></span>
                          <span>信用分 <span className="text-primary-600 font-bold font-mono">{cap.creditScore}</span></span>
                        </div>
                      </div>
                      <ArrowUpRight className="w-4 h-4 text-slate2-300" />
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState title="暂无金牌运力" />
              )}
            </div>
          </div>

          <div className="card-base p-5 card-hover">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate2-800">最近运单动态</h3>
              <Link to="/tracking" className="text-xs text-primary-500 hover:text-primary-600 font-medium">
                查看全部 →
              </Link>
            </div>
            <div className="space-y-4">
              {safeWaybills.length > 0 ? (
                safeWaybills.slice(0, 4).map((wb) => (
                  <div key={wb.id} className="relative pl-6">
                    <div className="absolute left-0 top-1 bottom-0 w-px bg-gradient-to-b from-slate2-200 to-transparent" />
                    <div className={`absolute left-[-5px] top-1 w-2.5 h-2.5 rounded-full border-2 border-white ${
                      wb.status === 'delivered' ? 'bg-success-500' :
                      wb.status === 'exception' ? 'bg-accent-500' :
                      wb.status === 'in_transit' ? 'bg-primary-500 animate-pulse' :
                      'bg-slate2-300'
                    }`} />
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[11px] font-mono font-medium text-slate2-600">{wb.waybillNo}</span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                          wb.status === 'delivered' ? 'bg-success-50 text-success-600' :
                          wb.status === 'exception' ? 'bg-accent-50 text-accent-600' :
                          'bg-primary-50 text-primary-600'
                        }`}>
                          {wbStatus(wb.status)}
                        </span>
                      </div>
                      <div className="text-xs text-slate2-700 mb-0.5">
                        <span className="font-medium">{wb.route.from}</span>
                        <span className="mx-1 text-slate2-300">→</span>
                        <span className="font-medium">{wb.route.to}</span>
                      </div>
                      <div className="text-[10px] text-slate2-400">{wb.driverName} · {wb.vehiclePlate}</div>
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState title="暂无运单数据" />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function LegendItem({ color, label, count }: { color: string; label: string; count: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={`w-2 h-2 rounded-full ${color}`} />
      <span className="text-slate2-500 text-xs">{label}</span>
      <span className="text-slate2-700 font-bold font-mono text-xs">{count}</span>
    </div>
  )
}

function alertTypeLabel(type: string) {
  const map: Record<string, string> = {
    stay_timeout: '停留超时',
    temperature: '温控异常',
    route_deviation: '路线偏离',
    delay: '到达延误',
    accident: '交通事故',
  }
  return map[type] || type
}

function wbStatus(s: string) {
  const map: Record<string, string> = {
    loading: '装货中',
    in_transit: '运输中',
    unloading: '卸货中',
    delivered: '已送达',
    exception: '异常',
  }
  return map[s] || s
}

function timeAgo(time: string) {
  if (!time) return '未知时间'
  try {
    const diff = (new Date().getTime() - new Date(time.replace(' ', 'T')).getTime()) / 1000
    if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`
    if (diff < 86400) return `${Math.floor(diff / 3600)}小时前`
    return `${Math.floor(diff / 86400)}天前`
  } catch {
    return '未知时间'
  }
}
