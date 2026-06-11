import { ChevronDown, ChevronUp } from 'lucide-react'
import type { Order } from '@/store'

const statusColors: Record<string, string> = {
  pending: 'bg-navy-300',
  deposit_paid: 'bg-blue-400',
  in_production: 'bg-amber-400',
  quality_check: 'bg-purple-400',
  shipped: 'bg-teal-400',
  completed: 'bg-emerald-400',
  disputed: 'bg-red-400',
}

const statusLabels: Record<string, string> = {
  pending: '待付定金',
  deposit_paid: '定金已付',
  in_production: '生产中',
  quality_check: '质检中',
  shipped: '已发货',
  completed: '已完成',
  disputed: '争议中',
}

const depositLabels: Record<string, string> = {
  unpaid: '未支付',
  paid: '已支付',
  refunded: '已退款',
}

interface OrderRowProps {
  order: Order
  expanded: boolean
  onToggle: () => void
}

export default function OrderRow({ order, expanded, onToggle }: OrderRowProps) {
  return (
    <div className="border-b border-navy-50 last:border-0">
      <div className="flex items-center px-4 py-3 hover:bg-surface/50 cursor-pointer" onClick={onToggle}>
        <span className="w-32 text-sm text-navy-500">{order.id}</span>
        <span className="flex-1 text-sm font-medium text-navy-700">{order.title}</span>
        <span className="w-28 text-sm text-navy-500">{order.supplierId}</span>
        <span className="w-24 text-sm font-medium text-navy-700 text-right">¥{order.amount.toLocaleString()}</span>
        <span className="w-20 text-sm text-navy-500 text-center">{depositLabels[order.depositStatus]}</span>
        <span className="w-20 flex items-center gap-1.5 text-sm">
          <span className={`w-2 h-2 rounded-full ${statusColors[order.status]}`} />
          {statusLabels[order.status]}
        </span>
        <span className="w-8 text-navy-300">
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </span>
      </div>
      {expanded && <OrderDetail order={order} />}
    </div>
  )
}

function OrderDetail({ order }: { order: Order }) {
  const depositPercent = order.depositStatus === 'paid' ? 100 : order.depositStatus === 'refunded' ? 50 : 0

  return (
    <div className="px-6 py-4 bg-surface/30 border-t border-navy-50">
      <div className="grid grid-cols-2 gap-6">
        <div>
          <h4 className="text-xs font-medium text-navy-500 mb-3">物流跟踪</h4>
          {order.logistics.length === 0 ? (
            <p className="text-xs text-navy-300">暂无物流信息</p>
          ) : (
            <div className="relative pl-6">
              <div className="absolute left-2 top-1 bottom-1 w-px bg-navy-200" />
              {order.logistics.map((node, i) => (
                <div key={i} className="relative mb-3 last:mb-0">
                  <div className={`absolute -left-4 top-0.5 w-3 h-3 rounded-full border-2 ${
                    i === order.logistics.length - 1 ? 'border-teal-400 bg-teal-400' : 'border-navy-300 bg-white'
                  }`} />
                  <p className="text-xs font-medium text-navy-700">{node.status}</p>
                  <p className="text-[10px] text-navy-400">{node.timestamp} · {node.location}</p>
                  <p className="text-xs text-navy-500">{node.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
        <div>
          <h4 className="text-xs font-medium text-navy-500 mb-3">支付担保</h4>
          <div className="bg-white rounded-lg p-4 border border-navy-100">
            <div className="flex justify-between text-xs text-navy-400 mb-1">
              <span>订单金额</span>
              <span className="text-navy-700 font-medium">¥{order.amount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-xs text-navy-400 mb-1">
              <span>定金金额</span>
              <span className="text-navy-700 font-medium">¥{order.depositAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-xs text-navy-400 mb-2">
              <span>担保状态</span>
              <span className="text-teal-600 font-medium">{depositLabels[order.depositStatus]}</span>
            </div>
            <div className="h-2 bg-navy-100 rounded-full overflow-hidden">
              <div className="h-full bg-teal-400 rounded-full transition-all duration-500" style={{ width: `${depositPercent}%` }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
