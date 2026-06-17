import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  Phone,
  MessageSquare,
  Star,
  MapPin,
  Clock,
  Calendar,
  FileText,
  Image,
  ShieldCheck,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Gavel,
  XCircle,
  Check,
  Users,
  Truck,
  Home,
  CreditCard,
  Eye,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { useQuery, useMutation } from '@tanstack/react-query'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Tag from '../../components/ui/Tag'
import Badge from '../../components/ui/Badge'
import { getOrderDetail, confirmOrder } from '../../services/employer.api'
import { getOrderStatus, getCreditLevel } from '../../constants'

interface OrderTimelineStep {
  key: string
  label: string
  time: string
  completed: boolean
  active: boolean
}

const mockOrderDetail = {
  id: '1',
  orderNo: 'CYT20240115001',
  type: 'moving' as const,
  status: 'in_service',
  title: '办公室搬家 - 精品服务',
  description: '3人工 + 小货车，拆装办公家具，含精品包装服务',
  pickupAddress: '南山区科技园南区T3栋15楼',
  deliveryAddress: '福田区CBD平安金融中心8楼',
  price: 1580,
  createdAt: '2024-01-15 10:00',
  scheduledAt: '2024-01-15 14:00',
  worker: {
    id: 'w1',
    name: '李师傅',
    avatar: '李',
    phone: '138****8888',
    creditScore: 920,
    orderCount: 328,
    skills: ['搬家师傅', '搬运工', '家具拆装'],
  },
  images: [
    'https://images.unsplash.com/photo-1600518464441-9154a4dea21b?w=200',
    'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?w=200',
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200',
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=200',
  ],
}

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

export default function OrderDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [showEvidence, setShowEvidence] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(35)

  const { data: order = mockOrderDetail as any } = useQuery({
    queryKey: ['orderDetail', id],
    queryFn: () => getOrderDetail(id || ''),
    initialData: mockOrderDetail as any,
  })

  const confirmMutation = useMutation({
    mutationFn: () => confirmOrder(id || ''),
    onSuccess: () => {
      navigate('/orders')
    },
  })

  const statusInfo = getOrderStatus(order.status)
  const TypeIcon = typeIconMap[order.type]
  const creditLevel = getCreditLevel(order.worker?.creditScore || 800)

  const timelineSteps: OrderTimelineStep[] = [
    { key: 'pending', label: '待接单', time: '10:00', completed: true, active: false },
    { key: 'matched', label: '已接单', time: '10:05', completed: true, active: false },
    { key: 'departing', label: '已出发', time: '13:30', completed: true, active: false },
    { key: 'in_service', label: '服务中', time: '14:15', completed: false, active: true },
    { key: 'confirming', label: '待确认', time: '--', completed: false, active: false },
    { key: 'completed', label: '已完成', time: '--', completed: false, active: false },
  ]

  const canCancel = ['pending', 'matched'].includes(order.status)
  const canConfirm = order.status === 'confirming'

  return (
    <div className="pb-32">
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-lg border-b border-gray-100 px-4 py-3">
        <div className="flex items-center">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="text-lg font-bold text-gray-900 ml-2">订单详情</h1>
          <div className="ml-auto flex items-center gap-2">
            <Tag color={typeColorMap[order.type]} size="sm">
              <TypeIcon className="w-3 h-3 mr-0.5" />
              {typeLabelMap[order.type]}
            </Tag>
            <Tag
              color={
                order.status === 'completed'
                  ? 'green'
                  : order.status === 'disputed'
                  ? 'red'
                  : 'blue'
              }
              size="sm"
            >
              {statusInfo?.label || '未知'}
            </Tag>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <Card>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400 font-mono">{order.orderNo}</span>
            <span className="text-xs text-gray-400">{order.createdAt}</span>
          </div>
          <h2 className="text-base font-bold text-gray-900 mb-1">{order.title}</h2>
          <p className="text-sm text-gray-500">{order.description}</p>
        </Card>

        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-bold text-gray-900">订单进度</h2>
          </div>
          <div className="relative">
            <div className="absolute left-4 top-6 bottom-6 w-0.5 bg-gray-100" />
            <div className="space-y-4">
              {timelineSteps.map((step, idx) => (
                <div key={step.key} className="relative flex items-start gap-4">
                  <div
                    className={`
                      relative z-10 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
                      ${step.completed
                        ? 'bg-green-500'
                        : step.active
                        ? 'bg-blue-500 ring-4 ring-blue-100'
                        : 'bg-gray-200'
                      }
                    `}
                  >
                    {step.completed ? (
                      <Check className="w-4 h-4 text-white" />
                    ) : (
                      <span className={`text-xs font-bold ${step.active ? 'text-white' : 'text-gray-400'}`}>
                        {idx + 1}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 pt-1">
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-sm font-medium ${
                          step.completed || step.active ? 'text-gray-800' : 'text-gray-400'
                        }`}
                      >
                        {step.label}
                      </span>
                      <span className="text-xs text-gray-400">{step.time}</span>
                    </div>
                    {step.active && (
                      <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-1"
                      >
                        <Tag color="blue" size="sm">正在进行中...</Tag>
                      </motion.div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {order.worker && (
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-blue-600" />
              <h2 className="text-base font-bold text-gray-900">服务人员</h2>
            </div>
            <div className="flex items-start gap-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                  {order.worker.avatar}
                </div>
                <Badge dot color="green" className="absolute bottom-1 right-1 ring-2 ring-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-base font-bold text-gray-900">{order.worker.name}</h3>
                  <div
                    className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-md"
                    style={{ backgroundColor: `${creditLevel.color}15` }}
                  >
                    <Star className="w-3 h-3" style={{ color: creditLevel.color }} fill={creditLevel.color} />
                    <span className="text-xs font-bold" style={{ color: creditLevel.color }}>
                      {creditLevel.level}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500 mb-2">
                  <span>信用分 {order.worker.creditScore}</span>
                  <span>完成 {order.worker.orderCount} 单</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {order.worker.skills.map((skill: string) => (
                    <Tag key={skill} color="gray" size="sm">
                      {skill}
                    </Tag>
                  ))}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-4">
              <Button variant="primary" icon={<Phone className="w-4 h-4" />} fullWidth>
                一键呼叫
              </Button>
              <Button variant="secondary" icon={<MessageSquare className="w-4 h-4" />} fullWidth>
                在线聊天
              </Button>
            </div>
          </Card>
        )}

        <Card padded={false}>
          <div className="h-52 rounded-t-2xl bg-gradient-to-br from-blue-100 via-cyan-50 to-green-100 relative overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-2 rounded-full bg-white/80 flex items-center justify-center shadow-lg">
                  <MapPin className="w-8 h-8 text-blue-600" />
                </div>
                <p className="text-sm text-gray-600 font-medium">实时位置追踪</p>
              </div>
            </div>

            <div className="absolute top-3 left-3 bg-white/90 backdrop-blur rounded-lg px-3 py-1.5 shadow-sm">
              <span className="text-xs text-gray-500">距您</span>
              <span className="text-sm font-bold text-blue-600 ml-1">1.2km</span>
            </div>

            <div className="absolute top-3 right-3 bg-white/90 backdrop-blur rounded-lg px-3 py-1.5 shadow-sm">
              <span className="text-xs text-gray-500">预计</span>
              <span className="text-sm font-bold text-green-600 ml-1">5分钟</span>
            </div>
          </div>

          <div className="p-4 bg-white">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-medium text-gray-500">轨迹回放</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/30"
              >
                {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
              </button>
              <button className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600">
                <SkipBack className="w-4 h-4" />
              </button>
              <button className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600">
                <SkipForward className="w-4 h-4" />
              </button>
              <div className="flex-1 relative h-2 bg-gray-100 rounded-full overflow-hidden">
                <motion.div
                  animate={{ width: isPlaying ? `${progress + 10}%` : `${progress}%` }}
                  transition={{ duration: 2 }}
                  className="absolute left-0 top-0 h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-xs text-gray-500 font-mono">
                {Math.floor(progress * 1.2 / 60)}:{String(Math.floor(progress * 1.2 % 60)).padStart(2, '0')}
              </span>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-2 mb-4">
            <FileText className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-bold text-gray-900">服务信息</h2>
          </div>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <MapPin className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="text-xs text-gray-500">服务地点</div>
                <div className="text-sm text-gray-800">{order.pickupAddress}</div>
                {order.deliveryAddress && (
                  <>
                    <div className="my-1 ml-2 border-l-2 border-dashed border-gray-200 h-3" />
                    <div className="text-xs text-gray-500">送达地点</div>
                    <div className="text-sm text-gray-800">{order.deliveryAddress}</div>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-blue-500 flex-shrink-0" />
              <div className="flex-1">
                <div className="text-xs text-gray-500">预约时间</div>
                <div className="text-sm text-gray-800">{order.scheduledAt}</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <CreditCard className="w-4 h-4 text-purple-500 flex-shrink-0" />
              <div className="flex-1">
                <div className="text-xs text-gray-500">服务费用</div>
                <div className="text-xl font-bold text-blue-600">¥{order.price}</div>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <button
            onClick={() => setShowEvidence(!showEvidence)}
            className="w-full flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-blue-600" />
              <h2 className="text-base font-bold text-gray-900">GPS轨迹存证</h2>
              <Tag color="green" size="sm">已上链</Tag>
            </div>
            {showEvidence ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </button>

          <AnimatePresence>
            {showEvidence && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="pt-4 mt-4 border-t border-gray-100 space-y-3">
                  <div className="p-3 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100">
                    <div className="flex items-center gap-2 mb-2">
                      <ShieldCheck className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium text-green-700">区块链存证信息</span>
                    </div>
                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-gray-500">存证哈希</span>
                        <span className="font-mono text-gray-700">0x7f3e...8a2b</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">区块高度</span>
                        <span className="font-mono text-gray-700">#18,234,567</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">时间戳</span>
                        <span className="font-mono text-gray-700">2024-01-15 14:15:32</span>
                      </div>
                    </div>
                  </div>
                  <Button variant="secondary" icon={<Eye className="w-4 h-4" />} fullWidth>
                    查看完整存证信息
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>

        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Image className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-bold text-gray-900">服务照片</h2>
            <span className="text-xs text-gray-400">({order.images.length}张)</span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {order.images.map((img: string, idx: number) => (
              <motion.div
                key={idx}
                whileTap={{ scale: 0.95 }}
                className="aspect-square rounded-xl overflow-hidden bg-gray-100"
              >
                <div className="w-full h-full bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                  <Image className="w-6 h-6 text-gray-400" />
                </div>
              </motion.div>
            ))}
          </div>
        </Card>
      </div>

      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-white/95 backdrop-blur-lg border-t border-gray-100 p-4 z-40">
        <div className="flex items-center gap-3">
          <button className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors">
            <Phone className="w-5 h-5" />
          </button>
          <button className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors">
            <MessageSquare className="w-5 h-5" />
          </button>
          <div className="flex-1 flex items-center gap-2">
            {canCancel && (
              <Button variant="secondary" icon={<XCircle className="w-4 h-4" />} fullWidth>
                取消订单
              </Button>
            )}
            {canConfirm && (
              <Button
                variant="primary"
                icon={<Check className="w-4 h-4" />}
                fullWidth
                loading={confirmMutation.isPending}
                onClick={() => confirmMutation.mutate()}
              >
                确认完工
              </Button>
            )}
            {!canCancel && !canConfirm && order.status !== 'completed' && order.status !== 'disputed' && (
              <Button variant="primary" icon={<Check className="w-4 h-4" />} fullWidth disabled>
                等待服务完成
              </Button>
            )}
            {order.status === 'completed' && (
              <Button variant="cta" icon={<Star className="w-4 h-4" />} fullWidth>
                去评价
              </Button>
            )}
            {order.status === 'disputed' && (
              <Button variant="danger" icon={<Gavel className="w-4 h-4" />} fullWidth>
                查看仲裁
              </Button>
            )}
            {(order.status === 'in_service' || order.status === 'confirming') && (
              <Button variant="secondary" icon={<Gavel className="w-4 h-4" />} size="md">
                申请仲裁
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
