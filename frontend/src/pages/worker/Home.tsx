import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Wallet,
  TrendingUp,
  CreditScore,
  Star,
  Briefcase,
  ListTodo,
  Receipt,
  Wrench,
  MapPin,
  Clock,
  ChevronRight,
  Pulse,
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

export default function WorkerHome() {
  const navigate = useNavigate()

  const quickActions = [
    { icon: Briefcase, label: '抢单大厅', path: '/worker/orders', color: 'emerald' as const, count: 128 },
    { icon: ListTodo, label: '我的任务', path: '/worker/tasks', color: 'cyan' as const, count: 3 },
    { icon: Receipt, label: '收入明细', path: '/worker/earnings', color: 'green' as const, count: null },
    { icon: Wrench, label: '技能管理', path: '/worker/skills', color: 'teal' as const, count: null },
  ]

  const colorMap: Record<string, string> = {
    emerald: 'from-emerald-500 to-teal-600',
    cyan: 'from-cyan-500 to-blue-600',
    green: 'from-green-500 to-emerald-600',
    teal: 'from-teal-500 to-cyan-600',
  }

  const bgMap: Record<string, string> = {
    emerald: 'bg-emerald-500/10 text-emerald-600',
    cyan: 'bg-cyan-500/10 text-cyan-600',
    green: 'bg-green-500/10 text-green-600',
    teal: 'bg-teal-500/10 text-teal-600',
  }

  return (
    <motion.div
      variants={container}
      initial="initial"
      animate="animate"
      className="p-4 space-y-4"
    >
      <motion.div variants={fadeInUp} className="mb-2">
        <h1 className="text-xl font-bold text-gray-900">早上好，李师傅 👋</h1>
        <p className="text-sm text-gray-500 mt-1">今天也要加油哦，附近有新的需求</p>
      </motion.div>

      <motion.div variants={fadeInUp} className="relative">
        <div className="bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 rounded-3xl p-5 text-white shadow-xl shadow-emerald-500/30 overflow-hidden">
          <div className="absolute -right-12 -top-12 w-40 h-40 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -right-4 -bottom-8 w-28 h-28 rounded-full bg-white/10 blur-xl" />
          
          <div className="relative flex items-center justify-between mb-4">
            <div>
              <p className="text-white/80 text-sm font-medium">信用分</p>
              <p className="text-4xl font-extrabold mt-1 tracking-tight">96.5</p>
              <div className="flex items-center gap-1 mt-1">
                <Star className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
                <span className="text-sm text-white/90 font-medium">好评率 98.6%</span>
              </div>
            </div>
            <div className="relative">
              <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" stroke="rgba(255,255,255,0.2)" strokeWidth="8" fill="none" />
                <motion.circle
                  initial={{ strokeDasharray: '0 264' }}
                  animate={{ strokeDasharray: '255 264' }}
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
                  <Pulse className="w-5 h-5 mx-auto text-white/80" />
                  <span className="text-[10px] text-white/70">良好</span>
                </div>
              </div>
            </div>
          </div>

          <div className="relative grid grid-cols-3 gap-3 pt-4 border-t border-white/20">
            <div>
              <p className="text-white/70 text-xs">今日收入</p>
              <p className="text-lg font-bold mt-0.5">¥386</p>
            </div>
            <div>
              <p className="text-white/70 text-xs">本周收入</p>
              <p className="text-lg font-bold mt-0.5">¥2,480</p>
            </div>
            <div>
              <p className="text-white/70 text-xs">累计收入</p>
              <p className="text-lg font-bold mt-0.5">¥48.6K</p>
            </div>
          </div>
        </div>

        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.8, type: 'spring', stiffness: 200, damping: 15 }}
          className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-lg flex items-center gap-1"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
          </span>
          附近 36 个需求
        </motion.div>
      </motion.div>

      <motion.div variants={fadeInUp}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-gray-900">进行中任务</h2>
          <button onClick={() => navigate('/worker/tasks')} className="text-xs text-emerald-600 font-medium flex items-center gap-0.5">
            查看全部 <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <Card className="!p-0 overflow-hidden border-emerald-200 shadow-lg shadow-emerald-500/10">
          <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 px-4 py-2 flex items-center gap-2 border-b border-emerald-100">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
            <span className="text-sm font-semibold text-emerald-700">进行中</span>
            <span className="text-xs text-emerald-600 ml-auto">预计 2 小时后完工</span>
          </div>
          <div className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="text-base font-bold text-gray-900">办公区域搬迁</h3>
                <div className="flex items-center gap-2 mt-1">
                  <Tag color="green" size="sm">搬家搬运</Tag>
                  <Tag color="cyan" size="sm">需 2 人</Tag>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">预计收入</p>
                <p className="text-xl font-bold text-emerald-600">¥280</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span className="line-clamp-1">朝阳区望京SOHO T3 → 海淀区中关村软件园</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span>今天 14:00 - 18:00</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-4">
              <Button size="md" variant="secondary">
                到达打卡
              </Button>
              <Button size="md" variant="primary" className="!bg-emerald-600 hover:!bg-emerald-700 shadow-emerald-500/25">
                提交完工
              </Button>
            </div>
          </div>
        </Card>
      </motion.div>

      <motion.div variants={fadeInUp}>
        <h2 className="text-base font-bold text-gray-900 mb-3">快捷入口</h2>
        <div className="grid grid-cols-4 gap-3">
          {quickActions.map((action, idx) => {
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
            title="今日收入"
            value="¥386"
            icon={<Wallet className="w-5 h-5" />}
            color="green"
            trend="up"
            trendValue="+18%"
          />
          <StatCard
            title="本周完成"
            value="12 单"
            icon={<TrendingUp className="w-5 h-5" />}
            color="cyan"
            trend="up"
            trendValue="+5"
          />
        </div>
      </motion.div>
    </motion.div>
  )
}
