import { useStore } from '@/store'
import MetricCard from '@/components/MetricCard'
import Card from '@/components/Card'
import StatusBadge from '@/components/StatusBadge'
import { useCountUp } from '@/hooks/useCountUp'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell,
} from 'recharts'
import { Ticket, Percent, Store, Banknote, TrendingUp, ArrowUpRight } from 'lucide-react'

const PIE_COLORS = ['#1B2A4A', '#E8A838', '#2ECC71', '#6366F1', '#EC4899']

const fmt = (n: number) => n.toLocaleString('zh-CN')

function AnimatedMetric({ value, suffix }: { value: number; suffix?: string }) {
  const animated = useCountUp(value)
  return <>{fmt(animated)}{suffix ?? ''}</>
}

export default function Dashboard() {
  const { dashboardMetrics, merchants } = useStore()
  const { totalIssued, verifyRate, activeMerchants, totalBenefit, dailyTrend, districtData, categoryDistribution } = dashboardMetrics

  const topMerchants = [...merchants]
    .sort((a, b) => b.verifyCount - a.verifyCount)
    .slice(0, 5)

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div style={{ animationDelay: '0ms' }} className="animate-fade-in">
          <MetricCard
            label="发放总量"
            value={<AnimatedMetric value={totalIssued} />}
            suffix="张"
            icon={<Ticket className="w-5 h-5" />}
            trend={{ value: '较上月 +12.3%', positive: true }}
            gradient="from-primary to-primary-light"
          />
        </div>
        <div style={{ animationDelay: '80ms' }} className="animate-fade-in">
          <MetricCard
            label="核销率"
            value={<AnimatedMetric value={Math.round(verifyRate * 10) / 10} />}
            suffix="%"
            icon={<Percent className="w-5 h-5" />}
            trend={{ value: '较上月 +2.1%', positive: true }}
            gradient="from-accent-dark to-accent"
          />
        </div>
        <div style={{ animationDelay: '160ms' }} className="animate-fade-in">
          <MetricCard
            label="活跃商户"
            value={<AnimatedMetric value={activeMerchants} />}
            suffix="家"
            icon={<Store className="w-5 h-5" />}
            trend={{ value: '较上月 +3', positive: true }}
            gradient="from-emerald-600 to-emerald-400"
          />
        </div>
        <div style={{ animationDelay: '240ms' }} className="animate-fade-in">
          <MetricCard
            label="惠民金额"
            value={<AnimatedMetric value={totalBenefit} />}
            suffix="元"
            icon={<Banknote className="w-5 h-5" />}
            trend={{ value: '较上月 +8.7%', positive: true }}
            gradient="from-indigo-600 to-indigo-400"
          />
        </div>
      </div>

      <div style={{ animationDelay: '320ms' }} className="animate-fade-in">
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-gray-800">每日趋势</h3>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={dailyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#9CA3AF" />
              <YAxis tick={{ fontSize: 11 }} stroke="#9CA3AF" />
              <Tooltip
                contentStyle={{ borderRadius: 8, fontSize: 13, border: '1px solid #e5e7eb' }}
                formatter={(v: number, name: string) => [fmt(v), name === 'issued' ? '发放' : '核销']}
              />
              <Line type="monotone" dataKey="issued" stroke="#1B2A4A" strokeWidth={2} dot={false} name="issued" />
              <Line type="monotone" dataKey="verified" stroke="#E8A838" strokeWidth={2} dot={false} name="verified" />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div style={{ animationDelay: '400ms' }} className="animate-fade-in">
          <Card>
            <h3 className="font-semibold text-gray-800 mb-4">各区核销量</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={districtData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} stroke="#9CA3AF" />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} stroke="#9CA3AF" width={60} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, fontSize: 13, border: '1px solid #e5e7eb' }}
                  formatter={(v: number) => [fmt(v) + ' 笔', '核销量']}
                />
                <Bar dataKey="value" fill="#1B2A4A" radius={[0, 4, 4, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>

        <div style={{ animationDelay: '480ms' }} className="animate-fade-in">
          <Card>
            <h3 className="font-semibold text-gray-800 mb-4">品类分布</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={{ stroke: '#9CA3AF' }}
                >
                  {categoryDistribution.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: 8, fontSize: 13, border: '1px solid #e5e7eb' }}
                  formatter={(v: number) => [v + '%', '占比']}
                />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </div>
      </div>

      <div style={{ animationDelay: '560ms' }} className="animate-fade-in">
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">商户核销排行</h3>
            <span className="text-xs text-gray-400">按核销量排序</span>
          </div>
          <div className="space-y-3">
            {topMerchants.map((m, i) => (
              <div key={m.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0 ${
                  i === 0 ? 'bg-amber-500' : i === 1 ? 'bg-gray-400' : i === 2 ? 'bg-amber-700' : 'bg-gray-300'
                }`}>
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-800 truncate">{m.name}</span>
                    <StatusBadge status={m.status} />
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">{m.district} · {m.category}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-sm font-semibold text-gray-800">{fmt(m.verifyCount)} 笔</div>
                  <div className="text-xs text-gray-400">核销率 {(m.verifyRate * 100).toFixed(0)}%</div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-gray-300 shrink-0" />
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
