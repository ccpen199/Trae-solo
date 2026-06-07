import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Store, ShieldCheck, Package } from 'lucide-react'
import { api } from '@/utils/api'
import { useAppStore } from '@/stores/appStore'

interface Merchant {
  id: number
  name: string
  contact_name: string
  phone: string
  address: string
  verify_status: string
  fulfillment_score: number
  zone_name: string
  created_at: string
}

interface Order {
  id: number
  order_no: string
  type: string
  status: string
  rider_name: string | null
  created_at: string
}

const verifyMap: Record<string, { label: string; cls: string }> = {
  approved: { label: '已认证', cls: 'bg-emerald-100 text-emerald-700' },
  pending: { label: '待审核', cls: 'bg-yellow-100 text-yellow-700' },
  rejected: { label: '已拒绝', cls: 'bg-red-100 text-red-700' },
}

const statusMap: Record<string, { label: string; cls: string }> = {
  pending: { label: '待调度', cls: 'badge-pending' },
  dispatched: { label: '已派单', cls: 'badge-dispatched' },
  picking_up: { label: '取餐中', cls: 'badge-picking_up' },
  delivering: { label: '配送中', cls: 'badge-delivering' },
  completed: { label: '已完成', cls: 'badge-completed' },
  cancelled: { label: '已取消', cls: 'badge-cancelled' },
}

export default function MerchantDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const addToast = useAppStore((s) => s.addToast)
  const [merchant, setMerchant] = useState<Merchant | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    api<Merchant>(`/api/merchants/${id}`).then((r) => {
      if (r.success) setMerchant(r.data!)
      setLoading(false)
    })
    api<{ list: Order[] }>(`/api/orders?merchant_id=${id}&page_size=10`).then((r) => {
      if (r.success) setOrders(r.data!.list)
    })
  }, [id])

  async function handleVerify(status: string) {
    const res = await api(`/api/merchants/${id}/verify`, {
      method: 'PUT',
      body: JSON.stringify({ verify_status: status }),
    })
    if (res.success) {
      addToast('审核成功', 'success')
      setMerchant((prev) => (prev ? { ...prev, verify_status: status } : prev))
    } else {
      addToast(res.error || '审核失败', 'error')
    }
  }

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400">加载中...</div>
  if (!merchant) return <div className="text-center py-10 text-gray-400">商户不存在</div>

  const v = verifyMap[merchant.verify_status] || { label: merchant.verify_status, cls: 'bg-gray-100 text-gray-600' }

  return (
    <div className="space-y-6">
      <button onClick={() => navigate('/merchants')} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft size={16} /> 返回商户列表
      </button>

      <div className="card p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
              <Store size={24} className="text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{merchant.name}</h2>
              <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                <span>{merchant.contact_name}</span>
                <span>·</span>
                <span>{merchant.phone}</span>
                <span>·</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${v.cls}`}>{v.label}</span>
              </div>
            </div>
          </div>
          {merchant.verify_status === 'pending' && (
            <div className="flex gap-2">
              <button onClick={() => handleVerify('approved')} className="btn-primary text-xs px-3 py-1.5">通过</button>
              <button onClick={() => handleVerify('rejected')} className="btn-danger text-xs px-3 py-1.5">拒绝</button>
            </div>
          )}
        </div>
        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-xs text-gray-500">地址</div>
            <div className="text-sm font-medium mt-1 text-gray-700">{merchant.address}</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-xs text-gray-500">所属区域</div>
            <div className="text-sm font-medium mt-1">{merchant.zone_name || '-'}</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-xs text-gray-500">履约评分</div>
            <div className="text-xl font-bold text-primary mt-1">{merchant.fulfillment_score || '-'}</div>
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
          <Package size={16} className="text-primary" />
          <h3 className="font-semibold text-gray-900">最近订单</h3>
        </div>
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">订单号</th>
              <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">类型</th>
              <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">状态</th>
              <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">骑手</th>
              <th className="text-left text-xs font-medium text-gray-500 px-5 py-3">创建时间</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-8 text-gray-400">暂无订单</td></tr>
            ) : (
              orders.map((o) => {
                const s = statusMap[o.status] || { label: o.status, cls: 'badge-pending' }
                return (
                  <tr key={o.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="px-5 py-3 text-sm font-medium text-primary cursor-pointer" onClick={() => navigate(`/orders/${o.id}`)}>{o.order_no}</td>
                    <td className="px-5 py-3 text-sm text-gray-600">{o.type === 'instant' ? '即时单' : o.type === 'scheduled' ? '预约单' : '批量单'}</td>
                    <td className="px-5 py-3"><span className={s.cls}>{s.label}</span></td>
                    <td className="px-5 py-3 text-sm text-gray-600">{o.rider_name || '-'}</td>
                    <td className="px-5 py-3 text-xs text-gray-400">{o.created_at?.slice(0, 16)}</td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
