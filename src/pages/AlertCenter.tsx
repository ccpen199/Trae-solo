import { useState } from 'react'
import { useAppStore } from '@/store'
import {
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Search,
  Filter,
  Clock,
  User,
  Send,
  MoreHorizontal,
  ChevronDown,
  TrendingUp,
  Thermometer,
  MapPin,
  Car,
  XCircle,
  FileClock,
  MessageSquare,
  CalendarClock,
  CheckCheck,
} from 'lucide-react'
import type { Alert } from '@/types'

const typeConfig = {
  stay_timeout: { label: '停留超时', icon: Clock, color: 'amber' },
  temperature: { label: '温控异常', icon: Thermometer, color: 'blue' },
  route_deviation: { label: '路线偏离', icon: MapPin, color: 'violet' },
  delay: { label: '到达延误', icon: FileClock, color: 'primary' },
  accident: { label: '交通事故', icon: Car, color: 'accent' },
} as const

export default function AlertCenter() {
  const { alerts, markAlertResolved, updateAlertHandler } = useAppStore()
  const [tab, setTab] = useState<'all' | 'pending' | 'processing' | 'resolved'>('all')
  const [severityFilter, setSeverityFilter] = useState<string>('all')
  const [selected, setSelected] = useState<Alert | null>(alerts[0])
  const [handlerInput, setHandlerInput] = useState('')
  const [resolutionInput, setResolutionInput] = useState('')

  const filtered = alerts.filter((a) => {
    if (tab !== 'all' && a.status !== tab) return false
    if (severityFilter !== 'all' && a.severity !== severityFilter) return false
    return true
  })

  const stats = [
    { k: 'all', label: '全部', count: alerts.length, icon: AlertTriangle },
    { k: 'pending', label: '待处理', count: alerts.filter(a => a.status === 'pending').length, icon: AlertCircle },
    { k: 'processing', label: '处理中', count: alerts.filter(a => a.status === 'processing').length, icon: MessageSquare },
    { k: 'resolved', label: '已解决', count: alerts.filter(a => a.status === 'resolved').length, icon: CheckCircle2 },
  ]

  return (
    <div className="space-y-6">
      {/* 严重等级分布 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: '严重告警', count: alerts.filter(a => a.severity === 'critical').length, color: 'from-accent-500 to-accent-600', icon: XCircle },
          { label: '预警提醒', count: alerts.filter(a => a.severity === 'warning').length, color: 'from-amber-500 to-amber-600', icon: AlertTriangle },
          { label: '信息通知', count: alerts.filter(a => a.severity === 'info').length, color: 'from-blue-500 to-blue-600', icon: AlertCircle },
          { label: '今日处理率', count: 87, unit: '%', color: 'from-success-500 to-success-600', icon: TrendingUp },
        ].map((item, i) => {
          const Icon = item.icon
          return (
            <div key={i} className={`p-5 rounded-2xl bg-gradient-to-br ${item.color} text-white shadow-xl relative overflow-hidden card-hover`}>
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/3 translate-x-1/3" />
              <div className="relative z-10 flex items-start justify-between">
                <div>
                  <div className="text-white/70 text-xs font-medium mb-1">{item.label}</div>
                  <div className="text-3xl font-extrabold font-mono tracking-tight">
                    {item.count}{item.unit || ''}
                  </div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
                  <Icon className="w-5 h-5" />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Tab导航 + 筛选 */}
      <div className="card-base p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 bg-slate2-50 rounded-xl p-1">
            {stats.map((s) => {
              const Icon = s.icon
              const active = tab === s.k
              return (
                <button
                  key={s.k}
                  onClick={() => setTab(s.k as any)}
                  className={`px-4 py-2 rounded-lg flex items-center gap-1.5 text-sm font-medium transition-all ${
                    active
                      ? 'bg-white text-primary-600 shadow-sm'
                      : 'text-slate2-500 hover:text-slate2-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {s.label}
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    active ? 'bg-primary-50 text-primary-600' : 'bg-slate2-200/60 text-slate2-500'
                  }`}>
                    {s.count}
                  </span>
                </button>
              )
            })}
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate2-400" />
              <input
                placeholder="搜索告警内容..."
                className="w-56 h-9 pl-9 pr-3 rounded-lg bg-slate2-50 border border-transparent text-xs focus:outline-none focus:bg-white focus:border-primary-300 transition-all"
              />
            </div>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="h-9 px-3 rounded-lg bg-slate2-50 border border-transparent text-xs focus:outline-none focus:bg-white focus:border-primary-300 transition-all cursor-pointer"
            >
              <option value="all">所有级别</option>
              <option value="critical">严重</option>
              <option value="warning">预警</option>
              <option value="info">通知</option>
            </select>
            <button className="h-9 px-3 rounded-lg bg-slate2-50 border border-transparent text-xs text-slate2-600 hover:bg-white hover:border-slate2-200 transition-all flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5" />
              高级筛选
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* 左侧：告警列表 */}
        <div className="col-span-12 lg:col-span-5">
          <div className="card-base overflow-hidden">
            <div className="divide-y divide-slate2-50 max-h-[680px] overflow-y-auto">
              {filtered.map((alert) => {
                const active = selected?.id === alert.id
                const tc = typeConfig[alert.type]
                const TCIcon = tc.icon
                return (
                  <button
                    key={alert.id}
                    onClick={() => setSelected(alert)}
                    className={`w-full p-4 text-left transition-all relative ${
                      active
                        ? 'bg-gradient-to-r from-primary-50/80 to-transparent border-l-4 border-primary-500'
                        : 'hover:bg-slate2-50/60 border-l-4 border-transparent'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* 严重级别指示 */}
                      <div className="flex flex-col items-center gap-1 pt-0.5 flex-shrink-0">
                        <div className={`w-2.5 h-2.5 rounded-full ${
                          alert.severity === 'critical' ? 'bg-accent-500 shadow-alert animate-blink' :
                          alert.severity === 'warning' ? 'bg-amber-500' :
                          'bg-primary-400'
                        }`} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded font-medium ${
                            tc.color === 'amber' ? 'bg-amber-50 text-amber-600' :
                            tc.color === 'blue' ? 'bg-blue-50 text-blue-600' :
                            tc.color === 'violet' ? 'bg-violet-50 text-violet-600' :
                            tc.color === 'primary' ? 'bg-primary-50 text-primary-600' :
                            'bg-accent-50 text-accent-600'
                          }`}>
                            <TCIcon className="w-3 h-3" />
                            {tc.label}
                          </span>
                          <span className="font-mono text-[10px] text-slate2-400">{alert.waybillNo}</span>
                          <span className="ml-auto">
                            {alert.status === 'pending' && <span className="text-[10px] px-2 py-0.5 rounded-full bg-accent-100 text-accent-700 font-bold">待处理</span>}
                            {alert.status === 'processing' && <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary-50 text-primary-600 font-medium">处理中</span>}
                            {alert.status === 'resolved' && <span className="text-[10px] px-2 py-0.5 rounded-full bg-success-50 text-success-600 font-medium">已解决</span>}
                          </span>
                        </div>
                        <div className="text-sm font-semibold text-slate2-800 line-clamp-1 mb-1">{alert.title}</div>
                        <div className="text-[11px] text-slate2-500 line-clamp-2 mb-2">{alert.description}</div>
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="flex items-center gap-1 text-slate2-400">
                            <CalendarClock className="w-3 h-3" />
                            {alert.triggeredAt.slice(5, 16)}
                          </span>
                          {alert.handler && (
                            <span className="flex items-center gap-1 text-primary-600">
                              <User className="w-3 h-3" />
                              {alert.handler}处理中
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* 右侧：告警详情 + 处理 */}
        <div className="col-span-12 lg:col-span-7 space-y-6">
          {selected ? (
            <>
              {/* 详情卡 */}
              <div className="card-base overflow-hidden card-hover">
                {/* 顶部标题条 */}
                <div className={`px-6 py-5 bg-gradient-to-r ${
                  selected.severity === 'critical' ? 'from-accent-50 to-white border-accent-100' :
                  selected.severity === 'warning' ? 'from-amber-50 to-white border-amber-100' :
                  'from-primary-50 to-white border-primary-100'
                } border-b`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                          selected.severity === 'critical' ? 'bg-accent-500 text-white shadow-alert' :
                          selected.severity === 'warning' ? 'bg-amber-500 text-white' :
                          'bg-primary-500 text-white'
                        }`}>
                          {selected.severity === 'critical' ? <XCircle className="w-4 h-4" /> :
                           selected.severity === 'warning' ? <AlertTriangle className="w-4 h-4" /> :
                           <AlertCircle className="w-4 h-4" />}
                          {selected.severity === 'critical' ? '严重告警' : selected.severity === 'warning' ? '预警提醒' : '信息通知'}
                        </span>
                        <span className="font-mono text-sm text-slate2-500">告警号: {selected.id.toUpperCase()}</span>
                      </div>
                      <h2 className="text-xl font-bold text-slate2-800">{selected.title}</h2>
                    </div>
                    <button className="w-9 h-9 rounded-lg bg-white border border-slate2-200 text-slate2-400 hover:text-slate2-600 hover:border-slate2-300 transition-colors flex items-center justify-center">
                      <MoreHorizontal className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="p-6">
                  {/* 基本信息网格 */}
                  <div className="grid grid-cols-2 gap-5 mb-6">
                    <InfoItem icon={<MapPin className="w-4 h-4" />} label="关联运单">
                      <span className="font-mono font-bold text-primary-600">{selected.waybillNo}</span>
                    </InfoItem>
                    <InfoItem icon={<User className="w-4 h-4" />} label="告警类型">
                      {typeConfig[selected.type].label}
                    </InfoItem>
                    <InfoItem icon={<CalendarClock className="w-4 h-4" />} label="触发时间">
                      <span className="font-mono">{selected.triggeredAt.replace('T', ' ')}</span>
                    </InfoItem>
                    <InfoItem icon={<Car className="w-4 h-4" />} label="关联货物">
                      {selected.cargoInfo}
                    </InfoItem>
                    {selected.location && (
                      <InfoItem icon={<MapPin className="w-4 h-4" />} label="发生位置" colSpan={2}>
                        <span className="text-slate2-700">{selected.location.address}</span>
                        <span className="text-xs text-slate2-400 font-mono ml-2">
                          ({selected.location.lat.toFixed(4)}, {selected.location.lng.toFixed(4)})
                        </span>
                      </InfoItem>
                    )}
                  </div>

                  {/* 详细描述 */}
                  <div className="mb-6">
                    <h4 className="text-sm font-bold text-slate2-700 mb-2">告警详细描述</h4>
                    <div className="p-4 rounded-xl bg-slate2-50/80 border border-slate2-100 text-sm text-slate2-700 leading-relaxed">
                      {selected.description}
                    </div>
                  </div>

                  {/* 处理记录 */}
                  {(selected.handler || selected.resolution) && (
                    <div className="mb-6">
                      <h4 className="text-sm font-bold text-slate2-700 mb-3">处理记录</h4>
                      <div className="relative pl-6 pb-2">
                        <div className="absolute left-[5px] top-2 bottom-0 w-px bg-gradient-to-b from-primary-300 to-slate2-100" />
                        <div className="space-y-4">
                          {selected.handler && (
                            <div className="relative">
                              <div className="absolute -left-6 w-3 h-3 rounded-full bg-primary-500 border-2 border-white ring-2 ring-primary-100 top-1" />
                              <div className="p-3 rounded-xl bg-primary-50 border border-primary-100">
                                <div className="flex items-center gap-2 mb-1.5">
                                  <span className="text-xs font-semibold text-primary-700">{selected.handler}</span>
                                  <span className="text-[10px] text-primary-500 bg-white/60 px-1.5 py-0.5 rounded">已接单</span>
                                </div>
                                <div className="text-xs text-slate2-600">{selected.resolution || '正在核实并处理中...'}</div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 处理操作区 */}
                  {selected.status !== 'resolved' && (
                    <div className="p-4 rounded-2xl bg-gradient-to-br from-slate2-50 to-white border border-slate2-100">
                      <h4 className="text-sm font-bold text-slate2-700 mb-3 flex items-center gap-1.5">
                        <MessageSquare className="w-4 h-4 text-primary-500" />
                        处理告警
                      </h4>
                      <div className="space-y-3">
                        <div>
                          <label className="block text-[11px] font-semibold text-slate2-600 mb-1.5">处理人</label>
                          <input
                            value={handlerInput || selected.handler || ''}
                            onChange={(e) => setHandlerInput(e.target.value)}
                            placeholder="输入处理人员姓名"
                            className="w-full h-10 px-3.5 rounded-lg bg-white border border-slate2-200 text-sm focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-50 transition-all"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-semibold text-slate2-600 mb-1.5">处理说明</label>
                          <textarea
                            value={resolutionInput || selected.resolution || ''}
                            onChange={(e) => setResolutionInput(e.target.value)}
                            rows={3}
                            placeholder="请输入处理措施、进度或解决方案..."
                            className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-slate2-200 text-sm focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-50 transition-all resize-none"
                          />
                        </div>
                        <div className="flex items-center gap-2 pt-1">
                          <button
                            onClick={() => {
                              const h = handlerInput || selected.handler || '调度员张'
                              const r = resolutionInput || selected.resolution || '已安排就近人员现场处理'
                              updateAlertHandler(selected.id, h, r)
                            }}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 text-white text-sm font-medium hover:from-primary-600 hover:to-primary-700 hover:shadow-lg hover:shadow-primary-500/20 transition-all-smooth"
                          >
                            <Send className="w-4 h-4" />
                            提交处理方案
                          </button>
                          <button
                            onClick={() => markAlertResolved(selected.id)}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-gradient-to-r from-success-500 to-success-600 text-white text-sm font-medium hover:from-success-600 hover:to-success-700 hover:shadow-lg hover:shadow-success-500/20 transition-all-smooth"
                          >
                            <CheckCheck className="w-4 h-4" />
                            标记已解决
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 处理统计 */}
              <div className="grid grid-cols-3 gap-4">
                <div className="card-base p-4 card-hover">
                  <div className="text-[11px] text-slate2-400 mb-1">平均响应时间</div>
                  <div className="text-2xl font-extrabold font-mono text-slate2-800">8.5<span className="text-sm font-normal text-slate2-400">分钟</span></div>
                </div>
                <div className="card-base p-4 card-hover">
                  <div className="text-[11px] text-slate2-400 mb-1">平均解决耗时</div>
                  <div className="text-2xl font-extrabold font-mono text-slate2-800">42<span className="text-sm font-normal text-slate2-400">分钟</span></div>
                </div>
                <div className="card-base p-4 card-hover">
                  <div className="text-[11px] text-slate2-400 mb-1">SLA达标率</div>
                  <div className="text-2xl font-extrabold font-mono text-success-600">98.5<span className="text-sm font-normal text-success-400">%</span></div>
                </div>
              </div>
            </>
          ) : (
            <div className="card-base py-20 text-center text-slate2-400">
              <AlertTriangle className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">请从左侧选择一条告警查看详情</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function InfoItem({
  icon,
  label,
  children,
  colSpan,
}: {
  icon: any
  label: string
  children: any
  colSpan?: number
}) {
  return (
    <div className={colSpan === 2 ? 'col-span-2' : ''}>
      <div className="flex items-center gap-1.5 text-[11px] text-slate2-400 mb-1">
        <span className="text-primary-400">{icon}</span>
        {label}
      </div>
      <div className="text-sm text-slate2-800 font-medium">{children}</div>
    </div>
  )
}
