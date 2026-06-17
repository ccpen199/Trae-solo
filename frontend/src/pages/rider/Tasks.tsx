import { useState } from 'react'
import { Navigation, Phone, ArrowRight, Star } from 'lucide-react'
import { ORDER_STATUS } from '../../constants'
import type { OrderStatus } from '../../types'
import Card from '../../components/ui/Card'
import Tag from '../../components/ui/Tag'
import Button from '../../components/ui/Button'

type TaskTab = 'pickup' | 'delivering' | 'completed'

interface PickupOrder {
  id: string
  orderNo: string
  status: OrderStatus
  pickupAddress: string
  deliveryAddress: string
  pickupPhone: string
}

interface DeliveringOrder {
  id: string
  orderNo: string
  status: OrderStatus
  pickupAddress: string
  deliveryAddress: string
  deliveryPhone: string
}

interface CompletedOrder {
  id: string
  orderNo: string
  amount: number
  completedAt: string
  rating: number
}

const PICKUP_ORDERS: PickupOrder[] = [
  { id: '1', orderNo: 'PT20260617001', status: 'accepted', pickupAddress: '万达广场1楼星巴克', deliveryAddress: '阳光小区3栋502', pickupPhone: '13800001111' },
  { id: '2', orderNo: 'PT20260617002', status: 'accepted', pickupAddress: '沃尔玛(西城店)', deliveryAddress: '金色家园2期6栋', pickupPhone: '13800002222' },
]

const DELIVERING_ORDERS: DeliveringOrder[] = [
  { id: '3', orderNo: 'PT20260617003', status: 'delivering', pickupAddress: '科技园A座前台', deliveryAddress: '市民中心B区3号门', deliveryPhone: '13800003333' },
  { id: '4', orderNo: 'PT20260617004', status: 'delivering', pickupAddress: '菜鸟驿站(南门店)', deliveryAddress: '和谐家园5栋1单元', deliveryPhone: '13800004444' },
]

const COMPLETED_ORDERS: CompletedOrder[] = [
  { id: '5', orderNo: 'PT20260616001', amount: 28.5, completedAt: '2026-06-16 18:32', rating: 5 },
  { id: '6', orderNo: 'PT20260616002', amount: 35.0, completedAt: '2026-06-16 14:10', rating: 4 },
]

const TABS: { key: TaskTab; label: string; count: number }[] = [
  { key: 'pickup', label: '待取件', count: PICKUP_ORDERS.length },
  { key: 'delivering', label: '配送中', count: DELIVERING_ORDERS.length },
  { key: 'completed', label: '已完成', count: COMPLETED_ORDERS.length },
]

const statusTagColor: Record<OrderStatus, 'blue' | 'cyan' | 'green' | 'yellow' | 'gray' | 'red' | 'purple'> = {
  pending: 'yellow',
  accepted: 'blue',
  picked_up: 'purple',
  delivering: 'cyan',
  completed: 'green',
  cancelled: 'gray',
  disputed: 'red',
}

export default function RiderTasks() {
  const [activeTab, setActiveTab] = useState<TaskTab>('pickup')
  const [confirmingId, setConfirmingId] = useState<string | null>(null)

  function handleConfirm(id: string) {
    setConfirmingId(id)
    setTimeout(() => setConfirmingId(null), 1500)
  }

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold text-gray-900">我的任务</h1>

      <div className="flex gap-2 bg-gray-100 p-1 rounded-xl">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`
              flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-medium transition-all
              ${activeTab === tab.key
                ? 'bg-white text-brand-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
              }
            `}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className={`
                min-w-[18px] h-[18px] rounded-full text-xs flex items-center justify-center px-1
                ${activeTab === tab.key ? 'bg-brand-500 text-white' : 'bg-gray-300 text-white'}
              `}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {activeTab === 'pickup' && (
        <div className="space-y-3">
          {PICKUP_ORDERS.map((order) => (
            <Card key={order.id}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-mono text-gray-500">{order.orderNo}</span>
                <Tag color={statusTagColor[order.status]} size="sm">
                  {ORDER_STATUS[order.status].name}
                </Tag>
              </div>
              <div className="space-y-1.5 mb-4">
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-brand-500 mt-1.5 flex-shrink-0" />
                  <span className="text-sm text-gray-600 line-clamp-1">{order.pickupAddress}</span>
                </div>
                <ArrowRight className="w-3 h-3 text-gray-300 ml-0.5" />
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
                  <span className="text-sm text-gray-600 line-clamp-1">{order.deliveryAddress}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" icon={<Navigation className="w-3.5 h-3.5" />}>
                  导航
                </Button>
                <Button variant="secondary" size="sm" icon={<Phone className="w-3.5 h-3.5" />}>
                  联系
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  fullWidth
                  loading={confirmingId === order.id}
                  className="!bg-gradient-to-r !from-amber-400 !to-amber-500 hover:!from-amber-500 hover:!to-amber-600 !shadow-md !shadow-amber-500/20"
                  onClick={() => handleConfirm(order.id)}
                >
                  确认取件
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {activeTab === 'delivering' && (
        <div className="space-y-3">
          {DELIVERING_ORDERS.map((order) => (
            <Card key={order.id}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-mono text-gray-500">{order.orderNo}</span>
                <Tag color={statusTagColor[order.status]} size="sm">
                  {ORDER_STATUS[order.status].name}
                </Tag>
              </div>
              <div className="space-y-1.5 mb-4">
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-brand-500 mt-1.5 flex-shrink-0" />
                  <span className="text-sm text-gray-600 line-clamp-1">{order.pickupAddress}</span>
                </div>
                <ArrowRight className="w-3 h-3 text-gray-300 ml-0.5" />
                <div className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
                  <span className="text-sm text-gray-600 line-clamp-1">{order.deliveryAddress}</span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" icon={<Navigation className="w-3.5 h-3.5" />}>
                  导航
                </Button>
                <Button variant="secondary" size="sm" icon={<Phone className="w-3.5 h-3.5" />}>
                  联系
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  fullWidth
                  loading={confirmingId === order.id}
                  className="!bg-gradient-to-r !from-brand-500 !to-brand-600 hover:!from-brand-600 hover:!to-brand-700 !shadow-md !shadow-brand-500/20"
                  onClick={() => handleConfirm(order.id)}
                >
                  确认送达
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {activeTab === 'completed' && (
        <div className="space-y-3">
          {COMPLETED_ORDERS.map((order) => (
            <Card key={order.id}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-mono text-gray-500 mb-1">{order.orderNo}</div>
                  <div className="text-xs text-gray-400">{order.completedAt}</div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-amber-600">¥{order.amount.toFixed(1)}</div>
                  <div className="flex items-center gap-0.5 justify-end mt-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3 h-3 ${i < order.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
