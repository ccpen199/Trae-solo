import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Gavel,
  Clock,
  AlertCircle,
  Filter,
  Search,
  ChevronDown,
  Eye,
  ArrowRight,
  Users,
  Truck,
  Home,
  AlertTriangle,
  CheckCircle2,
  CircleDot,
  XCircle,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import {
  getDisputes,
  getDisputeStats,
  type Dispute,
  type DisputeStatus,
  type DisputeSeverity,
  type DisputeType,
  type OrderCategory,
} from '../../services/dispatch.api'

const SEVERITY_CONFIG: Record<DisputeSeverity, { label: string; color: string; bg: string }> = {
  low: { label: '低', color: '#22C55E', bg: 'bg-emerald-500/20' },
  medium: { label: '中', color: '#F59E0B', bg: 'bg-amber-500/20' },
  high: { label: '高', color: '#F97316', bg: 'bg-orange-500/20' },
  urgent: { label: '紧急', color: '#EF4444', bg: 'bg-red-500/20' },
}

const STATUS_CONFIG: Record<DisputeStatus, { label: string; icon: React.ElementType; color: string }> = {
  pending: { label: '待处理', icon: Clock, color: 'text-amber-400 bg-amber-500/15' },
  processing: { label: '处理中', icon: CircleDot, color: 'text-cyan-400 bg-cyan-500/15' },
  closed: { label: '已关闭', icon: CheckCircle2, color: 'text-emerald-400 bg-emerald-500/15' },
}

const TYPE_OPTIONS: { value: DisputeType | 'all'; label: string }[] = [
  { value: 'all', label: '全部类型' },
  { value: 'price', label: '价格纠纷' },
  { value: 'quality', label: '服务质量' },
  { value: 'delay', label: '超时延误' },
  { value: 'damage', label: '物品损坏' },
  { value: 'other', label: '其他' },
]

const SEVERITY_OPTIONS: { value: DisputeSeverity | 'all'; label: string }[] = [
  { value: 'all', label: '全部等级' },
  { value: 'low', label: '低' },
  { value: 'medium', label: '中' },
  { value: 'high', label: '高' },
  { value: 'urgent', label: '紧急' },
]

const STATUS_OPTIONS: { value: DisputeStatus | 'all'; label: string }[] = [
  { value: 'all', label: '全部状态' },
  { value: 'pending', label: '待处理' },
  { value: 'processing', label: '处理中' },
  { value: 'closed', label: '已关闭' },
]

const generateMockDisputes = (): Dispute[] => {
  const data: Dispute[] = []
  const types: DisputeType[] = ['price', 'quality', 'delay', 'damage', 'other']
  const typeLabels: Record<DisputeType, string> = {
    price: '价格纠纷',
    quality: '服务质量',
    delay: '超时延误',
    damage: '物品损坏',
    other: '其他纠纷',
  }
  const severities: DisputeSeverity[] = ['low', 'medium', 'high', 'urgent']
  const statuses: DisputeStatus[] = ['pending', 'processing', 'closed']
  const categories: OrderCategory[] = ['labor', 'vehicle', 'moving']
  const names = ['张伟', '李娜', '王强', '刘洋', '陈静', '杨帆', '赵敏', '周磊']

  for (let i = 0; i < 35; i++) {
    const now = new Date()
    now.setHours(now.getHours() - Math.random() * 72)
    const deadline = new Date(now)
    deadline.setHours(deadline.getHours() + 48 - Math.random() * 60)

    const type = types[i % types.length]
    const severity = severities[Math.floor(Math.random() * severities.length)]
    const status = statuses[Math.floor(Math.random() * statuses.length)]
    const category = categories[i % categories.length]

    data.push({
      id: `dispute-${i + 1}`,
      orderId: `order-${i + 100}`,
      orderNo: `DD202606${String(10 + i).padStart(4, '0')}`,
      orderCategory: category,
      type,
      typeLabel: typeLabels[type],
      status,
      severity,
      priority: i < 3 ? 100 - i : Math.floor(Math.random() * 50),
      complainant: {
        id: `emp-${i}`,
        name: names[i % names.length],
        phone: `138${String(10000000 + i * 137).slice(0, 8)}`,
        role: 'employer',
      },
      respondent: {
        id: i % 2 === 0 ? `worker-${i}` : `driver-${i}`,
        name: names[(i + 3) % names.length],
        phone: `139${String(20000000 + i * 233).slice(0, 8)}`,
        role: i % 2 === 0 ? 'worker' : 'driver',
      },
      claimAmount: Math.round(100 + Math.random() * 4900),
      description: '客户投诉服务过程中存在问题，要求协商处理赔偿事宜。',
      slaDeadline: deadline.toISOString(),
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    })
  }

  return data.sort((a, b) => {
    if (a.severity === 'urgent' && b.severity !== 'urgent') return -1
    if (b.severity === 'urgent' && a.severity !== 'urgent') return 1
    if (a.status === 'pending' && b.status !== 'pending') return -1
    if (b.status === 'pending' && a.status !== 'pending') return 1
    return b.priority - a.priority
  })
}

function calculateSLA(slaDeadline: string): { timeLeft: string; isOverdue: boolean; isUrgent: boolean } {
  const deadline = new Date(slaDeadline).getTime()
  const now = Date.now()
  const diff = deadline - now

  if (diff <= 0) {
    return { timeLeft: '已超时', isOverdue: true, isUrgent: true }
  }

  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

  if (hours < 6) {
    return { timeLeft: `${hours}小时${minutes}分`, isOverdue: false, isUrgent: true }
  }
  if (hours < 24) {
    return { timeLeft: `${hours}小时`, isOverdue: false, isUrgent: false }
  }
  return { timeLeft: `${Math.floor(hours / 24)}天${hours % 24}小时`, isOverdue: false, isUrgent: false }
}

function CategoryIcon({ category }: { category: OrderCategory }) {
  const icons = {
    labor: Users,
    vehicle: Truck,
    moving: Home,
  }
  const Icon = icons[category]
  return <Icon className="w-3.5 h-3.5" />
}

export default function ArbitrationList() {
  const navigate = useNavigate()
  const [searchText, setSearchText] = useState('')
  const [filterType, setFilterType] = useState<DisputeType | 'all'>('all')
  const [filterSeverity, setFilterSeverity] = useState<DisputeSeverity | 'all'>('all')
  const [filterStatus, setFilterStatus] = useState<DisputeStatus | 'all'>('all')
  const [typeDropdownOpen, setTypeDropdownOpen] = useState(false)
  const [severityDropdownOpen, setSeverityDropdownOpen] = useState(false)
  const [statusDropdownOpen, setStatusDropdownOpen] = useState(false)

  const { data: stats } = useQuery({
    queryKey: ['dispute-stats'],
    queryFn: getDisputeStats,
    initialData: { pending: 23, processing: 15, closed: 89, atRisk: 5 },
  })

  const { data: disputes } = useQuery({
    queryKey: ['disputes', filterType, filterSeverity, filterStatus],
    queryFn: () =>
      getDisputes({
        type: filterType === 'all' ? undefined : filterType,
        severity: filterSeverity === 'all' ? undefined : filterSeverity,
        status: filterStatus === 'all' ? undefined : filterStatus,
        pageSize: 50,
      }),
    initialData: { list: generateMockDisputes(), total: 35 },
  })

  const filteredDisputes = disputes.list.filter((d) => {
    if (searchText) {
      const search = searchText.toLowerCase()
      if (
        !d.orderNo.toLowerCase().includes(search) &&
        !d.complainant.name.toLowerCase().includes(search) &&
        !d.respondent.name.toLowerCase().includes(search)
      ) {
        return false
      }
    }
    return true
  })

  const statCards = [
    { label: '待处理', value: stats.pending, icon: Clock, color: '#F59E0B' },
    { label: '处理中', value: stats.processing, icon: CircleDot, color: '#06B6D4' },
    { label: '已关闭', value: stats.closed, icon: CheckCircle2, color: '#22C55E' },
    { label: '48h超时风险', value: stats.atRisk, icon: AlertTriangle, color: '#EF4444' },
  ]

  return (
    <div className="p-6 min-w-[1440px]">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-2xl font-bold text-white">纠纷仲裁工作台</h1>
        <p className="text-slate-400 mt-1">高效处理平台纠纷工单，保障用户权益</p>
      </motion.div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        {statCards.map((stat, idx) => {
          const Icon = stat.icon
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-5 border border-slate-700/50 flex items-center gap-4"
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${stat.color}20`, color: stat.color }}
              >
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-slate-400">{stat.label}</p>
                <p className="text-2xl font-bold text-white font-mono">{stat.value}</p>
              </div>
            </motion.div>
          )
        })}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-5 border border-slate-700/50 mb-4"
      >
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="搜索工单号、用户..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="pl-9 pr-4 py-2.5 bg-slate-900/50 border border-slate-700/50 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-cyan-500/50 transition-colors w-64"
              />
            </div>

            <Filter className="w-4 h-4 text-slate-500" />

            <div className="relative">
              <button
                onClick={() => {
                  setTypeDropdownOpen(!typeDropdownOpen)
                  setSeverityDropdownOpen(false)
                  setStatusDropdownOpen(false)
                }}
                className="flex items-center gap-2 px-4 py-2.5 bg-slate-900/50 border border-slate-700/50 rounded-xl text-sm text-white hover:bg-slate-700/50 transition-colors min-w-[120px]"
              >
                <span>{TYPE_OPTIONS.find((t) => t.value === filterType)?.label}</span>
                <ChevronDown className={`w-4 h-4 text-slate-400 ml-auto transition-transform ${typeDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {typeDropdownOpen && (
                <div className="absolute top-full left-0 mt-2 w-40 bg-slate-800 border border-slate-700 rounded-xl overflow-hidden shadow-xl z-10">
                  {TYPE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => {
                        setFilterType(opt.value)
                        setTypeDropdownOpen(false)
                      }}
                      className={`w-full px-4 py-2.5 text-left text-sm hover:bg-slate-700/50 transition-colors ${
                        opt.value === filterType ? 'text-cyan-400 bg-cyan-500/10' : 'text-white'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="relative">
              <button
                onClick={() => {
                  setSeverityDropdownOpen(!severityDropdownOpen)
                  setTypeDropdownOpen(false)
                  setStatusDropdownOpen(false)
                }}
                className="flex items-center gap-2 px-4 py-2.5 bg-slate-900/50 border border-slate-700/50 rounded-xl text-sm text-white hover:bg-slate-700/50 transition-colors min-w-[120px]"
              >
                <span>{SEVERITY_OPTIONS.find((t) => t.value === filterSeverity)?.label}</span>
                <ChevronDown className={`w-4 h-4 text-slate-400 ml-auto transition-transform ${severityDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {severityDropdownOpen && (
                <div className="absolute top-full left-0 mt-2 w-40 bg-slate-800 border border-slate-700 rounded-xl overflow-hidden shadow-xl z-10">
                  {SEVERITY_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => {
                        setFilterSeverity(opt.value)
                        setSeverityDropdownOpen(false)
                      }}
                      className={`w-full px-4 py-2.5 text-left text-sm hover:bg-slate-700/50 transition-colors ${
                        opt.value === filterSeverity ? 'text-cyan-400 bg-cyan-500/10' : 'text-white'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="relative">
              <button
                onClick={() => {
                  setStatusDropdownOpen(!statusDropdownOpen)
                  setTypeDropdownOpen(false)
                  setSeverityDropdownOpen(false)
                }}
                className="flex items-center gap-2 px-4 py-2.5 bg-slate-900/50 border border-slate-700/50 rounded-xl text-sm text-white hover:bg-slate-700/50 transition-colors min-w-[120px]"
              >
                <span>{STATUS_OPTIONS.find((t) => t.value === filterStatus)?.label}</span>
                <ChevronDown className={`w-4 h-4 text-slate-400 ml-auto transition-transform ${statusDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {statusDropdownOpen && (
                <div className="absolute top-full left-0 mt-2 w-40 bg-slate-800 border border-slate-700 rounded-xl overflow-hidden shadow-xl z-10">
                  {STATUS_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => {
                        setFilterStatus(opt.value)
                        setStatusDropdownOpen(false)
                      }}
                      className={`w-full px-4 py-2.5 text-left text-sm hover:bg-slate-700/50 transition-colors ${
                        opt.value === filterStatus ? 'text-cyan-400 bg-cyan-500/10' : 'text-white'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <span className="text-sm text-slate-400">
            共 <span className="text-white font-mono font-medium">{filteredDisputes.length}</span> 条工单
          </span>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs text-slate-400 bg-slate-900/30 border-b border-slate-700/50">
                <th className="py-3.5 px-5 font-medium w-10"></th>
                <th className="py-3.5 px-4 font-medium">工单号</th>
                <th className="py-3.5 px-4 font-medium">纠纷类型</th>
                <th className="py-3.5 px-4 font-medium">严重程度</th>
                <th className="py-3.5 px-4 font-medium">申诉方</th>
                <th className="py-3.5 px-4 font-medium">被诉方</th>
                <th className="py-3.5 px-4 font-medium text-right">索赔金额</th>
                <th className="py-3.5 px-4 font-medium">SLA倒计时</th>
                <th className="py-3.5 px-4 font-medium">处理状态</th>
                <th className="py-3.5 px-5 font-medium text-right">操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredDisputes.map((dispute, idx) => {
                const sla = calculateSLA(dispute.slaDeadline)
                const severity = SEVERITY_CONFIG[dispute.severity]
                const status = STATUS_CONFIG[dispute.status]
                const StatusIcon = status.icon
                const isUrgentRow = dispute.severity === 'urgent' && dispute.status !== 'closed'

                return (
                  <motion.tr
                    key={dispute.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: idx * 0.015 }}
                    className={`border-b border-slate-700/30 last:border-b-0 transition-colors ${
                      isUrgentRow
                        ? 'bg-red-500/5 hover:bg-red-500/10'
                        : 'hover:bg-slate-900/30'
                    }`}
                  >
                    <td className="py-3.5 px-5">
                      <div className="flex flex-col gap-1">
                        <div
                          className={`w-1.5 h-1.5 rounded-full ${severity.bg.replace('/20', '')}`}
                          style={{ backgroundColor: severity.color }}
                        />
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <CategoryIcon category={dispute.orderCategory} />
                        <span className="text-sm font-mono font-medium text-white">{dispute.orderNo}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium ${
                          dispute.type === 'damage'
                            ? 'bg-red-500/15 text-red-400'
                            : dispute.type === 'price'
                            ? 'bg-amber-500/15 text-amber-400'
                            : dispute.type === 'delay'
                            ? 'bg-orange-500/15 text-orange-400'
                            : dispute.type === 'quality'
                            ? 'bg-purple-500/15 text-purple-400'
                            : 'bg-slate-500/15 text-slate-400'
                        }`}
                      >
                        {dispute.typeLabel}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <div className={`h-2 w-12 rounded-full ${severity.bg}`}>
                          <div
                            className="h-full rounded-full"
                            style={{
                              backgroundColor: severity.color,
                              width: `${dispute.severity === 'low' ? 25 : dispute.severity === 'medium' ? 50 : dispute.severity === 'high' ? 75 : 100}%`,
                            }}
                          />
                        </div>
                        <span className="text-xs font-medium" style={{ color: severity.color }}>
                          {severity.label}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div>
                        <p className="text-sm text-white font-medium">{dispute.complainant.name}</p>
                        <p className="text-xs text-slate-500">
                          {dispute.complainant.role === 'employer' ? '雇主' : dispute.complainant.role === 'worker' ? '工人' : '司机'}
                        </p>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div>
                        <p className="text-sm text-white font-medium">{dispute.respondent.name}</p>
                        <p className="text-xs text-slate-500">
                          {dispute.respondent.role === 'employer' ? '雇主' : dispute.respondent.role === 'worker' ? '工人' : '司机'}
                        </p>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="text-sm font-mono font-semibold text-orange-400">
                        ¥{dispute.claimAmount.toLocaleString()}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5">
                        {sla.isOverdue ? (
                          <XCircle className="w-4 h-4 text-red-500" />
                        ) : sla.isUrgent ? (
                          <AlertCircle className="w-4 h-4 text-orange-500" />
                        ) : (
                          <Clock className="w-4 h-4 text-slate-500" />
                        )}
                        <span
                          className={`text-sm font-mono font-medium ${
                            sla.isOverdue
                              ? 'text-red-400'
                              : sla.isUrgent
                              ? 'text-orange-400'
                              : 'text-slate-300'
                          }`}
                        >
                          {sla.timeLeft}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium ${status.color}`}>
                        <StatusIcon className="w-3 h-3" />
                        {status.label}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {dispute.status !== 'closed' && (
                          <button
                            onClick={() => navigate(`/dispatch/arbitration/${dispute.id}`)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 text-xs font-medium hover:bg-cyan-500/30 transition-colors"
                          >
                            <Gavel className="w-3.5 h-3.5" />
                            处理
                          </button>
                        )}
                        <button
                          onClick={() => navigate(`/dispatch/arbitration/${dispute.id}`)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-700/50 text-slate-300 text-xs font-medium hover:bg-slate-600/50 hover:text-white transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          查看
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  )
}
