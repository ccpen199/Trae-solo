import { useNavigate } from 'react-router-dom'
import {
  Wind, Flame, Waves, Snowflake, Monitor, Wrench, Star, Clock, MapPin,
  Package, Box, AlertTriangle, ShieldCheck, Users, BarChart3, DollarSign,
  ClipboardList, ScanSearch, Video, FileText, Award, TrendingUp,
  Factory, Truck, QrCode, ArrowRight, ChevronRight, Zap
} from 'lucide-react'
import {
  mockServices, mockEngineers, categories, mockWorkOrders,
  mockParts, mockInventoryBatches, mockCredits, mockInspections
} from '@/mocks/data'
import { motion } from 'framer-motion'
import { useAppStore } from '@/stores/useAppStore'

const iconMap: Record<string, React.ElementType> = {
  Wind, Flame, Waves, Snowflake, Monitor, Wrench,
}

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: 'easeOut' },
  }),
}

function UserHome() {
  const navigate = useNavigate()

  return (
    <div>
      <section className="relative overflow-hidden bg-gradient-to-b from-navy-800 via-navy-700 to-navy-600 py-20 grid-bg">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {Array.from({ length: 30 }).map((_, i) => (
            <span
              key={i}
              className="absolute rounded-full bg-cyber-400/20 animate-float"
              style={{
                width: `${Math.random() * 4 + 2}px`,
                height: `${Math.random() * 4 + 2}px`,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 6}s`,
                animationDuration: `${Math.random() * 4 + 4}s`,
              }}
            />
          ))}
        </div>
        <div className="relative z-10 container mx-auto px-4 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-4xl md:text-5xl font-bold mb-4"
          >
            <span className="gradient-text-cyber">智能家修</span>
            <span className="text-navy-50"> 透明服务</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-navy-200 text-lg mb-8 max-w-xl mx-auto"
          >
            AI智能诊断 · 透明报价 · 直播服务 · 品质保障
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.4 }}
            className="flex items-center justify-center gap-4"
          >
            <button onClick={() => navigate('/diagnosis')} className="btn-primary animate-pulse-slow flex items-center gap-2">
              <ScanSearch className="w-4 h-4" />AI智能诊断
            </button>
            <button onClick={() => navigate('/compare')} className="btn-secondary flex items-center gap-2">
              <Zap className="w-4 h-4" />服务比价
            </button>
          </motion.div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-12">
        <motion.h2
          variants={fadeUp} initial="hidden" whileInView="visible" custom={0} viewport={{ once: true }}
          className="text-2xl font-bold mb-6 gradient-text-cyber"
        >
          服务品类
        </motion.h2>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
          {categories.map((cat, i) => {
            const Icon = iconMap[cat.icon]
            return (
              <motion.div
                key={cat.key}
                variants={fadeUp} initial="hidden" whileInView="visible" custom={i + 1} viewport={{ once: true }}
                onClick={() => navigate(`/compare?category=${cat.key}`)}
                className="glass-card glass-card-hover cyber-border flex flex-col items-center gap-2 py-6 px-2 cursor-pointer transition-all"
              >
                {Icon && <Icon className="w-8 h-8 text-cyber-400" />}
                <span className="text-sm text-navy-100">{cat.label}</span>
              </motion.div>
            )
          })}
        </div>
      </section>

      <section className="container mx-auto px-4 py-12">
        <motion.h2
          variants={fadeUp} initial="hidden" whileInView="visible" custom={0} viewport={{ once: true }}
          className="text-2xl font-bold mb-6 gradient-text-cyber"
        >
          热门服务
        </motion.h2>
        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin">
          {mockServices.slice(0, 6).map((svc, i) => {
            const prices = svc.providers.map(p => p.price)
            const minPrice = Math.min(...prices)
            const maxPrice = Math.max(...prices)
            return (
              <motion.div
                key={svc.id}
                variants={fadeUp} initial="hidden" whileInView="visible" custom={i + 1} viewport={{ once: true }}
                onClick={() => navigate('/compare')}
                className="glass-card glass-card-hover cyber-border min-w-[260px] max-w-[280px] p-5 flex flex-col gap-3 shrink-0 cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-navy-50 text-sm">{svc.name}</h3>
                  <span className="tag-cyber">{svc.categoryLabel}</span>
                </div>
                <div className="text-cyber-400 font-bold text-lg">¥{minPrice} - ¥{maxPrice}</div>
                <div className="flex items-center gap-3 text-xs text-navy-200">
                  <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{svc.estimatedDuration}</span>
                  <span className="flex items-center gap-1"><ShieldCheck className="w-3.5 h-3.5" />{svc.warranty}</span>
                </div>
                <button className="btn-primary text-sm py-1.5 mt-auto">立即预约</button>
              </motion.div>
            )
          })}
        </div>
      </section>

      <section className="container mx-auto px-4 py-12">
        <motion.h2
          variants={fadeUp} initial="hidden" whileInView="visible" custom={0} viewport={{ once: true }}
          className="text-2xl font-bold mb-6 gradient-text-cyber"
        >
          推荐工程师
        </motion.h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {mockEngineers.slice(0, 6).map((eng, i) => (
            <motion.div
              key={eng.id}
              variants={fadeUp} initial="hidden" whileInView="visible" custom={i + 1} viewport={{ once: true }}
              className="glass-card glass-card-hover cyber-border p-5 flex gap-4"
            >
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyber-400 to-cyber-600 flex items-center justify-center text-navy-900 font-bold text-lg shrink-0">
                {eng.name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-navy-50">{eng.name}</span>
                  {eng.isOnline && <span className="w-2 h-2 rounded-full bg-cyber-400 animate-pulse" />}
                </div>
                <div className="flex flex-wrap gap-1 mb-2">
                  {eng.skills.slice(0, 2).map(s => (
                    <span key={s} className="tag-cyber">{s}</span>
                  ))}
                </div>
                <div className="flex items-center gap-4 text-xs text-navy-200">
                  <span className="flex items-center gap-1"><Star className="w-3.5 h-3.5 text-warm-400 fill-warm-400" />{eng.rating}</span>
                  <span>完成率 {eng.completionRate}%</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  )
}

function EngineerHome() {
  const navigate = useNavigate()
  const pendingOrders = mockWorkOrders.filter(o => o.status === 'pending')
  const todayEarnings = 1280
  const completedToday = 5

  const quickActions = [
    { label: '智能派单', icon: ClipboardList, count: pendingOrders.length, path: '/engineer', color: 'cyber' },
    { label: '电子工单', icon: FileText, count: mockWorkOrders.length, path: '/engineer', color: 'cyber' },
    { label: '配件扫码', icon: ScanSearch, count: 0, path: '/engineer', color: 'warm' },
  ]

  return (
    <div className="pb-12">
      <section className="relative overflow-hidden bg-gradient-to-br from-navy-800 via-navy-700 to-cyber-900/30 py-16 grid-bg">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center gap-4 mb-4"
          >
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyber-400 to-cyber-600 flex items-center justify-center text-navy-900 font-bold text-2xl">
              张
            </div>
            <div>
              <h1 className="text-2xl font-bold text-navy-50">张明辉工程师</h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="w-2 h-2 rounded-full bg-cyber-400 animate-pulse" />
                <span className="text-sm text-cyber-400">在线接单中</span>
                <span className="tag-cyber text-[10px]">信用等级 S</span>
              </div>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="grid grid-cols-3 gap-4 mt-8"
          >
            <div className="glass-card p-4 text-center">
              <p className="text-2xl font-bold text-cyber-400">¥{todayEarnings}</p>
              <p className="text-xs text-navy-200 mt-1">今日收入</p>
            </div>
            <div className="glass-card p-4 text-center">
              <p className="text-2xl font-bold text-navy-50">{completedToday}</p>
              <p className="text-xs text-navy-200 mt-1">今日完成</p>
            </div>
            <div className="glass-card p-4 text-center">
              <p className="text-2xl font-bold text-warm-400">{pendingOrders.length}</p>
              <p className="text-xs text-navy-200 mt-1">待接工单</p>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-8">
        <h2 className="text-lg font-bold mb-4 gradient-text-cyber">快捷入口</h2>
        <div className="grid grid-cols-3 gap-4">
          {quickActions.map((action, i) => (
            <motion.div
              key={action.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * i, duration: 0.4 }}
              onClick={() => navigate(action.path)}
              className="glass-card glass-card-hover cyber-border p-5 flex flex-col items-center gap-3 cursor-pointer"
            >
              <div className={`w-12 h-12 rounded-xl ${action.color === 'cyber' ? 'bg-cyber-400/20' : 'bg-warm-500/20'} flex items-center justify-center`}>
                <action.icon className={`w-6 h-6 ${action.color === 'cyber' ? 'text-cyber-400' : 'text-warm-500'}`} />
              </div>
              <span className="text-sm font-medium text-navy-50">{action.label}</span>
              {action.count > 0 && (
                <span className="bg-warm-500/20 text-warm-500 text-xs px-2 py-0.5 rounded-full">{action.count}条待处理</span>
              )}
            </motion.div>
          ))}
        </div>
      </section>

      <section className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold gradient-text-cyber">近期工单</h2>
          <button onClick={() => navigate('/engineer')} className="text-xs text-cyber-400 flex items-center gap-1 hover:underline">
            查看全部 <ChevronRight className="w-3 h-3" />
          </button>
        </div>
        <div className="space-y-3">
          {mockWorkOrders.slice(0, 4).map((order, i) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 * i, duration: 0.4 }}
              onClick={() => navigate(`/engineer/order/${order.id}`)}
              className="glass-card glass-card-hover cyber-border p-4 flex items-center gap-4 cursor-pointer"
            >
              <div className="w-10 h-10 rounded-lg bg-cyber-400/20 flex items-center justify-center shrink-0">
                <ClipboardList className="w-5 h-5 text-cyber-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs text-navy-300">{order.orderId}</span>
                  <span className="tag-cyber text-[10px]">{order.categoryLabel}</span>
                </div>
                <p className="text-sm text-navy-50 truncate">{order.faultDescription}</p>
              </div>
              <div className="text-right shrink-0">
                <span className={`text-xs px-2 py-1 rounded-full ${order.status === 'pending' ? 'bg-warm-500/20 text-warm-500' : order.status === 'in_progress' ? 'bg-cyber-400/20 text-cyber-400' : 'bg-green-500/20 text-green-400'}`}>
                  {order.status === 'pending' ? '待处理' : order.status === 'in_progress' ? '进行中' : '已完成'}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  )
}

function SupplierHome() {
  const navigate = useNavigate()
  const pendingBatches = mockInventoryBatches.filter(b => !b.verified).length
  const lowStockParts = mockParts.filter(p => p.stock < 10).length

  const stats = [
    { label: '总配件数', value: mockParts.length, icon: Package, color: 'cyber' },
    { label: '本月入库', value: mockInventoryBatches.length + '批', icon: Box, color: 'cyber' },
    { label: '待验真', value: pendingBatches, icon: AlertTriangle, color: 'warm' },
    { label: '库存预警', value: lowStockParts, icon: ShieldCheck, color: 'warm' },
  ]

  return (
    <div className="pb-12">
      <section className="relative overflow-hidden bg-gradient-to-br from-navy-800 via-navy-700 to-warm-900/20 py-16 grid-bg">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center gap-4"
          >
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-warm-500 to-warm-600 flex items-center justify-center text-white font-bold text-2xl">
              <Factory className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-navy-50">供应商管理平台</h1>
              <p className="text-sm text-navy-200 mt-1">格力原厂配件授权供应商</p>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="container mx-auto px-4 -mt-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * i, duration: 0.4 }}
              className="glass-card cyber-border p-5"
            >
              <s.icon className={`w-8 h-8 ${s.color === 'cyber' ? 'text-cyber-400' : 'text-warm-500'} mb-3`} />
              <p className="text-2xl font-bold text-navy-50">{s.value}</p>
              <p className="text-sm text-navy-200 mt-1">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="container mx-auto px-4 py-8">
        <h2 className="text-lg font-bold mb-4 gradient-text-cyber">快捷操作</h2>
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: '配件管理', icon: Package, path: '/supplier' },
            { label: '入库批次', icon: Truck, path: '/supplier' },
            { label: '库存流转', icon: TrendingUp, path: '/supplier' },
          ].map((action, i) => (
            <motion.div
              key={action.label}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 * i, duration: 0.3 }}
              onClick={() => navigate(action.path)}
              className="glass-card glass-card-hover cyber-border p-5 flex flex-col items-center gap-3 cursor-pointer"
            >
              <div className="w-12 h-12 rounded-xl bg-cyber-400/20 flex items-center justify-center">
                <action.icon className="w-6 h-6 text-cyber-400" />
              </div>
              <span className="text-sm font-medium text-navy-50">{action.label}</span>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold gradient-text-cyber">近期入库</h2>
          <button onClick={() => navigate('/supplier')} className="text-xs text-cyber-400 flex items-center gap-1">
            查看全部 <ChevronRight className="w-3 h-3" />
          </button>
        </div>
        <div className="glass-card cyber-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-cyber-400/10 bg-navy-800/30">
                {['批次号', '配件名称', '数量', '状态'].map(h => (
                  <th key={h} className="text-left px-4 py-2.5 text-navy-200/60 font-medium text-xs">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {mockInventoryBatches.slice(0, 4).map(b => (
                <tr key={b.id} className="border-b border-cyber-400/5 hover:bg-cyber-400/5 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-cyber-400">{b.batchNo}</td>
                  <td className="px-4 py-3 text-navy-50">{b.partName}</td>
                  <td className="px-4 py-3 text-navy-50">{b.quantity}</td>
                  <td className="px-4 py-3">
                    {b.verified ? (
                      <span className="text-cyber-400 text-xs flex items-center gap-1"><QrCode className="w-3 h-3" />已验真</span>
                    ) : (
                      <span className="text-warm-500 text-xs flex items-center gap-1"><Clock className="w-3 h-3" />待验真</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

function AdminHome() {
  const navigate = useNavigate()
  const passCount = mockInspections.filter(i => i.status === 'pass').length
  const passRate = ((passCount / mockInspections.length) * 100).toFixed(1)

  const stats = [
    { label: '总工单数', value: '3,256', icon: BarChart3, trend: '↑12.5%' },
    { label: '在线工程师', value: '127', icon: Users, trend: '↑3.2%' },
    { label: '今日营收', value: '¥48,560', icon: DollarSign, trend: '↑8.1%' },
    { label: 'AI质检通过率', value: passRate + '%', icon: ShieldCheck, trend: '↓1.3%' },
  ]

  const quickAccess = [
    { label: '信用评级', icon: Award, path: '/admin', color: 'cyber' },
    { label: 'AI质检', icon: ShieldCheck, path: '/admin', color: 'cyber' },
    { label: '知识库', icon: FileText, path: '/admin', color: 'warm' },
    { label: '合规存证', icon: FileText, path: '/admin', color: 'warm' },
  ]

  return (
    <div className="pb-12">
      <section className="relative overflow-hidden bg-gradient-to-br from-navy-900 via-navy-800 to-navy-700 py-16 grid-bg">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center gap-4"
          >
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-navy-400 to-navy-600 flex items-center justify-center text-white font-bold text-2xl border-2 border-cyber-400/50">
              <ShieldCheck className="w-8 h-8 text-cyber-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-navy-50">管理后台</h1>
              <p className="text-sm text-navy-200 mt-1">家修互联产业互联网平台</p>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="container mx-auto px-4 -mt-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * i, duration: 0.4 }}
              className="glass-card cyber-border p-5"
            >
              <s.icon className="w-8 h-8 text-cyber-400 mb-3" />
              <p className="text-2xl font-bold text-navy-50">{s.value}</p>
              <div className="flex items-center justify-between mt-1">
                <p className="text-sm text-navy-200">{s.label}</p>
                <span className="text-xs text-cyber-400">{s.trend}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="container mx-auto px-4 py-8">
        <h2 className="text-lg font-bold mb-4 gradient-text-cyber">功能入口</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickAccess.map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 * i, duration: 0.3 }}
              onClick={() => navigate(item.path)}
              className="glass-card glass-card-hover cyber-border p-5 flex flex-col items-center gap-3 cursor-pointer"
            >
              <div className={`w-14 h-14 rounded-xl ${item.color === 'cyber' ? 'bg-cyber-400/20' : 'bg-warm-500/20'} flex items-center justify-center`}>
                <item.icon className={`w-7 h-7 ${item.color === 'cyber' ? 'text-cyber-400' : 'text-warm-500'}`} />
              </div>
              <span className="text-sm font-medium text-navy-50">{item.label}</span>
              <span className="text-[10px] text-navy-300">点击进入</span>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold gradient-text-cyber">工程师信用评级</h2>
          <button onClick={() => navigate('/admin')} className="text-xs text-cyber-400 flex items-center gap-1">
            查看全部 <ChevronRight className="w-3 h-3" />
          </button>
        </div>
        <div className="space-y-3">
          {mockCredits.slice(0, 4).map((c, i) => (
            <motion.div
              key={c.engineerId}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 * i, duration: 0.4 }}
              className="glass-card cyber-border p-4 flex items-center gap-4"
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyber-400 to-cyber-600 flex items-center justify-center text-navy-900 font-bold shrink-0">
                {c.name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-navy-50">{c.name}</span>
                  <span className={`px-2 py-0.5 text-xs rounded border ${c.level === 'S' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' : 'bg-cyber-400/20 text-cyber-400 border-cyber-400/30'}`}>
                    {c.level}级
                  </span>
                </div>
                <div className="flex gap-4 text-xs text-navy-200 mt-1">
                  <span>完成率 {c.completionRate}%</span>
                  <span>评分 {c.avgRating}</span>
                </div>
              </div>
              <div className="text-2xl font-bold text-cyber-400">{c.score}</div>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  )
}

export default function Home() {
  const { currentRole } = useAppStore()

  if (currentRole === 'engineer') return <EngineerHome />
  if (currentRole === 'supplier') return <SupplierHome />
  if (currentRole === 'admin') return <AdminHome />
  return <UserHome />
}
