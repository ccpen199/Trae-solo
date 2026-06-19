import { useState, useMemo, Fragment } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
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
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  Eye,
  ListTodo,
} from 'lucide-react'
import StatCard from '@/components/ui/StatCard'
import { notifications, dashboardMetrics, policyDocuments, timeoutWarnings } from '@/mocks/data'
import { useAppStore } from '@/stores/appStore'
import { cn } from '@/lib/utils'
import type { TimeoutWarning } from '@/types'

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
  const { isLoggedIn, currentRole } = useAppStore()

  function handleNavClick(item: ServiceItem) {
    if (item.role === 'public') {
      navigate(item.path)
      return
    }
    if (!isLoggedIn) {
      navigate(`/login?role=${item.role}`)
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

const metricLinks = [
  '/admin/timeout-warning',
  '/admin',
  '/admin/timeout-warning',
  '/admin',
]

const levelLabels: Record<string, string> = {
  red: '红色预警',
  orange: '橙色预警',
  yellow: '黄色预警',
}

const levelDots: Record<string, string> = {
  red: 'bg-gov-red',
  orange: 'bg-orange-500',
  yellow: 'bg-amber-400',
}

const statusLabels: Record<string, string> = {
  active: '待督办',
  supervised: '督办中',
  resolved: '已办结',
}

const statusBadges: Record<string, string> = {
  active: 'gov-badge-red',
  supervised: 'gov-badge-gold',
  resolved: 'gov-badge-green',
}

const reviewRecords: Record<string, string> = {
  W001: '2026-06-15 张经办已督办，要求3日内办结',
  W002: '2026-06-14 李经办已督办，正在加快办理中',
  W003: '2026-06-16 张经办复查，材料审核中',
  W004: '2026-06-17 王经办督办完成，待申请人补充材料',
  W005: '2026-06-18 李经办初次检查，办理进度正常',
  W006: '2026-06-17 王经办初次检查，材料已初审通过',
}

function getRemainingDaysColor(days: number) {
  if (days <= 0) return 'text-gov-red'
  if (days <= 3) return 'text-orange-500'
  if (days <= 7) return 'text-amber-500'
  return 'text-emerald-500'
}

interface WarningRowProps {
  warning: TimeoutWarning
  isExpanded: boolean
  onToggle: () => void
  index: number
}

function WarningRow({ warning, isExpanded, onToggle, index }: WarningRowProps) {
  const navigate = useNavigate()

  return (
    <motion.tr
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className={cn(
        'cursor-pointer hover:bg-gov-bg-light/60 transition-colors',
        isExpanded && 'bg-gov-bg-light/40'
      )}
      onClick={onToggle}
    >
      <td className="font-medium text-gov-text">{warning.businessType}</td>
      <td className="text-gov-text">{warning.applicantName}</td>
      <td>
        <span className={cn('font-semibold', getRemainingDaysColor(warning.remainingDays))}>
          {warning.remainingDays < 0
            ? `已超时 ${Math.abs(warning.remainingDays)}天`
            : `剩余 ${warning.remainingDays}天`}
        </span>
      </td>
      <td>
        <div className="flex items-center gap-2">
        <span className={cn('w-2 h-2 rounded-full shrink-0', levelDots[warning.level])} />
          <span className="text-sm text-gov-text-secondary">
            {levelLabels[warning.level]}
          </span>
        </div>
      </td>
      <td>
        <button
          onClick={(e) => {
            e.stopPropagation()
            navigate('/admin/timeout-warning')
          }}
          className="text-gov-blue hover:underline text-sm flex items-center gap-1"
        >
          <Eye className="w-3.5 h-3.5" />
          查看详情
        </button>
      </td>
      <td className="w-8 text-center">
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-gov-text-muted mx-auto" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gov-text-muted mx-auto" />
        )}
      </td>
    </motion.tr>
  )
}

interface WarningDetailRow {
  warning: TimeoutWarning
  isExpanded: boolean
}

function WarningDetailRow({ warning, isExpanded }: WarningDetailRow) {
  if (!isExpanded) return null

  return (
    <tr className="bg-gov-bg-light/30">
      <td colSpan={6} className="py-0">
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="px-4 py-4 border-t border-gov-border/30">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="text-gov-text-muted mb-1 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      申请时间
                    </div>
                    <div className="text-gov-text font-medium">{warning.submittedAt}</div>
                  </div>
                  <div>
                    <div className="text-gov-text-muted mb-1 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      办结时限
                    </div>
                    <div className="text-gov-text font-medium">{warning.deadline}</div>
                  </div>
                  <div>
                    <div className="text-gov-text-muted mb-1 flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      当前经办人
                    </div>
                    <div className="text-gov-text font-medium">{warning.handler}</div>
                  </div>
                  <div>
                    <div className="text-gov-text-muted mb-1 flex items-center gap-1">
                      <ListTodo className="w-3.5 h-3.5" />
                      最近复查记录
                    </div>
                    <div className="text-gov-text font-medium">{reviewRecords[warning.warningId] || '暂无记录'}</div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </td>
    </tr>
  )
}

function DashboardSection() {
  const navigate = useNavigate()
  const { isLoggedIn, currentRole } = useAppStore()
  const [expanded, setExpanded] = useState(false)
  const [activeFilter, setActiveFilter] = useState('all')
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null)

  const activeWarnings = timeoutWarnings.filter((w) => w.status === 'active')
  const topWarnings = timeoutWarnings.slice(0, 3)

  const stats = useMemo(() => {
    let red = 0, orange = 0, yellow = 0, supervised = 0
    timeoutWarnings.forEach((w) => {
      if (w.level === 'red') red++
      else if (w.level === 'orange') orange++
      else yellow++
      if (w.status === 'supervised' || w.status === 'resolved') supervised++
    })
    return { red, orange, yellow, supervised }
  }, [])

  const filteredWarnings = useMemo(() => {
    if (activeFilter === 'all') return timeoutWarnings
    if (activeFilter === 'pending') return timeoutWarnings.filter(w => w.status === 'active')
    if (activeFilter === 'supervising') return timeoutWarnings.filter(w => w.status === 'supervised')
    if (activeFilter === 'completed') return timeoutWarnings.filter(w => w.status === 'resolved')
    return timeoutWarnings
  }, [activeFilter])

  const isAdmin = isLoggedIn && currentRole === 'admin'

  const filterTabs = [
    { key: 'all', label: '全部' },
    { key: 'pending', label: '待督办' },
    { key: 'supervising', label: '督办中' },
    { key: 'completed', label: '已办结' },
  ]

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
                <div
                  className="cursor-pointer"
                  onClick={() => navigate(metricLinks[i])}
                >
                  <StatCard
                    label={metric.label}
                    value={metric.value.toLocaleString('zh-CN')}
                    unit={metric.unit}
                    trend={metric.trend}
                    changePercent={metric.changePercent}
                    icon={<Icon className="w-5 h-5 text-gov-blue" />}
                  />
                </div>
                {metric.label === '平均办理时长' && (
                  <p className="text-xs text-gov-text-muted mt-2 px-1 leading-relaxed">
                    含超时督办事项，社保转移超15工作日自动触发预警
                  </p>
                )}
              </motion.div>
            )
          })}
        </div>

        <motion.div custom={5} variants={fadeUp} className="mt-6">
          <div className="gov-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gov-text flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-gov-red" />
                业务预警
                <span className="text-sm font-normal text-gov-text-secondary">
                  当前 {activeWarnings.length} 条活跃预警
                </span>
              </h3>
              <button
                onClick={() => navigate('/admin/timeout-warning')}
                className="text-sm text-gov-blue hover:underline"
              >
                查看全部预警 →
              </button>
            </div>

            {!expanded ? (
              <>
                <div className="space-y-3">
                  {topWarnings.map((w) => (
                    <div
                      key={w.warningId}
                      className="flex items-center gap-3 p-3 rounded-lg bg-gov-bg-light"
                    >
                      <span
                        className={cn(
                          'w-2.5 h-2.5 rounded-full shrink-0',
                          w.level === 'red'
                            ? 'bg-gov-red'
                            : w.level === 'orange'
                              ? 'bg-orange-500'
                              : 'bg-amber-400'
                        )}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gov-text truncate">
                          {w.businessType} - {w.applicantName}
                        </p>
                      </div>
                      <span
                        className={cn(
                          'text-xs font-semibold shrink-0',
                          w.remainingDays < 0
                            ? 'text-gov-red'
                            : w.remainingDays < 3
                              ? 'text-orange-500'
                              : 'text-amber-500'
                        )}
                      >
                        {w.remainingDays < 0
                          ? `已超时 ${Math.abs(w.remainingDays)}天`
                          : `剩余 ${w.remainingDays}天`}
                      </span>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => setExpanded(true)}
                  className="mt-4 w-full py-2 text-sm text-gov-blue hover:bg-gov-bg-light rounded-lg transition-colors flex items-center justify-center gap-1"
                >
                  展开全部
                  <ChevronDown className="w-4 h-4" />
                </button>
              </>
            ) : (
              <AnimatePresence>
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="flex flex-wrap items-center gap-4 mb-4 p-3 bg-gov-bg-light/50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                      <span className="text-sm text-gov-text">
                        黄色预警 <span className="font-bold text-amber-600">{stats.yellow}</span> 条
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                      <span className="text-sm text-gov-text">
                        橙色预警 <span className="font-bold text-orange-500">{stats.orange}</span> 条
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-gov-red" />
                      <span className="text-sm text-gov-text">
                        红色预警 <span className="font-bold text-gov-red">{stats.red}</span> 条
                      </span>
                    </div>
                    <div className="flex items-center gap-2 ml-auto">
                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                      <span className="text-sm text-gov-text">
                        已督办 <span className="font-bold text-emerald-500">{stats.supervised}</span> 条
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-1 mb-4 border-b border-gov-border/50">
                    {filterTabs.map((tab) => (
                      <button
                        key={tab.key}
                        onClick={() => setActiveFilter(tab.key)}
                        className={cn(
                          'px-4 py-2 text-sm font-medium transition-colors relative',
                          activeFilter === tab.key
                            ? 'text-gov-blue'
                            : 'text-gov-text-secondary hover:text-gov-text'
                        )}
                      >
                        {tab.label}
                        {activeFilter === tab.key && (
                          <motion.div
                            layoutId="filterTabIndicator"
                            className="absolute bottom-0 left-0 right-0 h-0.5 bg-gov-blue"
                          />
                        )}
                      </button>
                    ))}
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gov-border/50">
                          <th className="text-left py-3 px-2 font-medium text-gov-text-secondary">业务类型</th>
                          <th className="text-left py-3 px-2 font-medium text-gov-text-secondary">申请人</th>
                          <th className="text-left py-3 px-2 font-medium text-gov-text-secondary">剩余天数</th>
                          <th className="text-left py-3 px-2 font-medium text-gov-text-secondary">预警级别</th>
                          <th className="text-left py-3 px-2 font-medium text-gov-text-secondary">操作</th>
                          <th className="w-8 py-3"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gov-border/30">
                        {filteredWarnings.map((w, i) => (
                          <Fragment key={w.warningId}>
                            <WarningRow
                              warning={w}
                              isExpanded={expandedRowId === w.warningId}
                              onToggle={() => setExpandedRowId(expandedRowId === w.warningId ? null : w.warningId)}
                              index={i}
                            />
                            <WarningDetailRow
                              warning={w}
                              isExpanded={expandedRowId === w.warningId}
                            />
                          </Fragment>
                        ))}
                        {filteredWarnings.length === 0 && (
                          <tr>
                            <td colSpan={6} className="py-8 text-center text-gov-text-muted">
                              暂无预警数据
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-gov-border/30">
                    <button
                      onClick={() => {
                        setExpanded(false)
                        setExpandedRowId(null)
                      }}
                      className="text-sm text-gov-text-secondary hover:text-gov-text flex items-center gap-1"
                    >
                      <ChevronUp className="w-4 h-4" />
                      收起
                    </button>
                    <div className="relative group">
                      <button
                        disabled={!isAdmin}
                        onClick={() => {
                          if (isAdmin) {
                            alert('批量督办功能（演示）')
                          }
                        }}
                        className={cn(
                          'gov-btn-primary !px-4 !py-2 !text-sm flex items-center gap-1.5',
                          !isAdmin && 'opacity-50 cursor-not-allowed'
                        )}
                        title={!isAdmin ? '请以管理员身份登录后使用批量督办功能' : ''}
                      >
                        <ListTodo className="w-4 h-4" />
                        批量督办
                      </button>
                      {!isAdmin && (
                        <div className="absolute -top-8 right-0 bg-gov-text text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                          请以管理员身份登录
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            )}
          </div>
        </motion.div>
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
