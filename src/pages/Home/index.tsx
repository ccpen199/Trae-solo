import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Search, Shield, Building2, Bell, MessageSquare,
  ChevronRight, Clock, AlertTriangle, Users, Bus,
  Stethoscope, Mountain, Home as HomeIcon,
} from 'lucide-react'
import { hotServices, mockAnnouncements } from '@/data/mockData'
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

const quickEntries = [
  { label: '政务办事', icon: Shield, to: '/government' },
  { label: '城市服务', icon: Building2, to: '/city-service' },
  { label: '公共服务', icon: Bell, to: '/public-service' },
]

const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
}

export default function Home() {
  const toggleElderlyMode = useStore((s) => s.toggleElderlyMode)
  const announcements = mockAnnouncements.slice(0, 4)

  return (
    <div className="min-h-screen bg-gray-50">
      <section className="gradient-hero relative overflow-hidden py-16 pb-24 px-4">
        <motion.div
          className="container mx-auto text-center"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.h1
            className="font-serif text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4"
            variants={itemVariants}
          >
            无锡市政务民生融合服务平台
          </motion.h1>

          <motion.p
            className="text-gold-300 text-lg md:text-xl mb-8 tracking-widest"
            variants={itemVariants}
          >
            一网通办 · 一码通行 · 一键直达
          </motion.p>

          <motion.div
            className="max-w-xl mx-auto relative mb-10"
            variants={itemVariants}
          >
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="搜索服务事项..."
              className="w-full pl-12 pr-4 py-3.5 rounded-full bg-white/95 text-gray-700
                         focus:outline-none focus:ring-2 focus:ring-gold-400 shadow-lg text-base"
            />
          </motion.div>

          <motion.div
            className="grid grid-cols-3 gap-4 max-w-2xl mx-auto"
            variants={containerVariants}
          >
            {quickEntries.map(({ label, icon: Icon, to }) => (
              <motion.div key={to} variants={itemVariants}>
                <Link
                  to={to}
                  className="glass-card flex flex-col items-center gap-2 py-6 px-4
                             rounded-xl card-hover group"
                >
                  <Icon className="w-8 h-8 text-gold-400 group-hover:text-gold-300
                                   transition-colors" />
                  <span className="text-white text-sm font-medium">{label}</span>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-gray-50 to-transparent" />
      </section>

      <section className="container mx-auto px-4 -mt-8 relative z-10 mb-12">
        <h2 className="section-title">热门服务</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {hotServices.map((svc) => {
            const Icon = iconMap[svc.iconName] ?? Shield
            return (
              <Link
                key={svc.id}
                to={svc.category === '政务办事' ? `/government/${svc.id}` : svc.category === '城市服务' ? `/city-service/${svc.id.replace('cs-', '')}` : '/public-service'}
                className="bg-white rounded-xl p-5 flex items-center gap-4 card-hover
                           shadow-sm border border-gray-100"
              >
                <div className="w-12 h-12 rounded-lg gradient-primary flex items-center
                                justify-center flex-shrink-0">
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800 truncate">{svc.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{svc.category}</p>
                </div>
                <span className="badge bg-gold-50 text-gold-600 flex-shrink-0">
                  {svc.dailyCount.toLocaleString()}/日
                </span>
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
              <Link
                key={ann.id}
                to={`/announcements/${ann.id}`}
                className={`flex items-start gap-3 px-5 py-4 hover:bg-gray-50 transition-colors
                  ${isEmergency ? 'border-l-4 border-l-emergency' : ''}`}
              >
                <span className={`badge mt-0.5 flex-shrink-0 ${typeBadgeStyle[ann.type] ?? 'badge-info'}`}>
                  {isEmergency && <AlertTriangle className="w-3 h-3 mr-1" />}
                  {ann.type}
                </span>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm truncate ${isEmergency ? 'font-semibold text-emergency animate-pulse-slow' : 'text-gray-700'}`}>
                    {ann.title}
                  </p>
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
        <Link
          to="/smart-guide"
          className="block rounded-xl overflow-hidden card-hover relative"
        >
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

      <Link
        to="/elderly"
        onClick={(e) => { e.preventDefault(); toggleElderlyMode() }}
        className="fixed bottom-6 right-6 z-50 w-16 h-16 rounded-full gradient-gold
                   flex flex-col items-center justify-center shadow-lg
                   animate-bounce-gentle card-hover"
      >
        <span className="text-primary-900 text-xs font-bold leading-tight text-center">
          长辈模式
        </span>
      </Link>
    </div>
  )
}
