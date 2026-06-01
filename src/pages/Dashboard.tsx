import { useEffect, useState } from 'react'
import { Truck, ShoppingCart, Clock, AlertTriangle } from 'lucide-react'
import { api } from '@/utils/api'

interface Supplier { id: number }
interface Procurement { id: number; supplier_name: string; material_name: string; quantity: number; unit: string; price: number; arrival_time: string; status: string; batch_no: string }
interface NearExpiryItem { id: number; material_name: string; batch_no: string; expiry_date: string }
interface AnomalyStats { by_type: { type: string; count: number }[]; by_status: { status: string; count: number }[] }

const statCards = [
  { key: 'supplierCount', label: '供应商总数', icon: Truck, color: 'bg-blue-500' },
  { key: 'todayProcurementCount', label: '今日采购', icon: ShoppingCart, color: 'bg-green-500' },
  { key: 'nearExpiryCount', label: '临期食材', icon: Clock, color: 'bg-yellow-500' },
  { key: 'pendingAnomalyCount', label: '待处理异常', icon: AlertTriangle, color: 'bg-red-500' },
]

export default function Dashboard() {
  const [stats, setStats] = useState<Record<string, number>>({
    supplierCount: 0,
    todayProcurementCount: 0,
    nearExpiryCount: 0,
    pendingAnomalyCount: 0,
  })
  const [procurements, setProcurements] = useState<Procurement[]>([])
  const [nearExpiry, setNearExpiry] = useState<NearExpiryItem[]>([])

  useEffect(() => {
    api.get<Supplier[]>('/api/suppliers').then((r) => {
      setStats((s) => ({ ...s, supplierCount: r.length }))
    }).catch(() => {})

    api.get<Procurement[]>('/api/procurements').then((r) => {
      setStats((s) => ({ ...s, todayProcurementCount: r.length }))
      setProcurements(r.slice(0, 5))
    }).catch(() => {})

    api.get<NearExpiryItem[]>('/api/inventories/alerts/near-expiry').then((r) => {
      setStats((s) => ({ ...s, nearExpiryCount: r.length }))
      setNearExpiry(r)
    }).catch(() => {})

    api.get<AnomalyStats>('/api/anomalies/stats').then((r) => {
      const openCount = r.by_status.find((s) => s.status === 'open')?.count || 0
      const processingCount = r.by_status.find((s) => s.status === 'processing')?.count || 0
      setStats((s) => ({ ...s, pendingAnomalyCount: openCount + processingCount }))
    }).catch(() => {})
  }, [])

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-800">首页概览</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map(({ key, label, icon: Icon, color }) => (
          <div key={key} className="flex items-center gap-4 rounded-xl bg-white p-5 shadow-sm">
            <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${color}`}>
              <Icon className="text-white" size={22} />
            </div>
            <div>
              <p className="text-sm text-gray-500">{label}</p>
              <p className="text-2xl font-bold text-gray-800">{stats[key]}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-gray-800">近期采购记录</h2>
          {procurements.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-400">暂无数据</p>
          ) : (
            <div className="space-y-3">
              {procurements.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between rounded-lg border border-gray-100 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-700">{p.material_name}</p>
                    <p className="text-xs text-gray-400">
                      {p.supplier_name} · {p.arrival_time?.slice(0, 10)}
                    </p>
                  </div>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    p.status === 'verified' ? 'bg-green-50 text-green-600' :
                    p.status === 'pending' ? 'bg-yellow-50 text-yellow-600' :
                    'bg-red-50 text-red-600'
                  }`}>
                    {p.status === 'verified' ? '已验收' : p.status === 'pending' ? '待验收' : '已驳回'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-gray-800">临期食材预警</h2>
          {nearExpiry.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-400">暂无临期食材</p>
          ) : (
            <div className="space-y-3">
              {nearExpiry.slice(0, 5).map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-lg border border-amber-100 bg-amber-50/50 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-700">{item.material_name}</p>
                    <p className="text-xs text-gray-400">
                      批次 {item.batch_no} · 到期 {item.expiry_date}
                    </p>
                  </div>
                  <span className="rounded-full bg-orange-50 px-2.5 py-0.5 text-xs font-medium text-orange-600">
                    临期
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {stats.pendingAnomalyCount > 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
          <AlertTriangle className="text-red-500" size={20} />
          <span className="text-sm font-medium text-red-700">
            当前有 {stats.pendingAnomalyCount} 条待处理异常，请及时处理
          </span>
        </div>
      )}
    </div>
  )
}
