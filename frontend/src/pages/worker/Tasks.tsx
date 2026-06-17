import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MapPin,
  Clock,
  Camera,
  CheckCircle2,
  PlayCircle,
  Circle,
  XCircle,
} from 'lucide-react'
import Card from '../../components/ui/Card'
import Tag from '../../components/ui/Tag'
import Button from '../../components/ui/Button'

type TaskTab = 'in_progress' | 'pending' | 'completed' | 'cancelled'

interface WorkerTask {
  id: string
  title: string
  type: string
  price: number
  address: string
  scheduledAt: string
  duration: string
  status: TaskTab
  progress?: string
}

const mockTasks: WorkerTask[] = [
  {
    id: '1',
    title: '办公区域搬迁',
    type: '搬家搬运',
    price: 280,
    address: '朝阳区望京SOHO T3 → 海淀区中关村软件园',
    scheduledAt: '今天 14:00',
    duration: '4小时',
    status: 'in_progress',
    progress: '已到达，正在搬运中',
  },
  {
    id: '2',
    title: '居民楼搬家',
    type: '搬家搬运',
    price: 350,
    address: '昌平区回龙观龙泽苑西区',
    scheduledAt: '明天 09:00',
    duration: '5小时',
    status: 'pending',
  },
  {
    id: '3',
    title: '仓库货物装卸',
    type: '装卸搬运',
    price: 260,
    address: '海淀区五道口物流园',
    scheduledAt: '昨天 15:30',
    duration: '3小时',
    status: 'completed',
  },
  {
    id: '4',
    title: '家具组装-衣柜、餐桌',
    type: '家具组装',
    price: 180,
    address: '东城区东直门内大街',
    scheduledAt: '昨天 10:00',
    duration: '2.5小时',
    status: 'completed',
  },
  {
    id: '5',
    title: '展会现场布置',
    type: '展会搭建',
    price: 450,
    address: '顺义区新国展',
    scheduledAt: '06-10 08:00',
    duration: '6小时',
    status: 'cancelled',
  },
]

const tabs: { key: TaskTab; label: string; Icon: typeof Circle }[] = [
  { key: 'in_progress', label: '进行中', Icon: PlayCircle },
  { key: 'pending', label: '待确认', Icon: Clock },
  { key: 'completed', label: '已完成', Icon: CheckCircle2 },
  { key: 'cancelled', label: '已取消', Icon: XCircle },
]

const statusColorMap: Record<TaskTab, string> = {
  in_progress: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  pending: 'bg-amber-100 text-amber-700 border-amber-200',
  completed: 'bg-blue-100 text-blue-700 border-blue-200',
  cancelled: 'bg-gray-100 text-gray-600 border-gray-200',
}

const statusLabelMap: Record<TaskTab, string> = {
  in_progress: '进行中',
  pending: '待确认',
  completed: '已完成',
  cancelled: '已取消',
}

export default function WorkerTasks() {
  const [activeTab, setActiveTab] = useState<TaskTab>('in_progress')

  const filteredTasks = mockTasks.filter((t) => t.status === activeTab)

  return (
    <div className="flex flex-col min-h-screen">
      <div className="sticky top-0 z-30 bg-gray-50/95 backdrop-blur-lg px-4 pt-2 pb-3 border-b border-gray-100">
        <h1 className="text-xl font-bold text-gray-900 mb-3">我的任务</h1>
        <div className="flex items-center gap-1 bg-white rounded-xl p-1 border border-gray-100">
          {tabs.map(({ key, label }) => (
            <motion.button
              key={key}
              whileTap={{ scale: 0.97 }}
              onClick={() => setActiveTab(key)}
              className={`relative flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === key
                  ? 'text-emerald-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {activeTab === key && (
                <motion.div
                  layoutId="taskTabBg"
                  className="absolute inset-0 bg-emerald-50 rounded-lg"
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
                <CheckCircle2 className="w-8 h-8 text-gray-300" />
              </div>
              <p className="text-sm text-gray-500">暂无{statusLabelMap[activeTab]}的任务</p>
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
                        task.status === 'in_progress'
                          ? 'green'
                          : task.status === 'pending'
                          ? 'yellow'
                          : task.status === 'completed'
                          ? 'blue'
                          : 'gray'
                      }
                      size="sm"
                    >
                      {statusLabelMap[task.status]}
                    </Tag>
                    <span className="text-xs text-gray-500">{task.scheduledAt}</span>
                  </div>

                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2.5">
                      <div className="flex-1 pr-3">
                        <h3 className="text-base font-bold text-gray-900">{task.title}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Tag color="green" size="sm">{task.type}</Tag>
                          <span className="text-xs text-gray-500">{task.duration}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">收入</p>
                        <p className="text-xl font-bold text-emerald-600">¥{task.price}</p>
                      </div>
                    </div>

                    {task.progress && (
                      <div className="mb-3 flex items-center gap-2 px-3 py-2 bg-emerald-50 rounded-xl">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                        </span>
                        <span className="text-xs font-medium text-emerald-700">{task.progress}</span>
                      </div>
                    )}

                    <div className="space-y-1.5 mb-4">
                      <div className="flex items-start gap-2 text-sm text-gray-600">
                        <MapPin className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                        <span className="line-clamp-2">{task.address}</span>
                      </div>
                    </div>

                    {task.status === 'in_progress' && (
                      <div className="grid grid-cols-3 gap-2">
                        <Button size="sm" variant="secondary">
                          <Camera className="w-4 h-4" />
                          拍照
                        </Button>
                        <Button size="sm" variant="secondary">
                          到达打卡
                        </Button>
                        <Button size="sm" variant="primary" className="!bg-emerald-600 hover:!bg-emerald-700">
                          提交完工
                        </Button>
                      </div>
                    )}

                    {task.status === 'pending' && (
                      <div className="grid grid-cols-2 gap-2">
                        <Button size="sm" variant="secondary">
                          联系雇主
                        </Button>
                        <Button size="sm" variant="danger">
                          取消任务
                        </Button>
                      </div>
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
