import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '@/lib/api'
import { useAuth } from '@/stores/auth'
import {
  Newspaper, MessageSquare, CheckCircle, Clock, Target, Star,
  AlertTriangle, AlertOctagon, Building2, TrendingUp, Eye,
  BarChart3, PieChart, AlertCircle, User, Calendar, ChevronRight,
  RefreshCw, CreditCard, Award, ThumbsUp, ThumbsDown, Minus,
  Zap, Flame, Shield, FileCheck, Users, X, FileText, User as UserIcon, Clock as ClockIcon
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart as RePieChart, Pie, Cell,
  Legend
} from 'recharts'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'

interface OverviewData {
  total_news: number
  total_complaints: number
  resolved_complaints: number
  unresolved_complaints: number
  complaint_completion_rate: number
  avg_satisfaction: number
  pending_news: number
  pending_reviews: number
  warning_credits: number
}

interface StatusItem {
  name: string
  value: number
}

interface PriorityItem {
  name: string
  value: number
}

interface DepartmentRank {
  department: string
  total: number
  resolved: number
  pending: number
  completion_rate: number
}

interface OverdueComplaint {
  id: number
  title: string
  priority: string
  department: string
  created_at: string
  days_overdue: number
  content: string
  last_status: string
  last_progress: string
}

interface SupervisionOverview {
  by_status: StatusItem[]
  by_priority: PriorityItem[]
  department_ranks: DepartmentRank[]
  overdue_complaints: OverdueComplaint[]
}

interface UnresolvedComplaint {
  id: number
  title: string
  priority: string
  status: string
  department: string
  progress_updates: number
  last_updated: string
}

interface RatingDistribution {
  rating: number
  count: number
}

interface DepartmentSatisfaction {
  department: string
  avg_rating: number
  total_ratings: number
}

interface PendingSurvey {
  id: number
  complaint_id: number
  title: string
  department: string
  resolved_at: string
}

interface SatisfactionDetail {
  rating_distribution: RatingDistribution[]
  department_satisfaction: DepartmentSatisfaction[]
  pending_surveys: PendingSurvey[]
}

interface RegionHeat {
  region: string
  heat_value: number
  record_count: number
  positive: number
  neutral: number
  negative: number
  sentiment: string
}

interface RiskLevel {
  name: string
  value: number
}

interface HighRiskKeyword {
  keyword: string
  risk_level: string
  mention_count: number
  trend: string
}

interface OpinionHeatmapDetail {
  heat_by_region: RegionHeat[]
  risk_levels: RiskLevel[]
  high_risk_keywords: HighRiskKeyword[]
}

interface ResultDistribution {
  name: string
  value: number
}

interface TypeDistribution {
  type: string
  total: number
  passed: number
  rejected: number
  pending: number
}

interface RecentReview {
  id: number
  title: string
  type: string
  result: string
  reviewer: string
  reviewed_at: string
}

interface ReviewStats {
  result_distribution: ResultDistribution[]
  type_distribution: TypeDistribution[]
  recent_reviews: RecentReview[]
}

interface LevelDistribution {
  level: string
  count: number
}

interface RecentAdjustment {
  id: number
  creator_name: string
  points_change: number
  reason: string
  adjusted_at: string
}

interface LowCreditCreator {
  id: number
  name: string
  credit_score: number
  level: string
  warning_count: number
}

interface CreditStats {
  level_distribution: LevelDistribution[]
  recent_adjustments: RecentAdjustment[]
  low_credit_creators: LowCreditCreator[]
}

interface OpinionKeyword {
  keyword: string
  total_heat: number
}

const STATUS_COLORS: Record<string, string> = {
  submitted: 'bg-gray-100 text-gray-700',
  dispatched: 'bg-yellow-100 text-yellow-700',
  processing: 'bg-blue-100 text-blue-700',
  resolved: 'bg-green-100 text-green-700',
  closed: 'bg-slate-100 text-slate-700'
}

const PRIORITY_COLORS: Record<string, string> = {
  urgent: 'bg-red-100 text-red-700',
  high: 'bg-orange-100 text-orange-700',
  normal: 'bg-blue-100 text-blue-700',
  low: 'bg-gray-100 text-gray-700'
}

const SENTIMENT_COLORS: Record<string, string> = {
  positive: 'bg-green-100 text-green-700',
  neutral: 'bg-gray-100 text-gray-700',
  negative: 'bg-red-100 text-red-700'
}

const RISK_COLORS: Record<string, string> = {
  high: 'bg-red-100 text-red-700',
  medium: 'bg-orange-100 text-orange-700',
  low: 'bg-green-100 text-green-700'
}

const CREDIT_LEVEL_COLORS: Record<string, string> = {
  excellent: 'bg-green-100 text-green-700',
  good: 'bg-blue-100 text-blue-700',
  normal: 'bg-gray-100 text-gray-700',
  warning: 'bg-orange-100 text-orange-700',
  banned: 'bg-red-100 text-red-700'
}

const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

const STATUS_LABELS: Record<string, string> = {
  submitted: '已提交',
  dispatched: '已派单',
  processing: '处理中',
  resolved: '已办结',
  closed: '已关闭'
}

const PRIORITY_LABELS: Record<string, string> = {
  urgent: '紧急',
  high: '高',
  normal: '中',
  low: '低'
}

const SENTIMENT_LABELS: Record<string, string> = {
  positive: '正面',
  neutral: '中性',
  negative: '负面'
}

const RISK_LABELS: Record<string, string> = {
  high: '高风险',
  medium: '中风险',
  low: '低风险'
}

const CREDIT_LEVEL_LABELS: Record<string, string> = {
  excellent: '优秀',
  good: '良好',
  normal: '一般',
  warning: '预警',
  banned: '封禁'
}

const RESULT_LABELS: Record<string, string> = {
  passed: '通过',
  rejected: '驳回',
  pending: '待审核'
}

const TYPE_LABELS: Record<string, string> = {
  news: '新闻',
  complaint: '诉求',
  comment: '评论',
  media: '媒体'
}

function getStatusBadge(status: string) {
  return STATUS_COLORS[status] || 'bg-gray-100 text-gray-700'
}

function getPriorityBadge(priority: string) {
  return PRIORITY_COLORS[priority] || 'bg-gray-100 text-gray-700'
}

function getSentimentBadge(sentiment: string) {
  return SENTIMENT_COLORS[sentiment] || 'bg-gray-100 text-gray-700'
}

function getRiskBadge(risk: string) {
  return RISK_COLORS[risk] || 'bg-gray-100 text-gray-700'
}

function getCreditLevelBadge(level: string) {
  return CREDIT_LEVEL_COLORS[level] || 'bg-gray-100 text-gray-700'
}

function LoadingSection() {
  return (
    <div className="flex items-center justify-center h-64 text-slate-500">
      <RefreshCw className="animate-spin mr-2" size={20} />
      加载中...
    </div>
  )
}

function EmptyState({ message = '暂无数据' }: { message?: string }) {
  return (
    <div className="flex items-center justify-center h-48 text-slate-400">
      {message}
    </div>
  )
}

export default function Dashboard() {
  const { user, workspace } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState(0)

  const [overview, setOverview] = useState<OverviewData | null>(null)
  const [supervisionOverview, setSupervisionOverview] = useState<SupervisionOverview | null>(null)
  const [unresolvedComplaints, setUnresolvedComplaints] = useState<UnresolvedComplaint[]>([])
  const [satisfactionDetail, setSatisfactionDetail] = useState<SatisfactionDetail | null>(null)
  const [reviewStats, setReviewStats] = useState<ReviewStats | null>(null)
  const [opinionHeatmapDetail, setOpinionHeatmapDetail] = useState<OpinionHeatmapDetail | null>(null)
  const [creditStats, setCreditStats] = useState<CreditStats | null>(null)
  const [opinionSummary, setOpinionSummary] = useState<OpinionKeyword[]>([])
  const [overdueDetailModal, setOverdueDetailModal] = useState<OverdueComplaint | null>(null)

  const [loadingOverview, setLoadingOverview] = useState(true)
  const [loadingSupervision, setLoadingSupervision] = useState(true)
  const [loadingComplaints, setLoadingComplaints] = useState(true)
  const [loadingSatisfaction, setLoadingSatisfaction] = useState(true)
  const [loadingReviews, setLoadingReviews] = useState(true)
  const [loadingOpinion, setLoadingOpinion] = useState(true)
  const [loadingCredit, setLoadingCredit] = useState(true)
  const [loadingOpinionSummary, setLoadingOpinionSummary] = useState(true)

  const currentDate = useMemo(() => {
    return format(new Date(), 'yyyy年MM月dd日 EEEE', { locale: zhCN })
  }, [])

  const fetchData = useCallback(async () => {
    try {
      const results = await Promise.allSettled([
        api<OverviewData>('/dashboard/overview').then(res => {
          if (res.success) setOverview(res.data)
          setLoadingOverview(false)
        }),
        api<SupervisionOverview>('/dashboard/supervision-overview').then(res => {
          if (res.success) setSupervisionOverview(res.data)
          setLoadingSupervision(false)
        }),
        api<UnresolvedComplaint[]>('/dashboard/unresolved-complaints').then(res => {
          if (res.success) setUnresolvedComplaints(res.data)
          setLoadingComplaints(false)
        }),
        api<SatisfactionDetail>('/dashboard/satisfaction-detail').then(res => {
          if (res.success) setSatisfactionDetail(res.data)
          setLoadingSatisfaction(false)
        }),
        api<ReviewStats>('/dashboard/review-stats').then(res => {
          if (res.success) setReviewStats(res.data)
          setLoadingReviews(false)
        }),
        api<OpinionHeatmapDetail>('/dashboard/opinion-heatmap-detail').then(res => {
          if (res.success) setOpinionHeatmapDetail(res.data)
          setLoadingOpinion(false)
        }),
        api<CreditStats>('/dashboard/credit-stats').then(res => {
          if (res.success) setCreditStats(res.data)
          setLoadingCredit(false)
        }),
        api<OpinionKeyword[]>('/dashboard/opinion-summary').then(res => {
          if (res.success) setOpinionSummary(res.data)
          setLoadingOpinionSummary(false)
        })
      ])

      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          const setters = [
            setLoadingOverview, setLoadingSupervision, setLoadingComplaints,
            setLoadingSatisfaction, setLoadingReviews, setLoadingOpinion,
            setLoadingCredit, setLoadingOpinionSummary
          ]
          setters[index]?.(false)
        }
      })
    } catch {
      setLoadingOverview(false)
      setLoadingSupervision(false)
      setLoadingComplaints(false)
      setLoadingSatisfaction(false)
      setLoadingReviews(false)
      setLoadingOpinion(false)
      setLoadingCredit(false)
      setLoadingOpinionSummary(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const tabs = ['督办概览', '诉求追踪', '舆情监测', '内容审核', '信用体系']

  const statCards = [
    { key: 'total_news', label: '新闻总数', icon: Newspaper, color: 'text-blue-600', bg: 'bg-blue-50', value: overview?.total_news ?? 0 },
    { key: 'total_complaints', label: '诉求总量', icon: MessageSquare, color: 'text-orange-600', bg: 'bg-orange-50', value: overview?.total_complaints ?? 0 },
    { key: 'resolved_complaints', label: '已办结', icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50', value: overview?.resolved_complaints ?? 0 },
    { key: 'unresolved_complaints', label: '待办结', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', value: overview?.unresolved_complaints ?? 0 },
    { key: 'complaint_completion_rate', label: '办结率', icon: Target, color: 'text-emerald-600', bg: 'bg-emerald-50', value: overview?.complaint_completion_rate ?? 0, suffix: '%', isProgress: true },
    { key: 'avg_satisfaction', label: '平均满意度', icon: Star, color: 'text-amber-500', bg: 'bg-amber-50', value: overview?.avg_satisfaction ?? 0, suffix: '分' },
    { key: 'pending_total', label: '待审核', icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-50', value: (overview?.pending_news ?? 0) + (overview?.pending_reviews ?? 0) },
    { key: 'warning_credits', label: '信用预警', icon: AlertOctagon, color: 'text-rose-600', bg: 'bg-rose-50', value: overview?.warning_credits ?? 0 },
  ]

  const getRoleTodoItems = () => {
    if (!user) return []
    const role = user.role
    const items: { icon: any; label: string; count: number; color: string; bg: string; path: string }[] = []

    if (role === 'admin') {
      items.push(
        { icon: AlertTriangle, label: '待审新闻', count: overview?.pending_news ?? 0, color: 'text-amber-600', bg: 'bg-amber-50', path: '/news' },
        { icon: Shield, label: '待审核内容', count: overview?.pending_reviews ?? 0, color: 'text-red-600', bg: 'bg-red-50', path: '/review' },
        { icon: MessageSquare, label: '未办结诉求', count: overview?.unresolved_complaints ?? 0, color: 'text-orange-600', bg: 'bg-orange-50', path: '/complaints' },
        { icon: AlertOctagon, label: '信用预警', count: overview?.warning_credits ?? 0, color: 'text-rose-600', bg: 'bg-rose-50', path: '/credits' },
      )
    } else if (role === 'editor') {
      items.push(
        { icon: AlertTriangle, label: '待审新闻', count: overview?.pending_news ?? 0, color: 'text-amber-600', bg: 'bg-amber-50', path: '/news' },
        { icon: Shield, label: '待审核内容', count: overview?.pending_reviews ?? 0, color: 'text-red-600', bg: 'bg-red-50', path: '/review' },
        { icon: Newspaper, label: '新闻总数', count: overview?.total_news ?? 0, color: 'text-blue-600', bg: 'bg-blue-50', path: '/news' },
      )
    } else {
      items.push(
        { icon: MessageSquare, label: '我的诉求', count: overview?.total_complaints ?? 0, color: 'text-orange-600', bg: 'bg-orange-50', path: '/complaints' },
        { icon: Building2, label: '服务事项', count: overview?.total_services ?? 0, color: 'text-blue-600', bg: 'bg-blue-50', path: '/services' },
      )
    }

    return items
  }

  const roleTodos = getRoleTodoItems()

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center">
              <User size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-bold">
                欢迎回来，{user?.display_name || '用户'}
              </h1>
              <div className="flex items-center space-x-3 mt-1 text-blue-100">
                <span className="flex items-center">
                  <Calendar size={14} className="mr-1" />
                  {currentDate}
                </span>
                {workspace && (
                  <span className="px-2 py-0.5 bg-white/20 rounded-full text-xs font-medium">
                    {workspace.name}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <TrendingUp size={48} className="text-white/30" />
          </div>
        </div>
      </div>

      {roleTodos.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {roleTodos.map((todo) => (
            <button
              key={todo.label}
              onClick={() => navigate(todo.path)}
              className={`relative ${todo.bg} rounded-lg p-4 text-left transition-all hover:shadow-md hover:scale-[1.02] group border border-transparent hover:border-slate-200`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-full bg-white/80 flex items-center justify-center`}>
                    <todo.icon size={20} className={todo.color} />
                  </div>
                  <div>
                    <div className={`text-2xl font-bold ${todo.color}`}>{todo.count}</div>
                    <div className="text-sm text-slate-600">{todo.label}</div>
                  </div>
                </div>
                <ChevronRight size={18} className="text-slate-400 group-hover:text-slate-600 transition-colors" />
              </div>
              <div className="absolute bottom-1.5 right-2 text-xs text-slate-400 group-hover:text-slate-500">
                点击处理 →
              </div>
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
        {loadingOverview ? (
          Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow p-4 animate-pulse">
              <div className="w-10 h-10 bg-slate-200 rounded-full mb-2 mx-auto"></div>
              <div className="h-6 bg-slate-200 rounded w-3/4 mx-auto mb-1"></div>
              <div className="h-3 bg-slate-200 rounded w-1/2 mx-auto"></div>
            </div>
          ))
        ) : (
          statCards.map((card) => (
            <div key={card.key} className="bg-white rounded-lg shadow p-4 flex flex-col items-center">
              <div className={`w-10 h-10 rounded-full ${card.bg} flex items-center justify-center mb-2`}>
                <card.icon size={20} className={card.color} />
              </div>
              <div className="text-2xl font-bold text-slate-800">
                {card.value}
                {card.suffix || ''}
              </div>
              {card.isProgress && (
                <div className="w-full mt-2">
                  <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(card.value, 100)}%` }}
                    ></div>
                  </div>
                </div>
              )}
              <div className="text-xs text-slate-500 mt-1">{card.label}</div>
            </div>
          ))
        )}
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-slate-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab, index) => (
              <button
                key={tab}
                onClick={() => setActiveTab(index)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === index
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 0 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-slate-50 rounded-lg p-4">
                  <h3 className="text-base font-semibold text-slate-700 mb-4 flex items-center">
                    <PieChart size={18} className="mr-2 text-blue-500" />
                    诉求状态分布
                  </h3>
                  {loadingSupervision ? (
                    <LoadingSection />
                  ) : supervisionOverview?.by_status && supervisionOverview.by_status.length > 0 ? (
                    <ResponsiveContainer width="100%" height={280}>
                      <RePieChart>
                        <Pie
                          data={supervisionOverview.by_status}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${STATUS_LABELS[name] || name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {supervisionOverview.by_status.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => [`${value} 件`, '数量']} />
                        <Legend formatter={(value) => STATUS_LABELS[value] || value} />
                      </RePieChart>
                    </ResponsiveContainer>
                  ) : (
                    <EmptyState />
                  )}
                </div>

                <div className="bg-slate-50 rounded-lg p-4">
                  <h3 className="text-base font-semibold text-slate-700 mb-4 flex items-center">
                    <BarChart3 size={18} className="mr-2 text-orange-500" />
                    诉求优先级分布
                  </h3>
                  {loadingSupervision ? (
                    <LoadingSection />
                  ) : supervisionOverview?.by_priority && supervisionOverview.by_priority.length > 0 ? (
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={supervisionOverview.by_priority}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" tick={{ fontSize: 12 }} tickFormatter={(value) => PRIORITY_LABELS[value] || value} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip formatter={(value) => [`${value} 件`, '数量']} labelFormatter={(value) => PRIORITY_LABELS[value] || value} />
                        <Bar dataKey="value" fill="#f97316" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <EmptyState />
                  )}
                </div>
              </div>

              <div className="bg-slate-50 rounded-lg p-4">
                <h3 className="text-base font-semibold text-slate-700 mb-4 flex items-center">
                  <Building2 size={18} className="mr-2 text-green-500" />
                  承办单位督办榜
                </h3>
                {loadingSupervision ? (
                  <LoadingSection />
                ) : supervisionOverview?.department_ranks && supervisionOverview.department_ranks.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-slate-600">
                          <th className="text-left py-2 px-3">排名</th>
                          <th className="text-left py-2 px-3">承办单位</th>
                          <th className="text-right py-2 px-3">总数</th>
                          <th className="text-right py-2 px-3">已办结</th>
                          <th className="text-right py-2 px-3">待办结</th>
                          <th className="text-right py-2 px-3">办结率</th>
                        </tr>
                      </thead>
                      <tbody>
                        {supervisionOverview.department_ranks.map((item, i) => (
                          <tr key={i} className="border-b last:border-0 hover:bg-white">
                            <td className="py-2 px-3">
                              <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                                i < 3 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'
                              }`}>
                                {i + 1}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-slate-700 font-medium">{item.department}</td>
                            <td className="py-2 px-3 text-right text-slate-600">{item.total}</td>
                            <td className="py-2 px-3 text-right text-green-600 font-medium">{item.resolved}</td>
                            <td className="py-2 px-3 text-right text-amber-600">{item.pending}</td>
                            <td className="py-2 px-3 text-right">
                              <div className="flex items-center justify-end space-x-2">
                                <div className="w-20 h-2 bg-slate-200 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-green-500 rounded-full"
                                    style={{ width: `${item.completion_rate}%` }}
                                  ></div>
                                </div>
                                <span className="text-slate-700 font-medium">{item.completion_rate}%</span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <EmptyState />
                )}
              </div>

              <div className="bg-slate-50 rounded-lg p-4">
                <h3 className="text-base font-semibold text-slate-700 mb-4 flex items-center">
                  <AlertCircle size={18} className="mr-2 text-red-500" />
                  超时预警清单
                </h3>
                {loadingSupervision ? (
                  <LoadingSection />
                ) : supervisionOverview?.overdue_complaints && supervisionOverview.overdue_complaints.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-slate-600">
                          <th className="text-left py-2 px-3">诉求标题</th>
                          <th className="text-left py-2 px-3">优先级</th>
                          <th className="text-left py-2 px-3">承办单位</th>
                          <th className="text-left py-2 px-3">创建时间</th>
                          <th className="text-right py-2 px-3">超时天数</th>
                          <th className="text-center py-2 px-3">操作</th>
                        </tr>
                      </thead>
                      <tbody>
                        {supervisionOverview.overdue_complaints.map((item) => (
                          <tr key={item.id} className="border-b last:border-0 hover:bg-white">
                            <td className="py-2 px-3 text-slate-700 font-medium">{item.title}</td>
                            <td className="py-2 px-3">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityBadge(item.priority)}`}>
                                {PRIORITY_LABELS[item.priority] || item.priority}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-slate-600">{item.department}</td>
                            <td className="py-2 px-3 text-slate-500">{item.created_at}</td>
                            <td className="py-2 px-3 text-right">
                              <span className="text-red-600 font-bold">{item.days_overdue} 天</span>
                            </td>
                            <td className="py-2 px-3 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <button onClick={() => setOverdueDetailModal(item)} className="inline-flex items-center px-2 py-1 bg-blue-50 text-blue-600 text-xs rounded hover:bg-blue-100 transition-colors">
                                  <Eye size={12} className="mr-1" />
                                  详情
                                </button>
                                <button className="inline-flex items-center px-2 py-1 bg-red-500 text-white text-xs rounded-md hover:bg-red-600 transition-colors">
                                  <Zap size={12} className="mr-1" />
                                  督办
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <EmptyState />
                )}
              </div>
            </div>
          )}

          {activeTab === 1 && (
            <div className="space-y-6">
              <div className="bg-slate-50 rounded-lg p-4">
                <h3 className="text-base font-semibold text-slate-700 mb-4 flex items-center">
                  <MessageSquare size={18} className="mr-2 text-blue-500" />
                  未办结诉求列表
                </h3>
                {loadingComplaints ? (
                  <LoadingSection />
                ) : unresolvedComplaints.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-slate-600">
                          <th className="text-left py-2 px-3">ID</th>
                          <th className="text-left py-2 px-3">标题</th>
                          <th className="text-left py-2 px-3">优先级</th>
                          <th className="text-left py-2 px-3">状态</th>
                          <th className="text-left py-2 px-3">派单部门</th>
                          <th className="text-right py-2 px-3">进度更新</th>
                          <th className="text-left py-2 px-3">最后更新</th>
                          <th className="text-center py-2 px-3">操作</th>
                        </tr>
                      </thead>
                      <tbody>
                        {unresolvedComplaints.map((item) => (
                          <tr key={item.id} className="border-b last:border-0 hover:bg-white">
                            <td className="py-2 px-3 text-slate-500 font-mono">#{item.id}</td>
                            <td className="py-2 px-3 text-slate-700 font-medium max-w-xs truncate">{item.title}</td>
                            <td className="py-2 px-3">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityBadge(item.priority)}`}>
                                {PRIORITY_LABELS[item.priority] || item.priority}
                              </span>
                            </td>
                            <td className="py-2 px-3">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(item.status)}`}>
                                {STATUS_LABELS[item.status] || item.status}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-slate-600">{item.department}</td>
                            <td className="py-2 px-3 text-right text-slate-600">{item.progress_updates} 次</td>
                            <td className="py-2 px-3 text-slate-500">{item.last_updated}</td>
                            <td className="py-2 px-3 text-center">
                              <div className="flex items-center justify-center space-x-1">
                                <button className="inline-flex items-center px-2 py-1 bg-blue-50 text-blue-600 text-xs rounded hover:bg-blue-100 transition-colors">
                                  <Eye size={12} className="mr-1" />
                                  详情
                                </button>
                                <button className="inline-flex items-center px-2 py-1 bg-orange-50 text-orange-600 text-xs rounded hover:bg-orange-100 transition-colors">
                                  <Zap size={12} className="mr-1" />
                                  督办
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <EmptyState />
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-slate-50 rounded-lg p-4">
                  <h3 className="text-base font-semibold text-slate-700 mb-4 flex items-center">
                    <Star size={18} className="mr-2 text-amber-500" />
                    满意度分析
                  </h3>
                  {loadingSatisfaction ? (
                    <LoadingSection />
                  ) : satisfactionDetail?.rating_distribution && satisfactionDetail.rating_distribution.length > 0 ? (
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={satisfactionDetail.rating_distribution}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="rating" tick={{ fontSize: 12 }} tickFormatter={(value) => `${value}星`} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip formatter={(value) => [`${value} 人`, '评价数']} labelFormatter={(value) => `${value}星评价`} />
                        <Bar dataKey="count" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <EmptyState />
                  )}
                </div>

                <div className="bg-slate-50 rounded-lg p-4">
                  <h3 className="text-base font-semibold text-slate-700 mb-4 flex items-center">
                    <Building2 size={18} className="mr-2 text-emerald-500" />
                    部门满意度排行
                  </h3>
                  {loadingSatisfaction ? (
                    <LoadingSection />
                  ) : satisfactionDetail?.department_satisfaction && satisfactionDetail.department_satisfaction.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b text-slate-600">
                            <th className="text-left py-2 px-3">部门</th>
                            <th className="text-right py-2 px-3">平均评分</th>
                            <th className="text-right py-2 px-3">评价数</th>
                          </tr>
                        </thead>
                        <tbody>
                          {satisfactionDetail.department_satisfaction.map((item, i) => (
                            <tr key={i} className="border-b last:border-0 hover:bg-white">
                              <td className="py-2 px-3 text-slate-700 font-medium">{item.department}</td>
                              <td className="py-2 px-3 text-right">
                                <span className="text-amber-600 font-bold">{item.avg_rating.toFixed(1)}</span>
                                <span className="text-amber-400 ml-1">★</span>
                              </td>
                              <td className="py-2 px-3 text-right text-slate-600">{item.total_ratings}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <EmptyState />
                  )}
                </div>
              </div>

              <div className="bg-slate-50 rounded-lg p-4">
                <h3 className="text-base font-semibold text-slate-700 mb-4 flex items-center">
                  <Users size={18} className="mr-2 text-purple-500" />
                  待回访清单
                </h3>
                {loadingSatisfaction ? (
                  <LoadingSection />
                ) : satisfactionDetail?.pending_surveys && satisfactionDetail.pending_surveys.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-slate-600">
                          <th className="text-left py-2 px-3">诉求ID</th>
                          <th className="text-left py-2 px-3">标题</th>
                          <th className="text-left py-2 px-3">承办部门</th>
                          <th className="text-left py-2 px-3">办结时间</th>
                          <th className="text-center py-2 px-3">操作</th>
                        </tr>
                      </thead>
                      <tbody>
                        {satisfactionDetail.pending_surveys.map((item) => (
                          <tr key={item.id} className="border-b last:border-0 hover:bg-white">
                            <td className="py-2 px-3 text-slate-500 font-mono">#{item.complaint_id}</td>
                            <td className="py-2 px-3 text-slate-700 font-medium">{item.title}</td>
                            <td className="py-2 px-3 text-slate-600">{item.department}</td>
                            <td className="py-2 px-3 text-slate-500">{item.resolved_at}</td>
                            <td className="py-2 px-3 text-center">
                              <button className="inline-flex items-center px-3 py-1 bg-purple-500 text-white text-xs rounded-md hover:bg-purple-600 transition-colors">
                                <ChevronRight size={12} className="mr-1" />
                                发起回访
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <EmptyState />
                )}
              </div>
            </div>
          )}

          {activeTab === 2 && (
            <div className="space-y-6">
              <div className="bg-slate-50 rounded-lg p-4">
                <h3 className="text-base font-semibold text-slate-700 mb-4 flex items-center">
                  <Flame size={18} className="mr-2 text-red-500" />
                  区域热力图
                </h3>
                {loadingOpinion ? (
                  <LoadingSection />
                ) : opinionHeatmapDetail?.heat_by_region && opinionHeatmapDetail.heat_by_region.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-slate-600">
                          <th className="text-left py-2 px-3">区域</th>
                          <th className="text-right py-2 px-3">热度值</th>
                          <th className="text-right py-2 px-3">记录数</th>
                          <th className="text-right py-2 px-3">正面</th>
                          <th className="text-right py-2 px-3">中性</th>
                          <th className="text-right py-2 px-3">负面</th>
                          <th className="text-center py-2 px-3">情感倾向</th>
                        </tr>
                      </thead>
                      <tbody>
                        {opinionHeatmapDetail.heat_by_region.map((item, i) => (
                          <tr key={i} className="border-b last:border-0 hover:bg-white">
                            <td className="py-2 px-3 text-slate-700 font-medium">{item.region}</td>
                            <td className="py-2 px-3 text-right">
                              <span className="text-red-600 font-bold">{item.heat_value.toLocaleString()}</span>
                            </td>
                            <td className="py-2 px-3 text-right text-slate-600">{item.record_count}</td>
                            <td className="py-2 px-3 text-right text-green-600">{item.positive}</td>
                            <td className="py-2 px-3 text-right text-slate-600">{item.neutral}</td>
                            <td className="py-2 px-3 text-right text-red-600">{item.negative}</td>
                            <td className="py-2 px-3 text-center">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getSentimentBadge(item.sentiment)}`}>
                                {item.sentiment === 'positive' && <ThumbsUp size={10} className="mr-1" />}
                                {item.sentiment === 'negative' && <ThumbsDown size={10} className="mr-1" />}
                                {item.sentiment === 'neutral' && <Minus size={10} className="mr-1" />}
                                {SENTIMENT_LABELS[item.sentiment] || item.sentiment}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <EmptyState />
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-slate-50 rounded-lg p-4">
                  <h3 className="text-base font-semibold text-slate-700 mb-4 flex items-center">
                    <Shield size={18} className="mr-2 text-orange-500" />
                    风险分级
                  </h3>
                  {loadingOpinion ? (
                    <LoadingSection />
                  ) : opinionHeatmapDetail?.risk_levels && opinionHeatmapDetail.risk_levels.length > 0 ? (
                    <ResponsiveContainer width="100%" height={280}>
                      <RePieChart>
                        <Pie
                          data={opinionHeatmapDetail.risk_levels}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${RISK_LABELS[name] || name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {opinionHeatmapDetail.risk_levels.map((entry, index) => {
                            const colors: Record<string, string> = { high: '#ef4444', medium: '#f97316', low: '#10b981' }
                            return <Cell key={`cell-${index}`} fill={colors[entry.name] || CHART_COLORS[index % CHART_COLORS.length]} />
                          })}
                        </Pie>
                        <Tooltip formatter={(value) => [`${value} 条`, '数量']} labelFormatter={(value) => RISK_LABELS[value] || value} />
                        <Legend formatter={(value) => RISK_LABELS[value] || value} />
                      </RePieChart>
                    </ResponsiveContainer>
                  ) : (
                    <EmptyState />
                  )}
                </div>

                <div className="bg-slate-50 rounded-lg p-4">
                  <h3 className="text-base font-semibold text-slate-700 mb-4 flex items-center">
                    <AlertTriangle size={18} className="mr-2 text-red-500" />
                    高风险热词
                  </h3>
                  {loadingOpinion ? (
                    <LoadingSection />
                  ) : opinionHeatmapDetail?.high_risk_keywords && opinionHeatmapDetail.high_risk_keywords.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b text-slate-600">
                            <th className="text-left py-2 px-3">关键词</th>
                            <th className="text-left py-2 px-3">风险等级</th>
                            <th className="text-right py-2 px-3">提及次数</th>
                            <th className="text-left py-2 px-3">趋势</th>
                          </tr>
                        </thead>
                        <tbody>
                          {opinionHeatmapDetail.high_risk_keywords.map((item, i) => (
                            <tr key={i} className="border-b last:border-0 hover:bg-white">
                              <td className="py-2 px-3 text-slate-700 font-medium">{item.keyword}</td>
                              <td className="py-2 px-3">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getRiskBadge(item.risk_level)}`}>
                                  {RISK_LABELS[item.risk_level] || item.risk_level}
                                </span>
                              </td>
                              <td className="py-2 px-3 text-right text-slate-600 font-medium">{item.mention_count}</td>
                              <td className="py-2 px-3">
                                <span className={`inline-flex items-center text-xs font-medium ${
                                  item.trend === 'up' ? 'text-red-500' : item.trend === 'down' ? 'text-green-500' : 'text-slate-500'
                                }`}>
                                  {item.trend === 'up' ? '↑ 上升' : item.trend === 'down' ? '↓ 下降' : '— 持平'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <EmptyState />
                  )}
                </div>
              </div>

              <div className="bg-slate-50 rounded-lg p-4">
                <h3 className="text-base font-semibold text-slate-700 mb-4 flex items-center">
                  <BarChart3 size={18} className="mr-2 text-blue-500" />
                  热点关键词
                </h3>
                {loadingOpinionSummary ? (
                  <LoadingSection />
                ) : opinionSummary.length > 0 ? (
                  <ResponsiveContainer width="100%" height={320}>
                    <BarChart data={opinionSummary} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" tick={{ fontSize: 12 }} />
                      <YAxis dataKey="keyword" type="category" tick={{ fontSize: 12 }} width={80} />
                      <Tooltip formatter={(value) => [`${value}`, '热度值']} />
                      <Bar dataKey="total_heat" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyState />
                )}
              </div>
            </div>
          )}

          {activeTab === 3 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-slate-50 rounded-lg p-4">
                  <h3 className="text-base font-semibold text-slate-700 mb-4 flex items-center">
                    <PieChart size={18} className="mr-2 text-emerald-500" />
                    审核结果分布
                  </h3>
                  {loadingReviews ? (
                    <LoadingSection />
                  ) : reviewStats?.result_distribution && reviewStats.result_distribution.length > 0 ? (
                    <ResponsiveContainer width="100%" height={280}>
                      <RePieChart>
                        <Pie
                          data={reviewStats.result_distribution}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${RESULT_LABELS[name] || name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {reviewStats.result_distribution.map((entry, index) => {
                            const colors: Record<string, string> = { passed: '#10b981', rejected: '#ef4444', pending: '#f59e0b' }
                            return <Cell key={`cell-${index}`} fill={colors[entry.name] || CHART_COLORS[index % CHART_COLORS.length]} />
                          })}
                        </Pie>
                        <Tooltip formatter={(value) => [`${value} 条`, '数量']} labelFormatter={(value) => RESULT_LABELS[value] || value} />
                        <Legend formatter={(value) => RESULT_LABELS[value] || value} />
                      </RePieChart>
                    </ResponsiveContainer>
                  ) : (
                    <EmptyState />
                  )}
                </div>

                <div className="bg-slate-50 rounded-lg p-4">
                  <h3 className="text-base font-semibold text-slate-700 mb-4 flex items-center">
                    <FileCheck size={18} className="mr-2 text-blue-500" />
                    各类型审核统计
                  </h3>
                  {loadingReviews ? (
                    <LoadingSection />
                  ) : reviewStats?.type_distribution && reviewStats.type_distribution.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b text-slate-600">
                            <th className="text-left py-2 px-3">类型</th>
                            <th className="text-right py-2 px-3">总数</th>
                            <th className="text-right py-2 px-3">通过</th>
                            <th className="text-right py-2 px-3">驳回</th>
                            <th className="text-right py-2 px-3">待审核</th>
                          </tr>
                        </thead>
                        <tbody>
                          {reviewStats.type_distribution.map((item, i) => (
                            <tr key={i} className="border-b last:border-0 hover:bg-white">
                              <td className="py-2 px-3 text-slate-700 font-medium">{TYPE_LABELS[item.type] || item.type}</td>
                              <td className="py-2 px-3 text-right text-slate-600 font-medium">{item.total}</td>
                              <td className="py-2 px-3 text-right text-green-600">{item.passed}</td>
                              <td className="py-2 px-3 text-right text-red-600">{item.rejected}</td>
                              <td className="py-2 px-3 text-right text-amber-600">{item.pending}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <EmptyState />
                  )}
                </div>
              </div>

              <div className="bg-slate-50 rounded-lg p-4">
                <h3 className="text-base font-semibold text-slate-700 mb-4 flex items-center">
                  <Clock size={18} className="mr-2 text-purple-500" />
                  最新审核记录
                </h3>
                {loadingReviews ? (
                  <LoadingSection />
                ) : reviewStats?.recent_reviews && reviewStats.recent_reviews.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-slate-600">
                          <th className="text-left py-2 px-3">标题</th>
                          <th className="text-left py-2 px-3">类型</th>
                          <th className="text-left py-2 px-3">结果</th>
                          <th className="text-left py-2 px-3">审核人</th>
                          <th className="text-left py-2 px-3">审核时间</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reviewStats.recent_reviews.map((item) => (
                          <tr key={item.id} className="border-b last:border-0 hover:bg-white">
                            <td className="py-2 px-3 text-slate-700 font-medium">{item.title}</td>
                            <td className="py-2 px-3 text-slate-600">{TYPE_LABELS[item.type] || item.type}</td>
                            <td className="py-2 px-3">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                item.result === 'passed' ? 'bg-green-100 text-green-700' :
                                item.result === 'rejected' ? 'bg-red-100 text-red-700' :
                                'bg-amber-100 text-amber-700'
                              }`}>
                                {RESULT_LABELS[item.result] || item.result}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-slate-600">{item.reviewer}</td>
                            <td className="py-2 px-3 text-slate-500">{item.reviewed_at}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <EmptyState />
                )}
              </div>
            </div>
          )}

          {activeTab === 4 && (
            <div className="space-y-6">
              <div className="bg-slate-50 rounded-lg p-4">
                <h3 className="text-base font-semibold text-slate-700 mb-4 flex items-center">
                  <Award size={18} className="mr-2 text-amber-500" />
                  信用等级分布
                </h3>
                {loadingCredit ? (
                  <LoadingSection />
                ) : creditStats?.level_distribution && creditStats.level_distribution.length > 0 ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={creditStats.level_distribution}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="level" tick={{ fontSize: 12 }} tickFormatter={(value) => CREDIT_LEVEL_LABELS[value] || value} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip formatter={(value) => [`${value} 人`, '人数']} labelFormatter={(value) => CREDIT_LEVEL_LABELS[value] || value} />
                      <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                        {creditStats.level_distribution.map((entry, index) => {
                          const colors: Record<string, string> = { excellent: '#10b981', good: '#3b82f6', normal: '#6b7280', warning: '#f97316', banned: '#ef4444' }
                          return <Cell key={`cell-${index}`} fill={colors[entry.level] || CHART_COLORS[index % CHART_COLORS.length]} />
                        })}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyState />
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-slate-50 rounded-lg p-4">
                  <h3 className="text-base font-semibold text-slate-700 mb-4 flex items-center">
                    <CreditCard size={18} className="mr-2 text-blue-500" />
                    近期积分调整
                  </h3>
                  {loadingCredit ? (
                    <LoadingSection />
                  ) : creditStats?.recent_adjustments && creditStats.recent_adjustments.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b text-slate-600">
                            <th className="text-left py-2 px-3">创作者</th>
                            <th className="text-right py-2 px-3">积分变动</th>
                            <th className="text-left py-2 px-3">原因</th>
                            <th className="text-left py-2 px-3">时间</th>
                          </tr>
                        </thead>
                        <tbody>
                          {creditStats.recent_adjustments.map((item) => (
                            <tr key={item.id} className="border-b last:border-0 hover:bg-white">
                              <td className="py-2 px-3 text-slate-700 font-medium">{item.creator_name}</td>
                              <td className="py-2 px-3 text-right">
                                <span className={`font-bold ${item.points_change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  {item.points_change > 0 ? '+' : ''}{item.points_change}
                                </span>
                              </td>
                              <td className="py-2 px-3 text-slate-600 max-w-xs truncate">{item.reason}</td>
                              <td className="py-2 px-3 text-slate-500">{item.adjusted_at}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <EmptyState />
                  )}
                </div>

                <div className="bg-slate-50 rounded-lg p-4">
                  <h3 className="text-base font-semibold text-slate-700 mb-4 flex items-center">
                    <AlertOctagon size={18} className="mr-2 text-red-500" />
                    低信用创作者预警
                  </h3>
                  {loadingCredit ? (
                    <LoadingSection />
                  ) : creditStats?.low_credit_creators && creditStats.low_credit_creators.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b text-slate-600">
                            <th className="text-left py-2 px-3">创作者</th>
                            <th className="text-right py-2 px-3">信用分</th>
                            <th className="text-left py-2 px-3">等级</th>
                            <th className="text-right py-2 px-3">预警次数</th>
                          </tr>
                        </thead>
                        <tbody>
                          {creditStats.low_credit_creators.map((item) => (
                            <tr key={item.id} className="border-b last:border-0 hover:bg-white">
                              <td className="py-2 px-3 text-slate-700 font-medium">{item.name}</td>
                              <td className="py-2 px-3 text-right">
                                <span className="text-red-600 font-bold">{item.credit_score}</span>
                              </td>
                              <td className="py-2 px-3">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getCreditLevelBadge(item.level)}`}>
                                  {CREDIT_LEVEL_LABELS[item.level] || item.level}
                                </span>
                              </td>
                              <td className="py-2 px-3 text-right text-red-600 font-medium">{item.warning_count}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <EmptyState />
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {overdueDetailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 overflow-y-auto py-8">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg p-6 my-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-800">超时诉求详情</h3>
              <button onClick={() => setOverdueDetailModal(null)} className="text-slate-400 hover:text-slate-600"><X size={20} /></button>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-slate-600 mb-1">诉求标题</h4>
                <p className="text-base font-semibold text-slate-800">{overdueDetailModal.title}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-500 mb-1">责任部门</p>
                  <p className="text-sm font-medium text-slate-700">{overdueDetailModal.department}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">优先级</p>
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityBadge(overdueDetailModal.priority)}`}>
                    {PRIORITY_LABELS[overdueDetailModal.priority] || overdueDetailModal.priority}
                  </span>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">创建时间</p>
                  <p className="text-sm text-slate-700">{overdueDetailModal.created_at}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">超时时长</p>
                  <p className="text-sm font-bold text-red-600">{overdueDetailModal.days_overdue} 天</p>
                </div>
              </div>

              <div>
                <p className="text-xs text-slate-500 mb-1">诉求内容</p>
                <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded">{overdueDetailModal.content || '暂无详细内容'}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-500 mb-1">最新状态</p>
                  <p className="text-sm text-slate-700">{overdueDetailModal.last_status || '处理中'}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">逾期原因</p>
                  <p className="text-sm text-orange-600">超出7个工作日未办结</p>
                </div>
              </div>

              <div>
                <p className="text-xs text-slate-500 mb-1">最新进展</p>
                <p className="text-sm text-slate-700 bg-blue-50 p-3 rounded border border-blue-100">
                  {overdueDetailModal.last_progress || '正在处理中，请耐心等待'}
                </p>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <AlertTriangle size={16} className="text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-red-800">督办建议</p>
                    <p className="text-xs text-red-600 mt-1">该诉求已超时 {overdueDetailModal.days_overdue} 天未办结，建议立即联系承办部门了解具体情况，督促加快办理进度。</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setOverdueDetailModal(null)} className="px-4 py-2 text-sm text-slate-600 border rounded-lg hover:bg-slate-100">关闭</button>
              <button className="px-4 py-2 text-sm text-white bg-red-600 rounded-lg hover:bg-red-700">立即督办</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
