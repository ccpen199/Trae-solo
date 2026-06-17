import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  Filter,
  Users,
  Truck,
  Home,
  MapPin,
  Clock,
  ChevronRight,
  Star,
  XCircle,
  MessageSquare,
  RefreshCw,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Tag from '../../components/ui/Tag'
import Empty from '../../components/ui/Empty'
import { getOrders } from '../../services/employer.api'
import { getOrderStatus, ORDER_STATUS } from '../../constants'

type OrderType = 'all' | 'labor' | 'vehicle' | 'moving'
type OrderStatusFilter = 'all' | 'pending' | 'assigned' | 'in_service' | 'confirming' | 'completed' | 'disputed'

interface MockOrder {
  id: string
  orderNo: string
  type: 'labor' | 'vehicle' | 'moving'
  status: string
  title: string
  description: string
  address: string
  price: number
  createdAt: string
  workerName?: string
  workerAvatar?: string
  driverName?: string
  driverAvatar?: string
}

const mockOrders: MockOrder[] = [
  {
    id: '1', orderNo: 'CYT20240115001', type: 'moving', status: 'completed',
    title: '办公室搬家 - 精品服务', description: '3人工 + 小货车，拆装办公家具',
    address: '南山区科技园 → 福田区CBD', price: 1580,
    createdAt: '2024-01-15 10:00', workerName: '李师傅', workerAvatar: '李',
  },
  {
    id: '2', orderNo: 'CYT20240114002', type: 'vehicle', status: 'in_service',
    title: '货物运输 - 小货车', description: '普通货物 0.8吨 3方',
    address: '福田区华强北 → 龙岗区坂田', price: 320,
    createdAt: '2024-01-14 14:00', driverName: '刘师傅', driverAvatar: '刘',
  },
  {
    id: '3', orderNo: 'CYT20240113003', type: 'labor', status: 'confirming',
    title: '水电维修 - 2小时', description: '电路检修 + 水龙头更换',
    address: '罗湖区东门', price: 200,
    createdAt: '2024-01-13 09:00', workerName: '王师傅', workerAvatar: '王',
  },
  {
    id: '4', orderNo: 'CYT20240112004', type: 'labor', status: 'pending',
    title: '临时搬运工 - 4人', description: '仓库货物整理，预计4小时',
    address: '宝安区西乡', price: 800, createdAt: '2024-01-12 16:00',
  },
  {
    id: '5', orderNo: 'CYT20240111005', type: 'vehicle', status: 'assigned',
    title: '家具运输 - 中货', description: '衣柜、沙发、床各一件',
    address: '南山区蛇口 → 龙华区民治', price: 680,
    createdAt: '2024-01-11 11:00', driverName: '周师傅', driverAvatar: '周',
  },
  {
    id: '6', orderNo: 'CYT20240110006', type: 'moving', status: 'disputed',
    title: '居民搬家 - 标准服务', description: '家具家电搬运',
    address: '南山区西丽 → 南山区南头', price: 580,
    createdAt: '2024-01-10 09:30', workerName: '张师傅', workerAvatar: '张',
  },
]

const typeIconMap = {
  labor: Users,
  vehicle: Truck,
  moving: Home,
}

const typeColorMap = {
  labor: 'blue',
  vehicle: 'orange',
  moving: 'purple',
} as const

const typeLabelMap = {
  labor: '用工',
  vehicle: '找车',
  moving: '搬家',
}

export default function EmployerOrders() {
  const navigate = useNavigate()
  const [statusFilter, setStatusFilter] = useState<OrderStatusFilter>('all')
  const [typeFilter, setTypeFilter] = useState<OrderType>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [showTypeFilter, setShowTypeFilter] = useState(false)

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['orders', statusFilter, typeFilter],
    queryFn: () => getOrders({ status: statusFilter === 'all' ? undefined : statusFilter, page: 1, pageSize: 20 }),
    initialData: { list: mockOrders as any, total: mockOrders.length },
  })

  const statusTabs: { value: OrderStatusFilter; label: string }[] = [
    { value: 'all', label: '全部' },
    { value: 'pending', label: '待接单' },
    { value: 'assigned', label: '进行中' },
    { value: 'confirming', label: '待确认' },
    { value: 'completed', label: '已完成' },
    { value: 'disputed', label: '纠纷' },
  ]

  const typeTabs: { value: OrderType; label: string; icon: typeof Users }[] = [
    { value: 'all', label: '全部类型', icon: Filter },
    { value: 'labor', label: '用工', icon: Users },
    { value: 'vehicle', label: '找车', icon: Truck },
    { value: 'moving', label: '搬家', icon: Home },
  ]

  const filteredOrders = (data.list as unknown as MockOrder[]).filter((order) => {
    if (typeFilter !== 'all' && order.type !== typeFilter) return false
    if (statusFilter !== 'all' && order.status !== statusFilter) return false
    if (searchQuery && !order.title.includes(searchQuery) && !order.orderNo.includes(searchQuery)) return false
    return true
  })

  const renderOrderCard = (order: MockOrder, idx: number) => {
    const statusInfo = getOrderStatus(order.status)
    const TypeIcon = typeIconMap[order.type]

    const canCancel = ['pending', 'assigned'].includes(order.status)
    const canReview = order.status === 'completed'
    const canConfirm = order.status === 'confirming'

    return (
      <motion.div
        key={order.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: idx * 0.05 }}
        whileTap={{ scale: 0.99 }}
        onClick={() => navigate(`/orders/${order.id}`)}
      >
        <Card padded={false} className="mb-3">
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 font-mono">{order.orderNo}</span>
                <Tag color={typeColorMap[order.type]} size="sm">
                  <TypeIcon className="w-3 h-3 mr-0.5" />
                  {typeLabelMap[order.type]}
                </Tag>
              </div>
              <Tag
                color={
                  order.status === 'completed'
                    ? 'green'
                    : order.status === 'disputed'
                    ? 'red'
                    : order.status === 'pending'
                    ? 'yellow'
                    : order.status === 'confirming'
                    ? 'orange'
                    : 'blue'
                }
                size="sm"
              >
                {statusInfo?.label || '未知'}
              </Tag>
            </div>

            <h3 className="text-sm font-bold text-gray-800 mb-1.5">{order.title}</h3>
            <p className="text-xs text-gray-500 mb-3 line-clamp-1">{order.description}</p>

            <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {order.address.split(' → ')[0]}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {order.createdAt.slice(5, 16)}
              </span>
            </div>

            {(order.workerName || order.driverName) && (
              <div className="flex items-center gap-2 mb-3 p-2 rounded-lg bg-gray-50">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white text-xs font-medium">
                  {order.workerAvatar || order.driverAvatar}
                </div>
                <div className="flex-1">
                  <div className="text-xs font-medium text-gray-700">
                    {order.workerName || order.driverName}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Star className="w-3 h-3 text-amber-400" fill="#f59e0b" />
                    4.9
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-gray-50">
              <span className="text-lg font-bold text-blue-600">¥{order.price}</span>

              <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                <Button
                  size="sm"
                  variant="ghost"
                  icon={<ChevronRight className="w-4 h-4" />}
                  onClick={() => navigate(`/orders/${order.id}`)}
                >
                  详情
                </Button>

                {canCancel && (
                  <Button
                    size="sm"
                    variant="secondary"
                    icon={<XCircle className="w-4 h-4" />}
                  >
                    取消
                  </Button>
                )}

                {canReview && (
                  <Button
                    size="sm"
                    variant="primary"
                    icon={<MessageSquare className="w-4 h-4" />}
                  >
                    评价
                  </Button>
                )}

                {canConfirm && (
                  <Button
                    size="sm"
                    variant="primary"
                    icon={<CheckMark className="w-4 h-4" />}
                  >
                    确认
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Card>
      </motion.div>
    )
  }

  return (
    <div className="pb-4">
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-lg border-b border-gray-100">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-lg font-bold text-gray-900">我的订单</h1>
            <button
              onClick={() => setShowTypeFilter(!showTypeFilter)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-gray-100 text-sm text-gray-600"
            >
              <Filter className="w-4 h-4" />
              {typeFilter === 'all' ? '全部类型' : typeLabelMap[typeFilter]}
            </button>
          </div>

          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索订单号或内容..."
              className="w-full py-2.5 pl-9 pr-4 rounded-xl bg-gray-100 border-transparent text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
            {statusTabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setStatusFilter(tab.value)}
                className={`
                  flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all
                  ${statusFilter === tab.value
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }
                `}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <AnimatePresence>
          {showTypeFilter && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden border-t border-gray-100"
            >
              <div className="px-4 py-3 flex gap-2">
                {typeTabs.map((tab) => {
                  const Icon = tab.icon
                  return (
                    <button
                      key={tab.value}
                      onClick={() => {
                        setTypeFilter(tab.value)
                        setShowTypeFilter(false)
                      }}
                      className={`
                        flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all
                        ${typeFilter === tab.value
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }
                      `}
                    >
                      <Icon className="w-4 h-4" />
                      {tab.label}
                    </button>
                  )
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="p-4">
        {isLoading || isRefetching ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} padded={false}>
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-gray-100 rounded w-1/2 animate-pulse" />
                  <div className="h-5 bg-gray-100 rounded w-3/4 animate-pulse" />
                  <div className="h-3 bg-gray-100 rounded w-full animate-pulse" />
                  <div className="h-12 bg-gray-100 rounded-xl animate-pulse" />
                </div>
              </Card>
            ))}
          </div>
        ) : filteredOrders.length === 0 ? (
          <Empty
            type="orders"
            action={
              <Button
                variant="primary"
                icon={<RefreshCw className="w-4 h-4" />}
                onClick={() => refetch()}
              >
                刷新
              </Button>
            }
          />
        ) : (
          filteredOrders.map(renderOrderCard)
        )}
      </div>
    </div>
  )
}

function CheckMark(props: any) {
  return (
    <svg
      {...props}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}
