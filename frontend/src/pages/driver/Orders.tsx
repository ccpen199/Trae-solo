import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  Filter,
  MapPin,
  Clock,
  Package,
  Truck,
  ArrowRight,
  ChevronDown,
  X,
} from 'lucide-react'
import Card from '../../components/ui/Card'
import Tag from '../../components/ui/Tag'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'

interface DriverOrder {
  id: string
  pickup: string
  delivery: string
  cargoType: string
  weight: string
  volume: string
  vehicleType: string
  price: number
  distance: string
  scheduledAt: string
  matchScore: number
  isHot?: boolean
}

const mockOrders: DriverOrder[] = [
  {
    id: '1',
    pickup: '朝阳区望京SOHO地下车库',
    delivery: '海淀区中关村软件园二期',
    cargoType: '电子产品',
    weight: '2.5吨',
    volume: '12立方',
    vehicleType: '4.2米厢货',
    price: 680,
    distance: '18.5km',
    scheduledAt: '今天 15:00',
    matchScore: 95,
    isHot: true,
  },
  {
    id: '2',
    pickup: '顺义区天竺综合保税区',
    delivery: '通州区马驹桥物流园',
    cargoType: '日用百货',
    weight: '1.8吨',
    volume: '8立方',
    vehicleType: '4.2米厢货',
    price: 520,
    distance: '32km',
    scheduledAt: '今天 16:30',
    matchScore: 88,
  },
  {
    id: '3',
    pickup: '大兴区亦庄经济开发区',
    delivery: '昌平区回龙观建材城',
    cargoType: '建材瓷砖',
    weight: '3.5吨',
    volume: '15立方',
    vehicleType: '6.8米厢货',
    price: 980,
    distance: '45km',
    scheduledAt: '明天 08:00',
    matchScore: 72,
  },
  {
    id: '4',
    pickup: '丰台区新发地农产品批发市场',
    delivery: '东城区东直门内大街',
    cargoType: '生鲜蔬菜',
    weight: '1.2吨',
    volume: '6立方',
    vehicleType: '3.5米冷藏',
    price: 450,
    distance: '22km',
    scheduledAt: '明天 06:00',
    matchScore: 65,
  },
  {
    id: '5',
    pickup: '石景山区苹果园南路',
    delivery: '房山区良乡大学城',
    cargoType: '家具家电',
    weight: '2.0吨',
    volume: '10立方',
    vehicleType: '4.2米厢货',
    price: 580,
    distance: '28km',
    scheduledAt: '后天 09:00',
    matchScore: 82,
  },
]

const sortOptions = [
  { value: 'match', label: '智能匹配' },
  { value: 'distance', label: '距离最近' },
  { value: 'price', label: '价格最高' },
  { value: 'time', label: '时间最近' },
]

export default function DriverOrders() {
  const navigate = useNavigate()
  const [sortBy, setSortBy] = useState('match')
  const [showFilter, setShowFilter] = useState(false)
  const [searchText, setSearchText] = useState('')

  const filteredOrders = mockOrders.filter(
    (o) => !searchText || o.cargoType.includes(searchText) || o.pickup.includes(searchText)
  )

  return (
    <div className="flex flex-col min-h-screen">
      <div className="sticky top-0 z-30 bg-gray-50/95 backdrop-blur-lg px-4 pt-2 pb-3 border-b border-gray-100">
        <div className="flex items-center gap-2 mb-3">
          <div className="flex-1">
            <Input
              placeholder="搜索货源..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              prefix={<Search className="w-4 h-4" />}
              className="!py-2.5 !text-sm"
            />
          </div>
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowFilter(!showFilter)}
            className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all ${
              showFilter
                ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
                : 'bg-white border border-gray-200 text-gray-600'
            }`}
          >
            <Filter className="w-5 h-5" />
          </motion.button>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar -mx-1 px-1">
          {sortOptions.map((opt) => (
            <motion.button
              key={opt.value}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSortBy(opt.value)}
              className={`flex-shrink-0 px-3.5 py-1.5 rounded-xl text-sm font-medium transition-all flex items-center gap-1 ${
                sortBy === opt.value
                  ? 'bg-orange-600 text-white shadow-md shadow-orange-500/30'
                  : 'bg-white text-gray-600 border border-gray-200'
              }`}
            >
              {opt.label}
              {sortBy === opt.value && <ChevronDown className="w-3.5 h-3.5" />}
            </motion.button>
          ))}
        </div>

        <AnimatePresence>
          {showFilter && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-3 bg-white rounded-2xl p-4 border border-gray-100 shadow-sm"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-gray-900">筛选条件</span>
                <button onClick={() => setShowFilter(false)}>
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-3">
                {['3.5米厢货', '4.2米厢货', '6.8米厢货', '9.6米厢货', '冷藏车', '高栏车'].map(
                  (type) => (
                    <Tag key={type} color="gray" size="md" className="justify-center cursor-pointer hover:bg-orange-50 hover:text-orange-600">
                      {type}
                    </Tag>
                  )
                )}
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" fullWidth>重置</Button>
                <Button size="sm" variant="primary" className="!bg-orange-600 hover:!bg-orange-700" fullWidth>应用</Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex-1 p-4 space-y-3">
        <AnimatePresence mode="popLayout">
          {filteredOrders.map((order, index) => (
            <motion.div
              key={order.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card hover className="!p-0 overflow-hidden" onClick={() => navigate(`/driver/waybill/${order.id}`)}>
                {order.isHot && (
                  <div className="bg-gradient-to-r from-red-500 to-orange-500 px-4 py-1.5 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-white" />
                    <span className="text-xs font-bold text-white">热门货源 · 已有 8 人报价</span>
                  </div>
                )}

                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 pr-3">
                      <div className="flex items-start gap-2">
                        <div className="flex flex-col items-center pt-1">
                          <div className="w-2 h-2 rounded-full bg-green-500" />
                          <div className="w-px h-8 bg-gray-300 my-1" />
                          <div className="w-2 h-2 rounded-full bg-red-500" />
                        </div>
                        <div className="flex-1 space-y-2">
                          <div>
                            <p className="text-xs text-gray-400">装货</p>
                            <p className="text-sm font-medium text-gray-900 line-clamp-1">{order.pickup}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-400">卸货</p>
                            <p className="text-sm font-medium text-gray-900 line-clamp-1">{order.delivery}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">运费</p>
                      <p className="text-2xl font-extrabold text-orange-500 tracking-tight">¥{order.price}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5 mb-3">
                    <Tag color="orange" size="sm">{order.vehicleType}</Tag>
                    <Tag color="yellow" size="sm">{order.weight}</Tag>
                    <Tag color="cyan" size="sm">{order.volume}</Tag>
                    <Tag color="purple" size="sm">{order.cargoType}</Tag>
                  </div>

                  <div className="flex items-center justify-between mb-3 text-xs text-gray-500">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {order.distance}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {order.scheduledAt}
                      </span>
                    </div>
                    <span className="text-orange-600 font-bold">匹配度 {order.matchScore}%</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${order.matchScore}%` }}
                        transition={{ duration: 0.8, delay: 0.1, ease: 'easeOut' }}
                        className="h-full bg-gradient-to-r from-orange-400 to-amber-500 rounded-full"
                      />
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={(e) => {
                        e.stopPropagation()
                      }}
                      className="relative px-5 py-2 bg-gradient-to-r from-orange-500 to-amber-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-orange-500/30 flex items-center gap-1"
                    >
                      <Truck className="w-4 h-4" />
                      立即抢单
                    </motion.button>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}
