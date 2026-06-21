import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Search, Shield, Building2, Bell, MessageSquare,
  ChevronRight, Clock, AlertTriangle, Users, Bus,
  Stethoscope, Mountain, Home as HomeIcon,
  TrendingDown, CheckCircle, FileCheck,
  Star, PieChart, BellRing,
} from 'lucide-react'
import { hotServices, mockAnnouncements, mockEfficiencyMetrics } from '@/data/mockData'
import { useStore } from '@/store/useStore'

const iconMap: Record<string, React.ElementType> = {
  Shield, Bus, HomeIcon, Stethoscope, Users, Mountain,
}

const typeBadgeStyle: Record<string, string> = {
  '政策公告': 'bg-primary-50 text-primary-500',
  '应急通知': 'bg-emergency-light text-emergency',
  '社区活动': 'bg-success-light text-success',
  '服务通知': 'bg-gold-50 text-gold-600',
}

const statusBadgeStyle: Record<string, string> = {
  '审核中': 'bg-primary-50 text-primary-500',
  '补正中': 'bg-gold-50 text-gold-600',
}

const quickEntries = [
  { label: '政务办事', icon: Shield, to: '/government' },
  { label: '城市服务', icon: Building2, to: '/city-service' },
  { label: '公共服务', icon: Bell, to: '/public-service' },
]

const containerVariants = { hidden: {}, visible: { transition: { staggerChildren: 0.12 } } }
const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } }
const getDaysRemaining = (d: string) => Math.ceil((new Date(d).getTime() - new Date().getTime()) / 86400000)

export default function Home() {
  const toggleElderlyMode = useStore((s) => s.toggleElderlyMode)
  const isAuthenticated = useStore((s) => s.isAuthenticated)
  const user = useStore((s) => s.user)
  const applications = useStore((s) => s.applications)
  const certificates = useStore((s) => s.certificates)
  const announcements = mockAnnouncements.slice(0, 4)

  const inProgressCount = applications.filter(a => a.status !== '已办结').length
  const completedCount = applications.filter(a => a.status === '已办结').length
  const proxyCount = user?.proxyBindings?.length ?? 0
  const todoItems = applications.filter(a => a.status === '补正中' || a.status === '审核中')

  const totalApps = mockEfficiencyMetrics.reduce((sum, m) => sum + m.totalApplications, 0)
  const totalAbnormal = mockEfficiencyMetrics.reduce((sum, m) => sum + m.abnormalInterruptions.length, 0)
  const abnormalRate = ((totalAbnormal / totalApps) * 100).toFixed(1)
  const avgDays = (mockEfficiencyMetrics.reduce((sum, m) => sum + m.avgProcessingDays, 0) / mockEfficiencyMetrics.length).toFixed(1)
  const avgSatisfaction = (mockEfficiencyMetrics.reduce((sum, m) => sum + m.satisfactionAvg, 0) / mockEfficiencyMetrics.length).toFixed(1)

  const dashboardCards = [
    { label: '办件中', value: inProgressCount, icon: FileCheck, color: 'bg-primary-500', bg: 'bg-primary-50', link: '/government' },
    { label: '已办结', value: completedCount, icon: CheckCircle, color: 'bg-success', bg: 'bg-success-light', link: '/government' },
    { label: '证照数', value: certificates.length, icon: Shield, color: 'bg-gold-500', bg: 'bg-gold-50', link: '/profile' },
    { label: '代办绑定', value: proxyCount, icon: Users, color: 'bg-purple-500', bg: 'bg-purple-50', link: '/profile' },
  ]

  const efficiencyCards = [
    { label: '平均办结时效', value: '2.4天', icon: TrendingDown, trend: '较上月↓0.3天', trendColor: 'text-success' },
    { label: '群众满意度', value: '4.8/5', icon: Star, trend: '好评率96.2%', trendColor: 'text-gold-500' },
    { label: '异常中断率', value: '1.2%', icon: AlertTriangle, trend: '较上月↓0.5%', trendColor: 'text-success' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <section className="gradient-hero relative overflow-hidden py-16 pb-24 px-4">
        <motion.div className="container mx-auto text-center" variants={containerVariants} initial="hidden" animate="visible">
          <motion.h1 className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4" variants={itemVariants}>
            无锡市政务民生融合服务平台
          </motion.h1>
          <motion.p className="text-gold-300 text-lg md:text-xl mb-8 tracking-widest" variants={itemVariants}>
            一网通办 · 一码通行 · 一键直达
          </motion.p>
          <motion.div className="max-w-xl mx-auto relative mb-10" variants={itemVariants}>
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input type="text" placeholder="搜索服务事项..." className="w-full pl-12 pr-4 py-3.5 rounded-full bg-white/95 text-gray-700 focus:outline-none focus:ring-2 focus:ring-gold-400 shadow-lg text-base" />
          </motion.div>
          <motion.div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto" variants={containerVariants}>
            {quickEntries.map(({ label, icon: Icon, to }) => (
              <motion.div key={to} variants={itemVariants}>
                <Link to={to} className="glass-card flex flex-col items-center gap-2 py-6 px-4 rounded-xl card-hover group">
                  <Icon className="w-8 h-8 text-gold-400 group-hover:text-gold-300 transition-colors" />
                  <span className="text-white text-sm font-medium">{label}</span>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-gray-50 to-transparent" />
      </section>

      {!isAuthenticated && (
        <section className="container mx-auto px-4 -mt-8 relative z-10 mb-12">
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center border border-gray-100">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full gradient-primary flex items-center justify-center">
              <Shield className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-3">登录解锁更多服务</h2>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              通过统一身份认证（SSO）登录后，您可以在线办理各类政务服务、查询个人证照、
              跟踪办件进度、享受代办服务，全程安全加密，数据可信可溯。
            </p>
            <Link to="/login" className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full gradient-primary text-white font-semibold shadow-lg card-hover">
              <Shield className="w-5 h-5" />
              立即登录
            </Link>
          </div>
        </section>
      )}

      {isAuthenticated && user && (
        <section className="container mx-auto px-4 -mt-8 relative z-10 mb-12">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-full gradient-gold flex items-center justify-center flex-shrink-0">
                <span className="text-xl font-bold text-primary-900">{user.name.charAt(0)}</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold text-gray-800">您好，{user.name}</h3>
                  {user.verified && (
                    <span className="flex items-center gap-1 text-xs bg-primary-50 text-primary-500 px-2 py-0.5 rounded-full">
                      <CheckCircle className="w-3 h-3" />
                      已实名
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-400 mt-1">欢迎回来，今天有 {todoItems.length} 项待办事项</p>
              </div>
            </div>
            <h2 className="section-title mb-4">我的工作台</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {dashboardCards.map(({ label, value, icon: Icon, color, bg, link }) => (
                <Link key={label} to={link} className="block">
                  <div className={`${bg} rounded-xl p-4 card-hover`}>
                    <div className="flex items-start justify-between mb-3">
                      <div className={`${color} w-10 h-10 rounded-lg flex items-center justify-center`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </div>
                    <p className="text-2xl font-bold text-gray-800">{value}</p>
                    <p className="text-sm text-gray-500 mt-1 flex items-center justify-between">
                      {label}
                      <span className="text-xs text-primary-500">查看</span>
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {todoItems.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
              <h2 className="section-title mb-4 flex items-center gap-2">
                <BellRing className="w-5 h-5 text-gold-500" />
                待办提醒
              </h2>
              <div className="space-y-3">
                {todoItems.map((item) => {
                  const days = getDaysRemaining(item.estimatedCompletion)
                  return (
                    <div key={item.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-800">{item.serviceName}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <span className={`badge ${statusBadgeStyle[item.status]}`}>{item.status}</span>
                          <span className="text-xs text-gray-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            剩余 {days} 天
                          </span>
                        </div>
                      </div>
                      <Link to={`/my-applications/${item.id}`} className="flex-shrink-0 px-4 py-2 bg-primary-500 text-white text-sm font-medium rounded-lg card-hover">
                        立即办理
                      </Link>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          <Link to="/admin/monitor" className="block">
            <div className="bg-gradient-to-r from-primary-600 to-primary-500 rounded-2xl shadow-lg p-6 card-hover">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                  <PieChart className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-bold text-lg">管理后台入口</h3>
                  <p className="text-primary-100 text-sm mt-1">效能监测 · 统计报表 · 复核管理</p>
                </div>
                <ChevronRight className="w-5 h-5 text-white/60" />
              </div>
            </div>
          </Link>
        </section>
      )}

      <section className="container mx-auto px-4 mb-12">
        <h2 className="section-title">服务效能</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {efficiencyCards.map(({ label, value, icon: Icon, trend, trendColor }) => (
            <div key={label} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-primary-500" />
                </div>
                <span className={`text-xs ${trendColor}`}>{trend}</span>
              </div>
              <p className="text-2xl font-bold text-gray-800">{value}</p>
              <p className="text-sm text-gray-500 mt-1">{label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container mx-auto px-4 mb-12">
        <h2 className="section-title">热门服务</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {hotServices.map((svc) => {
            const Icon = iconMap[svc.iconName] ?? Shield
            return (
              <Link key={svc.id} to={svc.category === '政务办事' ? `/government/${svc.id}` : svc.category === '城市服务' ? `/city-service/${svc.id.replace('cs-', '')}` : '/public-service'} className="bg-white rounded-xl p-5 flex items-center gap-4 card-hover shadow-sm border border-gray-100">
                <div className="w-12 h-12 rounded-lg gradient-primary flex items-center justify-center flex-shrink-0">
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800 truncate">{svc.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{svc.category}</p>
                </div>
                <span className="badge bg-gold-50 text-gold-600 flex-shrink-0">{svc.dailyCount.toLocaleString()}/日</span>
              </Link>
            )
          })}
        </div>
      </section>

      <section className="container mx-auto px-4 mb-12">
        <h2 className="section-title">公告通知</h2>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y divide-gray-100">
          {announcements.map((ann) => {
            const isEmergency = ann.type === '应急通知'
            return (
              <Link key={ann.id} to="/public-service" className={`flex items-start gap-3 px-5 py-4 hover:bg-gray-50 transition-colors ${isEmergency ? 'border-l-4 border-l-emergency' : ''}`}>
                <span className={`badge mt-0.5 flex-shrink-0 ${typeBadgeStyle[ann.type] ?? 'badge-info'}`}>
                  {isEmergency && <AlertTriangle className="w-3 h-3 mr-1" />}
                  {ann.type}
                </span>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm truncate ${isEmergency ? 'font-semibold text-emergency animate-pulse-slow' : 'text-gray-700'}`}>{ann.title}</p>
                </div>
                <span className="flex items-center gap-1 text-xs text-gray-400 flex-shrink-0 mt-0.5">
                  <Clock className="w-3 h-3" />
                  {ann.date}
                </span>
              </Link>
            )
          })}
        </div>
      </section>

      <section className="container mx-auto px-4 mb-12">
        <Link to="/smart-guide" className="block rounded-xl overflow-hidden card-hover relative">
          <div className="gradient-primary p-6 flex items-center gap-4 animate-glow">
            <div className="w-14 h-14 rounded-full bg-white/15 flex items-center justify-center flex-shrink-0">
              <MessageSquare className="w-7 h-7 text-gold-300" />
            </div>
            <div className="flex-1">
              <h3 className="text-white font-serif text-xl font-bold">智能导办</h3>
              <p className="text-gold-200 text-sm mt-1">有问题？问我！</p>
            </div>
            <ChevronRight className="w-6 h-6 text-white/60" />
          </div>
        </Link>
      </section>

      <Link to="/elderly" className="fixed bottom-6 right-6 z-50 w-16 h-16 rounded-full gradient-gold flex flex-col items-center justify-center shadow-lg animate-bounce-gentle card-hover">
        <span className="text-primary-900 text-xs font-bold leading-tight text-center">长辈模式</span>
      </Link>
    </div>
  )
}
