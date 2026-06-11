import { useStore } from '@/store'
import MetricCard from '@/components/MetricCard'
import Card from '@/components/Card'
import PageHeader from '@/components/PageHeader'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts'
import { ScanLine, CheckCircle, XCircle, RotateCcw } from 'lucide-react'
import { useMemo } from 'react'

const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b']

export default function VerifyOverview() {
  const { verifyRecords } = useStore()

  const total = verifyRecords.length
  const successCount = verifyRecords.filter((r) => r.status === 'success').length
  const failedCount = verifyRecords.filter((r) => r.status === 'failed').length
  const totalAmount = verifyRecords.reduce((s, r) => s + r.amount, 0)

  const dailyTrend = useMemo(() => {
    const map = new Map<string, { date: string; count: number }>()
    verifyRecords.forEach((r) => {
      const day = r.verifyTime.slice(0, 10)
      const item = map.get(day) || { date: day, count: 0 }
      item.count += 1
      map.set(day, item)
    })
    return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date))
  }, [verifyRecords])

  const terminalDist = useMemo(() => {
    const counts: Record<string, number> = { 'POS机具': 0, '小程序码': 0, '城市码': 0 }
    verifyRecords.forEach((r) => { counts[r.terminal] = (counts[r.terminal] || 0) + 1 })
    return Object.entries(counts).map(([name, value]) => ({ name, value }))
  }, [verifyRecords])

  return (
    <div>
      <PageHeader title="核销概览" description="核销数据总览与趋势分析" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <MetricCard label="总核销笔数" value={total} icon={<ScanLine className="w-5 h-5" />} gradient="from-blue-500 to-blue-400" />
        <MetricCard label="成功笔数" value={successCount} icon={<CheckCircle className="w-5 h-5" />} gradient="from-emerald-500 to-emerald-400" />
        <MetricCard label="失败笔数" value={failedCount} icon={<XCircle className="w-5 h-5" />} gradient="from-red-500 to-red-400" />
        <MetricCard label="核销金额" value={`¥${totalAmount.toLocaleString()}`} suffix="元" icon={<RotateCcw className="w-5 h-5" />} gradient="from-amber-500 to-amber-400" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <h3 className="text-sm font-semibold text-primary mb-4">每日核销趋势</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={dailyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#9ca3af" />
              <YAxis tick={{ fontSize: 12 }} stroke="#9ca3af" />
              <Tooltip />
              <Line type="monotone" dataKey="count" name="核销笔数" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <h3 className="text-sm font-semibold text-primary mb-4">终端类型分布</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={terminalDist} dataKey="value" nameKey="name" cx="50%" cy="45%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {terminalDist.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  )
}
