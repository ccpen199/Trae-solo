import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  Filter,
  MapPin,
  Clock,
  Users,
  Zap,
  Star,
  Shield,
  ChevronDown,
  X,
} from 'lucide-react'
import Card from '../../components/ui/Card'
import Tag from '../../components/ui/Tag'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'

interface WorkerOrder {
  id: string
  title: string
  type: string
  price: number
  distance: string
  duration: string
  workersNeeded: number
  address: string
  scheduledAt: string
  matchScore: number
  matchBreakdown: { skill: number; distance: number; credit: number; time: number }
  employerRating: number
  countdown?: number
  isHot?: boolean
}

const mockOrders: WorkerOrder[] = [
  {
    id: '1',
    title: '办公室搬迁需要3名搬运工',
    type: '搬家搬运',
    price: 320,
    distance: '0.8km',
    duration: '4小时',
    workersNeeded: 3,
    address: '朝阳区望京SOHO T3',
    scheduledAt: '今天 14:00',
    matchScore: 92,
    matchBreakdown: { skill: 35, distance: 25, credit: 20, time: 12 },
    employerRating: 4.9,
    countdown: 180,
    isHot: true,
  },
  {
    id: '2',
    title: '仓库货物装卸',
    type: '装卸搬运',
    price: 260,
    distance: '1.5km',
    duration: '3小时',
    workersNeeded: 2,
    address: '海淀区五道口物流园',
    scheduledAt: '今天 15:30',
    matchScore: 85,
    matchBreakdown: { skill: 30, distance: 22, credit: 20, time: 13 },
    employerRating: 4.8,
    countdown: 420,
  },
  {
    id: '3',
    title: '家具组装-衣柜、餐桌',
    type: '家具组装',
    price: 180,
    distance: '2.3km',
    duration: '2.5小时',
    workersNeeded: 1,
    address: '昌平区回龙观龙泽苑',
    scheduledAt: '明天 09:00',
    matchScore: 78,
    matchBreakdown: { skill: 28, distance: 18, credit: 20, time: 12 },
    employerRating: 4.7,
    countdown: 1200,
  },
  {
    id: '4',
    title: '家电安装-空调3台',
    type: '家电安装',
    price: 240,
    distance: '3.1km',
    duration: '3小时',
    workersNeeded: 2,
    address: '东城区东直门内大街',
    scheduledAt: '明天 10:00',
    matchScore: 71,
    matchBreakdown: { skill: 25, distance: 16, credit: 20, time: 10 },
    employerRating: 4.6,
  },
  {
    id: '5',
    title: '展会现场布置搭建',
    type: '展会搭建',
    price: 450,
    distance: '4.5km',
    duration: '6小时',
    workersNeeded: 4,
    address: '顺义区中国国际展览中心',
    scheduledAt: '后天 08:00',
    matchScore: 65,
    matchBreakdown: { skill: 22, distance: 15, credit: 18, time: 10 },
    employerRating: 4.9,
  },
]

const sortOptions = [
  { value: 'match', label: '智能匹配' },
  { value: 'distance', label: '距离最近' },
  { value: 'price', label: '价格最高' },
  { value: 'time', label: '时间最近' },
]

const fadeInUp = {
  initial: { opacity: 0, y: 15 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
}

function formatCountdown(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

export default function WorkerOrders() {
  const navigate = useNavigate()
  const [sortBy, setSortBy] = useState('match')
  const [showFilter, setShowFilter] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [countdowns, setCountdowns] = useState<Record<string, number>>({})

  const filteredOrders = mockOrders.filter(
    (o) => !searchText || o.title.includes(searchText) || o.type.includes(searchText)
  )

  return (
    <div className="flex flex-col min-h-screen">
      <div className="sticky top-0 z-30 bg-gray-50/95 backdrop-blur-lg px-4 pt-2 pb-3 border-b border-gray-100">
        <div className="flex items-center gap-2 mb-3">
          <div className="flex-1">
            <Input
              placeholder="搜索需求..."
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
                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
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
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/30'
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
              variants={fadeInUp}
              initial="initial"
              animate="animate"
              exit="exit"
              className="mt-3 bg-white rounded-2xl p-4 border border-gray-100 shadow-sm"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-gray-900">筛选条件</span>
                <button onClick={() => setShowFilter(false)}>
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-3">
                {['搬家搬运', '装卸搬运', '家具组装', '家电安装', '展会搭建', '其他'].map(
                  (type) => (
                    <Tag key={type} color="gray" size="md" className="justify-center cursor-pointer hover:bg-emerald-50 hover:text-emerald-600">
                      {type}
                    </Tag>
                  )
                )}
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" fullWidth>重置</Button>
                <Button size="sm" variant="primary" className="!bg-emerald-600 hover:!bg-emerald-700" fullWidth>应用</Button>
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
              <Card
                hover
                className="!p-0 overflow-hidden"
                onClick={() => navigate(`/worker/orders/${order.id}`)}
              >
                {order.isHot && (
                  <div className="bg-gradient-to-r from-red-500 to-orange-500 px-4 py-1.5 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 text-white fill-white" />
                    <span className="text-xs font-bold text-white">热门需求 · 已有 18 人抢单</span>
                  </div>
                )}

                <div className="p-4">
                  <div className="flex items-start justify-between mb-2.5">
                    <div className="flex-1 pr-3">
                      <h3 className="text-base font-bold text-gray-900 line-clamp-1">{order.title}</h3>
                      <div className="flex items-center gap-2 mt-1.5">
                        <Tag color="green" size="sm">{order.type}</Tag>
                        <div className="flex items-center gap-0.5">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                          <span className="text-xs text-gray-600 font-medium">{order.employerRating}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-500">预计收入</p>
                      <p className="text-2xl font-extrabold text-orange-500 tracking-tight">¥{order.price}</p>
                    </div>
                  </div>

                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Shield className="w-3 h-3 text-emerald-500" />
                        智能匹配度
                      </span>
                      <span className="text-xs font-bold text-emerald-600">{order.matchScore}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${order.matchScore}%` }}
                        transition={{ duration: 0.8, delay: 0.1, ease: 'easeOut' }}
                        className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full"
                      />
                    </div>
                    <div className="flex items-center justify-between mt-1.5 text-[10px] text-gray-500">
                      <span>技能 {order.matchBreakdown.skill}%</span>
                      <span>距离 {order.matchBreakdown.distance}%</span>
                      <span>信用 {order.matchBreakdown.credit}%</span>
                      <span>时间 {order.matchBreakdown.time}%</span>
                    </div>
                  </div>

                  <div className="space-y-1.5 mb-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                      <span className="line-clamp-1">{order.address}</span>
                      <Tag color="cyan" size="sm" className="ml-auto flex-shrink-0">{order.distance}</Tag>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                      <span>{order.scheduledAt} · {order.duration}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Users className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                      <span>需要 {order.workersNeeded} 人</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      {order.countdown !== undefined ? (
                        <div className="flex items-center gap-1.5 text-xs">
                          <span className="text-gray-500">剩余</span>
                          <motion.span
                            key={order.countdown}
                            initial={{ scale: 1.1, color: '#ef4444' }}
                            animate={{ scale: 1 }}
                            className="font-mono font-bold text-red-500 text-sm"
                          >
                            {formatCountdown(order.countdown)}
                          </motion.span>
                          <span className="text-gray-500">结束抢单</span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-500">随时可抢</span>
                      )}
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={(e) => {
                        e.stopPropagation()
                      }}
                      className="relative px-5 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-emerald-500/30"
                    >
                      {order.countdown !== undefined && (
                        <motion.span
                          animate={{ opacity: [0.6, 1, 0.6] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                          className="absolute inset-0 rounded-xl bg-emerald-400 blur-md -z-10"
                        />
                      )}
                      立即抢单
                    </motion.button>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredOrders.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-sm text-gray-500">没有找到相关需求</p>
          </div>
        )}
      </div>
    </div>
  )
}
