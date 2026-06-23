import {
  Package,
  Truck,
  FileCheck,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  AlertCircle,
  Clock,
  CheckCircle2,
  Circle,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts'
import { PageHeader } from '../components/ui/Breadcrumb'
import { StatCard } from '../components/ui/StatCard'
import { Section } from '../components/ui/Section'
import { DataTable } from '../components/ui/DataTable'
import { Tag } from '../components/ui/Tag'
import { Progress } from '../components/ui/Progress'
import { mockOrders, mockAlerts, mockCapacity, mockAudits } from '../data/mock'
import { formatCurrency, formatDateTime, statusColor, cn } from '../utils'
import { Home } from 'lucide-react'

const orderTrend = [
  { name: '6/15', orders: 38, amount: 520000 },
  { name: '6/16', orders: 42, amount: 610000 },
  { name: '6/17', orders: 35, amount: 485000 },
  { name: '6/18', orders: 51, amount: 720000 },
  { name: '6/19', orders: 48, amount: 680000 },
  { name: '6/20', orders: 56, amount: 810000 },
  { name: '6/21', orders: 44, amount: 625000 },
]

const statusDist = [
  { name: '运输中', value: 18, color: '#6366f1' },
  { name: '待匹配', value: 12, color: '#3b82f6' },
  { name: '已完成', value: 65, color: '#10b981' },
  { name: '异常', value: 3, color: '#f59e0b' },
  { name: '已取消', value: 2, color: '#ef4444' },
]

const performanceData = [
  { name: '顺达物流', score: 96.5, onTime: 98.6 },
  { name: '恒通快运', score: 92.8, onTime: 95.2 },
  { name: '鑫源物流', score: 89.4, onTime: 92.1 },
  { name: '迅捷物流', score: 88.4, onTime: 91.3 },
  { name: '万和航运', score: 94.1, onTime: 96.8 },
]

export default function Dashboard() {
  const recentOrders = mockOrders.slice(0, 4)
  const pendingAudits = mockAudits.filter((a) => a.auditStatus === 'manual_review' || a.auditStatus === 'ocr_verifying')
  const activeAlerts = mockAlerts.filter((a) => !a.resolved)
  const onlineFleet = mockCapacity.filter((v) => v.gpsStatus === 'online').length

  return (
    <div className="space-y-6">
      <PageHeader
        title="工作台"
        subtitle="欢迎回来，今日业务动态一览"
        breadcrumbs={[{ label: '工作台', icon: Home }]}
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="今日订单数"
          value="44"
          trend={
            <span className="flex items-center gap-1 text-green-400">
              <ArrowUpRight className="h-3 w-3" /> +12.5% 较昨日
            </span>
          }
          icon={<Package className="h-5 w-5" />}
          iconColor="bg-blue-500/15 text-blue-400"
        />
        <StatCard
          label="在途车辆"
          value={`${onlineFleet} / ${mockCapacity.length}`}
          trend={
            <span className="flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-green-400" /> GPS在线率 {(onlineFleet / mockCapacity.length * 100).toFixed(0)}%
            </span>
          }
          icon={<Truck className="h-5 w-5" />}
          iconColor="bg-cyan-500/15 text-cyan-400"
        />
        <StatCard
          label="今日交易额"
          value={formatCurrency(625400)}
          trend={
            <span className="flex items-center gap-1 text-green-400">
              <ArrowUpRight className="h-3 w-3" /> +8.2% 周同比
            </span>
          }
          icon={<FileCheck className="h-5 w-5" />}
          iconColor="bg-emerald-500/15 text-emerald-400"
        />
        <StatCard
          label="待处理告警"
          value={activeAlerts.length}
          trend={
            <span className="flex items-center gap-1 text-red-400">
              <ArrowDownRight className="h-3 w-3" /> 2 项高风险
            </span>
          }
          icon={<AlertTriangle className="h-5 w-5" />}
          iconColor="bg-red-500/15 text-red-400"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Section
          title="订单与交易额趋势"
          subtitle="近 7 日订单数量及运输费用波动"
          className="lg:col-span-2"
        >
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={orderTrend} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e2d4a" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#111a2e',
                    border: '1px solid #1e2d4a',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#e2e8f0',
                  }}
                />
                <Area type="monotone" dataKey="orders" stroke="#3b82f6" fill="url(#colorOrders)" strokeWidth={2} name="订单数" />
                <Area type="monotone" dataKey="amount" stroke="#10b981" fill="url(#colorAmount)" strokeWidth={2} name="交易额(元)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Section>

        <Section title="订单状态分布" subtitle="当前所有活跃订单占比">
          <div className="h-72 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusDist}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {statusDist.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} stroke="#111a2e" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#111a2e',
                    border: '1px solid #1e2d4a',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#e2e8f0',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
            {statusDist.map((s) => (
              <div key={s.name} className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                <span className="text-logistics-muted">{s.name}</span>
                <span className="ml-auto font-medium text-logistics-text">{s.value}</span>
              </div>
            ))}
          </div>
        </Section>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Section
          title="最新运输订单"
          subtitle="最近创建的 4 条运输订单"
          actions={<button className="btn-ghost">查看全部 →</button>}
          className="lg:col-span-2"
        >
          <DataTable
            compact
            columns={[
              {
                key: 'orderNo',
                title: '订单编号',
                render: (r) => <span className="font-mono text-xs text-primary-400">{r.orderNo as string}</span>,
              },
              { key: 'route', title: '路线', render: (r) => <span>{r.originCity as string} → {r.destCity as string}</span> },
              {
                key: 'cargo',
                title: '货物',
                render: (r) => (
                  <span className="text-xs text-logistics-muted">
                    {(r.cargo as { name: string; weight: number }).name} · {(r.cargo as { weight: number }).weight / 1000}吨
                  </span>
                ),
              },
              {
                key: 'budget',
                title: '预算',
                align: 'right',
                render: (r) => <span className="font-medium">{formatCurrency(r.budget as number)}</span>,
              },
              {
                key: 'status',
                title: '状态',
                align: 'center',
                render: (r) => <Tag className={statusColor(r.status as string)}>{r.statusLabel as string}</Tag>,
              },
            ]}
            data={recentOrders}
          />
        </Section>

        <Section
          title="承运方履约排行"
          subtitle="本月履约评分 TOP 5"
          actions={<button className="btn-ghost">详情 →</button>}
        >
          <div className="space-y-4">
            {performanceData.map((p, idx) => (
              <div key={p.name}>
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      'flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold',
                      idx < 3 ? 'bg-primary-600 text-white' : 'bg-logistics-border text-logistics-muted'
                    )}>
                      {idx + 1}
                    </span>
                    <span className="text-logistics-text">{p.name}</span>
                  </div>
                  <span className="font-medium text-logistics-text">{p.score}</span>
                </div>
                <Progress value={p.score} color={p.score >= 95 ? 'green' : p.score >= 90 ? 'primary' : 'yellow'} size="sm" />
                <div className="mt-1 flex justify-between text-[11px] text-logistics-muted">
                  <span>准时率 {p.onTime}%</span>
                </div>
              </div>
            ))}
          </div>
        </Section>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Section title="异常告警" subtitle="未处理的运输异常提醒" actions={<button className="btn-ghost">全部告警 →</button>}>
          <div className="space-y-3">
            {activeAlerts.length === 0 ? (
              <div className="py-8 text-center text-sm text-logistics-muted">暂无异常告警 ✓</div>
            ) : (
              activeAlerts.map((a) => (
                <div key={a.id} className="flex items-start gap-3 rounded-lg border border-logistics-border/60 bg-logistics-bg p-3">
                  <div className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                    a.severity === 'high' && 'bg-red-500/15 text-red-400',
                    a.severity === 'medium' && 'bg-yellow-500/15 text-yellow-400',
                    a.severity === 'low' && 'bg-blue-500/15 text-blue-400'
                  )}>
                    <AlertCircle className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-logistics-text">{a.typeLabel}</span>
                      <Tag variant={a.severity === 'high' ? 'danger' : a.severity === 'medium' ? 'warning' : 'info'}>
                        {a.severityLabel}
                      </Tag>
                    </div>
                    <p className="mt-0.5 text-xs text-logistics-muted line-clamp-2">{a.remark}</p>
                    <div className="mt-1 flex items-center gap-2 text-[11px] text-logistics-muted">
                      <span className="font-mono">{a.orderNo}</span>
                      <span>·</span>
                      <Clock className="h-3 w-3" />
                      <span>{formatDateTime(a.detectedAt)}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Section>

        <Section title="资质审核队列" subtitle={`${pendingAudits.length} 项待人工复核`} actions={<button className="btn-ghost">审核中心 →</button>}>
          <div className="space-y-3">
            {pendingAudits.length === 0 ? (
              <div className="py-8 text-center text-sm text-logistics-muted">审核队列为空 ✓</div>
            ) : (
              pendingAudits.map((a) => (
                <div key={a.id} className="flex items-start gap-3 rounded-lg border border-logistics-border/60 bg-logistics-bg p-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/15 text-amber-400">
                    <FileCheck className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-logistics-text">{a.documentTypeLabel}</span>
                      <Tag variant="warning">{a.auditStatusLabel}</Tag>
                    </div>
                    <p className="mt-0.5 text-xs text-logistics-muted">{a.applicantName} · {a.documentNumber}</p>
                    {a.ocrResult?.warnings?.length ? (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {a.ocrResult.warnings.map((w, i) => (
                          <span key={i} className="rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] text-amber-400">
                            ⚠ {w}
                          </span>
                        ))}
                      </div>
                    ) : null}
                    <div className="mt-1 flex items-center gap-2 text-[11px] text-logistics-muted">
                      <span>OCR置信度 {(a.ocrResult?.confidence ? (a.ocrResult.confidence * 100).toFixed(1) : 0)}%</span>
                      <span>·</span>
                      <span>上传 {formatDateTime(a.uploadedAt)}</span>
                    </div>
                  </div>
                  <button className="btn-primary !px-3 !py-1 !text-xs">处理</button>
                </div>
              ))
            )}
          </div>
        </Section>
      </div>
    </div>
  )
}
