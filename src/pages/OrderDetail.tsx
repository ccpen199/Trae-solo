import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Package, User, Zap, Repeat, Hand } from 'lucide-react'
import { api } from '@/utils/api'
import { useAppStore } from '@/stores/appStore'

interface Order {
  id: number
  order_no: string
  type: string
  merchant_name: string
  merchant_address: string
  pickup_address: string
  pickup_time_start: string
  pickup_time_end: string
  delivery_address: string
  delivery_time_start: string
  delivery_time_end: string
  cargo_type: string
  special_requirements: string
  status: string
  rider_name: string | null
  rider_phone: string | null
  rider_id: number | null
  zone_name: string
  created_at: string
  updated_at: string
}

interface DispatchCandidate {
  rider_id: number
  rider_name: string
  score: number
  distance_score: number
  timeliness_score: number
  load_score: number
  fulfillment_score: number
}

const statusMap: Record<string, { label: string; cls: string }> = {
  pending: { label: '待调度', cls: 'badge-pending' },
  dispatched: { label: '已派单', cls: 'badge-dispatched' },
  picking_up: { label: '取餐中', cls: 'badge-picking_up' },
  delivering: { label: '配送中', cls: 'badge-delivering' },
  completed: { label: '已完成', cls: 'badge-completed' },
  cancelled: { label: '已取消', cls: 'badge-cancelled' },
}

const typeMap: Record<string, string> = { instant: '即时单', scheduled: '预约单', batch: '批量单' }

const statusTimeline = ['pending', 'dispatched', 'picking_up', 'delivering', 'completed']

function StatusTimeline({ currentStatus }: { currentStatus: string }) {
  const currentIdx = statusTimeline.indexOf(currentStatus)
  return (
    <div className="flex items-start gap-4 py-2">
      {statusTimeline.map((status, idx) => {
        const s = statusMap[status]
        const isActive = idx <= currentIdx && currentStatus !== 'cancelled'
        const isCurrent = idx === currentIdx
        return (
          <div key={status} className="flex items-center gap-2 flex-1">
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                isActive ? 'bg-primary text-white' : 'bg-gray-200 text-gray-400'
              } ${isCurrent ? 'ring-2 ring-primary/30 ring-offset-2' : ''}`}>
                {idx + 1}
              </div>
              <span className={`text-xs mt-1 ${isActive ? 'text-primary font-medium' : 'text-gray-400'}`}>
                {s.label}
              </span>
            </div>
            {idx < statusTimeline.length - 1 && (
              <div className={`flex-1 h-0.5 mt-4 ${idx < currentIdx && currentStatus !== 'cancelled' ? 'bg-primary' : 'bg-gray-200'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

export default function OrderDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const addToast = useAppStore((s) => s.addToast)
  const [order, setOrder] = useState<Order | null>(null)
  const [candidates, setCandidates] = useState<DispatchCandidate[]>([])
  const [loading, setLoading] = useState(true)
  const [dispatching, setDispatching] = useState(false)
  const [grabRiderId, setGrabRiderId] = useState('')
  const [transferRiderId, setTransferRiderId] = useState('')

  useEffect(() => {
    if (!id) return
    setLoading(true)
    api<Order>(`/api/orders/${id}`).then((r) => {
      if (r.success) setOrder(r.data!)
      setLoading(false)
    })
  }, [id])

  async function handleSmartDispatch() {
    if (!id) return
    setDispatching(true)
    const res = await api<{ order_id: number; candidates: DispatchCandidate[] }>(`/api/orders/${id}/dispatch`, {
      method: 'POST',
    })
    setDispatching(false)
    if (res.success) {
      setCandidates(res.data!.candidates)
      addToast('智能调度完成', 'success')
    } else {
      addToast(res.error || '调度失败', 'error')
    }
  }

  async function handleGrab() {
    if (!id || !grabRiderId) {
      addToast('请输入骑手ID', 'error')
      return
    }
    const res = await api(`/api/orders/${id}/grab`, {
      method: 'POST',
      body: JSON.stringify({ rider_id: Number(grabRiderId) }),
    })
    if (res.success) {
      addToast('抢单成功', 'success')
      setOrder((prev) => prev ? { ...prev, status: 'dispatched', rider_id: Number(grabRiderId) } : prev)
      setGrabRiderId('')
    } else {
      addToast(res.error || '抢单失败', 'error')
    }
  }

  async function handleTransfer() {
    if (!id || !transferRiderId || !order?.rider_id) {
      addToast('请输入目标骑手ID', 'error')
      return
    }
    const res = await api(`/api/orders/${id}/transfer`, {
      method: 'POST',
      body: JSON.stringify({ from_rider_id: order.rider_id, to_rider_id: Number(transferRiderId) }),
    })
    if (res.success) {
      addToast('转单成功', 'success')
      setOrder((prev) => prev ? { ...prev, rider_id: Number(transferRiderId) } : prev)
      setTransferRiderId('')
      const refreshed = await api<Order>(`/api/orders/${id}`)
      if (refreshed.success) setOrder(refreshed.data!)
    } else {
      addToast(res.error || '转单失败', 'error')
    }
  }

  async function handleStatusUpdate(status: string) {
    if (!id) return
    const res = await api(`/api/orders/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    })
    if (res.success) {
      addToast('状态更新成功', 'success')
      setOrder((prev) => prev ? { ...prev, status } : prev)
    } else {
      addToast(res.error || '更新失败', 'error')
    }
  }

  if (loading) return <div className="flex items-center justify-center h-64 text-gray-400">加载中...</div>
  if (!order) return <div className="text-center py-10 text-gray-400">订单不存在</div>

  const s = statusMap[order.status] || { label: order.status, cls: 'badge-pending' }
  const canTransfer = ['dispatched', 'picking_up', 'delivering'].includes(order.status) && order.rider_id

  return (
    <div className="space-y-6">
      <button onClick={() => navigate('/orders')} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft size={16} /> 返回订单列表
      </button>

      <div className="card p-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold text-gray-900">{order.order_no}</h2>
              <span className={s.cls}>{s.label}</span>
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{typeMap[order.type] || order.type}</span>
            </div>
            <div className="text-sm text-gray-500 mt-1">创建时间: {order.created_at?.slice(0, 19)} · 区域: {order.zone_name || '-'}</div>
          </div>
          {order.status === 'pending' && (
            <button onClick={handleSmartDispatch} disabled={dispatching} className="btn-accent flex items-center gap-1">
              <Zap size={14} /> {dispatching ? '调度中...' : '智能调度'}
            </button>
          )}
        </div>

        <div className="mt-6">
          <StatusTimeline currentStatus={order.status} />
        </div>

        <div className="grid grid-cols-2 gap-6 mt-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <Package size={14} className="text-orange-500" />
              <span className="text-gray-500">取货:</span>
              <span className="text-gray-800">{order.pickup_address}</span>
            </div>
            {order.pickup_time_start && (
              <div className="text-xs text-gray-400 pl-6">{order.pickup_time_start} ~ {order.pickup_time_end}</div>
            )}
            <div className="flex items-center gap-2 text-sm">
              <Package size={14} className="text-emerald-500" />
              <span className="text-gray-500">送达:</span>
              <span className="text-gray-800">{order.delivery_address}</span>
            </div>
            {order.delivery_time_start && (
              <div className="text-xs text-gray-400 pl-6">{order.delivery_time_start} ~ {order.delivery_time_end}</div>
            )}
          </div>
          <div className="space-y-2 text-sm">
            <div><span className="text-gray-500">商户:</span> <span className="text-gray-800">{order.merchant_name}</span></div>
            <div><span className="text-gray-500">货物类型:</span> <span className="text-gray-800">{order.cargo_type}</span></div>
            {order.special_requirements && (
              <div><span className="text-gray-500">特殊要求:</span> <span className="text-gray-800">{order.special_requirements}</span></div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
            <User size={16} className="text-primary" /> 骑手信息
          </h3>
          {order.rider_name ? (
            <div className="space-y-2 text-sm">
              <div><span className="text-gray-500">姓名:</span> {order.rider_name}</div>
              <div><span className="text-gray-500">手机:</span> {order.rider_phone}</div>
            </div>
          ) : (
            <div className="text-gray-400 text-sm">暂未分配骑手</div>
          )}
        </div>

        <div className="card p-6">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
            <Hand size={16} className="text-accent" /> 快捷操作
          </h3>
          <div className="space-y-3">
            {(order.status === 'pending' || order.status === 'dispatched') && (
              <div className="flex items-center gap-2">
                <input
                  className="input-base flex-1"
                  placeholder="输入骑手ID抢单"
                  value={grabRiderId}
                  onChange={(e) => setGrabRiderId(e.target.value)}
                />
                <button onClick={handleGrab} className="btn-primary text-xs">抢单</button>
              </div>
            )}
            {canTransfer && (
              <div className="flex items-center gap-2">
                <input
                  className="input-base flex-1"
                  placeholder="输入目标骑手ID转单"
                  value={transferRiderId}
                  onChange={(e) => setTransferRiderId(e.target.value)}
                />
                <button onClick={handleTransfer} className="btn-outline text-xs flex items-center gap-1">
                  <Repeat size={12} /> 转单
                </button>
              </div>
            )}
            {order.status === 'dispatched' && (
              <button onClick={() => handleStatusUpdate('picking_up')} className="btn-outline w-full text-xs">更新为取餐中</button>
            )}
            {order.status === 'picking_up' && (
              <button onClick={() => handleStatusUpdate('delivering')} className="btn-outline w-full text-xs">更新为配送中</button>
            )}
            {order.status === 'delivering' && (
              <button onClick={() => handleStatusUpdate('completed')} className="btn-primary text-xs w-full">确认完成</button>
            )}
          </div>
        </div>
      </div>

      {candidates.length > 0 && (
        <div className="card p-6">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
            <Zap size={16} className="text-accent" /> 调度候选结果 (Top 5)
          </h3>
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-xs font-medium text-gray-500 py-2">排名</th>
                <th className="text-left text-xs font-medium text-gray-500 py-2">骑手</th>
                <th className="text-left text-xs font-medium text-gray-500 py-2">综合评分</th>
                <th className="text-left text-xs font-medium text-gray-500 py-2">距离</th>
                <th className="text-left text-xs font-medium text-gray-500 py-2">时效</th>
                <th className="text-left text-xs font-medium text-gray-500 py-2">负载</th>
                <th className="text-left text-xs font-medium text-gray-500 py-2">履约</th>
              </tr>
            </thead>
            <tbody>
              {candidates.map((c, idx) => (
                <tr key={c.rider_id} className="border-b border-gray-50">
                  <td className="py-2.5 text-sm font-medium">{idx + 1}</td>
                  <td className="py-2.5 text-sm">{c.rider_name}</td>
                  <td className="py-2.5 text-sm font-bold text-primary">{c.score}</td>
                  <td className="py-2.5 text-sm text-gray-600">{c.distance_score}</td>
                  <td className="py-2.5 text-sm text-gray-600">{c.timeliness_score}</td>
                  <td className="py-2.5 text-sm text-gray-600">{c.load_score}</td>
                  <td className="py-2.5 text-sm text-gray-600">{c.fulfillment_score}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
