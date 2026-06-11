import { useState, useEffect, useMemo } from 'react'
import {
  BarChart3,
  Users,
  Clock,
  Star,
  AlertTriangle,
  Snowflake,
  TrendingUp,
  PieChart as PieChartIcon,
  Activity,
  AlertCircle,
  Info,
  Shield,
  Award,
  Gavel,
  MessageSquare,
  Scale,
  ThumbsDown,
  Eye,
  RefreshCw,
  Ban,
  Unlock,
  CheckCircle2,
  XCircle,
  Clock3,
  User,
  ChevronUp,
  ChevronDown,
  History,
  Calendar,
  ShieldCheck,
  FileText,
} from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'
import Modal from '@/components/ui/Modal'
import { useMonitoringStore } from '@/store/useMonitoringStore'
import { mockApi } from '@/mock/api'
import { lawyers as mockLawyers, appeals as mockAppeals, consultations } from '@/mock/data'
import { cn } from '@/lib/utils'
import type { Lawyer, LegalCaseType, Appeal, Consultation } from '@/types'
import {
  computePlatformStats,
  computeLawyerActivities,
  getWarningLawyers,
  type PlatformStats,
  type LawyerActivityExt,
} from '@/utils/platformStats'

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316']

const caseTypeLabels: Record<LegalCaseType, string> = {
  marriage: '婚姻家庭',
  labor: '劳动纠纷',
  debt: '债务纠纷',
  property: '房产纠纷',
  contract: '合同纠纷',
  traffic: '交通事故',
  criminal: '刑事辩护',
  other: '其他',
}

type TabKey = 'monitoring' | 'qualification' | 'appeal' | 'freeze'
type AppealTabKey = 'pending' | 'arbitration' | 'closed'
type ReviewResult = 'unfreeze' | 'permanent_freeze' | 'extend_observation'

interface ConfirmDialogState {
  open: boolean
  title: string
  message: string
  onConfirm: () => void
}

interface LawyerActivity extends LawyerActivityExt {}

interface AuditRecord {
  id: string
  operatedAt: number
  operatorName: string
  lawyerId: string
  lawyerName: string
  operationType: 'unfreeze' | 'permanent_freeze' | 'extend_observation'
  reviewReason: string
  reviewResult: string
  remark: string
}

interface ZeroResponseRecord {
  date: string
  consultationCount: number
  responseCount: number
  avgResponseTime: number | null
}

function CircularProgress({ value, max, size = 48, strokeWidth = 4 }: { value: number; max: number; size?: number; strokeWidth?: number }) {
  const percentage = Math.min(100, Math.round((value / max) * 100))
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (percentage / 100) * circumference
  const color = percentage >= 100 ? '#10B981' : percentage >= 75 ? '#3B82F6' : percentage >= 50 ? '#F59E0B' : '#EF4444'

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#E2E8F0"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-bold" style={{ color }}>{value}</span>
      </div>
    </div>
  )
}

function formatTime(seconds: number) {
  if (seconds < 60) return `${seconds}秒`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}分钟`
  return `${Math.floor(seconds / 3600)}小时${Math.floor((seconds % 3600) / 60)}分`
}

function formatDate(timestamp: number) {
  const date = new Date(timestamp)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

function timeAgo(timestamp: number) {
  const diff = Date.now() - timestamp
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  return `${days}天前`
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<TabKey>('monitoring')
  const [appealTab, setAppealTab] = useState<AppealTabKey>('pending')

  const { stats: monitoringStats, historyStats, fetchStats, freezeLawyer } = useMonitoringStore()
  const [loading, setLoading] = useState(true)
  const [lawyers, setLawyers] = useState<Lawyer[]>([])
  const [freezeModalOpen, setFreezeModalOpen] = useState(false)
  const [selectedLawyer, setSelectedLawyer] = useState<Lawyer | null>(null)
  const [freezeReason, setFreezeReason] = useState('')
  const [freezing, setFreezing] = useState(false)

  const [reviewModalOpen, setReviewModalOpen] = useState(false)
  const [reviewLawyer, setReviewLawyer] = useState<LawyerActivityExt | null>(null)
  const [reviewAction, setReviewAction] = useState<'unfreeze' | 'permanent_freeze'>('unfreeze')
  const [reviewReason, setReviewReason] = useState('')
  const [reviewResult, setReviewResult] = useState<ReviewResult>('unfreeze')
  const [reviewRemark, setReviewRemark] = useState('')
  const [processingReview, setProcessingReview] = useState(false)

  const [expandedTraceId, setExpandedTraceId] = useState<string | null>(null)
  const [auditRecords, setAuditRecords] = useState<AuditRecord[]>([])

  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>({
    open: false,
    title: '',
    message: '',
    onConfirm: () => {},
  })

  const platformStats = useMemo(() => computePlatformStats(), [])
  const warningLawyersList = useMemo(() => getWarningLawyers(), [])

  const allLawyers = useMemo(() => [...mockLawyers, ...lawyers], [lawyers])

  const dedupedAppeals = useMemo(() => {
    const appealMap = new Map<string, Appeal>()
    mockAppeals.forEach((appeal) => {
      appealMap.set(appeal.id, appeal)
    })
    return Array.from(appealMap.values())
  }, [])

  const appeals = dedupedAppeals

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await Promise.all([fetchStats(), mockApi.getLawyers().then(setLawyers)])
      setLoading(false)
    }
    loadData()
  }, [fetchStats])

  const today = new Date().toISOString().split('T')[0]

  const trendData = useMemo(() => {
    const last30Days: { date: string; consultations: number }[] = []
    for (let i = 29; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      const dayStats = historyStats.filter((s) => s.date === dateStr)
      const consultations = dayStats.reduce((sum, s) => sum + s.receivedCount, 0)
      last30Days.push({
        date: `${date.getMonth() + 1}/${date.getDate()}`,
        consultations: consultations + Math.floor(Math.random() * 5),
      })
    }
    return last30Days
  }, [historyStats])

  const caseDistribution = useMemo(() => {
    const types: LegalCaseType[] = ['marriage', 'labor', 'debt', 'property', 'contract', 'traffic', 'criminal', 'other']
    return types.map((type) => ({
      name: caseTypeLabels[type],
      value: Math.floor(Math.random() * 100) + 20,
    }))
  }, [])

  const saturation = platformStats.saturationPct
  const saturationColor = saturation > 80 ? '#EF4444' : saturation > 60 ? '#F59E0B' : '#10B981'

  const lawyerActivities: LawyerActivity[] = useMemo(() => {
    return computeLawyerActivities()
      .sort((a, b) => b.saturation - a.saturation)
  }, [])

  const handleFreeze = async () => {
    if (!selectedLawyer || !freezeReason.trim()) return

    setFreezing(true)
    try {
      const result = await freezeLawyer(selectedLawyer.id, freezeReason.trim())
      if (result) {
        setLawyers((prev) =>
          prev.map((l) => (l.id === selectedLawyer.id ? { ...l, status: 'frozen' as const } : l))
        )
      }
      setFreezeModalOpen(false)
      setSelectedLawyer(null)
      setFreezeReason('')
    } catch (error) {
      console.error('冻结失败:', error)
    } finally {
      setFreezing(false)
    }
  }

  const openFreezeModal = (lawyer: Lawyer) => {
    setSelectedLawyer(lawyer)
    setFreezeReason('')
    setFreezeModalOpen(true)
  }

  const heatmapData = useMemo(() => {
    const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
    const hours = Array.from({ length: 12 }, (_, i) => `${i + 9}:00`)
    return days.map((day) =>
      hours.map((hour) => ({
        day,
        hour,
        value: Math.floor(Math.random() * 100),
      }))
    )
  }, [])

  const getHeatmapColor = (value: number) => {
    if (value > 80) return 'bg-red-500'
    if (value > 60) return 'bg-orange-400'
    if (value > 40) return 'bg-amber-300'
    if (value > 20) return 'bg-yellow-200'
    return 'bg-green-100'
  }

  const qualificationStats = useMemo(() => ({
    total: platformStats.totalLawyers,
    verified: platformStats.verifiedLawyers,
    pendingVerify: platformStats.unverifiedLawyers,
    notQualified: platformStats.creditInsufficientLawyers,
  }), [platformStats])

  const frozenLawyers = useMemo(() => {
    return computeLawyerActivities().filter(l => l.status === 'frozen')
  }, [])

  const warningLawyers = useMemo(() => getWarningLawyers(), [])

  const getConsultation = (consultationId: string): Consultation | undefined => {
    return consultations.find(c => c.id === consultationId)
  }

  const getDispatchModeLabel = (mode: string) => {
    switch (mode) {
      case 'auto': return '系统自动分派'
      case 'manual': return '人工手动分派'
      case 'grab': return '律师抢单'
      default: return '未知分派方式'
    }
  }

  const showConfirmDialog = (title: string, message: string, onConfirm: () => void) => {
    setConfirmDialog({ open: true, title, message, onConfirm })
  }

  const handleConfirm = () => {
    confirmDialog.onConfirm()
    setConfirmDialog({ open: false, title: '', message: '', onConfirm: () => {} })
  }

  const handleCancel = () => {
    setConfirmDialog({ open: false, title: '', message: '', onConfirm: () => {} })
  }

  const generateZeroResponseTimeline = (lawyerId: string): ZeroResponseRecord[] => {
    const records: ZeroResponseRecord[] = []
    const now = new Date()
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)
      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
      records.push({
        date: dateStr,
        consultationCount: 1 + Math.floor(Math.random() * 3),
        responseCount: 0,
        avgResponseTime: null,
      })
    }
    return records
  }

  const getLawyerAuditRecords = (lawyerId: string) => {
    return auditRecords.filter(r => r.lawyerId === lawyerId)
  }

  const calculateFrozenDuration = (updatedAt: number) => {
    const diff = Date.now() - updatedAt
    const days = Math.floor(diff / (24 * 60 * 60 * 1000))
    const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000))
    if (days > 0) {
      return `${days}天${hours}小时`
    }
    return `${hours}小时`
  }

  const openReviewModal = (lawyer: LawyerActivityExt, action: 'unfreeze' | 'permanent_freeze') => {
    setReviewLawyer(lawyer)
    setReviewAction(action)
    setReviewReason('')
    setReviewResult(action === 'unfreeze' ? 'unfreeze' : 'permanent_freeze')
    setReviewRemark('')
    setReviewModalOpen(true)
  }

  const handleReview = async () => {
    if (!reviewLawyer || !reviewReason.trim()) return

    setProcessingReview(true)
    try {
      const auditRecord: AuditRecord = {
        id: `audit-${Date.now()}`,
        operatedAt: Date.now(),
        operatorName: 'admin',
        lawyerId: reviewLawyer.id,
        lawyerName: reviewLawyer.realName,
        operationType: reviewResult,
        reviewReason: reviewReason.trim(),
        reviewResult: reviewResult === 'unfreeze' ? '同意解冻' : reviewResult === 'permanent_freeze' ? '永久冻结' : '延长观察30天',
        remark: reviewRemark.trim(),
      }

      setAuditRecords(prev => [auditRecord, ...prev])

      setReviewModalOpen(false)
      setReviewLawyer(null)
      setReviewReason('')
      setReviewRemark('')
    } catch (error) {
      console.error('处理失败:', error)
    } finally {
      setProcessingReview(false)
    }
  }

  const toggleTrace = (lawyerId: string) => {
    setExpandedTraceId(prev => prev === lawyerId ? null : lawyerId)
  }

  const filteredAppeals = useMemo(() => {
    switch (appealTab) {
      case 'pending':
        return appeals.filter(a => a.status === 'pending')
      case 'arbitration':
        return appeals.filter(a => a.status === 'accepted')
      case 'closed':
        return appeals.filter(a => a.status === 'resolved' || a.status === 'rejected')
      default:
        return appeals
    }
  }, [appeals, appealTab])

  const getAppellantName = (id: string) => {
    if (id === 'user-001') return '张先生'
    return '用户' + id.slice(-3)
  }

  const getLawyerName = (id: string) => {
    const lawyer = allLawyers.find(l => l.id === id)
    return lawyer?.realName || '律师' + id.slice(-3)
  }

  const getConsultationTitle = (consultationId: string) => {
    const titles: Record<string, string> = {
      'consult-001': '公司拖欠3个月工资未发放',
      'consult-002': '朋友借款5万元到期不还',
      'consult-003': '离婚财产分割问题咨询',
      'consult-004': '交通事故赔偿纠纷',
      'consult-005': '房产买卖合同纠纷',
    }
    return titles[consultationId] || '法律咨询'
  }

  if (loading) {
    return (
        <div className="flex h-96 items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent" />
        </div>
    )
  }

  const tabs: { key: TabKey; label: string; icon: any; count?: number }[] = [
    { key: 'monitoring', label: '运营监控', icon: BarChart3 },
    { key: 'qualification', label: '资质核验中心', icon: Shield, count: platformStats.unverifiedLawyers },
    { key: 'appeal', label: '申诉与仲裁', icon: Scale, count: filteredAppeals.filter(a => a.status === 'pending').length },
    { key: 'freeze', label: '冻结复核', icon: Snowflake, count: platformStats.totalFrozen },
  ]

  return (
    <>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-800 mb-2">管理员后台</h1>
          <p className="text-slate-500">平台运营管理与风险控制</p>
        </div>

        <div className="bg-white rounded-2xl p-1.5 shadow-sm mb-6 inline-flex">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all',
                activeTab === tab.key
                  ? 'bg-blue-500 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              )}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className={cn(
                  'px-1.5 py-0.5 rounded-full text-xs',
                  activeTab === tab.key ? 'bg-white/20' : 'bg-slate-100'
                )}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {activeTab === 'monitoring' && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-6">
              <div className="bg-white rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                    <BarChart3 className="h-5 w-5 text-blue-500" />
                  </div>
                  <span className="text-xs text-green-500 font-medium flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    +12%
                  </span>
                </div>
                <p className="text-2xl font-bold text-slate-800">{platformStats.todayConsultations}</p>
                <p className="text-xs text-slate-500 mt-1">今日咨询量</p>
              </div>

              <div className="bg-white rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                    <Users className="h-5 w-5 text-emerald-500" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-slate-800">{platformStats.activeLawyers}</p>
                <p className="text-xs text-slate-500 mt-1">活跃律师数</p>
              </div>

              <div className="bg-white rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                    <Clock className="h-5 w-5 text-amber-500" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-slate-800">{platformStats.avgResponseTime}<span className="text-sm font-normal ml-1">分钟</span></p>
                <p className="text-xs text-slate-500 mt-1">平均响应时长</p>
              </div>

              <div className="bg-white rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                    <Star className="h-5 w-5 text-purple-500" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-slate-800">{platformStats.satisfactionPct}<span className="text-sm font-normal ml-1">%</span></p>
                <p className="text-xs text-slate-500 mt-1">满意度</p>
              </div>

              <div className="bg-white rounded-2xl p-5 shadow-sm col-span-2 md:col-span-4 lg:col-span-1">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-slate-500 mb-1">系统饱和度</p>
                    <p className="text-2xl font-bold" style={{ color: saturationColor }}>
                      {platformStats.saturationPct}%
                    </p>
                    {platformStats.saturationPct > 80 && (
                      <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                        <AlertTriangle className="h-3 w-3" />
                        过载警告
                      </p>
                    )}
                  </div>
                  <div className="relative w-16 h-16">
                    <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke="#E2E8F0"
                        strokeWidth="3"
                      />
                      <path
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        stroke={saturationColor}
                        strokeWidth="3"
                        strokeDasharray={`${platformStats.saturationPct}, 100`}
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-blue-500" />
                    咨询量趋势
                  </h3>
                  <span className="text-xs text-slate-400">最近30天</span>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                      <XAxis dataKey="date" stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#fff',
                          border: 'none',
                          borderRadius: '12px',
                          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="consultations"
                        stroke="#3B82F6"
                        strokeWidth={2.5}
                        dot={false}
                        activeDot={{ r: 6, fill: '#3B82F6' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2 mb-6">
                  <PieChartIcon className="h-5 w-5 text-purple-500" />
                  案由分布
                </h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={caseDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {caseDistribution.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#fff',
                          border: 'none',
                          borderRadius: '12px',
                          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                        }}
                      />
                      <Legend
                        iconType="circle"
                        iconSize={6}
                        wrapperStyle={{ fontSize: '11px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
              <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2 mb-6">
                <Activity className="h-5 w-5 text-orange-500" />
                律师饱和度热力图
              </h3>
              <div className="overflow-x-auto">
                <div className="min-w-[600px]">
                  <div className="flex mb-2">
                    <div className="w-16" />
                    {heatmapData[0]?.map((h) => (
                      <div key={h.hour} className="flex-1 text-center text-xs text-slate-400">
                        {h.hour}
                      </div>
                    ))}
                  </div>
                  {heatmapData.map((dayData, dayIndex) => (
                    <div key={dayData[0].day} className="flex items-center mb-1">
                      <div className="w-16 text-xs text-slate-400">{dayData[0].day}</div>
                      {dayData.map((cell, hourIndex) => (
                        <div
                          key={`${dayIndex}-${hourIndex}`}
                          className={cn(
                            'flex-1 h-8 mx-0.5 rounded-md transition-colors',
                            getHeatmapColor(cell.value)
                          )}
                          title={`${cell.day} ${cell.hour}: ${cell.value}%`}
                        />
                      ))}
                    </div>
                  ))}
                  <div className="flex items-center justify-end gap-2 mt-4">
                    <span className="text-xs text-slate-400">低</span>
                    <div className="flex gap-0.5">
                      <div className="w-4 h-4 rounded bg-green-100" />
                      <div className="w-4 h-4 rounded bg-yellow-200" />
                      <div className="w-4 h-4 rounded bg-amber-300" />
                      <div className="w-4 h-4 rounded bg-orange-400" />
                      <div className="w-4 h-4 rounded bg-red-500" />
                    </div>
                    <span className="text-xs text-slate-400">高</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2">
                  <Users className="h-5 w-5 text-emerald-500" />
                  律师活跃度排名
                </h3>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Info className="h-3.5 w-3.5" />
                  共 {allLawyers.length} 位律师
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="text-left py-3 px-4 text-xs font-medium text-slate-500">律师姓名</th>
                      <th className="text-center py-3 px-4 text-xs font-medium text-slate-500">今日咨询量</th>
                      <th className="text-center py-3 px-4 text-xs font-medium text-slate-500">平均响应时长</th>
                      <th className="text-center py-3 px-4 text-xs font-medium text-slate-500">响应率</th>
                      <th className="text-center py-3 px-4 text-xs font-medium text-slate-500">评分</th>
                      <th className="text-center py-3 px-4 text-xs font-medium text-slate-500">饱和度</th>
                      <th className="text-center py-3 px-4 text-xs font-medium text-slate-500">最后活跃时间</th>
                      <th className="text-center py-3 px-4 text-xs font-medium text-slate-500">状态</th>
                      <th className="text-right py-3 px-4 text-xs font-medium text-slate-500">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lawyerActivities.map((lawyer) => {
                      const isZeroResponse = lawyer.avgResponseTime === 0 && lawyer.todayConsultations > 0
                      const isFrozen = lawyer.status === 'frozen'
                      const isActive = lawyer.status === 'active'

                      return (
                        <tr
                          key={lawyer.id}
                          className={cn(
                            'border-b border-slate-50 transition-colors hover:bg-slate-50',
                            isZeroResponse && 'bg-red-50/50'
                          )}
                        >
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center">
                                <span className="text-sm font-medium text-blue-600">
                                  {lawyer.realName?.[0]}
                                </span>
                              </div>
                              <div>
                                <p className={cn(
                                  'text-sm font-medium',
                                  isZeroResponse ? 'text-red-600' : 'text-slate-800'
                                )}>
                                  {lawyer.realName}
                                </p>
                                <p className="text-xs text-slate-400">{lawyer.lawFirm}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <span className={cn(
                              'text-sm font-semibold',
                              isZeroResponse ? 'text-red-600' : 'text-slate-800'
                            )}>
                              {lawyer.todayConsultations}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <span className={cn(
                              'text-sm',
                              isZeroResponse ? 'text-red-600 font-medium' : 'text-slate-600'
                            )}>
                              {isZeroResponse ? '无响应' : `${lawyer.avgResponseTime}分钟`}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <span className={cn(
                              'text-sm font-medium',
                              lawyer.responseRate >= 80 ? 'text-green-600' :
                              lawyer.responseRate >= 60 ? 'text-amber-600' : 'text-red-600'
                            )}>
                              {lawyer.responseRate}%
                            </span>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                              <span className="text-sm text-slate-800 font-medium">{lawyer.avgRating.toFixed(1)}</span>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center justify-center gap-2">
                              <div className="w-20 h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                  className={cn(
                                    'h-full rounded-full transition-all',
                                    lawyer.saturation > 80 ? 'bg-red-500' :
                                    lawyer.saturation > 60 ? 'bg-amber-500' : 'bg-green-500'
                                  )}
                                  style={{ width: `${lawyer.saturation}%` }}
                                />
                              </div>
                              <span className="text-xs text-slate-500 w-8">{lawyer.saturation}%</span>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <span className="text-sm text-slate-600">
                              {timeAgo(lawyer.lastActiveAt)}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-center">
                            <span className={cn(
                              'px-2.5 py-1 rounded-full text-xs font-medium',
                              isFrozen ? 'bg-slate-100 text-slate-600' :
                              isActive ? 'bg-green-100 text-green-700' :
                              'bg-amber-100 text-amber-700'
                            )}>
                              {isFrozen ? '已冻结' :
                               isActive ? '在线' : '离线'}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-right">
                            {isActive && (
                              <button
                                onClick={() => openFreezeModal(lawyer)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-50 text-red-600 text-xs font-medium hover:bg-red-100 transition-colors"
                              >
                                <Snowflake className="h-3.5 w-3.5" />
                                冻结
                              </button>
                            )}
                            {isFrozen && (
                              <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-500 text-xs font-medium">
                                已冻结
                              </span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-blue-800">自动冻结规则</p>
                    <ul className="text-xs text-blue-600 mt-2 space-y-1">
                      <li>• 律师接单后超过 24 小时未响应，系统自动冻结账号</li>
                      <li>• 连续 3 天日响应率低于 50%，触发人工审核</li>
                      <li>• 信用分低于 800 分，限制接单数量</li>
                      <li>• 每月申诉成立超过 3 次，自动冻结 7 天</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'qualification' && (
          <>
            <div className="mb-6">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Shield className="h-6 w-6 text-blue-500" />
                律师资质核验中心
              </h2>
              <p className="text-sm text-slate-500 mt-1">管理律师执业资质、继续教育学分与信用评级</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-2xl p-5 shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                    <Users className="h-5 w-5 text-blue-500" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-slate-800">{qualificationStats.total}</p>
                <p className="text-xs text-slate-500 mt-1">总律师数</p>
              </div>
              <div className="bg-white rounded-2xl p-5 shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-slate-800">{qualificationStats.verified}</p>
                <p className="text-xs text-slate-500 mt-1">已核验数</p>
              </div>
              <div className="bg-white rounded-2xl p-5 shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                    <Clock3 className="h-5 w-5 text-amber-500" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-slate-800">{qualificationStats.pendingVerify}</p>
                <p className="text-xs text-slate-500 mt-1">待核验数</p>
              </div>
              <div className="bg-white rounded-2xl p-5 shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                    <XCircle className="h-5 w-5 text-red-500" />
                  </div>
                </div>
                <p className="text-2xl font-bold text-slate-800">{qualificationStats.notQualified}</p>
                <p className="text-xs text-slate-500 mt-1">学分不达标数</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="text-left py-4 px-5 text-xs font-medium text-slate-500">律师信息</th>
                      <th className="text-left py-4 px-5 text-xs font-medium text-slate-500">执业证号</th>
                      <th className="text-left py-4 px-5 text-xs font-medium text-slate-500">执业年限</th>
                      <th className="text-center py-4 px-5 text-xs font-medium text-slate-500">继续教育学分</th>
                      <th className="text-center py-4 px-5 text-xs font-medium text-slate-500">信用评分</th>
                      <th className="text-center py-4 px-5 text-xs font-medium text-slate-500">状态</th>
                      <th className="text-right py-4 px-5 text-xs font-medium text-slate-500">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lawyerActivities.map((lawyer) => (
                      <tr key={lawyer.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <span className="text-sm font-medium text-blue-600">
                                {lawyer.realName?.[0]}
                              </span>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-slate-800">{lawyer.realName}</p>
                              <p className="text-xs text-slate-500">{lawyer.lawFirm}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-slate-700 font-mono">{lawyer.licenseNumber}</span>
                            {lawyer.licenseVerified && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-50 text-green-700 text-xs font-medium">
                                <CheckCircle2 className="h-3 w-3" />
                                司法部API核验通过
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-5">
                          <div>
                            <div className="flex items-center gap-2">
                              <Award className="h-4 w-4 text-amber-500" />
                              <span className="text-sm text-slate-800 font-medium">{lawyer.practiceYears}年</span>
                            </div>
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {lawyer.expertise.slice(0, 3).map((exp) => (
                                <span key={exp} className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 text-xs">
                                  {caseTypeLabels[exp]}
                                </span>
                              ))}
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-5">
                          <div className="flex items-center justify-center gap-3">
                            <CircularProgress value={lawyer.continuingEducationCredits} max={40} />
                            <div>
                              <p className="text-sm font-medium text-slate-800">{lawyer.continuingEducationCredits}/40</p>
                              <p className="text-xs text-slate-500">
                                {lawyer.continuingEducationCredits >= 40 ? '已达标' : `还差${40 - lawyer.continuingEducationCredits}学分`}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-5 text-center">
                          <div className="flex flex-col items-center">
                            <span className={cn(
                              'text-lg font-bold',
                              lawyer.creditScore >= 900 ? 'text-green-600' :
                              lawyer.creditScore >= 800 ? 'text-blue-600' :
                              lawyer.creditScore >= 700 ? 'text-amber-600' : 'text-red-600'
                            )}>
                              {lawyer.creditScore}
                            </span>
                            <span className="text-xs text-slate-500">信用分</span>
                          </div>
                        </td>
                        <td className="py-4 px-5 text-center">
                          <span className={cn(
                            'px-2.5 py-1 rounded-full text-xs font-medium',
                            lawyer.status === 'frozen' ? 'bg-slate-100 text-slate-600' :
                            lawyer.status === 'active' ? 'bg-green-100 text-green-700' :
                            'bg-amber-100 text-amber-700'
                          )}>
                            {lawyer.status === 'frozen' ? '已冻结' :
                             lawyer.status === 'active' ? '正常' : '离线'}
                          </span>
                        </td>
                        <td className="py-4 px-5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 text-xs font-medium hover:bg-blue-100 transition-colors">
                              <Eye className="h-3.5 w-3.5" />
                              查看详情
                            </button>
                            <button className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-50 text-amber-600 text-xs font-medium hover:bg-amber-100 transition-colors">
                              <RefreshCw className="h-3.5 w-3.5" />
                              学分复查
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {activeTab === 'appeal' && (
          <>
            <div className="mb-6">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Scale className="h-6 w-6 text-purple-500" />
                纠纷处理中心
              </h2>
              <p className="text-sm text-slate-500 mt-1">评价 → 申诉 → 仲裁 三级处理链</p>
            </div>

            <div className="bg-white rounded-2xl p-1.5 shadow-sm mb-6 inline-flex">
              {(['pending', 'arbitration', 'closed'] as AppealTabKey[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setAppealTab(tab)}
                  className={cn(
                    'flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all',
                    appealTab === tab
                      ? 'bg-purple-500 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100'
                  )}
                >
                  {tab === 'pending' && <Clock3 className="h-4 w-4" />}
                  {tab === 'arbitration' && <Gavel className="h-4 w-4" />}
                  {tab === 'closed' && <CheckCircle2 className="h-4 w-4" />}
                  {tab === 'pending' ? '待处理申诉' : tab === 'arbitration' ? '仲裁中' : '已结案'}
                  <span className={cn(
                    'px-1.5 py-0.5 rounded-full text-xs',
                    appealTab === tab ? 'bg-white/20' : 'bg-slate-100'
                  )}>
                    {filteredAppeals.length}
                  </span>
                </button>
              ))}
            </div>

            <div className="space-y-4">
              {filteredAppeals.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 shadow-sm text-center">
                  <MessageSquare className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500">暂无{appealTab === 'pending' ? '待处理' : appealTab === 'arbitration' ? '仲裁中' : '已结案'}申诉</p>
                </div>
              ) : (
                filteredAppeals.map((appeal) => {
                  const consultation = getConsultation(appeal.consultationId)
                  const dispatchMode = consultation?.dispatchMode
                  const dispatchedAt = consultation?.dispatchedAt
                  const acceptedAt = consultation?.acceptedAt

                  return (
                    <div key={appeal.id} className="bg-white rounded-2xl p-6 shadow-sm">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-base font-semibold text-slate-800">
                              {getConsultationTitle(appeal.consultationId)}
                            </h3>
                            <span className={cn(
                              'px-2.5 py-1 rounded-full text-xs font-medium',
                              appeal.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                              appeal.status === 'accepted' ? 'bg-blue-100 text-blue-700' :
                              appeal.status === 'resolved' ? 'bg-green-100 text-green-700' :
                              'bg-slate-100 text-slate-600'
                            )}>
                              {appeal.status === 'pending' ? '待处理' :
                               appeal.status === 'accepted' ? '处理中' :
                               appeal.status === 'resolved' ? '已裁决' : '已驳回'}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-1.5 text-slate-600">
                              <User className="h-4 w-4" />
                              <span>申诉人：{getAppellantName(appeal.appellantId)}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-slate-600">
                              <Award className="h-4 w-4" />
                              <span>被诉律师：{getLawyerName(appeal.respondentId)}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-slate-500">
                              <Clock className="h-4 w-4" />
                              <span>{timeAgo(appeal.createdAt)}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-slate-50 rounded-xl p-4 mb-4">
                        <div className="mb-3">
                          <span className="text-xs font-medium text-slate-500">申诉原因：</span>
                          <span className="text-sm text-slate-800 ml-2">{appeal.reason}</span>
                        </div>
                        <div>
                          <span className="text-xs font-medium text-slate-500">详细描述：</span>
                          <p className="text-sm text-slate-700 mt-1">{appeal.description}</p>
                        </div>
                      </div>

                      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <p className="text-xs text-blue-600 font-medium mb-1">分派状态</p>
                            <p className="text-sm text-slate-800 font-medium">
                              {dispatchMode ? getDispatchModeLabel(dispatchMode) : '未知'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-blue-600 font-medium mb-1">分派时间</p>
                            <p className="text-sm text-slate-800">
                              {dispatchedAt ? formatDate(dispatchedAt) : '-'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-blue-600 font-medium mb-1">律师响应时间</p>
                            <p className="text-sm text-slate-800">
                              {acceptedAt ? formatDate(acceptedAt) : '-'}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2">
                        <button className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors">
                          <Eye className="h-4 w-4" />
                          查看详情
                        </button>
                        {appeal.status === 'pending' && (
                          <>
                            <button
                              onClick={() => showConfirmDialog(
                                '确认驳回申诉',
                                '确定要驳回该申诉吗？此操作将记录在案且无法撤销。',
                                () => console.log('驳回申诉:', appeal.id)
                              )}
                              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-50 text-red-600 text-sm font-medium hover:bg-red-100 transition-colors"
                            >
                              <ThumbsDown className="h-4 w-4" />
                              驳回
                            </button>
                            <button
                              onClick={() => showConfirmDialog(
                                '确认受理仲裁',
                                '确定要受理该仲裁申请吗？受理后将进入仲裁流程。',
                                () => console.log('受理仲裁:', appeal.id)
                              )}
                              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-500 text-white text-sm font-medium hover:bg-purple-600 transition-colors"
                            >
                              <Gavel className="h-4 w-4" />
                              受理仲裁
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </>
        )}

        {activeTab === 'freeze' && (
          <>
            <div className="mb-6">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Snowflake className="h-6 w-6 text-blue-500" />
                零响应律师冻结复核
              </h2>
              <p className="text-sm text-slate-500 mt-1">管理被冻结律师账号，审核解冻申请与永久冻结处理</p>
            </div>

            <div className="mb-8">
              <h3 className="text-base font-semibold text-slate-700 mb-4 flex items-center gap-2">
                <Snowflake className="h-5 w-5 text-blue-500" />
                已冻结律师 ({platformStats.totalFrozen})
              </h3>
              {frozenLawyers.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 shadow-sm text-center">
                  <Snowflake className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                  <p className="text-slate-500">暂无已冻结律师</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {frozenLawyers.map((lawyer) => {
                    const isExpanded = expandedTraceId === lawyer.id
                    const timeline = generateZeroResponseTimeline(lawyer.id)
                    const lawyerAuditRecords = getLawyerAuditRecords(lawyer.id)

                    return (
                      <div key={lawyer.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                        <div className="p-6">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-4 flex-1">
                              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                                <span className="text-lg font-medium text-slate-500">
                                  {lawyer.realName?.[0]}
                                </span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3 mb-1">
                                  <h4 className="text-base font-semibold text-slate-800">{lawyer.realName}</h4>
                                  <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-medium">
                                    已冻结
                                  </span>
                                </div>
                                <p className="text-sm text-slate-500 mb-3">{lawyer.lawFirm}</p>
                                <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 mb-3">
                                  <div className="flex items-center gap-2 text-sm">
                                    <AlertTriangle className="h-4 w-4 text-red-500" />
                                    <span className="font-medium text-red-700">冻结原因：</span>
                                    <span className="text-red-600">连续7天零响应自动冻结</span>
                                  </div>
                                </div>
                                <div className="grid grid-cols-4 gap-6">
                                  <div>
                                    <p className="text-xs text-slate-500 mb-1">冻结时间</p>
                                    <p className="text-sm font-medium text-slate-700">
                                      {formatDate(lawyer.updatedAt)}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-slate-500 mb-1">冻结前响应率</p>
                                    <p className="text-sm font-medium text-red-600">{lawyer.responseRate}%</p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-slate-500 mb-1">平均响应时长</p>
                                    <p className="text-sm font-medium text-slate-700">
                                      {formatTime(lawyer.avgResponseTime)}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-xs text-slate-500 mb-1">最后活跃时间</p>
                                    <p className="text-sm font-medium text-slate-700">
                                      {formatDate(lawyer.lastActiveAt)}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-2 ml-4">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => openReviewModal(lawyer, 'permanent_freeze')}
                                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-50 text-red-600 text-sm font-medium hover:bg-red-100 transition-colors"
                                >
                                  <Ban className="h-4 w-4" />
                                  永久冻结
                                </button>
                                <button
                                  onClick={() => openReviewModal(lawyer, 'unfreeze')}
                                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-green-500 text-white text-sm font-medium hover:bg-green-600 transition-colors"
                                >
                                  <Unlock className="h-4 w-4" />
                                  解冻恢复接单
                                </button>
                              </div>
                              <button
                                onClick={() => toggleTrace(lawyer.id)}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 text-xs font-medium hover:bg-slate-200 transition-colors"
                              >
                                {isExpanded ? (
                                  <><ChevronUp className="h-3.5 w-3.5" /> 收起冻结追溯</>
                                ) : (
                                  <><ChevronDown className="h-3.5 w-3.5" /> 查看冻结追溯</>
                                )}
                              </button>
                            </div>
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="border-t border-slate-100 bg-slate-50 p-6">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                              <div>
                                <h5 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
                                  <History className="h-4 w-4 text-blue-500" />
                                  冻结追溯信息
                                </h5>
                                <div className="space-y-3">
                                  <div className="flex items-start gap-3">
                                    <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                                    <div>
                                      <p className="text-xs font-medium text-slate-500">冻结触发条件</p>
                                      <p className="text-sm text-slate-800">连续7天零响应</p>
                                    </div>
                                  </div>
                                  <div className="flex items-start gap-3">
                                    <Calendar className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                                    <div>
                                      <p className="text-xs font-medium text-slate-500">冻结执行时间</p>
                                      <p className="text-sm text-slate-800">{formatDate(lawyer.updatedAt)}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-start gap-3">
                                    <Clock className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                                    <div>
                                      <p className="text-xs font-medium text-slate-500">已冻结时长</p>
                                      <p className="text-sm text-slate-800">{calculateFrozenDuration(lawyer.updatedAt)}</p>
                                    </div>
                                  </div>
                                </div>

                                <h5 className="text-sm font-semibold text-slate-800 mb-4 mt-6 flex items-center gap-2">
                                  <Activity className="h-4 w-4 text-orange-500" />
                                  系统自动检测时间线
                                </h5>
                                <div className="relative pl-6">
                                  <div className="absolute left-2 top-1 bottom-1 w-0.5 bg-slate-200" />
                                  {timeline.map((record, index) => (
                                    <div key={record.date} className="relative mb-4 last:mb-0">
                                      <div className={cn(
                                        'absolute -left-4 w-3 h-3 rounded-full border-2 border-white',
                                        record.responseCount === 0 ? 'bg-red-500' : 'bg-green-500'
                                      )} />
                                      <div className="bg-white rounded-lg p-3 shadow-sm">
                                        <div className="flex items-center justify-between mb-1">
                                          <span className="text-xs font-medium text-slate-700">{record.date}</span>
                                          <span className={cn(
                                            'text-xs px-1.5 py-0.5 rounded',
                                            record.responseCount === 0 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                                          )}>
                                            {record.responseCount === 0 ? '零响应' : '正常'}
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-4 text-xs text-slate-500">
                                          <span>咨询数: {record.consultationCount}</span>
                                          <span>响应数: {record.responseCount}</span>
                                          <span>响应时长: {record.avgResponseTime ? formatTime(record.avgResponseTime) : '-'}</span>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              <div>
                                <h5 className="text-sm font-semibold text-slate-800 mb-4 flex items-center gap-2">
                                  <ShieldCheck className="h-4 w-4 text-purple-500" />
                                  审计记录
                                </h5>
                                {lawyerAuditRecords.length === 0 ? (
                                  <div className="bg-white rounded-xl p-8 text-center">
                                    <FileText className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                                    <p className="text-sm text-slate-500">暂无审计记录</p>
                                  </div>
                                ) : (
                                  <div className="space-y-3">
                                    {lawyerAuditRecords.map((record) => (
                                      <div key={record.id} className="bg-white rounded-xl p-4 shadow-sm">
                                        <div className="flex items-center justify-between mb-2">
                                          <span className="text-xs font-medium text-slate-700">
                                            {formatDate(record.operatedAt)}
                                          </span>
                                          <span className={cn(
                                            'text-xs px-2 py-0.5 rounded-full font-medium',
                                            record.operationType === 'unfreeze' ? 'bg-green-100 text-green-700' :
                                            record.operationType === 'permanent_freeze' ? 'bg-red-100 text-red-700' :
                                            'bg-amber-100 text-amber-700'
                                          )}>
                                            {record.reviewResult}
                                          </span>
                                        </div>
                                        <div className="space-y-1.5 text-xs">
                                          <div className="flex items-start gap-2">
                                            <span className="text-slate-500 w-16 flex-shrink-0">操作管理员:</span>
                                            <span className="text-slate-800">{record.operatorName}</span>
                                          </div>
                                          <div className="flex items-start gap-2">
                                            <span className="text-slate-500 w-16 flex-shrink-0">复核理由:</span>
                                            <span className="text-slate-800">{record.reviewReason}</span>
                                          </div>
                                          {record.remark && (
                                            <div className="flex items-start gap-2">
                                              <span className="text-slate-500 w-16 flex-shrink-0">处理备注:</span>
                                              <span className="text-slate-800">{record.remark}</span>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <div>
              <h3 className="text-base font-semibold text-slate-700 mb-4 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                待观察区 — 响应率低于60%的活跃律师 ({warningLawyers.length})
              </h3>
              {warningLawyers.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 shadow-sm text-center">
                  <CheckCircle2 className="h-12 w-12 text-green-300 mx-auto mb-3" />
                  <p className="text-slate-500">所有活跃律师响应率正常</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {warningLawyers.map((lawyer) => (
                    <div key={lawyer.id} className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                            <span className="text-sm font-medium text-amber-700">
                              {lawyer.realName?.[0]}
                            </span>
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-slate-800">{lawyer.realName}</p>
                              <span className="px-2 py-0.5 rounded-full bg-amber-200 text-amber-800 text-xs font-medium">
                                预警
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">{lawyer.lawFirm}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-right">
                            <p className="text-xs text-slate-500">响应率</p>
                            <p className="text-base font-bold text-amber-600">{lawyer.responseRate}%</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-slate-500">平均响应</p>
                            <p className="text-sm font-medium text-slate-700">
                              {formatTime(lawyer.avgResponseTime)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-slate-500">最后活跃</p>
                            <p className="text-sm font-medium text-slate-700">
                              {timeAgo(lawyer.lastActiveAt)}
                            </p>
                          </div>
                          <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white text-slate-600 text-xs font-medium hover:bg-slate-50 transition-colors border border-amber-200">
                            <Eye className="h-3.5 w-3.5" />
                            监控详情
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        <Modal
          open={freezeModalOpen}
          onClose={() => setFreezeModalOpen(false)}
          title="确认冻结律师账号"
          size="md"
          footer={
            <>
              <button
                onClick={() => setFreezeModalOpen(false)}
                className="px-4 py-2 rounded-xl text-sm text-slate-600 hover:bg-slate-100 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleFreeze}
                disabled={!freezeReason.trim() || freezing}
                className={cn(
                  'px-4 py-2 rounded-xl text-sm font-medium transition-colors',
                  freezeReason.trim() && !freezing
                    ? 'bg-red-500 text-white hover:bg-red-600'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                )}
              >
                {freezing ? '处理中...' : '确认冻结'}
              </button>
            </>
          }
        >
          {selectedLawyer && (
            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-red-800">冻结警告</p>
                    <p className="text-xs text-red-600 mt-1">
                      冻结后，律师 {selectedLawyer.realName} 将无法接收新咨询，且会影响其信用评级。
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-sm font-medium text-blue-600">
                    {selectedLawyer.realName?.[0]}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-800">{selectedLawyer.realName} 律师</p>
                  <p className="text-xs text-slate-500">{selectedLawyer.lawFirm}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  冻结原因 <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={freezeReason}
                  onChange={(e) => setFreezeReason(e.target.value)}
                  placeholder="请输入冻结原因..."
                  rows={3}
                  className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-red-500 focus:ring-2 focus:ring-red-100"
                />
              </div>
            </div>
          )}
        </Modal>

        <Modal
          open={reviewModalOpen}
          onClose={() => setReviewModalOpen(false)}
          title={reviewAction === 'unfreeze' ? '复核：解冻恢复接单' : '复核：永久冻结'}
          size="lg"
          footer={
            <>
              <button
                onClick={() => setReviewModalOpen(false)}
                className="px-4 py-2 rounded-xl text-sm text-slate-600 hover:bg-slate-100 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleReview}
                disabled={!reviewReason.trim() || processingReview}
                className={cn(
                  'px-4 py-2 rounded-xl text-sm font-medium transition-colors',
                  reviewReason.trim() && !processingReview
                    ? reviewAction === 'unfreeze'
                      ? 'bg-green-500 text-white hover:bg-green-600'
                      : 'bg-red-500 text-white hover:bg-red-600'
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                )}
              >
                {processingReview ? '处理中...' : '确认处理'}
              </button>
            </>
          }
        >
          {reviewLawyer && (
            <div className="space-y-5">
              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl">
                <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center">
                  <span className="text-xl font-medium text-blue-600">
                    {reviewLawyer.realName?.[0]}
                  </span>
                </div>
                <div>
                  <h4 className="text-base font-semibold text-slate-800">{reviewLawyer.realName}</h4>
                  <p className="text-sm text-slate-500">{reviewLawyer.lawFirm}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-medium">
                      已冻结
                    </span>
                    <span className="text-xs text-slate-500">
                      已冻结 {calculateFrozenDuration(reviewLawyer.updatedAt)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-red-50 border border-red-100 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-red-800">冻结原因（只读）</p>
                    <p className="text-sm text-red-600 mt-1">连续7天零响应自动冻结</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="bg-slate-50 rounded-xl p-4 text-center">
                  <p className="text-xs text-slate-500 mb-1">冻结前响应率</p>
                  <p className="text-lg font-bold text-red-600">{reviewLawyer.responseRate}%</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-4 text-center">
                  <p className="text-xs text-slate-500 mb-1">平均响应时长</p>
                  <p className="text-lg font-bold text-slate-700">{formatTime(reviewLawyer.avgResponseTime)}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-4 text-center">
                  <p className="text-xs text-slate-500 mb-1">最后活跃时间</p>
                  <p className="text-sm font-bold text-slate-700">{formatDate(reviewLawyer.lastActiveAt)}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  复核理由 <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={reviewReason}
                  onChange={(e) => setReviewReason(e.target.value)}
                  placeholder="请输入复核理由..."
                  rows={3}
                  className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">
                  处理结果 <span className="text-red-500">*</span>
                </label>
                <div className="space-y-2">
                  <label className={cn(
                    'flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all',
                    reviewResult === 'unfreeze'
                      ? 'border-green-500 bg-green-50'
                      : 'border-slate-200 hover:border-slate-300'
                  )}>
                    <input
                      type="radio"
                      name="reviewResult"
                      value="unfreeze"
                      checked={reviewResult === 'unfreeze'}
                      onChange={(e) => setReviewResult(e.target.value as ReviewResult)}
                      className="w-4 h-4 text-green-600 focus:ring-green-500"
                    />
                    <div>
                      <p className={cn(
                        'text-sm font-medium',
                        reviewResult === 'unfreeze' ? 'text-green-700' : 'text-slate-700'
                      )}>
                        同意解冻
                      </p>
                      <p className="text-xs text-slate-500">恢复律师接单权限，解除冻结状态</p>
                    </div>
                  </label>

                  <label className={cn(
                    'flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all',
                    reviewResult === 'permanent_freeze'
                      ? 'border-red-500 bg-red-50'
                      : 'border-slate-200 hover:border-slate-300'
                  )}>
                    <input
                      type="radio"
                      name="reviewResult"
                      value="permanent_freeze"
                      checked={reviewResult === 'permanent_freeze'}
                      onChange={(e) => setReviewResult(e.target.value as ReviewResult)}
                      className="w-4 h-4 text-red-600 focus:ring-red-500"
                    />
                    <div>
                      <p className={cn(
                        'text-sm font-medium',
                        reviewResult === 'permanent_freeze' ? 'text-red-700' : 'text-slate-700'
                      )}>
                        永久冻结
                      </p>
                      <p className="text-xs text-slate-500">永久冻结律师账号，禁止再次接单</p>
                    </div>
                  </label>

                  <label className={cn(
                    'flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all',
                    reviewResult === 'extend_observation'
                      ? 'border-amber-500 bg-amber-50'
                      : 'border-slate-200 hover:border-slate-300'
                  )}>
                    <input
                      type="radio"
                      name="reviewResult"
                      value="extend_observation"
                      checked={reviewResult === 'extend_observation'}
                      onChange={(e) => setReviewResult(e.target.value as ReviewResult)}
                      className="w-4 h-4 text-amber-600 focus:ring-amber-500"
                    />
                    <div>
                      <p className={cn(
                        'text-sm font-medium',
                        reviewResult === 'extend_observation' ? 'text-amber-700' : 'text-slate-700'
                      )}>
                        延长观察30天
                      </p>
                      <p className="text-xs text-slate-500">继续冻结30天观察期，期满后自动复核</p>
                    </div>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  处理备注 <span className="text-slate-400 text-xs font-normal">（可选）</span>
                </label>
                <textarea
                  value={reviewRemark}
                  onChange={(e) => setReviewRemark(e.target.value)}
                  placeholder="请输入处理备注..."
                  rows={2}
                  className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>
            </div>
          )}
        </Modal>

        <Modal
          open={confirmDialog.open}
          onClose={handleCancel}
          title={confirmDialog.title}
          size="sm"
          footer={
            <>
              <button
                onClick={handleCancel}
                className="px-4 py-2 rounded-xl text-sm text-slate-600 hover:bg-slate-100 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleConfirm}
                className="px-4 py-2 rounded-xl text-sm font-medium bg-blue-500 text-white hover:bg-blue-600 transition-colors"
              >
                确认
              </button>
            </>
          }
        >
          <div className="py-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-6 w-6 text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-slate-600">{confirmDialog.message}</p>
            </div>
          </div>
        </Modal>
      </div>
    </>
  )
}
