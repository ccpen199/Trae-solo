import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Search,
  Shield,
  Heart,
  GraduationCap,
  CreditCard,
  Users,
  FileText,
  FileCheck,
  BookOpen,
  Grid3x3,
  Scroll,
  Bell,
  Info,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  Activity,
  Clock,
} from 'lucide-react'
import StatCard from '@/components/ui/StatCard'
import { notifications, dashboardMetrics, policyDocuments } from '@/mocks/data'
import { useAppStore } from '@/stores/appStore'
import { cn } from '@/lib/utils'

type ServiceRole = 'personal' | 'enterprise' | 'admin' | 'public'

interface ServiceItem {
  icon: typeof Shield
  label: string
  path: string
  color: string
  role: ServiceRole
}

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: 'easeOut' },
  }),
}

const serviceItems: ServiceItem[] = [
  { icon: Shield, label: '社保查询', path: '/personal/social-insurance', color: 'bg-gov-blue', role: 'personal' },
  { icon: Heart, label: '医保服务', path: '/personal/medical', color: 'bg-rose-600', role: 'personal' },
  { icon: GraduationCap, label: '考试报名', path: '/personal/exam', color: 'bg-amber-600', role: 'personal' },
  { icon: CreditCard, label: '电子社保卡', path: '/personal/essc', color: 'bg-emerald-600', role: 'personal' },
  { icon: Users, label: '参保申报', path: '/enterprise/insurance-declaration', color: 'bg-violet-600', role: 'enterprise' },
  { icon: FileText, label: '失业金申领', path: '/enterprise/unemployment', color: 'bg-gov-red', role: 'enterprise' },
  { icon: FileCheck, label: '电子合同', path: '/enterprise/e-contract', color: 'bg-cyan-700', role: 'enterprise' },
  { icon: BookOpen, label: '政策查询', path: '/admin/policy-tags', color: 'bg-gov-gold', role: 'admin' },
  { icon: Grid3x3, label: '更多服务', path: '/personal', color: 'bg-gray-600', role: 'personal' },
]

const notificationTypeConfig = {
  policy: { icon: Scroll, color: 'text-gov-blue', bg: 'bg-gov-blue/10' },
  service: { icon: Bell, color: 'text-gov-gold', bg: 'bg-gov-gold/10' },
  system: { icon: Info, color: 'text-gov-red', bg: 'bg-gov-red/10' },
} as const

const particles = Array.from({ length: 20 }, (_, i) => ({
  id: i,
  left: `${Math.random() * 100}%`,
  top: `${Math.random() * 100}%`,
  size: 2 + Math.random() * 4,
  delay: Math.random() * 6,
  duration: 4 + Math.random() * 4,
}))

function HeroSection() {
  const [searchValue, setSearchValue] = useState('')
  const navigate = useNavigate()

  return (
    <section className="relative overflow-hidden bg-hero-gradient min-h-[480px] flex items-center justify-center -mx-6 -mt-6 mb-8">
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.3) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />
      {particles.map((p) => (
        <span
          key={p.id}
          className="absolute rounded-full bg-white/40 pointer-events-none"
          style={{
            left: p.left,
            top: p.top,
            width: p.size,
            height: p.size,
            animation: `particle ${p.duration}s ${p.delay}s infinite ease-in-out`,
          }}
        />
      ))}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-gov-bg-light/30" />
      <div className="relative z-10 max-w-3xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <span className="text-gov-gold text-sm tracking-widest font-medium">
              对接金保工程核心数据库
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-white mb-4 tracking-wide">
            人社服务 一网通办
          </h1>
          <p className="text-white/70 text-base md:text-lg mb-10 leading-relaxed">
            省级人社一体化政务服务平台 · 一卡通用 · 一码通验
          </p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="flex flex-col items-center gap-5"
        >
          <div className="relative w-full max-w-xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gov-text-secondary" />
            <input
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="搜索服务事项、政策法规..."
              className="w-full h-12 pl-12 pr-4 rounded-xl bg-white text-gov-text placeholder:text-gov-text-muted shadow-gov-md focus:outline-none focus:ring-2 focus:ring-gov-gold/50 transition"
            />
          </div>
          <div className="flex gap-4">
            <button
              className="gov-btn-primary !shadow-gov-md !px-8 !py-3 !text-base"
              onClick={() => navigate('/login?role=personal')}
            >
              个人登录
            </button>
            <button
              className="gov-btn-secondary !border-white/40 !text-white !px-8 !py-3 !text-base hover:!bg-white/10"
              onClick={() => navigate('/login?role=enterprise')}
            >
              企业登录
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

function QuickServiceNav() {
  const navigate = useNavigate()
  const { currentRole } = useAppStore()

  function handleNavClick(item: ServiceItem) {
    if (item.role === 'public') {
      navigate(item.path)
      return
    }
    if (currentRole === item.role) {
      navigate(item.path)
    } else {
      navigate(`/login?role=${item.role}`)
    }
  }

  return (
    <section className="mb-12">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-50px' }}
        className="grid grid-cols-3 md:grid-cols-3 gap-5"
      >
        {serviceItems.map((item, i) => (
          <motion.div
            key={item.label}
            custom={i}
            variants={fadeUp}
            onClick={() => handleNavClick(item)}
            className="gov-card flex flex-col items-center gap-3 py-7 px-4 cursor-pointer group"
          >
            <div
              className={cn(
                'w-14 h-14 rounded-full flex items-center justify-center transition-transform duration-300 group-hover:scale-110',
                item.color
              )}
            >
              <item.icon className="w-6 h-6 text-white" />
            </div>
            <span className="text-sm font-medium text-gov-text group-hover:text-gov-blue transition-colors">
              {item.label}
            </span>
          </motion.div>
        ))}
      </motion.div>
    </section>
  )
}

function NotificationsSection() {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  return (
    <section className="mb-12">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-50px' }}
      >
        <motion.h2 custom={0} variants={fadeUp} className="gov-section-title mb-6">
          通知公告
        </motion.h2>
        <motion.div
          custom={1}
          variants={fadeUp}
          className="gov-card divide-y divide-gov-border/50 max-h-[380px] overflow-y-auto"
        >
          {notifications.map((n) => {
            const config = notificationTypeConfig[n.type]
            const Icon = config.icon
            const isExpanded = expandedId === n.id

            return (
              <div
                key={n.id}
                className="px-5 py-4 cursor-pointer hover:bg-gov-bg-light/60 transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : n.id)}
              >
                <div className="flex items-start gap-3">
                  <div className={cn('shrink-0 w-8 h-8 rounded-full flex items-center justify-center', config.bg)}>
                    <Icon className={cn('w-4 h-4', config.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium text-gov-text truncate">
                        {n.title}
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-gov-text-muted shrink-0" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-gov-text-muted shrink-0" />
                      )}
                    </div>
                    <span className="text-xs text-gov-text-muted mt-1">{n.date}</span>
                    {isExpanded && (
                      <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="text-sm text-gov-text-secondary mt-2 leading-relaxed"
                      >
                        {n.content}
                      </motion.p>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </motion.div>
      </motion.div>
    </section>
  )
}

const metricIcons = [TrendingUp, Users, Clock, Activity]

function DashboardSection() {
  return (
    <section className="mb-12">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-50px' }}
      >
        <motion.h2 custom={0} variants={fadeUp} className="gov-section-title mb-6">
          运营数据
        </motion.h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          {dashboardMetrics.map((metric, i) => {
            const Icon = metricIcons[i]
            return (
              <motion.div key={metric.label} custom={i + 1} variants={fadeUp}>
                <StatCard
                  label={metric.label}
                  value={metric.value.toLocaleString('zh-CN')}
                  unit={metric.unit}
                  trend={metric.trend}
                  changePercent={metric.changePercent}
                  icon={<Icon className="w-5 h-5 text-gov-blue" />}
                />
              </motion.div>
            )
          })}
        </div>
      </motion.div>
    </section>
  )
}

function PolicySection() {
  const latestPolicies = useMemo(() => policyDocuments.slice(0, 3), [])

  const tagBadgeMap: Record<string, string> = {
    '人群': 'gov-badge-blue',
    '场景': 'gov-badge-gold',
    '时效': 'gov-badge-green',
  }

  return (
    <section className="mb-12">
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-50px' }}
      >
        <motion.h2 custom={0} variants={fadeUp} className="gov-section-title mb-6">
          政策速递
        </motion.h2>
        <div className="grid gap-5">
          {latestPolicies.map((policy, i) => (
            <motion.div
              key={policy.policyId}
              custom={i + 1}
              variants={fadeUp}
              className="gov-card p-5 flex flex-col gap-3"
            >
              <div className="flex items-start justify-between gap-4">
                <h3 className="text-base font-semibold text-gov-text leading-snug">
                  {policy.title}
                </h3>
                <span className="shrink-0 text-xs text-gov-text-muted">
                  {policy.publishDate}
                </span>
              </div>
              <p className="text-sm text-gov-text-secondary leading-relaxed">
                {policy.summary}
              </p>
              <div className="flex flex-wrap gap-2">
                {policy.tags.map((tag) => (
                  <span key={tag.name} className={tagBadgeMap[tag.category] ?? 'gov-badge-gray'}>
                    {tag.name}
                  </span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  )
}

export default function HomePage() {
  return (
    <div>
      <HeroSection />
      <div className="max-w-6xl mx-auto">
        <QuickServiceNav />
        <NotificationsSection />
        <DashboardSection />
        <PolicySection />
      </div>
      <footer className="py-8 text-center text-xs text-gov-text-muted border-t border-gov-border/50">
        省级人社一体化政务服务平台 &copy; 2026 &nbsp;|&nbsp; 技术支持：金保工程 &nbsp;|&nbsp; 接口规范：国家政务服务平台
      </footer>
    </div>
  )
}
