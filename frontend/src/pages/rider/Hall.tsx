import { useState, useMemo } from 'react'
import { ShoppingBag, Send, Package, ClipboardList, MapPin, ArrowRight, Weight, Zap } from 'lucide-react'
import { ORDER_CATEGORIES } from '../../constants'
import type { OrderCategory } from '../../types'
import Card from '../../components/ui/Card'
import Tag from '../../components/ui/Tag'
import Button from '../../components/ui/Button'
import Empty from '../../components/ui/Empty'

type CategoryFilter = 'all' | OrderCategory
type DistanceFilter = 'all' | '1km' | '3km' | '5km'

const categoryIcons: Record<OrderCategory, typeof ShoppingBag> = {
  buy: ShoppingBag,
  send: Send,
  fetch: Package,
  errand: ClipboardList,
}

const categoryColors: Record<OrderCategory, string> = {
  buy: 'bg-brand-100 text-brand-600',
  send: 'bg-amber-100 text-amber-600',
  fetch: 'bg-green-100 text-green-600',
  errand: 'bg-orange-100 text-orange-600',
}

interface HallOrder {
  id: string
  category: OrderCategory
  amount: number
  distance: number
  pickupAddress: string
  deliveryAddress: string
  weight: number
  urgent: boolean
  tip: number
}

const MOCK_ORDERS: HallOrder[] = [
  { id: '1', category: 'buy', amount: 28.5, distance: 1.2, pickupAddress: '万达广场星巴克', deliveryAddress: '阳光小区3栋', weight: 2, urgent: false, tip: 0 },
  { id: '2', category: 'send', amount: 35.0, distance: 3.5, pickupAddress: '科技园A座', deliveryAddress: '市民中心B区', weight: 1.5, urgent: true, tip: 5 },
  { id: '3', category: 'fetch', amount: 18.0, distance: 0.8, pickupAddress: '菜鸟驿站(南门店)', deliveryAddress: '和谐家园5栋', weight: 3, urgent: false, tip: 0 },
  { id: '4', category: 'errand', amount: 45.0, distance: 4.2, pickupAddress: '中山医院', deliveryAddress: '翠苑街道', weight: 0, urgent: true, tip: 10 },
  { id: '5', category: 'buy', amount: 52.0, distance: 2.1, pickupAddress: '沃尔玛(西城店)', deliveryAddress: '金色家园2期', weight: 5, urgent: false, tip: 3 },
  { id: '6', category: 'send', amount: 22.0, distance: 0.6, pickupAddress: '创业大厦12F', deliveryAddress: '对面咖啡厅', weight: 0.5, urgent: false, tip: 0 },
  { id: '7', category: 'fetch', amount: 15.5, distance: 1.8, pickupAddress: '顺丰速运(城西点)', deliveryAddress: '文三路盈润科技', weight: 2.5, urgent: false, tip: 2 },
  { id: '8', category: 'errand', amount: 60.0, distance: 5.0, pickupAddress: '火车站北广场', deliveryAddress: '西湖区政务中心', weight: 0, urgent: true, tip: 8 },
]

const CATEGORY_OPTIONS: { key: CategoryFilter; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'buy', label: '买' },
  { key: 'send', label: '送' },
  { key: 'fetch', label: '取' },
  { key: 'errand', label: '办' },
]

const DISTANCE_OPTIONS: { key: DistanceFilter; label: string }[] = [
  { key: '1km', label: '<1km' },
  { key: '3km', label: '<3km' },
  { key: '5km', label: '<5km' },
  { key: 'all', label: '全部' },
]

function filterByDistance(distance: number, filter: DistanceFilter): boolean {
  if (filter === 'all') return true
  const max = parseFloat(filter)
  return distance <= max
}

export default function RiderHall() {
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all')
  const [distanceFilter, setDistanceFilter] = useState<DistanceFilter>('all')
  const [grabbingId, setGrabbingId] = useState<string | null>(null)

  const filteredOrders = useMemo(() => {
    return MOCK_ORDERS.filter((o) => {
      const catMatch = categoryFilter === 'all' || o.category === categoryFilter
      const distMatch = filterByDistance(o.distance, distanceFilter)
      return catMatch && distMatch
    })
  }, [categoryFilter, distanceFilter])

  function getCategoryName(category: OrderCategory): string {
    return ORDER_CATEGORIES.find((c) => c.key === category)?.name ?? ''
  }

  function handleGrab(id: string) {
    setGrabbingId(id)
    setTimeout(() => setGrabbingId(null), 1500)
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">抢单大厅</h1>
        <Tag color="green" size="sm">{filteredOrders.length} 单可抢</Tag>
      </div>

      <Card padded={false} className="!p-3">
        <div className="space-y-2.5">
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
            {CATEGORY_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                onClick={() => setCategoryFilter(opt.key)}
                className={`
                  px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all
                  ${categoryFilter === opt.key
                    ? 'bg-brand-500 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }
                `}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
            {DISTANCE_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                onClick={() => setDistanceFilter(opt.key)}
                className={`
                  px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all
                  ${distanceFilter === opt.key
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }
                `}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {filteredOrders.length === 0 ? (
        <Empty
          type="orders"
          title="暂无可抢订单"
          description="换个筛选条件试试，或稍后再来"
        />
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((order) => {
            const Icon = categoryIcons[order.category]
            const iconColorClass = categoryColors[order.category]
            return (
              <Card key={order.id} hover>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${iconColorClass}`}>
                      <Icon className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 text-sm">{getCategoryName(order.category)}</div>
                      <div className="text-xs text-gray-400">{order.distance}km</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-amber-600">¥{order.amount.toFixed(0)}</div>
                  </div>
                </div>

                <div className="space-y-1.5 mb-3">
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-brand-500 mt-1.5 flex-shrink-0" />
                    <span className="text-sm text-gray-600 line-clamp-1">{order.pickupAddress}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ArrowRight className="w-3 h-3 text-gray-300 ml-0.5" />
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
                    <span className="text-sm text-gray-600 line-clamp-1">{order.deliveryAddress}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 mb-3">
                  {order.weight > 0 && (
                    <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                      <Weight className="w-3 h-3" />
                      {order.weight}kg
                    </span>
                  )}
                  {order.urgent && <Tag color="red" size="sm">加急</Tag>}
                  {order.tip > 0 && <Tag color="orange" size="sm">小费¥{order.tip}</Tag>}
                </div>

                <Button
                  variant="primary"
                  fullWidth
                  size="md"
                  loading={grabbingId === order.id}
                  icon={<Zap className="w-4 h-4" />}
                  className="!bg-gradient-to-r !from-amber-400 !to-amber-500 hover:!from-amber-500 hover:!to-amber-600 !shadow-lg !shadow-amber-500/25"
                  onClick={() => handleGrab(order.id)}
                >
                  立即抢单
                </Button>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
