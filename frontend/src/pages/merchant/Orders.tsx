import { useState } from 'react'
import { Clock, MapPin, Phone, User } from 'lucide-react'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Tag from '../../components/ui/Tag'
import { ORDER_STATUS, ORDER_CATEGORIES } from '../../constants'
import type { OrderStatus, OrderCategory } from '../../types'

interface MerchantOrder {
  id: string
  orderNo: string
  category: OrderCategory
  status: OrderStatus
  title: string
  customerName: string
  customerPhone: string
  address: string
  amount: number
  createdAt: string
}

type TabKey = 'all' | OrderStatus

const tabs: { key: TabKey; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'pending', label: '待接单' },
  { key: 'delivering', label: '进行中' },
  { key: 'completed', label: '已完成' },
  { key: 'cancelled', label: '已取消' },
]

const mockOrders: MerchantOrder[] = [
  { id: '1', orderNo: 'ORD20240101001', category: 'buy', status: 'pending', title: '招牌牛肉面x2', customerName: '张三', customerPhone: '138****1234', address: '朝阳区建国路88号', amount: 56, createdAt: '2024-01-15 12:30' },
  { id: '2', orderNo: 'ORD20240101002', category: 'send', status: 'accepted', title: '文件送达', customerName: '李四', customerPhone: '139****5678', address: '海淀区中关村大街1号', amount: 12, createdAt: '2024-01-15 11:20' },
  { id: '3', orderNo: 'ORD20240101003', category: 'fetch', status: 'delivering', title: '快递代取', customerName: '王五', customerPhone: '137****9012', address: '西城区金融街10号', amount: 5, createdAt: '2024-01-15 10:15' },
  { id: '4', orderNo: 'ORD20240101004', category: 'buy', status: 'completed', title: '酸辣粉x1', customerName: '赵六', customerPhone: '136****3456', address: '东城区王府井大街', amount: 18, createdAt: '2024-01-14 18:00' },
  { id: '5', orderNo: 'ORD20240101005', category: 'errand', status: 'cancelled', title: '排队代办', customerName: '孙七', customerPhone: '135****7890', address: '丰台区南三环', amount: 30, createdAt: '2024-01-14 15:30' },
  { id: '6', orderNo: 'ORD20240101006', category: 'buy', status: 'pending', title: '红烧排骨饭x1', customerName: '周八', customerPhone: '134****2345', address: '通州区新华大街', amount: 35, createdAt: '2024-01-15 13:00' },
]

const inProgressStatuses: OrderStatus[] = ['accepted', 'picked_up', 'delivering']

const statusColorMap: Record<string, 'blue' | 'yellow' | 'green' | 'gray' | 'red' | 'purple' | 'cyan'> = {
  pending: 'yellow',
  accepted: 'blue',
  picked_up: 'purple',
  delivering: 'cyan',
  completed: 'green',
  cancelled: 'gray',
  disputed: 'red',
}

const categoryMap = Object.fromEntries(ORDER_CATEGORIES.map((c) => [c.key, c.name]))

export default function Orders() {
  const [activeTab, setActiveTab] = useState<TabKey>('all')

  const filtered =
    activeTab === 'all'
      ? mockOrders
      : activeTab === 'delivering'
        ? mockOrders.filter((o) => inProgressStatuses.includes(o.status))
        : mockOrders.filter((o) => o.status === activeTab)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">商户订单</h1>

      <div className="flex items-center gap-2 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === tab.key
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filtered.length === 0 && (
          <div className="text-center py-16 text-gray-400">暂无订单</div>
        )}
        {filtered.map((order) => (
          <Card key={order.id}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-mono text-gray-400">{order.orderNo}</span>
                  <Tag color={statusColorMap[order.status]} size="sm">
                    {ORDER_STATUS[order.status].name}
                  </Tag>
                </div>
                <h3 className="font-semibold text-gray-900">{order.title}</h3>
              </div>
              <span className="text-lg font-bold text-gray-900">¥{order.amount}</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-sm text-gray-500 mb-3">
              <div className="flex items-center gap-1.5">
                <Tag color="blue" size="sm">{categoryMap[order.category]}</Tag>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>{order.createdAt}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" />
                <span>{order.customerName}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5" />
                <span>{order.customerPhone}</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-4">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{order.address}</span>
            </div>

            <div className="flex items-center gap-2 border-t border-gray-100 pt-3">
              {order.status === 'pending' && (
                <>
                  <Button size="sm" onClick={() => {}}>接单</Button>
                  <Button variant="danger" size="sm" onClick={() => {}}>拒绝</Button>
                </>
              )}
              {order.status === 'delivering' && (
                <Button size="sm" onClick={() => {}}>联系骑手</Button>
              )}
              {order.status === 'completed' && (
                <Button variant="secondary" size="sm" onClick={() => {}}>查看详情</Button>
              )}
              {order.status === 'cancelled' && (
                <Button variant="ghost" size="sm" onClick={() => {}}>查看原因</Button>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
