import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MapPin,
  Camera,
  CheckCircle2,
  PlayCircle,
  Circle,
  XCircle,
  Truck,
  Clock,
} from 'lucide-react'
import Card from '../../components/ui/Card'
import Tag from '../../components/ui/Tag'
import Button from '../../components/ui/Button'

type TaskTab = 'pending' | 'in_transit' | 'delivered' | 'completed'

interface DriverTask {
  id: string
  title: string
  vehicleType: string
  price: number
  pickup: string
  delivery: string
  scheduledAt: string
  status: TaskTab
  progress?: string
}

const mockTasks: DriverTask[] = [
  {
    id: '1',
    title: '电子产品运输',
    vehicleType: '4.2米厢货',
    price: 680,
    pickup: '朝阳区望京SOHO地下车库',
    delivery: '海淀区中关村软件园二期',
    scheduledAt: '今天 14:00',
    status: 'in_transit',
    progress: '运输中，预计 45 分钟到达',
  },
  {
    id: '2',
    title: '日用百货运输',
    vehicleType: '4.2米厢货',
    price: 520,
    pickup: '顺义区天竺综合保税区',
    delivery: '通州区马驹桥物流园',
    scheduledAt: '明天 08:00',
    status: 'pending',
  },
  {
    id: '3',
    title: '建材瓷砖运输',
    vehicleType: '6.8米厢货',
    price: 980,
    pickup: '大兴区亦庄经济开发区',
    delivery: '昌平区回龙观建材城',
    scheduledAt: '昨天 10:00',
    status: 'delivered',
  },
  {
    id: '4',
    title: '生鲜蔬菜运输',
    vehicleType: '3.5米冷藏',
    price: 450,
    pickup: '丰台区新发地农产品市场',
    delivery: '东城区东直门内大街',
    scheduledAt: '06-12 06:00',
    status: 'completed',
  },
  {
    id: '5',
    title: '家具家电运输',
    vehicleType: '4.2米厢货',
    price: 580,
    pickup: '石景山区苹果园南路',
    delivery: '房山区良乡大学城',
    scheduledAt: '06-11 09:00',
    status: 'completed',
  },
]

const tabs: { key: TaskTab; label: string }[] = [
  { key: 'pending', label: '待装货' },
  { key: 'in_transit', label: '运输中' },
  { key: 'delivered', label: '待签收' },
  { key: 'completed', label: '已完成' },
]

const statusLabelMap: Record<TaskTab, string> = {
  pending: '待装货',
  in_transit: '运输中',
  delivered: '待签收',
  completed: '已完成',
}

export default function DriverTasks() {
  const [activeTab, setActiveTab] = useState<TaskTab>('in_transit')

  const filteredTasks = mockTasks.filter((t) => t.status === activeTab)

  return (
    <div className="flex flex-col min-h-screen">
      <div className="sticky top-0 z-30 bg-gray-50/95 backdrop-blur-lg px-4 pt-2 pb-3 border-b border-gray-100">
        <h1 className="text-xl font-bold text-gray-900 mb-3">我的运单</h1>
        <div className="flex items-center gap-1 bg-white rounded-xl p-1 border border-gray-100">
          {tabs.map(({ key, label }) => (
            <motion.button
              key={key}
              whileTap={{ scale: 0.97 }}
              onClick={() => setActiveTab(key)}
              className={`relative flex-1 py-2 rounded-lg text-xs font-medium transition-all ${
                activeTab === key ? 'text-orange-700' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {activeTab === key && (
                <motion.div
                  layoutId="driverTaskTabBg"
                  className="absolute inset-0 bg-orange-50 rounded-lg"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
              <span className="relative">{label}</span>
            </motion.button>
          ))}
        </div>
      </div>

      <div className="flex-1 p-4 space-y-3">
        <AnimatePresence mode="popLayout">
          {filteredTasks.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-16"
            >
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
                <Truck className="w-8 h-8 text-gray-300" />
              </div>
              <p className="text-sm text-gray-500">暂无{statusLabelMap[activeTab]}的运单</p>
            </motion.div>
          ) : (
            filteredTasks.map((task, index) => (
              <motion.div
                key={task.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="!p-0 overflow-hidden">
                  <div className="px-4 py-2.5 flex items-center justify-between border-b border-gray-50">
                    <Tag
                      color={
                        task.status === 'in_transit'
                          ? 'orange'
                          : task.status === 'pending'
                          ? 'yellow'
                          : task.status === 'delivered'
                          ? 'cyan'
                          : 'blue'
                      }
                      size="sm"
                    >
                      {statusLabelMap[task.status]}
                    </Tag>
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {task.scheduledAt}
                    </span>
                  </div>

                  <div className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 pr-3">
                        <h3 className="text-base font-bold text-gray-900">{task.title}</h3>
                        <Tag color="orange" size="sm" className="mt-1">
                          {task.vehicleType}
                        </Tag>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">运费</p>
                        <p className="text-xl font-bold text-orange-600">¥{task.price}</p>
                      </div>
                    </div>

                    {task.progress && (
                      <div className="mb-3 flex items-center gap-2 px-3 py-2 bg-orange-50 rounded-xl">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-500 opacity-75" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500" />
                        </span>
                        <span className="text-xs font-medium text-orange-700">{task.progress}</span>
                      </div>
                    )}

                    <div className="space-y-2 mb-4">
                      <div className="flex items-start gap-2 text-sm text-gray-600">
                        <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5 flex-shrink-0" />
                        <span className="line-clamp-1">{task.pickup}</span>
                      </div>
                      <div className="ml-1 w-px h-4 bg-gray-300" />
                      <div className="flex items-start gap-2 text-sm text-gray-600">
                        <div className="w-2 h-2 rounded-full bg-red-500 mt-1.5 flex-shrink-0" />
                        <span className="line-clamp-1">{task.delivery}</span>
                      </div>
                    </div>

                    {task.status === 'pending' && (
                      <div className="grid grid-cols-2 gap-2">
                        <Button size="sm" variant="secondary">
                          <Camera className="w-4 h-4" />
                          装货拍照
                        </Button>
                        <Button size="sm" variant="primary" className="!bg-orange-600 hover:!bg-orange-700">
                          开始运输
                        </Button>
                      </div>
                    )}

                    {task.status === 'in_transit' && (
                      <div className="grid grid-cols-3 gap-2">
                        <Button size="sm" variant="secondary">
                          联系货主
                        </Button>
                        <Button size="sm" variant="secondary">
                          到达打卡
                        </Button>
                        <Button size="sm" variant="primary" className="!bg-orange-600 hover:!bg-orange-700">
                          <Camera className="w-4 h-4" />
                          卸货拍照
                        </Button>
                      </div>
                    )}

                    {task.status === 'delivered' && (
                      <Button size="sm" variant="primary" fullWidth className="!bg-orange-600 hover:!bg-orange-700">
                        <CheckCircle2 className="w-4 h-4" />
                        确认签收
                      </Button>
                    )}

                    {task.status === 'completed' && (
                      <Button size="sm" variant="secondary" fullWidth>
                        <CheckCircle2 className="w-4 h-4" />
                        查看评价
                      </Button>
                    )}
                  </div>
                </Card>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
