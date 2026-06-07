import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { MapPin, Phone, User, Clock, CheckCircle, ArrowRight, AlertTriangle } from 'lucide-react'
import StatusBadge from '../../components/StatusBadge'
import { orders } from '../../api'

const statusSteps = ['pending', 'accepted', 'picking_up', 'delivering', 'completed']

const actionMap: Record<string, { label: string; color: string }> = {
  pending: { label: '接单', color: 'bg-primary hover:bg-primary/90' },
  accepted: { label: '已到达取件点', color: 'bg-blue-600 hover:bg-blue-700' },
  picking_up: { label: '已取件', color: 'bg-purple-600 hover:bg-purple-700' },
  delivering: { label: '已送达', color: 'bg-success hover:bg-success/90' },
}

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    loadOrder()
  }, [id])

  const loadOrder = async () => {
    try {
      const res: any = await orders.getOrder(id!)
      setOrder(res)
    } catch {
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async () => {
    if (!order) return
    setActionLoading(true)
    try {
      if (order.status === 'pending') await orders.acceptOrder(order.id)
      else if (order.status === 'accepted') await orders.pickupOrder(order.id)
      else if (order.status === 'picking_up') await orders.deliverOrder(order.id)
      else if (order.status === 'delivering') await orders.completeOrder(order.id)
      await loadOrder()
    } catch {
    } finally {
      setActionLoading(false)
    }
  }

  const handleAppeal = async () => {
    if (!order) return
    const reason = prompt('请输入申诉原因：')
    if (!reason) return
    try {
      await orders.appealOrder(order.id, { reason })
      await loadOrder()
    } catch {
    }
  }

  const getStepIndex = (status: string) => {
    const idx = statusSteps.indexOf(status)
    return idx >= 0 ? idx : -1
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!order) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-400">订单不存在</p>
        <button onClick={() => navigate('/rider/orders')} className="mt-4 text-primary hover:underline text-sm">
          返回订单列表
        </button>
      </div>
    )
  }

  const currentStep = getStepIndex(order.status)

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-secondary">订单详情</h1>
          <p className="text-sm text-gray-500 mt-1">{order.order_no}</p>
        </div>
        <StatusBadge status={order.status} />
      </div>

      {/* Status Timeline */}
      {order.status !== 'cancelled' && order.status !== 'appealing' && (
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            {statusSteps.map((step, idx) => (
              <div key={step} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      idx <= currentStep
                        ? 'bg-primary text-white'
                        : 'bg-gray-200 text-gray-400'
                    }`}
                  >
                    {idx <= currentStep ? <CheckCircle size={16} /> : idx + 1}
                  </div>
                  <span className={`text-xs mt-1 ${idx <= currentStep ? 'text-primary font-medium' : 'text-gray-400'}`}>
                    {['待接单', '已接单', '取件中', '配送中', '已完成'][idx]}
                  </span>
                </div>
                {idx < statusSteps.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 ${idx < currentStep ? 'bg-primary' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Address Info */}
      <div className="bg-white rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5">取</div>
          <div>
            <p className="text-sm text-gray-500">取件地址</p>
            <p className="font-medium text-secondary">{order.pickup_address}</p>
            {order.pickup_contact && <p className="text-sm text-gray-500 mt-1">联系人: {order.pickup_contact}</p>}
          </div>
        </div>
        <div className="border-l-2 border-dashed border-gray-200 ml-3 h-4" />
        <div className="flex items-start gap-3">
          <div className="w-6 h-6 bg-success rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5">送</div>
          <div>
            <p className="text-sm text-gray-500">配送地址</p>
            <p className="font-medium text-secondary">{order.delivery_address}</p>
            {order.delivery_contact && <p className="text-sm text-gray-500 mt-1">联系人: {order.delivery_contact}</p>}
          </div>
        </div>
      </div>

      {/* Order Info */}
      <div className="bg-white rounded-xl p-5 shadow-sm">
        <h3 className="font-display font-bold text-secondary mb-3">订单信息</h3>
        <div className="grid grid-cols-2 gap-y-3 text-sm">
          <div><span className="text-gray-500">订单编号</span><p className="font-medium text-secondary">{order.order_no}</p></div>
          <div><span className="text-gray-500">下单时间</span><p className="font-medium text-secondary">{order.created_at?.slice(0, 16) || '--'}</p></div>
          <div><span className="text-gray-500">配送距离</span><p className="font-medium text-secondary">{order.distance ? `${order.distance}km` : '--'}</p></div>
          <div><span className="text-gray-500">时效要求</span><p className="font-medium text-secondary">{order.time_sensitivity ? '急件' : '普通'}</p></div>
        </div>
      </div>

      {/* Pricing */}
      <div className="bg-white rounded-xl p-5 shadow-sm">
        <h3 className="font-display font-bold text-secondary mb-3">费用明细</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-gray-500">配送费</span><span className="font-medium">¥{order.total_price}</span></div>
          {order.commission != null && <div className="flex justify-between"><span className="text-gray-500">平台佣金</span><span className="font-medium text-danger">-¥{order.commission}</span></div>}
          {order.tax != null && <div className="flex justify-between"><span className="text-gray-500">税费</span><span className="font-medium text-danger">-¥{order.tax}</span></div>}
          <div className="flex justify-between pt-2 border-t border-gray-100">
            <span className="font-bold text-secondary">实际收入</span>
            <span className="text-lg font-bold text-primary">¥{order.net_amount || order.total_price}</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      {actionMap[order.status] && (
        <button
          onClick={handleAction}
          disabled={actionLoading}
          className={`w-full py-3 text-white font-medium rounded-xl transition-colors disabled:opacity-50 ${actionMap[order.status].color}`}
        >
          {actionLoading ? '处理中...' : actionMap[order.status].label}
        </button>
      )}

      {order.status === 'completed' && (
        <button
          onClick={handleAppeal}
          className="w-full py-3 bg-white border border-danger text-danger font-medium rounded-xl hover:bg-red-50 transition-colors"
        >
          申诉
        </button>
      )}
    </div>
  )
}
