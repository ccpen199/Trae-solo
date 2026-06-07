import { useEffect, useState } from 'react'
import { BarChart3, TrendingUp, DollarSign, Users } from 'lucide-react'
import { api } from '@/utils/api'

interface Overview {
  online_riders: number
  pending_orders: number
  today_completed: number
  delivering_orders: number
  total_riders: number
  total_orders: number
}

interface Fulfillment {
  zone_id: number
  zone_name: string
  total_orders: number
  completed_orders: number
  fulfillment_rate: number
}

interface ROI {
  zone_id: number
  zone_name: string
  total_income: number
  completed_orders: number
  avg_income_per_order: number
  active_riders: number
  income_per_rider: number
}

interface TrendHour {
  hour: string
  count: number
}

interface Trends {
  orders_by_hour: TrendHour[]
  riders_by_hour: { hour: string; online_count: number }[]
}

function BarChart({ data, label, color }: { data: { label: string; value: number }[]; label: string; color: string }) {
  const maxVal = Math.max(...data.map((d) => d.value), 1)
  return (
    <div className="space-y-2">
      <div className="text-sm font-medium text-gray-700 mb-3">{label}</div>
      <div className="flex items-end gap-2 h-40">
        {data.map((d, i) => {
          const height = (d.value / maxVal) * 100
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-xs text-gray-500">{d.value}</span>
              <div
                className="w-full rounded-t-sm transition-all duration-300"
                style={{ height: `${height}%`, backgroundColor: color, minHeight: d.value > 0 ? '4px' : '0' }}
              />
              <span className="text-xs text-gray-400 truncate w-full text-center">{d.label}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function OpsDashboard() {
  const [overview, setOverview] = useState<Overview | null>(null)
  const [fulfillment, setFulfillment] = useState<Fulfillment[]>([])
  const [roi, setROI] = useState<ROI[]>([])
  const [trends, setTrends] = useState<Trends | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      api<Overview>('/api/dashboard/overview'),
      api<Fulfillment[]>('/api/dashboard/fulfillment'),
      api<ROI[]>('/api/dashboard/roi'),
      api<Trends>('/api/dashboard/trends'),
    ]).then(([ov, ff, roiRes, tr]) => {
      if (ov.success) setOverview(ov.data!)
      if (ff.success) setFulfillment(ff.data!)
      if (roiRes.success) setROI(roiRes.data!)
      if (tr.success) setTrends(tr.data!)
      setLoading(false)
    })
  }, [])

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400">加载中...</div>

  const supplyDemandData = fulfillment.map((f) => ({
    label: f.zone_name?.slice(0, 4) || '',
    value: f.total_orders,
  }))

  const riderData = roi.map((r) => ({
    label: r.zone_name?.slice(0, 4) || '',
    value: r.active_riders,
  }))

  const orderTrendData = (trends?.orders_by_hour || []).map((h) => ({
    label: `${h.hour}时`,
    value: h.count,
  }))

  const totalIncome = roi.reduce((s, r) => s + (r.total_income || 0), 0)
  const totalOrders = roi.reduce((s, r) => s + (r.completed_orders || 0), 0)
  const avgPerOrder = totalOrders > 0 ? totalIncome / totalOrders : 0

  return (
    <div className="space-y-6">
      <h1 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
        <BarChart3 size={20} className="text-primary" /> 运营看板
      </h1>

      <div className="grid grid-cols-4 gap-4">
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-500">总订单</div>
              <div className="text-2xl font-bold text-gray-900 mt-1">{overview?.total_orders ?? 0}</div>
            </div>
            <div className="bg-primary/10 p-3 rounded-lg"><TrendingUp size={20} className="text-primary" /></div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-500">总收入</div>
              <div className="text-2xl font-bold text-emerald-600 mt-1">¥{totalIncome.toFixed(0)}</div>
            </div>
            <div className="bg-emerald-50 p-3 rounded-lg"><DollarSign size={20} className="text-emerald-600" /></div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-500">客单收入</div>
              <div className="text-2xl font-bold text-orange-500 mt-1">¥{avgPerOrder.toFixed(2)}</div>
            </div>
            <div className="bg-orange-50 p-3 rounded-lg"><DollarSign size={20} className="text-orange-500" /></div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-500">在线骑手</div>
              <div className="text-2xl font-bold text-blue-600 mt-1">{overview?.online_riders ?? 0}</div>
            </div>
            <div className="bg-blue-50 p-3 rounded-lg"><Users size={20} className="text-blue-600" /></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="card p-5">
          <BarChart data={supplyDemandData} label="各区域订单量" color="#1E3A5F" />
        </div>
        <div className="card p-5">
          <BarChart data={riderData} label="各区域骑手数" color="#FF6B35" />
        </div>
      </div>

      {orderTrendData.length > 0 && (
        <div className="card p-5">
          <BarChart data={orderTrendData} label="24小时订单趋势" color="#10B981" />
        </div>
      )}

      <div className="grid grid-cols-2 gap-6">
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">各区域履约率</h3>
          </div>
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">区域</th>
                <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">总订单</th>
                <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">已完成</th>
                <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">履约率</th>
              </tr>
            </thead>
            <tbody>
              {fulfillment.map((f) => (
                <tr key={f.zone_id} className="border-b border-gray-50">
                  <td className="px-5 py-3 text-sm font-medium text-gray-900">{f.zone_name}</td>
                  <td className="px-5 py-3 text-sm text-gray-600">{f.total_orders}</td>
                  <td className="px-5 py-3 text-sm text-gray-600">{f.completed_orders}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${f.fulfillment_rate}%` }} />
                      </div>
                      <span className="text-sm font-medium text-emerald-600">{f.fulfillment_rate}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">各区域ROI</h3>
          </div>
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">区域</th>
                <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">总收入</th>
                <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">客单价</th>
                <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">人效</th>
              </tr>
            </thead>
            <tbody>
              {roi.map((r) => (
                <tr key={r.zone_id} className="border-b border-gray-50">
                  <td className="px-5 py-3 text-sm font-medium text-gray-900">{r.zone_name}</td>
                  <td className="px-5 py-3 text-sm text-primary font-medium">¥{r.total_income?.toFixed(2) || '0.00'}</td>
                  <td className="px-5 py-3 text-sm text-gray-600">¥{r.avg_income_per_order?.toFixed(2) || '0.00'}</td>
                  <td className="px-5 py-3 text-sm text-gray-600">¥{r.income_per_rider?.toFixed(2) || '0.00'}/人</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
