import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Wallet,
  Truck,
  MapPin,
  Star,
  ListTodo,
  Gavel,
  FileText,
  Car,
  Clock,
  ChevronRight,
  TrendingUp,
  Navigation,
  Flame,
} from 'lucide-react'
import Card from '../../components/ui/Card'
import StatCard from '../../components/ui/StatCard'
import Tag from '../../components/ui/Tag'
import Button from '../../components/ui/Button'

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4 },
}

const container = {
  animate: { transition: { staggerChildren: 0.08 } },
}

export default function DriverHome() {
  const navigate = useNavigate()

  const quickActions = [
    { icon: Truck, label: '需求大厅', path: '/driver/orders', color: 'orange' as const, count: 86 },
    { icon: Gavel, label: '竞价中心', path: '/driver/bidding', color: 'amber' as const, count: 12 },
    { icon: ListTodo, label: '我的运单', path: '/driver/tasks', color: 'yellow' as const, count: 4 },
    { icon: Car, label: '车辆管理', path: '/driver/vehicles', color: 'red' as const, count: null },
  ]

  const colorMap: Record<string, string> = {
    orange: 'from-orange-500 to-amber-600',
    amber: 'from-amber-500 to-yellow-600',
    yellow: 'from-yellow-500 to-orange-600',
    red: 'from-red-500 to-orange-600',
  }

  const heatmapPoints = [
    { x: 20, y: 30, size: 18, intensity: 0.9 },
    { x: 55, y: 45, size: 28, intensity: 1 },
    { x: 75, y: 25, size: 14, intensity: 0.6 },
    { x: 35, y: 70, size: 22, intensity: 0.85 },
    { x: 65, y: 75, size: 16, intensity: 0.7 },
    { x: 85, y: 60, size: 12, intensity: 0.5 },
  ]

  return (
    <motion.div
      variants={container}
      initial="initial"
      animate="animate"
      className="p-4 space-y-4"
    >
      <motion.div variants={fadeInUp} className="mb-2">
        <h1 className="text-xl font-bold text-gray-900">早上好，王师傅 👋</h1>
        <p className="text-sm text-gray-500 mt-1">今日货源充足，开始接单吧</p>
      </motion.div>

      <motion.div variants={fadeInUp}>
        <div className="bg-gradient-to-br from-orange-500 via-amber-500 to-yellow-500 rounded-3xl p-5 text-white shadow-xl shadow-orange-500/30 overflow-hidden relative">
          <div className="absolute -right-12 -top-12 w-40 h-40 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -right-4 -bottom-8 w-28 h-28 rounded-full bg-white/10 blur-xl" />
          
          <div className="relative flex items-center justify-between mb-4">
            <div>
              <p className="text-white/80 text-sm font-medium">信用分</p>
              <p className="text-4xl font-extrabold mt-1 tracking-tight">94.2</p>
              <div className="flex items-center gap-1 mt-1">
                <Star className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
                <span className="text-sm text-white/90 font-medium">好评率 97.8%</span>
              </div>
            </div>
            <div className="relative">
              <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" stroke="rgba(255,255,255,0.2)" strokeWidth="8" fill="none" />
                <motion.circle
                  initial={{ strokeDasharray: '0 264' }}
                  animate={{ strokeDasharray: '249 264' }}
                  transition={{ duration: 1.5, delay: 0.3, ease: 'easeOut' }}
                  cx="50"
                  cy="50"
                  r="42"
                  stroke="white"
                  strokeWidth="8"
                  fill="none"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <Navigation className="w-5 h-5 mx-auto text-white/80" />
                  <span className="text-[10px] text-white/70">优秀</span>
                </div>
              </div>
            </div>
          </div>

          <div className="relative grid grid-cols-3 gap-3 pt-4 border-t border-white/20">
            <div>
              <p className="text-white/70 text-xs">今日收入</p>
              <p className="text-lg font-bold mt-0.5">¥680</p>
            </div>
            <div>
              <p className="text-white/70 text-xs">今日单量</p>
              <p className="text-lg font-bold mt-0.5">3 单</p>
            </div>
            <div>
              <p className="text-white/70 text-xs">累计里程</p>
              <p className="text-lg font-bold mt-0.5">2,864km</p>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div variants={fadeInUp}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-gray-900">进行中运单</h2>
          <button onClick={() => navigate('/driver/tasks')} className="text-xs text-orange-600 font-medium flex items-center gap-0.5">
            查看全部 <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <Card className="!p-0 overflow-hidden border-orange-200 shadow-lg shadow-orange-500/10">
          <div className="bg-gradient-to-r from-orange-500/10 to-amber-500/10 px-4 py-2 flex items-center gap-2 border-b border-orange-100">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-500 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-orange-500" />
            </span>
            <span className="text-sm font-semibold text-orange-700">运输中</span>
            <span className="text-xs text-orange-600 ml-auto">预计 45 分钟送达</span>
          </div>
          <div className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="text-base font-bold text-gray-900">电子产品运输</h3>
                <div className="flex items-center gap-2 mt-1">
                  <Tag color="orange" size="sm">4.2米厢货</Tag>
                  <Tag color="yellow" size="sm">2.5吨</Tag>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">运费</p>
                <p className="text-xl font-bold text-orange-600">¥680</p>
              </div>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-start gap-2 text-sm text-gray-600">
                <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5 flex-shrink-0" />
                <span className="line-clamp-1">朝阳区望京SOHO地下车库</span>
              </div>
              <div className="ml-1 w-px h-4 bg-gray-300" />
              <div className="flex items-start gap-2 text-sm text-gray-600">
                <div className="w-2 h-2 rounded-full bg-red-500 mt-1.5 flex-shrink-0" />
                <span className="line-clamp-1">海淀区中关村软件园二期</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button size="md" variant="secondary">
                到达打卡
              </Button>
              <Button size="md" variant="primary" className="!bg-orange-600 hover:!bg-orange-700 shadow-orange-500/25">
                卸货拍照
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>

      <motion.div variants={fadeInUp}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <Flame className="w-4 h-4 text-orange-500" />
            附近货源热力
          </h2>
          <Tag color="orange" size="sm">实时更新</Tag>
        </div>
        <Card className="!p-0 overflow-hidden">
          <div className="relative h-40 bg-gradient-to-br from-orange-50 to-amber-50 overflow-hidden">
            <div className="absolute inset-0 opacity-30">
              <svg className="w-full h-full">
                <defs>
                  <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                    <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#fb923c" strokeWidth="0.5" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
              </svg>
            </div>
            {heatmapPoints.map((point, i) => (
              <motion.div
                key={i}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: point.intensity }}
                transition={{ delay: 0.1 + i * 0.1, type: 'spring' }}
                className="absolute rounded-full"
                style={{
                  left: `${point.x}%`,
                  top: `${point.y}%`,
                  width: point.size * 2,
                  height: point.size * 2,
                  background: `radial-gradient(circle, rgba(249,115,22,${point.intensity}) 0%, rgba(249,115,22,0) 70%)`,
                  transform: 'translate(-50%, -50%)',
                }}
              />
            ))}
            <div className="absolute bottom-3 left-3 right-3 bg-white/90 backdrop-blur rounded-xl px-3 py-2 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-900">周边货源</span>
              <Tag color="orange" size="sm">86 单</Tag>
            </div>
          </div>
        </Card>
      </motion.div>

      <motion.div variants={fadeInUp}>
        <h2 className="text-base font-bold text-gray-900 mb-3">快捷入口</h2>
        <div className="grid grid-cols-4 gap-3">
          {quickActions.map((action) => {
            const Icon = action.icon
            return (
              <motion.button
                key={action.label}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate(action.path)}
                className="relative bg-white rounded-2xl p-3 flex flex-col items-center gap-2 shadow-sm border border-gray-100 hover:shadow-md transition-all"
              >
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${colorMap[action.color]} flex items-center justify-center shadow-lg`}>
                  <Icon className="w-5 h-5 text-white" strokeWidth={2.2} />
                </div>
                <span className="text-xs font-medium text-gray-700">{action.label}</span>
                {action.count !== null && (
                  <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center shadow-md">
                    {action.count}
                  </span>
                )}
              </motion.button>
            )
          })}
        </div>
      </motion.div>

      <motion.div variants={fadeInUp}>
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            title="本周收入"
            value="¥3,680"
            icon={<Wallet className="w-5 h-5" />}
            color="yellow"
            trend="up"
            trendValue="+22%"
          />
          <StatCard
            title="累计里程"
            value="12.6K km"
            icon={<TrendingUp className="w-5 h-5" />}
            color="green"
            trend="up"
            trendValue="+386km"
          />
        </div>
      </motion.div>
    </motion.div>
  )
}
