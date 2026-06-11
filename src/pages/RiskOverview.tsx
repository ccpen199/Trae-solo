import { useMemo } from 'react'
import { useStore } from '@/store'
import MetricCard from '@/components/MetricCard'
import Card from '@/components/Card'
import StatusBadge from '@/components/StatusBadge'
import PageHeader from '@/components/PageHeader'
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts'
import { ShieldAlert, AlertTriangle, AlertOctagon, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

const PIE_COLORS = ['#3B82F6', '#F59E0B', '#F97316', '#EF4444']

export default function RiskOverview() {
  const { riskEvents } = useStore()

  const stats = useMemo(() => {
    const total = riskEvents.length
    const pending = riskEvents.filter((e) => e.status === 'pending').length
    const critical = riskEvents.filter((e) => e.level === 'critical').length
    const today = riskEvents.filter((e) => e.detectedAt.startsWith('2026-06-09')).length
    return { total, pending, critical, today }
  }, [riskEvents])

  const levelData = useMemo(() => [
    { name: '低风险', value: riskEvents.filter((e) => e.level === 'low').length },
    { name: '中风险', value: riskEvents.filter((e) => e.level === 'medium').length },
    { name: '高风险', value: riskEvents.filter((e) => e.level === 'high').length },
    { name: '极高风险', value: riskEvents.filter((e) => e.level === 'critical').length },
  ], [riskEvents])

  const typeData = useMemo(() => [
    { name: '设备多账户', value: riskEvents.filter((e) => e.type === 'device_multi_account').length },
    { name: '黄牛囤券', value: riskEvents.filter((e) => e.type === 'hoarding').length },
    { name: '异常路径', value: riskEvents.filter((e) => e.type === 'abnormal_path').length },
  ], [riskEvents])

  return (
    <div>
      <PageHeader title="风控概览" description="风险事件监控与统计分析" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard label="风险事件总数" value={stats.total} icon={<ShieldAlert className="w-5 h-5" />} gradient="from-blue-500 to-blue-700" />
        <MetricCard label="待处理" value={stats.pending} icon={<AlertTriangle className="w-5 h-5" />} gradient="from-amber-500 to-amber-700" />
        <MetricCard label="高危事件" value={stats.critical} icon={<AlertOctagon className="w-5 h-5" />} gradient="from-red-500 to-red-700" />
        <MetricCard label="今日新增" value={stats.today} icon={<CheckCircle className="w-5 h-5" />} gradient="from-emerald-500 to-emerald-700" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <h3 className="text-base font-bold text-primary mb-4">风险等级分布</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={levelData} cx="50%" cy="50%" innerRadius={50} outerRadius={85} dataKey="value" label={({ name, value }) => `${name} ${value}`}>
                {levelData.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <h3 className="text-base font-bold text-primary mb-4">风险类型分布</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={typeData}>
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="value" fill="#6366F1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card>
        <h3 className="text-base font-bold text-primary mb-4">近期风险事件</h3>
        <div className="space-y-3">
          {riskEvents.map((event) => (
            <div
              key={event.id}
              className={cn(
                'flex items-center gap-4 p-3 rounded-lg border border-border hover:bg-gray-50/50 transition-colors',
                event.level === 'critical' && 'border-red-200 bg-red-50/30'
              )}
            >
              {event.level === 'critical' && (
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
                </span>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <StatusBadge status={event.type} />
                  <StatusBadge status={event.level} />
                </div>
                <p className="text-sm text-[#6B7A99] truncate">{event.description}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-xs text-[#6B7A99]">{event.detectedAt}</p>
                <div className="mt-1">
                  <StatusBadge status={event.status} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
