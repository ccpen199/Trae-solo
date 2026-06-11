import PageHeader from '@/components/PageHeader'
import Card from '@/components/Card'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts'
import { TrendingDown, AlertTriangle, Bell } from 'lucide-react'
import { cn } from '@/lib/utils'

const trendData = Array.from({ length: 30 }, (_, i) => {
  const d = new Date()
  d.setDate(d.getDate() - (29 - i))
  const base = 80
  const dip = (i === 8 || i === 15 || i === 22) ? -25 : 0
  const noise = Math.floor(Math.random() * 10 - 5)
  const rate = Math.min(95, Math.max(55, base + dip + noise))
  return {
    date: `${d.getMonth() + 1}/${d.getDate()}`,
    rate: Number(rate.toFixed(1)),
  }
})

const alerts = trendData
  .filter((d) => d.rate < 60)
  .map((d, i) => ({
    id: `alert-${i}`,
    date: d.date,
    rate: d.rate,
    message: `核销率降至 ${d.rate}%，低于预警线`,
  }))

if (alerts.length === 0) {
  alerts.push(
    { id: 'alert-a', date: trendData[8].date, rate: 55.2, message: '核销率降至 55.2%，低于预警线' },
    { id: 'alert-b', date: trendData[15].date, rate: 57.8, message: '核销率降至 57.8%，低于预警线' },
    { id: 'alert-c', date: trendData[22].date, rate: 53.5, message: '核销率降至 53.5%，低于预警线' },
  )
}

export default function MerchantAlert() {
  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="核销率预警"
        description="监控商户核销率变化趋势，及时预警异常波动"
        actions={
          <span className="inline-flex items-center gap-1.5 text-sm text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg">
            <Bell className="w-4 h-4" /> {alerts.length} 条预警
          </span>
        }
      />

      <Card>
        <div className="flex items-center gap-2 mb-4">
          <TrendingDown className="w-5 h-5 text-amber-600" />
          <h3 className="font-semibold text-gray-800">30天核销率趋势</h3>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#9CA3AF" />
            <YAxis domain={[40, 100]} tick={{ fontSize: 11 }} stroke="#9CA3AF" unit="%" />
            <Tooltip
              contentStyle={{ borderRadius: 8, fontSize: 13, border: '1px solid #e5e7eb' }}
              formatter={(v: number) => [`${v}%`, '核销率']}
            />
            <ReferenceLine y={60} stroke="#ef4444" strokeDasharray="6 3" label={{ value: '预警线 60%', position: 'right', fill: '#ef4444', fontSize: 11 }} />
            <Line type="monotone" dataKey="rate" stroke="#1B2A4A" strokeWidth={2} dot={{ r: 3, fill: '#1B2A4A' }} activeDot={{ r: 5 }} />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      <Card>
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-5 h-5 text-amber-600" />
          <h3 className="font-semibold text-gray-800">预警记录</h3>
        </div>
        {alerts.length > 0 ? (
          <div className="space-y-3">
            {alerts.map((a) => (
              <div key={a.id} className="flex items-center gap-3 p-3 rounded-lg bg-amber-50/60 border border-amber-100">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-800">{a.message}</div>
                  <div className="text-xs text-[#6B7A99] mt-0.5">日期: {a.date}</div>
                </div>
                <span className={cn('text-sm font-bold shrink-0', a.rate < 55 ? 'text-red-600' : 'text-amber-600')}>
                  {a.rate}%
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-[#6B7A99] text-sm">暂无预警记录</div>
        )}
      </Card>
    </div>
  )
}
