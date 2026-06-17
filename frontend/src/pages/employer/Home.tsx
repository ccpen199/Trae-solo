import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  MapPin,
  ChevronDown,
  Users,
  Truck,
  Home,
  Star,
  Clock,
  ArrowRight,
  RefreshCw,
  Sparkles,
  Shield,
  Zap,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import Card from '../../components/ui/Card'
import Tag from '../../components/ui/Tag'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import { getNearbyWorkers, getNearbyDrivers, getOrders } from '../../services/employer.api'
import { getOrderStatus, getCreditLevel } from '../../constants'
import { useAuthStore } from '../../store/useAuthStore'

interface NearbyPerson {
  id: string
  name: string
  avatar: string
  online: boolean
  distance: number
  creditScore: number
  skills?: string[]
}

const mockWorkers: NearbyPerson[] = [
  { id: '1', name: '李师傅', avatar: '李', online: true, distance: 0.3, creditScore: 920, skills: ['水电工', '木工'] },
  { id: '2', name: '王师傅', avatar: '王', online: true, distance: 0.5, creditScore: 880, skills: ['搬运工'] },
  { id: '3', name: '张师傅', avatar: '张', online: false, distance: 0.8, creditScore: 850, skills: ['油漆工'] },
  { id: '4', name: '赵师傅', avatar: '赵', online: true, distance: 1.2, creditScore: 910, skills: ['安装工'] },
  { id: '5', name: '陈师傅', avatar: '陈', online: true, distance: 1.5, creditScore: 790, skills: ['泥瓦工'] },
]

const mockDrivers: NearbyPerson[] = [
  { id: '1', name: '刘师傅', avatar: '刘', online: true, distance: 0.2, creditScore: 940 },
  { id: '2', name: '周师傅', avatar: '周', online: true, distance: 0.6, creditScore: 870 },
  { id: '3', name: '吴师傅', avatar: '吴', online: true, distance: 0.9, creditScore: 890 },
  { id: '4', name: '郑师傅', avatar: '郑', online: false, distance: 1.1, creditScore: 820 },
  { id: '5', name: '孙师傅', avatar: '孙', online: true, distance: 1.8, creditScore: 900 },
]

export default function EmployerHome() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [activeTab, setActiveTab] = useState<'workers' | 'drivers'>('workers')
  const [city] = useState('深圳市')

  const { data: nearbyWorkers } = useQuery({
    queryKey: ['nearbyWorkers'],
    queryFn: () => getNearbyWorkers({ lat: 22.5431, lng: 114.0579 }),
    initialData: { list: mockWorkers },
  })

  const { data: nearbyDrivers } = useQuery({
    queryKey: ['nearbyDrivers'],
    queryFn: () => getNearbyDrivers({ lat: 22.5431, lng: 114.0579 }),
    initialData: { list: mockDrivers },
  })

  const { data: ordersData } = useQuery({
    queryKey: ['recentOrders'],
    queryFn: () => getOrders({ page: 1, pageSize: 3 }),
    initialData: {
      list: [
        {
          id: '1',
          orderNo: 'CYT20240115001',
          status: 'completed',
          cargoDescription: '办公室搬家 - 3人工',
          estimatedPrice: 580,
          pickupLocation: { address: '南山区科技园' },
          scheduledAt: '2024-01-15 10:00',
        },
        {
          id: '2',
          orderNo: 'CYT20240114002',
          status: 'in_service',
          cargoDescription: '货物运输 - 小货车',
          estimatedPrice: 320,
          pickupLocation: { address: '福田区华强北' },
          scheduledAt: '2024-01-14 14:00',
        },
        {
          id: '3',
          orderNo: 'CYT20240113003',
          status: 'confirming',
          cargoDescription: '水电维修 - 2小时',
          estimatedPrice: 200,
          pickupLocation: { address: '罗湖区东门' },
          scheduledAt: '2024-01-13 09:00',
        },
      ],
      total: 3,
    },
  })

  const serviceCards = [
    {
      id: 'labor',
      title: '用工服务',
      desc: '找工人，随叫随到',
      icon: Users,
      gradient: 'from-blue-500 to-blue-600',
      bg: 'bg-blue-50',
      text: 'text-blue-600',
      path: '/publish/labor',
    },
    {
      id: 'vehicle',
      title: '找车服务',
      desc: '货运搬家，一键叫车',
      icon: Truck,
      gradient: 'from-orange-500 to-orange-600',
      bg: 'bg-orange-50',
      text: 'text-orange-600',
      path: '/publish/vehicle',
    },
    {
      id: 'moving',
      title: '搬家服务',
      desc: '精品搬家，省心省力',
      icon: Home,
      gradient: 'from-purple-500 to-purple-600',
      bg: 'bg-purple-50',
      text: 'text-purple-600',
      path: '/publish/moving',
    },
  ]

  const packages = [
    { id: '1', name: '新人礼包', desc: '首单立减50元', tag: '限时', price: '0元起' },
    { id: '2', name: '会员套餐', desc: '享9折优惠', tag: '热门', price: '99元/月' },
    { id: '3', name: '企业版', desc: '专属客服', tag: '推荐', price: '咨询' },
  ]

  const renderAvatarList = (list: NearbyPerson[]) => (
    <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
      {list.map((person, idx) => {
        const creditLevel = getCreditLevel(person.creditScore)
        return (
          <motion.div
            key={person.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="flex flex-col items-center flex-shrink-0 w-16"
          >
            <div className="relative mb-1.5">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-medium text-sm ${
                  person.online
                    ? 'bg-gradient-to-br from-blue-500 to-indigo-500'
                    : 'bg-gray-300'
                }`}
              >
                {person.avatar}
              </div>
              <Badge
                dot
                color={person.online ? 'green' : 'gray'}
                className="absolute bottom-0 right-0 ring-2 ring-white"
              />
            </div>
            <span className="text-xs font-medium text-gray-700 truncate w-full text-center">
              {person.name}
            </span>
            <div className="flex items-center gap-0.5 text-xs text-gray-500 mt-0.5">
              <MapPin className="w-3 h-3" />
              <span>{person.distance}km</span>
            </div>
            <div className="flex items-center gap-0.5 mt-0.5">
              <Star className="w-3 h-3" style={{ color: creditLevel.color }} fill={creditLevel.color} />
              <span className="text-xs font-medium" style={{ color: creditLevel.color }}>
                {creditLevel.level}
              </span>
            </div>
          </motion.div>
        )
      })}
    </div>
  )

  return (
    <div className="pb-4">
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              你好，{user?.realName || user?.username || '用户'} 👋
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">今天有什么可以帮您？</p>
          </div>
          <button className="flex items-center gap-1 px-3 py-2 rounded-full bg-white border border-gray-100 shadow-sm">
            <MapPin className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-gray-700">{city}</span>
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-5">
          {serviceCards.map((card, idx) => {
            const Icon = card.icon
            return (
              <motion.div
                key={card.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                whileHover={{ y: -4, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate(card.path)}
                className={`${card.bg} rounded-2xl p-4 cursor-pointer relative overflow-hidden`}
              >
                <div
                  className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center mb-3 shadow-lg`}
                >
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <h3 className={`text-sm font-bold ${card.text} mb-1`}>{card.title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{card.desc}</p>
              </motion.div>
            )
          })}
        </div>
      </div>

      <Card className="mx-4 mb-4" padded={false}>
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <h2 className="text-base font-bold text-gray-900">附近运力</h2>
            </div>
            <button className="text-xs text-blue-600 font-medium flex items-center gap-0.5">
              查看全部 <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="flex gap-2 mb-4">
            {[
              { key: 'workers', label: '工人', count: nearbyWorkers.list.length },
              { key: 'drivers', label: '司机', count: nearbyDrivers.list.length },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as 'workers' | 'drivers')}
                className={`
                  px-4 py-1.5 rounded-full text-sm font-medium transition-all
                  ${activeTab === tab.key
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }
                `}
              >
                {tab.label} ({tab.count})
              </button>
            ))}
          </div>

          {activeTab === 'workers'
            ? renderAvatarList(nearbyWorkers.list as NearbyPerson[])
            : renderAvatarList(nearbyDrivers.list as NearbyPerson[])}
        </div>
      </Card>

      <div className="px-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-gray-900">最近订单</h2>
          <button
            onClick={() => navigate('/orders')}
            className="text-xs text-blue-600 font-medium flex items-center gap-0.5"
          >
            全部订单 <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="space-y-3">
          {ordersData.list.map((order: any, idx: number) => {
            const statusInfo = getOrderStatus(order.status)
            return (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.08 }}
                whileHover={{ scale: 1.01 }}
              >
                <Card padded={false}>
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-400 font-mono">{order.orderNo}</span>
                      <Tag
                        color={
                          order.status === 'completed'
                            ? 'green'
                            : order.status === 'in_service'
                            ? 'blue'
                            : 'yellow'
                        }
                        size="sm"
                      >
                        {statusInfo?.label || '未知'}
                      </Tag>
                    </div>
                    <h3 className="text-sm font-semibold text-gray-800 mb-1.5">
                      {order.cargoDescription}
                    </h3>
                    <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {order.pickupLocation?.address}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {order.scheduledAt?.slice(5, 16)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                      <span className="text-lg font-bold text-blue-600">
                        ¥{order.estimatedPrice}
                      </span>
                      <Button
                        size="sm"
                        variant="secondary"
                        icon={<RefreshCw className="w-4 h-4" />}
                        onClick={() => navigate('/orders')}
                      >
                        再来一单
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            )
          })}
        </div>
      </div>

      <div className="px-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-purple-500" />
            <h2 className="text-base font-bold text-gray-900">推荐套餐</h2>
          </div>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
          {packages.map((pkg, idx) => (
            <motion.div
              key={pkg.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              whileHover={{ y: -4 }}
              className="flex-shrink-0 w-36 rounded-2xl bg-gradient-to-br from-purple-50 to-indigo-50 p-4 border border-purple-100"
            >
              <Tag color="purple" size="sm" className="mb-3">
                {pkg.tag}
              </Tag>
              <h3 className="text-sm font-bold text-gray-800 mb-1">{pkg.name}</h3>
              <p className="text-xs text-gray-500 mb-3">{pkg.desc}</p>
              <div className="flex items-center justify-between">
                <span className="text-base font-bold text-purple-600">{pkg.price}</span>
                <button className="w-7 h-7 rounded-full bg-purple-600 flex items-center justify-center">
                  <Zap className="w-4 h-4 text-white" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
