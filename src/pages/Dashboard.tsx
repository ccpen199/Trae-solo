import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Package, Truck, MessageSquareWarning, Coins, CalendarClock, ScanLine, Upload,
  Calculator, TrendingUp, TrendingDown, Clock, AlertCircle, FileText, ChevronRight,
  FileSpreadsheet, Printer, AlertTriangle, CheckCircle2, Crown,
  Eye, RefreshCw, Usb, RotateCcw, PhoneCall, Timer, MapPin as MapPinIcon, Zap,
} from 'lucide-react'
import { useDashboardStore } from '@/store'
import StatusBadge from '@/components/StatusBadge'
import type { Waybill } from '../../shared/types'

const complaintBranchMap: Record<string, { label: string; color: string }> = {
  '时效延误': { label: '时效保障组', color: 'bg-orange-500/15 text-orange-400 border-orange-500/30' },
  '货物丢失': { label: '丢失调查组', color: 'bg-red-500/15 text-red-400 border-red-500/30' },
  '破损理赔': { label: '理赔中心', color: 'bg-pink-500/15 text-pink-400 border-pink-500/30' },
  '服务态度': { label: '服务质量部', color: 'bg-violet-500/15 text-violet-400 border-violet-500/30' },
  '其他': { label: '综合处理组', color: 'bg-slate-500/15 text-slate-400 border-slate-500/30' },
  '默认': { label: '综合处理组', color: 'bg-slate-500/15 text-slate-400 border-slate-500/30' },
}

function renderSLAProgress(deadline: string, size = 64) {
  if (!deadline) return null
  const totalMs = 48 * 3600 * 1000
  const remain = Math.max(0, new Date(deadline.replace(' ', 'T')).getTime() - Date.now())
  const usedPct = Math.min(100, Math.max(0, ((totalMs - remain) / totalMs) * 100))
  const r = size / 2 - 6
  const c = 2 * Math.PI * r
  const dash = (usedPct / 100) * c
  const urgent = remain < 4 * 3600 * 1000
  const hours = Math.floor(remain / 3600000)
  const mins = Math.floor((remain % 3600000) / 60000)
  const stroke = urgent ? '#f87171' : remain < 24 * 3600 * 1000 ? '#f59e0b' : '#10b981'
  return (
    <div className="relative shrink-0 flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#1e293b" strokeWidth="4" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={stroke} strokeWidth="4"
          strokeDasharray={`${dash} ${c}`} strokeLinecap="round"
          className="transition-all duration-700" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center leading-none">
        {remain > 0 ? (
          <>
            <span className={`font-mono-num text-sm font-bold ${urgent ? 'text-red-400 animate-pulse' : 'text-slate-200'}`}>{hours}h</span>
            <span className="text-[10px] text-slate-500 mt-0.5">{mins}m</span>
          </>
        ) : (
          <span className="text-[10px] font-bold text-red-400">超时</span>
        )}
      </div>
    </div>
  )
}

const statCards = [
  { key: 'todayPickups' as const, label: '今日寄件', icon: Package, borderCls: 'border-t-amber-500', bgCls: 'bg-amber-500/15', textCls: 'text-amber-400', trend: '+12%' },
  { key: 'inTransitWaybills' as const, label: '在途运单', icon: Truck, borderCls: 'border-t-blue-500', bgCls: 'bg-blue-500/15', textCls: 'text-blue-400', trend: '+5%' },
  { key: 'pendingComplaints' as const, label: '待处理工单', icon: MessageSquareWarning, borderCls: 'border-t-red-500', bgCls: 'bg-red-500/15', textCls: 'text-red-400', trend: '-3%', down: true },
  { key: 'pointsBalance' as const, label: '积分余额', icon: Coins, borderCls: 'border-t-emerald-500', bgCls: 'bg-emerald-500/15', textCls: 'text-emerald-400', trend: '+8%' },
]

const businessStatCards = [
  { key: 'scanTodayCount' as const, label: '今日扫描', icon: ScanLine, color: 'cyan',
    badgeFn: (v: any) => (v?.scanPendingReview > 0 ? `${v.scanPendingReview}条待复核` : null) },
  { key: 'importProcessing' as const, label: '导入批次', icon: FileSpreadsheet, color: 'violet',
    badgeFn: (v: any) => (v?.importTodayFailed > 0 ? `${v.importTodayFailed}条失败` : null) },
  { key: 'printPending' as const, label: '打印任务', icon: Printer, color: 'pink',
    badgeFn: (v: any) => (v?.printFailed > 0 ? `${v.printFailed}个失败` : null) },
  { key: 'pendingInvoices' as const, label: '待开发票', icon: FileText, color: 'orange',
    badgeFn: (v: any) => (v?.failedInvoices > 0 ? `${v.failedInvoices}张失败` : null) },
]

const quickActions = [
  { label: '预约取件', icon: CalendarClock, to: '/pickup' },
  { label: '扫码识别', icon: ScanLine, to: '/scan' },
  { label: '批量导入', icon: Upload, to: '/waybill' },
  { label: '运费计算', icon: Calculator, to: '/freight' },
]

const todoIconMap: Record<string, any> = {
  pickup: CalendarClock, complaint: AlertCircle, invoice: FileText,
  scan: ScanLine, import: FileSpreadsheet, print: Printer,
}
const todoBadgeMap: Record<string, string> = {
  pickup: 'badge-warning', complaint: 'badge-danger', invoice: 'badge-info',
  scan: 'badge-cyan', import: 'badge-violet', print: 'badge-pink',
}
const todoLabelMap: Record<string, string> = {
  pickup: '取件', complaint: '工单', invoice: '发票',
  scan: '扫描', import: '导入', print: '打印',
}

function BusinessStatCard({ card, stats }: { card: any; stats: any }) {
  const Icon = card.icon
  const value = stats?.[card.key] ?? 0
  const badge = card.badgeFn(stats)
  const colorMap: Record<string, string> = {
    cyan: 'bg-cyan-500/15 text-cyan-400',
    violet: 'bg-violet-500/15 text-violet-400',
    pink: 'bg-pink-500/15 text-pink-400',
    orange: 'bg-orange-500/15 text-orange-400',
  }
  const borderColorMap: Record<string, string> = {
    cyan: 'border-cyan-500/30',
    violet: 'border-violet-500/30',
    pink: 'border-pink-500/30',
    orange: 'border-orange-500/30',
  }
  const cls = colorMap[card.color] || colorMap.cyan
  const borderCls = borderColorMap[card.color] || borderColorMap.cyan
  return (
    <div className={`card rounded-xl p-4 animate-slide-up`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg ${cls} flex items-center justify-center`}>
            <Icon className={`w-5 h-5 ${cls.split(' ')[1]}`} />
          </div>
          <div>
            <p className="text-2xl font-bold font-mono-num text-slate-100">{value.toLocaleString()}</p>
            <p className="text-sm text-slate-400">{card.label}</p>
          </div>
        </div>
        <div>
          {badge && (
            <span className={`text-xs px-2 py-1 rounded bg-red-500/15 text-red-400 border border-red-500/30 flex items-center gap-1`}>
              <AlertTriangle className="w-3 h-3" />{badge}
            </span>
          )}
        </div>
      </div>
      <div className={`h-1 mt-4 rounded bg-slate-800 overflow-hidden`}>
        <div className={`h-full ${borderCls.replace('border-', 'bg-').replace('/30', '/50')}`} style={{ width: `${Math.min(100, value * 5 + 20)}%` }} />
      </div>
    </div>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { stats, todos, fetchStats, fetchTodos } = useDashboardStore()
  const [recentWaybills, setRecentWaybills] = useState<Waybill[]>([])
  const [todoFilter, setTodoFilter] = useState<string>('all')

  useEffect(() => {
    fetchStats()
    fetchTodos()
    fetch('/api/waybill?page=1&limit=5')
      .then((r) => r.json())
      .then((d) => setRecentWaybills(d.data ?? d))
      .catch(() => {})
  }, [fetchStats, fetchTodos])

  const filteredTodos = useMemo(() => {
    if (todoFilter === 'all') return todos
    if (todoFilter === 'import') return todos.filter((t) => t.type === 'import' || t.type === 'print')
    return todos.filter((t) => t.type === todoFilter)
  }, [todos, todoFilter])

  const waybillStatusLabel = (s: string) => {
    const m: Record<string, string> = {
      created: '待取件', picked_up: '已取件', in_transit: '运输中', delivered: '已签收', returned: '退回',
    }
    return m[s] ?? s
  }

  const svipBadge = (level: number) => {
    if (!level) return null
    const levels = ['', '白银SVIP', '黄金SVIP', '钻石SVIP']
    return (
      <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
        <Crown className="w-3 h-3" />{levels[level] || `SVIP Lv.${level}`}
      </span>
    )
  }

  const deadlineUrgent = (deadline: string) => {
    if (!deadline) return false
    return new Date(deadline).getTime() - Date.now() < 4 * 3600 * 1000
  }

  const fmtDeadline = (d: string) => {
    try {
      return new Date(d).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
    } catch {
      return d
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">工作台首页</h1>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-sm text-slate-500">欢迎回来，张三</span>
            {svipBadge(stats?.svipLevel || 0)}
          </div>
        </div>
        <div className="text-sm text-slate-500 font-mono-num">
          {new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => {
          const Icon = card.icon
          const value = stats?.[card.key] ?? 0
          const isDown = card.down
          return (
            <div
              key={card.key}
              className={`card border-t-2 ${card.borderCls} animate-slide-up`}
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="flex items-center gap-4">
                <div className={`w-11 h-11 rounded-full ${card.bgCls} flex items-center justify-center shrink-0`}>
                  <Icon className={`w-5 h-5 ${card.textCls}`} />
                </div>
                <div className="min-w-0">
                  <p className="stat-value text-slate-100">{value.toLocaleString()}</p>
                  <p className="text-sm text-slate-400 mt-0.5">{card.label}</p>
                </div>
              </div>
              <div className={`mt-3 text-xs flex items-center gap-1 ${isDown ? 'text-red-400' : 'text-emerald-400'}`}>
                {isDown ? <TrendingDown className="w-3.5 h-3.5" /> : <TrendingUp className="w-3.5 h-3.5" />}
                {card.trend} 较昨日
              </div>
            </div>
          )
        })}
      </div>

      <div>
        <h2 className="section-title">业务动态</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {businessStatCards.map((card, i) => (
            <div key={card.key} style={{ animationDelay: `${i * 60}ms` }}>
              <BusinessStatCard card={card} stats={stats} />
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {quickActions.map((action) => {
          const Icon = action.icon
          return (
            <button
              key={action.to}
              onClick={() => navigate(action.to)}
              className="card-hover flex flex-col items-center justify-center gap-2 py-5 cursor-pointer group"
            >
              <Icon className="w-6 h-6 text-amber-500 group-hover:scale-110 transition-transform" />
              <span className="text-sm text-slate-300">{action.label}</span>
            </button>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="section-title !mb-0">待办事项</h2>
            <div className="flex items-center gap-1">
              {[
                { key: 'all', label: '全部' },
                { key: 'complaint', label: '工单' },
                { key: 'scan', label: '扫描' },
                { key: 'import', label: '导入/打印' },
              ].map((f) => (
                <button
                  key={f.key}
                  onClick={() => setTodoFilter(f.key)}
                  className={`text-xs px-2.5 py-1 rounded-md transition-colors ${
                    todoFilter === f.key
                      ? 'bg-amber-500/20 text-amber-400'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>
          <div className="card space-y-1 py-2">
            {filteredTodos.length === 0 && (
              <div className="text-slate-500 text-sm py-8 text-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                暂无待办事项
              </div>
            )}
            {filteredTodos.slice(0, 8).map((todo) => {
              const Icon = todoIconMap[todo.type] || AlertCircle
              const badgeCls = todoBadgeMap[todo.type] || 'badge-info'
              const label = todoLabelMap[todo.type] || todo.type
              const urgent = deadlineUrgent(todo.deadline || '')
              const meta = (todo as any).meta || {}

              return (
                <button
                  key={todo.id}
                  onClick={() => navigate(todo.link || '/')}
                  className="w-full flex items-start gap-3 py-3 px-3 text-left hover:bg-slate-800/60 transition-colors rounded-lg border border-transparent hover:border-slate-700"
                >
                  <div className="mt-0.5"><Icon className="w-4 h-4 text-slate-500" /></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`badge ${badgeCls}`}>{label}</span>
                      {urgent && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-red-500/15 text-red-400 flex items-center gap-1 animate-pulse">
                          <AlertTriangle className="w-3 h-3" />紧急
                        </span>
                      )}
                      <span className="text-sm text-slate-200 truncate">{todo.title}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1 truncate">{todo.description}</p>

                    {todo.type === 'complaint' && (() => {
                      const complaintType = meta.type || '默认'
                      const branch = meta.assignedBranch === '待分派'
                        ? complaintBranchMap[complaintType as keyof typeof complaintBranchMap] || complaintBranchMap['默认']
                        : { label: meta.assignedBranch, color: complaintBranchMap[complaintType as keyof typeof complaintBranchMap]?.color || 'bg-slate-500/15 text-slate-400 border-slate-500/30' }
                      return (
                        <div className="flex items-center gap-2 flex-wrap mt-2">
                          <span className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border ${branch.color}`}>
                            <MapPinIcon className="w-3 h-3" />责任网点: {branch.label}
                          </span>
                          <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border bg-slate-700/50 text-slate-400 border-slate-600">
                            <PhoneCall className="w-3 h-3" />{complaintType}
                          </span>
                          {todo.deadline && (
                            <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border bg-blue-500/10 text-blue-400 border-blue-500/30">
                              <Timer className="w-3 h-3" />SLA 48h
                            </span>
                          )}
                        </div>
                      )
                    })()}

                    {todo.type === 'invoice' && (() => {
                      const failed = meta.failReason
                      return (
                        <div className="flex items-center gap-2 flex-wrap mt-2">
                          {failed ? (
                            <div className="flex-1 min-w-0 flex items-center gap-1 text-[10px] px-2 py-1 rounded bg-red-500/10 text-red-400 border border-red-500/30">
                              <AlertCircle className="w-3 h-3 shrink-0" />
                              <span className="truncate">失败原因: {failed}</span>
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border bg-emerald-500/10 text-emerald-400 border-emerald-500/30">
                              <Usb className="w-3 h-3" />UKey 就绪
                            </span>
                          )}
                          {meta.failReason ? (
                            <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border bg-red-500/10 text-red-400 border-red-500/30">
                              <Usb className="w-3 h-3" />UKey 异常
                            </span>
                          ) : null}
                          <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border bg-slate-700/50 text-slate-400 border-slate-600 font-mono-num">
                            ¥{meta.amount}
                          </span>
                          {meta.failReason && (
                            <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border bg-amber-500/15 text-amber-400 border-amber-500/30 animate-pulse">
                              <RotateCcw className="w-3 h-3" />一键重试
                            </span>
                          )}
                        </div>
                      )
                    })()}

                    {todo.type === 'print' && meta.printedCount !== undefined && (
                      <div className="mt-2">
                        <div className="flex items-center justify-between text-[10px] text-slate-500 mb-0.5">
                          <span className="flex items-center gap-1"><Printer className="w-3 h-3" />打印进度</span>
                          <span className="font-mono-num">{meta.printedCount}/{meta.printedCount + 1 >= todo.title.includes('失败') ? 10 : todo.title.match(/(\d+)/)?.[0] || 0}张</span>
                        </div>
                        <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
                          <div className={`h-full ${todo.title.includes('失败') ? 'bg-red-500' : 'bg-emerald-500'}`}
                            style={{ width: `${Math.min(100, meta.printedCount * 15)}%` }} />
                        </div>
                      </div>
                    )}

                    {todo.deadline && todo.type !== 'complaint' && (
                      <p className={`text-xs mt-1.5 flex items-center gap-1 ${urgent ? 'text-red-400' : 'text-slate-600'}`}>
                        <Clock className="w-3 h-3" />截止 {fmtDeadline(todo.deadline)}
                      </p>
                    )}
                  </div>

                  {todo.type === 'complaint' && todo.deadline ? (
                    <div className="shrink-0 ml-auto">{renderSLAProgress(todo.deadline, 58)}</div>
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-600 shrink-0" />
                  )}
                </button>
              )
            })}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="section-title !mb-0">近期运单追踪</h2>
            <button
              onClick={() => navigate('/tracking')}
              className="text-xs text-amber-500 hover:text-amber-400 flex items-center gap-1"
            >
              <Eye className="w-3.5 h-3.5" />物流追踪
            </button>
          </div>
          <div className="card space-y-0 divide-y divide-slate-800">
            {recentWaybills.length === 0 && (
              <p className="text-slate-500 text-sm py-8 text-center">暂无运单记录</p>
            )}
            {recentWaybills.map((wb, idx) => {
              const serviceLabels: Record<string, string> = { standard: '标准快递', express: '特快', same_day: '当日达' }
              const currentStep = ['created', 'picked_up', 'in_transit', 'delivered'].indexOf(wb.status)
              const stepLabels = ['创建', '取件', '运输', '签收']
              return (
                <div key={wb.id} className="py-3 px-1 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="font-mono-num text-sm text-slate-200 shrink-0">{wb.waybillNo}</span>
                      <StatusBadge status={wb.status} label={waybillStatusLabel(wb.status)} />
                      <span className="text-xs px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400">{serviceLabels[wb.serviceLevel] || wb.serviceLevel}</span>
                    </div>
                    <span className="font-mono-num text-sm text-amber-400 shrink-0">¥{wb.fee}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 truncate mb-2">
                    <span className="shrink-0">{wb.senderName}</span>
                    <span className="text-slate-700">→</span>
                    <span className="truncate flex-1">{wb.receiverName} · {wb.receiverAddress}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    {stepLabels.map((label, i) => (
                      <div key={i} className="flex-1 flex items-center min-w-0">
                        <div className={`w-2 h-2 rounded-full shrink-0 ${i <= currentStep ? 'bg-amber-500' : 'bg-slate-700'}`} />
                        <span className={`ml-1 text-[10px] shrink-0 ${i <= currentStep ? 'text-slate-300' : 'text-slate-600'}`}>{label}</span>
                        {i < 3 && (
                          <div className={`flex-1 h-0.5 mx-1 ${i < currentStep ? 'bg-amber-500/50' : 'bg-slate-800'}`} />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="card animate-slide-up" style={{ animationDelay: '200ms' }}>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-slate-400">今日营收</p>
            <RefreshCw className="w-4 h-4 text-slate-600" />
          </div>
          <p className="stat-value text-amber-400">
            ¥{(stats?.todayRevenue ?? 0).toLocaleString()}
          </p>
          <div className="mt-2 text-xs text-emerald-400 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />环比 +18.5%
          </div>
        </div>
        <div className="card animate-slide-up" style={{ animationDelay: '280ms' }}>
          <p className="text-sm text-slate-400 mb-2">妥投率</p>
          <p className="stat-value text-emerald-400">
            {(stats?.deliveryRate ?? 0).toFixed(1)}%
          </p>
          <div className="mt-3 h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-700"
              style={{ width: `${stats?.deliveryRate ?? 0}%` }}
            />
          </div>
        </div>
        <div className="card animate-slide-up" style={{ animationDelay: '360ms' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400 mb-2">会员权益</p>
              <p className="text-lg font-bold text-slate-100">
                {stats?.svipLevel ? `SVIP Lv.${stats.svipLevel}` : '普通会员'}
              </p>
            </div>
            <Crown className={`w-8 h-8 ${stats?.svipLevel ? 'text-amber-500' : 'text-slate-600'}`} />
          </div>
          <button
            onClick={() => navigate('/membership')}
            className="mt-3 w-full text-xs py-2 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-colors border border-amber-500/20 flex items-center justify-center gap-1"
          >
            查看权益详情 <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  )
}
