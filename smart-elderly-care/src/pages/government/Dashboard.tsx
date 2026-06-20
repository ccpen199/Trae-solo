import { Users, Target, MessageSquare, CheckCircle } from 'lucide-react'
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import StatCard from '../../components/StatCard'
import StatusBadge from '../../components/StatusBadge'
import { govDashboard, complaintRecords, subsidyRecords } from '../../data/mockData'
import type { ComplaintRecord } from '../../types'

const agingTrendData = [
  { month: '1月', rate: 19.5 },
  { month: '2月', rate: 19.8 },
  { month: '3月', rate: 20.3 },
  { month: '4月', rate: 20.9 },
  { month: '5月', rate: 21.2 },
  { month: '6月', rate: 21.8 },
]

const subsidyByTypeData = [
  { type: '养老金', amount: 1280 },
  { type: '失能补贴', amount: 560 },
  { type: '护理补贴', amount: 680 },
  { type: '医疗救助', amount: 336 },
]

const complaintTypeMap: Record<string, string> = {
  service_quality: '服务质量',
  subsidy: '补贴问题',
  facility: '设施问题',
  personnel: '人员问题',
}

const subsidyTypeMap: Record<string, string> = {
  pension: '养老金',
  disability: '失能补贴',
  nursing: '护理补贴',
  medical: '医疗救助',
}

function ComplaintsTable() {
  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm">
      <div className="px-5 py-4 border-b border-slate-100">
        <h3 className="font-semibold text-slate-800">近期投诉</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left text-xs text-slate-500 border-b border-slate-50">
              <th className="px-5 py-3 font-medium">投诉人</th>
              <th className="px-5 py-3 font-medium">类型</th>
              <th className="px-5 py-3 font-medium">状态</th>
              <th className="px-5 py-3 font-medium">时间</th>
            </tr>
          </thead>
          <tbody>
            {complaintRecords.map((c: ComplaintRecord) => (
              <tr key={c.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-25">
                <td className="px-5 py-3 text-sm text-slate-700">{c.elderName}</td>
                <td className="px-5 py-3 text-sm text-slate-600">{complaintTypeMap[c.type]}</td>
                <td className="px-5 py-3"><StatusBadge status={c.status} type="complaint" /></td>
                <td className="px-5 py-3 text-sm text-slate-400">{c.createdAt.slice(0, 10)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function SubsidyStatsTable() {
  const statsByType: Record<string, { count: number; total: number; disbursed: number }> = {}
  for (const r of subsidyRecords) {
    const label = subsidyTypeMap[r.type]
    if (!statsByType[label]) statsByType[label] = { count: 0, total: 0, disbursed: 0 }
    statsByType[label].count++
    statsByType[label].total += r.amount
    if (r.status === 'disbursed') statsByType[label].disbursed += r.amount
  }

  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm">
      <div className="px-5 py-4 border-b border-slate-100">
        <h3 className="font-semibold text-slate-800">补贴发放统计</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-left text-xs text-slate-500 border-b border-slate-50">
              <th className="px-5 py-3 font-medium">补贴类型</th>
              <th className="px-5 py-3 font-medium">申请数</th>
              <th className="px-5 py-3 font-medium">申请总额</th>
              <th className="px-5 py-3 font-medium">已发放</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(statsByType).map(([type, s]) => (
              <tr key={type} className="border-b border-slate-50 last:border-0 hover:bg-slate-25">
                <td className="px-5 py-3 text-sm text-slate-700">{type}</td>
                <td className="px-5 py-3 text-sm text-slate-600">{s.count}</td>
                <td className="px-5 py-3 text-sm text-slate-600">¥{s.total.toLocaleString()}</td>
                <td className="px-5 py-3 text-sm text-green-600">¥{s.disbursed.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="区域老龄化率"
          value={govDashboard.regionAgingRate}
          unit="%"
          icon={<Users className="w-5 h-5" />}
          trend={{ value: 1.2, isUp: true }}
          color="blue"
        />
        <StatCard
          title="补贴发放精准度"
          value={govDashboard.subsidyPrecision}
          unit="%"
          icon={<Target className="w-5 h-5" />}
          trend={{ value: 0.8, isUp: true }}
          color="green"
        />
        <StatCard
          title="投诉闭环率"
          value={govDashboard.complaintResolutionRate}
          unit="%"
          icon={<MessageSquare className="w-5 h-5" />}
          trend={{ value: 2.3, isUp: true }}
          color="orange"
        />
        <StatCard
          title="工单完成率"
          value={govDashboard.completedOrderRate}
          unit="%"
          icon={<CheckCircle className="w-5 h-5" />}
          trend={{ value: 1.5, isUp: true }}
          color="purple"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
          <h3 className="font-semibold text-slate-800 mb-4">老龄化率月度趋势</h3>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={agingTrendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94a3b8' }} />
              <YAxis domain={[18, 23]} tick={{ fontSize: 12, fill: '#94a3b8' }} unit="%" />
              <Tooltip
                contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13 }}
                formatter={(value) => [`${value}%`, '老龄化率']}
              />
              <Area type="monotone" dataKey="rate" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.1} strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
          <h3 className="font-semibold text-slate-800 mb-4">补贴发放类型分布</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={subsidyByTypeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="type" tick={{ fontSize: 12, fill: '#94a3b8' }} />
              <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} unit="万" />
              <Tooltip
                contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13 }}
                formatter={(value) => [`${value}万元`, '发放金额']}
              />
              <Bar dataKey="amount" fill="#22c55e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ComplaintsTable />
        <SubsidyStatsTable />
      </div>
    </div>
  )
}
