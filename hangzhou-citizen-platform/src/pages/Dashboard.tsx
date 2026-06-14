import { Users, Activity, Server, ShieldCheck, TrendingUp, Clock, AlertCircle, CheckCircle2 } from 'lucide-react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
} from 'recharts'
import {
  dashboardStats,
  citizenCodes,
  verificationRecords,
  heatMapData,
  complaintWorkOrders,
} from '../data/mockData'

const trendData = [
  { month: '01', 核验次数: 320, 服务调用: 210 },
  { month: '02', 核验次数: 280, 服务调用: 190 },
  { month: '03', 核验次数: 350, 服务调用: 240 },
  { month: '04', 核验次数: 410, 服务调用: 280 },
  { month: '05', 核验次数: 380, 服务调用: 260 },
  { month: '06', 核验次数: 450, 服务调用: 310 },
  { month: '07', 核验次数: 520, 服务调用: 350 },
  { month: '08', 核验次数: 490, 服务调用: 330 },
  { month: '09', 核验次数: 470, 服务调用: 320 },
  { month: '10', 核验次数: 530, 服务调用: 360 },
  { month: '11', 核验次数: 560, 服务调用: 380 },
  { month: '12', 核验次数: 610, 服务调用: 420 },
].map((d) => ({ ...d, month: `2026-${d.month}` }))

const serviceCoverageData = [
  { name: '交通出行', coverage: 98 },
  { name: '文旅服务', coverage: 92 },
  { name: '医疗保障', coverage: 88 },
  { name: '教育服务', coverage: 85 },
  { name: '社会保障', coverage: 90 },
  { name: '住房服务', coverage: 78 },
  { name: '就业服务', coverage: 82 },
  { name: '养老服务', coverage: 75 },
  { name: '残疾人服务', coverage: 70 },
  { name: '公共安全', coverage: 95 },
  { name: '文化服务', coverage: 80 },
  { name: '体育健身', coverage: 72 },
]

function formatWan(n: number): string {
  return (n / 10000).toFixed(1) + '万'
}

const activeCodes = citizenCodes.filter((c) => c.status === 'active').length

const statsCards = [
  {
    icon: Users,
    value: formatWan(dashboardStats.totalUsers),
    label: '总用户数',
    trend: `+${dashboardStats.monthlyGrowth}% 月增长`,
    iconBg: 'bg-blue-100',
    iconColor: 'text-primary',
  },
  {
    icon: Activity,
    value: formatWan(dashboardStats.activeUsersToday),
    label: '日活用户',
    trend: '+2.1% 月增长',
    iconBg: 'bg-green-100',
    iconColor: 'text-success',
  },
  {
    icon: Server,
    value: `${dashboardStats.totalServices}项`,
    label: '服务总量',
    trend: `${activeCodes}类市民码活跃`,
    iconBg: 'bg-purple-100',
    iconColor: 'text-purple-600',
  },
  {
    icon: ShieldCheck,
    value: formatWan(dashboardStats.totalVerifications) + '次',
    label: '核验总量',
    trend: '+5.2% 月增长',
    iconBg: 'bg-orange-100',
    iconColor: 'text-orange-500',
  },
]

const heatColorMap: Record<string, string> = {
  high: '#ff4d4f',
  medium: '#faad14',
  low: '#52c41a',
}

const typeLabelMap: Record<string, { label: string; color: string }> = {
  subway: { label: '地铁', color: 'bg-blue-100 text-primary' },
  scenic: { label: '景区', color: 'bg-green-100 text-success' },
  campus: { label: '校园', color: 'bg-purple-100 text-purple-600' },
}

const statusMap: Record<string, { label: string; color: string }> = {
  success: { label: '成功', color: 'bg-green-100 text-success' },
  failed: { label: '失败', color: 'bg-red-100 text-danger' },
}

const workOrderStatusMap: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  pending: { label: '待处理', color: 'text-warning', icon: AlertCircle },
  processing: { label: '处理中', color: 'text-primary', icon: Clock },
  resolved: { label: '已解决', color: 'text-success', icon: CheckCircle2 },
}

const maxHeatValue = Math.max(...heatMapData.map((d) => d.value))

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-primary">后台管理 · 运营数据</h2>
            <p className="mt-1 text-sm text-text-secondary">
              数据概览、服务资源、核验记录和工单详情均已接入本地管理后台。
            </p>
          </div>
          <button
            type="button"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white"
          >
            查看详情
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {statsCards.map((card) => (
          <div
            key={card.label}
            className="rounded-xl bg-bg-card p-5 shadow-sm border border-border"
          >
            <div className="flex items-center justify-between">
              <div className={`flex h-11 w-11 items-center justify-center rounded-lg ${card.iconBg}`}>
                <card.icon className={`h-5 w-5 ${card.iconColor}`} />
              </div>
              <span className="flex items-center gap-1 text-xs text-success">
                <TrendingUp className="h-3 w-3" />
                {card.trend}
              </span>
            </div>
            <div className="mt-3">
              <p className="text-2xl font-bold text-text-primary">{card.value}</p>
              <p className="mt-1 text-sm text-text-secondary">{card.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="rounded-xl bg-bg-card p-5 shadow-sm border border-border">
          <h3 className="mb-4 text-base font-semibold text-text-primary">服务使用趋势</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={trendData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#9ca3af" />
              <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
              <Tooltip
                contentStyle={{
                  borderRadius: 8,
                  border: '1px solid #e5e7eb',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                }}
              />
              <Area
                type="monotone"
                dataKey="核验次数"
                stroke="#1677ff"
                fill="#1677ff"
                fillOpacity={0.15}
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="服务调用"
                stroke="#36cfc9"
                fill="#36cfc9"
                fillOpacity={0.15}
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl bg-bg-card p-5 shadow-sm border border-border">
          <h3 className="mb-4 text-base font-semibold text-text-primary">12类公共服务覆盖</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={serviceCoverageData}
              layout="vertical"
              margin={{ top: 5, right: 20, bottom: 5, left: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12 }} stroke="#9ca3af" unit="%" />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} stroke="#9ca3af" width={60} />
              <Tooltip
                formatter={(value) => [`${value}%`, '覆盖率']}
                contentStyle={{
                  borderRadius: 8,
                  border: '1px solid #e5e7eb',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                }}
              />
              <Bar dataKey="coverage" fill="#1677ff" radius={[0, 4, 4, 0]} barSize={14} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="rounded-xl bg-bg-card p-5 shadow-sm border border-border">
          <h3 className="mb-4 text-base font-semibold text-text-primary">区域服务热力图</h3>
          <div className="space-y-3">
            {heatMapData.map((item) => (
              <div key={item.district} className="flex items-center gap-3">
                <span className="w-16 shrink-0 text-sm text-text-secondary">{item.district}</span>
                <div className="relative h-6 flex-1 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="absolute inset-y-0 left-0 rounded-full transition-all"
                    style={{
                      width: `${(item.value / maxHeatValue) * 100}%`,
                      backgroundColor: heatColorMap[item.level],
                      opacity: 0.75,
                    }}
                  />
                </div>
                <span className="w-16 shrink-0 text-right text-sm font-medium text-text-primary">
                  {(item.value / 10000).toFixed(1)}万
                </span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center gap-4 text-xs text-text-secondary">
            <span className="flex items-center gap-1">
              <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: '#ff4d4f' }} />
              高
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: '#faad14' }} />
              中
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: '#52c41a' }} />
              低
            </span>
          </div>
        </div>

        <div className="rounded-xl bg-bg-card p-5 shadow-sm border border-border">
          <h3 className="mb-4 text-base font-semibold text-text-primary">最新核验记录</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-text-secondary">
                  <th className="pb-2 text-left font-medium">时间</th>
                  <th className="pb-2 text-left font-medium">市民</th>
                  <th className="pb-2 text-left font-medium">地点</th>
                  <th className="pb-2 text-left font-medium">类型</th>
                  <th className="pb-2 text-left font-medium">状态</th>
                </tr>
              </thead>
              <tbody>
                {verificationRecords.map((record) => {
                  const typeInfo = typeLabelMap[record.type]
                  const statusInfo = statusMap[record.status]
                  return (
                    <tr key={record.id} className="border-b border-border last:border-0">
                      <td className="py-2.5 text-text-secondary">{record.time.slice(11)}</td>
                      <td className="py-2.5 text-text-primary">{record.citizenName}</td>
                      <td className="py-2.5 text-text-primary">{record.location}</td>
                      <td className="py-2.5">
                        <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${typeInfo.color}`}>
                          {typeInfo.label}
                        </span>
                      </td>
                      <td className="py-2.5">
                        <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${statusInfo.color}`}>
                          {statusInfo.label}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="rounded-xl bg-bg-card p-5 shadow-sm border border-border">
        <h3 className="mb-4 text-base font-semibold text-text-primary">最新工单</h3>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {complaintWorkOrders.map((order) => {
            const ws = workOrderStatusMap[order.status]
            const StatusIcon = ws.icon
            return (
              <div
                key={order.id}
                className="flex items-start gap-3 rounded-lg border border-border p-3"
              >
                <StatusIcon className={`mt-0.5 h-4 w-4 shrink-0 ${ws.color}`} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="inline-block rounded bg-gray-100 px-1.5 py-0.5 text-xs text-text-secondary">
                      {order.category}
                    </span>
                    <span className={`text-xs font-medium ${ws.color}`}>{ws.label}</span>
                  </div>
                  <p className="mt-1 truncate text-sm text-text-primary">{order.content}</p>
                  <p className="mt-1 text-xs text-text-secondary">
                    {order.citizenName} · {order.dispatchBureau} · {order.createTime.slice(5, 16)}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
