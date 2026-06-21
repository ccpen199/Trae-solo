import { useState } from 'react'
import { useAppStore } from '@/store'
import {
  Navigation,
  Truck,
  Clock,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  Search,
  Filter,
  RefreshCw,
  ChevronRight,
  Play,
  Pause,
  Thermometer,
  AlertCircle,
  FileCheck,
  ChevronDown,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Waybill } from '@/types'

const statusInfo: Record<Waybill['status'], { label: string; className: string; color: string }> = {
  loading: { label: '装货中', className: 'bg-blue-50 text-blue-600', color: '#3B82F6' },
  in_transit: { label: '运输中', className: 'bg-success-50 text-success-600', color: '#16C79A' },
  unloading: { label: '卸货中', className: 'bg-violet-50 text-violet-600', color: '#8B5CF6' },
  delivered: { label: '已送达', className: 'bg-success-50 text-success-700', color: '#0D775C' },
  exception: { label: '异常', className: 'bg-accent-50 text-accent-600', color: '#E94560' },
}

export default function TrackingOverview() {
  const { waybills, vehicleMapData, alerts } = useAppStore()
  const [selectedWaybill, setSelectedWaybill] = useState<Waybill | null>(waybills[0])
  const [playing, setPlaying] = useState(false)
  const [search, setSearch] = useState('')

  const filteredWaybills = waybills.filter(
    (w) => !search || w.waybillNo.includes(search) || w.driverName.includes(search) || w.vehiclePlate.includes(search)
  )
  const activeWaybills = waybills.filter((w) => w.status === 'in_transit' || w.status === 'exception')

  return (
    <div className="space-y-6">
      {/* 顶部统计 */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: '运输中', count: activeWaybills.filter(w => w.status === 'in_transit').length, icon: Truck, color: 'from-success-500 to-success-600' },
          { label: '装货中', count: waybills.filter(w => w.status === 'loading').length, icon: FileCheck, color: 'from-blue-500 to-blue-600' },
          { label: '异常告警', count: waybills.filter(w => w.status === 'exception').length, icon: AlertTriangle, color: 'from-accent-500 to-accent-600' },
          { label: '今日已送达', count: waybills.filter(w => w.status === 'delivered').length, icon: CheckCircle2, color: 'from-violet-500 to-violet-600' },
          { label: '总在途车辆', count: vehicleMapData.length, icon: Navigation, color: 'from-primary-500 to-primary-600' },
        ].map((item, i) => {
          const Icon = item.icon
          return (
            <div key={i} className="card-base p-4 card-hover">
              <div className="flex items-center gap-3">
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${item.color} text-white flex items-center justify-center shadow-md`}>
                  <Icon className="w-5.5 h-5.5" />
                </div>
                <div>
                  <div className="text-[11px] text-slate2-400 font-medium">{item.label}</div>
                  <div className="text-2xl font-extrabold font-mono text-slate2-800">{item.count}</div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* 左侧：运单列表 */}
        <div className="col-span-12 xl:col-span-3 space-y-4">
          <div className="card-base p-4">
            <div className="flex items-center gap-2 mb-4">
              <h3 className="font-bold text-slate2-800">运单列表</h3>
              <span className="text-xs text-slate2-400">({filteredWaybills.length})</span>
            </div>
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate2-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="运单号/司机/车牌"
                className="w-full h-9 pl-9 pr-3 rounded-lg bg-slate2-50 border border-transparent text-xs focus:outline-none focus:bg-white focus:border-primary-300 transition-all"
              />
            </div>
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {filteredWaybills.map((wb) => {
                const active = selectedWaybill?.id === wb.id
                const info = statusInfo[wb.status]
                return (
                  <button
                    key={wb.id}
                    onClick={() => setSelectedWaybill(wb)}
                    className={`w-full p-3 rounded-xl border-2 text-left transition-all ${
                      active
                        ? 'border-primary-400 bg-gradient-to-r from-primary-50 to-transparent shadow-sm'
                        : 'border-transparent bg-slate2-50/50 hover:border-slate2-200 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-mono text-xs font-bold text-slate2-700">{wb.waybillNo}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${info.className}`}>
                        {info.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate2-600 mb-2">
                      <span className="font-medium">{wb.route.from}</span>
                      <ChevronRight className="w-3 h-3 text-slate2-300" />
                      <span className="font-medium">{wb.route.to}</span>
                    </div>
                    {/* 进度条 */}
                    <div className="relative">
                      <div className="h-1.5 bg-slate2-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${wb.progress}%`,
                            background: `linear-gradient(90deg, ${info.color}, ${info.color}dd)`,
                          }}
                        />
                      </div>
                      <div className="flex items-center justify-between mt-1 text-[10px]">
                        <span className="text-slate2-400">进度 {wb.progress}%</span>
                        <span className="font-mono font-medium text-slate2-600">{wb.vehiclePlate}</span>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* 中间：地图视图 */}
        <div className="col-span-12 xl:col-span-6 space-y-6">
          {/* 主地图 */}
          <div className="card-base overflow-hidden card-hover">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate2-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary-50 flex items-center justify-center">
                  <Navigation className="w-5 h-5 text-primary-500" />
                </div>
                <div>
                  <h3 className="font-bold text-slate2-800">实时运输地图</h3>
                  <p className="text-xs text-slate2-400">
                    {selectedWaybill
                      ? `${selectedWaybill.waybillNo} · ${selectedWaybill.route.from} → ${selectedWaybill.route.to}`
                      : '全国在途运输车辆'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="w-8 h-8 rounded-lg bg-slate2-50 text-slate2-500 hover:bg-white hover:border-slate2-200 border border-transparent transition-colors flex items-center justify-center">
                  <Filter className="w-4 h-4" />
                </button>
                <button className="w-8 h-8 rounded-lg bg-slate2-50 text-slate2-500 hover:bg-white hover:border-slate2-200 border border-transparent transition-colors flex items-center justify-center">
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* 模拟地图 */}
            <div className="h-[480px] map-bg relative">
              {/* 轨迹线 */}
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="routeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#16C79A" stopOpacity="0.9" />
                    <stop offset="100%" stopColor="#0F3460" stopOpacity="0.9" />
                  </linearGradient>
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="0.8" result="coloredBlur" />
                    <feMerge>
                      <feMergeNode in="coloredBlur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
                {/* 主路线 */}
                {selectedWaybill && (
                  <>
                    <path
                      d="M 25 75 C 35 60, 45 55, 55 45 S 70 30, 80 25"
                      fill="none"
                      stroke="url(#routeGrad)"
                      strokeWidth="0.8"
                      strokeDasharray="1.2 0.8"
                      filter="url(#glow)"
                    />
                    {/* 起点 */}
                    <circle cx="25" cy="75" r="1.5" fill="#16C79A" />
                    <circle cx="25" cy="75" r="3" fill="#16C79A" fillOpacity="0.2">
                      <animate attributeName="r" from="1.5" to="5" dur="2s" repeatCount="indefinite" />
                      <animate attributeName="fill-opacity" from="0.4" to="0" dur="2s" repeatCount="indefinite" />
                    </circle>
                    {/* 终点 */}
                    <circle cx="80" cy="25" r="1.5" fill="#E94560" />
                    <circle cx="80" cy="25" r="3" fill="#E94560" fillOpacity="0.2">
                      <animate attributeName="r" from="1.5" to="5" dur="2s" repeatCount="indefinite" begin="1s" />
                      <animate attributeName="fill-opacity" from="0.4" to="0" dur="2s" repeatCount="indefinite" begin="1s" />
                    </circle>
                    {/* 车辆位置 */}
                    <circle
                      cx={25 + (80 - 25) * (selectedWaybill.progress / 100)}
                      cy={75 + (25 - 75) * (selectedWaybill.progress / 100)}
                      r="2"
                      fill="#0F3460"
                      stroke="white"
                      strokeWidth="0.5"
                    />
                  </>
                )}

                {/* 背景车辆散点 */}
                {vehicleMapData.map((v, idx) => {
                  const x = 10 + ((v.lng - 73) / 65) * 80
                  const y = 10 + ((54 - v.lat) / 35) * 80
                  let color = '#16C79A'
                  if (v.status === 'warning') color = '#E94560'
                  if (v.status === 'stop') color = '#F59E0B'
                  return (
                    <g key={v.id}>
                      <circle cx={x} cy={y} r="0.8" fill={color} opacity="0.7" />
                    </g>
                  )
                })}
              </svg>

              {/* 车辆详情浮窗 */}
              {selectedWaybill && (
                <div className="absolute top-4 right-4 w-64 bg-white/95 backdrop-blur rounded-xl shadow-cardHover border border-slate2-100 p-4 animate-slideInRight">
                  <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate2-50">
                    <div>
                      <div className="font-mono text-xs font-bold text-slate2-700">{selectedWaybill.waybillNo}</div>
                      <div className="text-[10px] text-slate2-400 mt-0.5">{selectedWaybill.driverName}</div>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${statusInfo[selectedWaybill.status].className}`}>
                      {statusInfo[selectedWaybill.status].label}
                    </span>
                  </div>
                  <div className="space-y-2.5">
                    <div>
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="text-slate2-400">行驶路线</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-semibold text-success-600">{selectedWaybill.route.from}</span>
                        <div className="flex-1 h-0.5 bg-gradient-to-r from-success-400 via-primary-400 to-accent-400 rounded-full relative">
                          <div className="absolute w-2 h-2 rounded-full bg-primary-600 border-2 border-white shadow-lg top-1/2 -translate-y-1/2" style={{ left: `${selectedWaybill.progress - 1}%` }} />
                        </div>
                        <span className="font-semibold text-accent-600">{selectedWaybill.route.to}</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div className="p-2 rounded-lg bg-slate2-50">
                        <div className="text-slate2-400 mb-0.5">车速</div>
                        <div className="font-bold font-mono text-slate2-800">82 <span className="text-[10px] font-normal">km/h</span></div>
                      </div>
                      <div className="p-2 rounded-lg bg-slate2-50">
                        <div className="text-slate2-400 mb-0.5">车牌</div>
                        <div className="font-bold font-mono text-slate2-800">{selectedWaybill.vehiclePlate}</div>
                      </div>
                      <div className="p-2 rounded-lg bg-success-50">
                        <div className="text-success-500 mb-0.5 flex items-center gap-0.5"><Clock className="w-3 h-3" /> 预计到达</div>
                        <div className="font-bold font-mono text-success-700 text-[10px]">{selectedWaybill.estimatedArrival.slice(5, 16)}</div>
                      </div>
                      <div className="p-2 rounded-lg bg-blue-50">
                        <div className="text-blue-500 mb-0.5 flex items-center gap-0.5"><MapPin className="w-3 h-3" /> 位置</div>
                        <div className="font-bold text-blue-700 text-[10px] truncate">{selectedWaybill.currentLocation?.address?.slice(0, 8)}...</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 底部播放控制条 */}
              <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur rounded-xl shadow-cardHover border border-slate2-100 px-4 py-3 flex items-center gap-4">
                <button
                  onClick={() => setPlaying(!playing)}
                  className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 text-white flex items-center justify-center shadow-lg hover:shadow-primary-500/30 transition-shadow flex-shrink-0"
                >
                  {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                </button>
                <div className="flex-1">
                  <div className="flex items-center justify-between text-[11px] text-slate2-500 mb-1.5">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-success-500" />
                      {selectedWaybill?.route.from}
                    </span>
                    <span className="font-mono font-bold text-primary-600">
                      {selectedWaybill ? `${selectedWaybill.progress}%` : ''}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-accent-500" />
                      {selectedWaybill?.route.to}
                    </span>
                  </div>
                  <div className="h-2 bg-slate2-100 rounded-full overflow-hidden relative">
                    <div
                      className="h-full bg-gradient-to-r from-success-500 via-primary-500 to-accent-500 rounded-full transition-all duration-700"
                      style={{ width: `${selectedWaybill?.progress || 0}%` }}
                    />
                    <div
                      className="absolute w-4 h-4 -mt-1 rounded-full bg-white border-2 border-primary-500 shadow-lg transition-all duration-700"
                      style={{ left: `calc(${selectedWaybill?.progress || 0}% - 8px)` }}
                    />
                  </div>
                </div>
                <div className="hidden md:flex items-center gap-2 flex-shrink-0">
                  {['0.5x', '1x', '2x'].map((x, i) => (
                    <button
                      key={x}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                        i === 1 ? 'bg-primary-50 text-primary-600' : 'text-slate2-500 hover:bg-slate2-50'
                      }`}
                    >
                      {x}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 节点时间轴 */}
          {selectedWaybill && (
            <div className="card-base p-6 card-hover">
              <h3 className="font-bold text-slate2-800 mb-5 flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary-500" />
                运输节点时间轴
                <span className="ml-2 text-xs text-slate2-400 font-normal font-mono">
                  {selectedWaybill.cargoSummary}
                </span>
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {selectedWaybill.nodes.map((node, idx, arr) => {
                  const isLast = idx === arr.length - 1
                  const isFirst = idx === 0
                  let nodeColor = 'slate2'
                  let nodeLabel = '待到达'
                  if (node.status === 'completed') { nodeColor = 'success'; nodeLabel = '已完成' }
                  if (node.status === 'delayed') { nodeColor = 'accent'; nodeLabel = '有延误' }

                  return (
                    <div key={node.id} className="relative">
                      {/* 连接线 */}
                      {!isLast && (
                        <div
                          className={`absolute top-6 left-8 right-0 h-0.5 ${
                            node.status === 'completed'
                              ? 'bg-gradient-to-r from-success-400 to-slate2-200'
                              : 'bg-slate2-100'
                          }`}
                        />
                      )}
                      <div className="relative z-10 bg-white">
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${
                          nodeColor === 'success' ? 'from-success-400 to-success-600' :
                          nodeColor === 'accent' ? 'from-accent-400 to-accent-600' :
                          'from-slate2-200 to-slate2-300'
                        } text-white flex items-center justify-center shadow-md mb-3`}>
                          {isFirst ? <FileCheck className="w-5 h-5" /> :
                           isLast ? <CheckCircle2 className="w-5 h-5" /> :
                           <MapPin className="w-5 h-5" />}
                        </div>
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="text-sm font-bold text-slate2-800">{node.name}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                            nodeColor === 'success' ? 'bg-success-50 text-success-600' :
                            nodeColor === 'accent' ? 'bg-accent-50 text-accent-600' :
                            'bg-slate2-50 text-slate2-500'
                          }`}>
                            {nodeLabel}
                          </span>
                        </div>
                        <div className="space-y-0.5 text-[11px] text-slate2-500">
                          <div className="flex items-center gap-1">
                            <span>计划:</span>
                            <span className="font-mono">{node.plannedTime.slice(5, 16)}</span>
                          </div>
                          {node.actualTime && (
                            <div className="flex items-center gap-1 text-success-600">
                              <span>实际:</span>
                              <span className="font-mono">{node.actualTime.slice(5, 16)}</span>
                            </div>
                          )}
                        </div>
                        {node.remark && (
                          <div className="mt-2 p-2 rounded-lg bg-slate2-50 text-[10px] text-slate2-600 line-clamp-2">
                            {node.remark}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* 右侧：实时告警 + 温控监控 */}
        <div className="col-span-12 xl:col-span-3 space-y-6">
          {/* 实时告警 */}
          <div className="card-base overflow-hidden card-hover">
            <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-accent-50 to-transparent border-b border-accent-100">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-accent-500" />
                <span className="font-bold text-slate2-800 text-sm">实时告警</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent-500 text-white font-bold">
                  {alerts.filter(a => a.status !== 'resolved').length}
                </span>
              </div>
              <Link to="/tracking/alerts" className="text-[11px] text-accent-500 hover:text-accent-600 font-medium">
                处理 →
              </Link>
            </div>
            <div className="divide-y divide-slate2-50 max-h-[320px] overflow-y-auto">
              {alerts.filter(a => a.status !== 'resolved').slice(0, 6).map((alert) => (
                <div key={alert.id} className="p-3 hover:bg-slate2-50/80 transition-colors">
                  <div className="flex items-start gap-2">
                    <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                      alert.severity === 'critical' ? 'bg-accent-500 animate-blink shadow-alert' : 'bg-amber-500'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium ${
                          alert.type === 'temperature' ? 'bg-blue-50 text-blue-600' :
                          alert.type === 'stay_timeout' ? 'bg-amber-50 text-amber-600' :
                          alert.type === 'accident' ? 'bg-rose-50 text-rose-600' :
                          'bg-violet-50 text-violet-600'
                        }`}>
                          {({ stay_timeout: '停留超时', temperature: '温控异常', accident: '事故', route_deviation: '偏航', delay: '延误' } as any)[alert.type]}
                        </span>
                        <span className="text-[10px] font-mono text-slate2-400 truncate">{alert.waybillNo}</span>
                      </div>
                      <div className="text-[12px] font-semibold text-slate2-700 line-clamp-1">{alert.title}</div>
                      <div className="text-[10px] text-slate2-400 line-clamp-2 mt-0.5">{alert.description}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 温控监控 */}
          <div className="card-base p-5 card-hover">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-slate2-800 flex items-center gap-2 text-sm">
                <Thermometer className="w-4 h-4 text-blue-500" />
                冷链温控监控
              </h3>
              <span className="text-[10px] text-blue-500 font-medium px-2 py-0.5 rounded-full bg-blue-50">2车温控</span>
            </div>
            <div className="space-y-4">
              {[
                { plate: '粤B·88888', name: '电池模组', min: 15, max: 28, current: 24.2, status: 'normal' },
                { plate: '顺丰冷链-01', name: '冷冻牛肉', min: -20, max: -15, current: -9.8, status: 'alert' },
              ].map((t, i) => (
                <div key={i} className="p-3 rounded-xl border border-slate2-100 bg-gradient-to-br from-slate2-50/50 to-white">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="text-xs font-bold text-slate2-700 font-mono">{t.plate}</div>
                      <div className="text-[10px] text-slate2-400">{t.name}</div>
                    </div>
                    {t.status === 'alert' ? (
                      <span className="flex items-center gap-1 text-[10px] text-accent-600 bg-accent-50 px-2 py-0.5 rounded-full font-medium">
                        <AlertCircle className="w-3 h-3 animate-blink" />
                        超温
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[10px] text-success-600 bg-success-50 px-2 py-0.5 rounded-full font-medium">
                        <CheckCircle2 className="w-3 h-3" />
                        正常
                      </span>
                    )}
                  </div>
                  <div className="relative h-2 bg-slate2-100 rounded-full overflow-hidden mb-2">
                    {/* 正常范围 */}
                    <div
                      className="absolute top-0 bottom-0 bg-success-200/60"
                      style={{
                        left: `${((Math.max(t.min, -25) + 25) / 60) * 100}%`,
                        right: `${100 - ((Math.min(t.max, 35) + 25) / 60) * 100}%`,
                      }}
                    />
                    {/* 当前温度指示 */}
                    <div
                      className={`absolute top-0 bottom-0 w-2 rounded-full ${t.status === 'alert' ? 'bg-accent-500 shadow-alert' : 'bg-primary-500'}`}
                      style={{
                        left: `calc(${((t.current + 25) / 60) * 100}% - 4px)`,
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-slate2-400">
                      范围: <span className="font-mono text-slate2-600">{t.min}~{t.max}℃</span>
                    </span>
                    <span className={`font-bold font-mono ${t.status === 'alert' ? 'text-accent-600' : 'text-primary-600'}`}>
                      当前: {t.current}℃
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
