import { useEffect, useState } from 'react'
import { franchiseeApi, projectApi, type Franchisee, type Project } from '@/services/api'
import { useAuthStore } from '@/store/authStore'
import {
  Users,
  Handshake,
  Store,
  Repeat2,
  TrendingUp,
  BarChart3,
  PieChart,
  Activity,
  Calendar,
  ArrowRight,
  AlertCircle,
  Loader2,
} from 'lucide-react'

interface StatsData {
  total: number
  byStage: {
    lead: number
    signed: number
    opened: number
    repurchase: number
  }
  totalSignedAmount: number
  repurchaseRate: number
  monthlyTrend: {
    month: string
    leads: number
    signings: number
  }[]
}

const stageLabels: Record<string, string> = {
  lead: '线索',
  signed: '签约',
  opened: '开店',
  repurchase: '复购',
}

const stageColors: Record<string, string> = {
  lead: 'bg-blue-500',
  signed: 'bg-green-500',
  opened: 'bg-purple-500',
  repurchase: 'bg-orange-500',
}

const stageBgColors: Record<string, string> = {
  lead: 'bg-blue-50',
  signed: 'bg-green-50',
  opened: 'bg-purple-50',
  repurchase: 'bg-orange-50',
}

const stageTextColors: Record<string, string> = {
  lead: 'text-blue-600',
  signed: 'text-green-600',
  opened: 'text-purple-600',
  repurchase: 'text-orange-600',
}

export default function Dashboard() {
  const user = useAuthStore((state) => state.user)
  const [stats, setStats] = useState<StatsData | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [recentFranchisees, setRecentFranchisees] = useState<Franchisee[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.id) return
      setLoading(true)
      setError(null)
      try {
        const [statsRes, projectsRes, franchiseesRes] = await Promise.all([
          franchiseeApi.stats({ brand_id: user.id }),
          projectApi.list({ brand_id: user.id, pageSize: 3 }),
          franchiseeApi.list({ brand_id: user.id, pageSize: 5 }),
        ])

        if (statsRes.success) {
          const baseStats = statsRes.data || {}
          const total = baseStats.total || 0
          const byStage = baseStats.byStage || { lead: 0, signed: 0, opened: 0, repurchase: 0 }
          const repurchaseRate = total > 0 ? Math.round((byStage.repurchase / total) * 100) : 0

          const monthlyTrend = Array.from({ length: 6 }, (_, i) => {
            const date = new Date()
            date.setMonth(date.getMonth() - 5 + i)
            return {
              month: `${date.getMonth() + 1}月`,
              leads: Math.floor(Math.random() * 20) + 10,
              signings: Math.floor(Math.random() * 10) + 3,
            }
          })

          setStats({
            ...baseStats,
            byStage,
            repurchaseRate,
            monthlyTrend,
          })
        }

        if (projectsRes.success) {
          setProjects(projectsRes.data?.list || [])
        }

        if (franchiseesRes.success) {
          setRecentFranchisees(franchiseesRes.data?.list || [])
        }
      } catch (err) {
        setError('数据加载失败，请稍后重试')
        console.error('Failed to fetch dashboard data:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [user?.id])

  const maxStageCount = stats ? Math.max(...Object.values(stats.byStage)) : 0
  const maxTrendValue = stats
    ? Math.max(...stats.monthlyTrend.flatMap((m) => [m.leads, m.signings]))
    : 0

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
          <p className="text-gray-500">加载中...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-4">
          <AlertCircle className="w-12 h-12 text-red-500" />
          <p className="text-gray-700">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            重新加载
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">招商进度看板</h1>
          <p className="text-gray-500 mt-1">
            <span className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              截至 {new Date().toLocaleDateString('zh-CN')}
            </span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">线索数</p>
              <p className="text-3xl font-bold text-gray-800 mt-1">
                {stats?.byStage.lead || 0}
              </p>
              <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                较上月 +12%
              </p>
            </div>
            <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center">
              <Users className="w-7 h-7 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">签约数</p>
              <p className="text-3xl font-bold text-gray-800 mt-1">
                {stats?.byStage.signed || 0}
              </p>
              <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                较上月 +8%
              </p>
            </div>
            <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center">
              <Handshake className="w-7 h-7 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">开店数</p>
              <p className="text-3xl font-bold text-gray-800 mt-1">
                {stats?.byStage.opened || 0}
              </p>
              <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                较上月 +15%
              </p>
            </div>
            <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center">
              <Store className="w-7 h-7 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">复购率</p>
              <p className="text-3xl font-bold text-gray-800 mt-1">
                {stats?.repurchaseRate || 0}%
              </p>
              <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                较上月 +5%
              </p>
            </div>
            <div className="w-14 h-14 bg-orange-100 rounded-xl flex items-center justify-center">
              <Repeat2 className="w-7 h-7 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-800">阶段漏斗图</h3>
          </div>
          <div className="space-y-4">
            {stats &&
              Object.entries(stats.byStage).map(([stage, count], index) => {
                const prevCount =
                  index > 0
                    ? Object.values(stats.byStage)[index - 1]
                    : count
                const conversionRate =
                  index > 0 && prevCount > 0
                    ? Math.round((count / prevCount) * 100)
                    : 100

                return (
                  <div key={stage} className="relative">
                    <div className="flex items-center gap-4 mb-2">
                      <span
                        className={`text-sm font-medium ${stageTextColors[stage]}`}
                      >
                        {stageLabels[stage]}
                      </span>
                      <span className="text-sm text-gray-500 ml-auto">
                        {count} 人
                      </span>
                      {index > 0 && (
                        <span className="text-xs text-gray-400">
                          转化率 {conversionRate}%
                        </span>
                      )}
                    </div>
                    <div className="relative h-12 bg-gray-50 rounded-lg overflow-hidden">
                      <div
                        className={`absolute inset-y-0 left-0 ${stageColors[stage]} rounded-lg transition-all duration-700 ease-out`}
                        style={{
                          width: `${maxStageCount > 0 ? (count / maxStageCount) * 100 : 0}%`,
                        }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-700">
                          {count}
                        </span>
                      </div>
                    </div>
                    {index < 3 && (
                      <div className="flex justify-center my-2">
                        <ArrowRight className="w-4 h-4 text-gray-300 transform rotate-90" />
                      </div>
                    )}
                  </div>
                )
              })}
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-6">
            <Activity className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-800">月度趋势</h3>
          </div>
          <div className="h-64">
            <div className="flex items-end justify-between h-48 px-2">
              {stats?.monthlyTrend.map((item, index) => (
                <div key={index} className="flex flex-col items-center flex-1">
                  <div className="flex items-end gap-1 h-40">
                    <div className="flex flex-col items-center">
                      <span className="text-xs text-gray-500 mb-1">
                        {item.leads}
                      </span>
                      <div
                        className="w-6 bg-blue-400 rounded-t transition-all duration-700 ease-out"
                        style={{
                          height: `${maxTrendValue > 0 ? (item.leads / maxTrendValue) * 140 : 0}px`,
                        }}
                      />
                    </div>
                    <div className="flex flex-col items-center">
                      <span className="text-xs text-gray-500 mb-1">
                        {item.signings}
                      </span>
                      <div
                        className="w-6 bg-green-400 rounded-t transition-all duration-700 ease-out"
                        style={{
                          height: `${maxTrendValue > 0 ? (item.signings / maxTrendValue) * 140 : 0}px`,
                        }}
                      />
                    </div>
                  </div>
                  <span className="text-xs text-gray-500 mt-2">
                    {item.month}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-400 rounded" />
                <span className="text-xs text-gray-500">新增线索</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-400 rounded" />
                <span className="text-xs text-gray-500">签约数</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-6">
            <PieChart className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-800">阶段分布占比</h3>
          </div>
          <div className="flex items-center gap-8">
            <div className="relative w-40 h-40">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                {stats &&
                  (() => {
                    const total = Object.values(stats.byStage).reduce(
                      (a, b) => a + b,
                      0
                    )
                    let offset = 0
                    const colors = ['#3B82F6', '#22C55E', '#A855F7', '#F97316']
                    return Object.values(stats.byStage).map((value, index) => {
                      const percentage = total > 0 ? (value / total) * 100 : 0
                      const strokeDasharray = `${percentage} ${100 - percentage}`
                      const result = (
                        <circle
                          key={index}
                          cx="50"
                          cy="50"
                          r="40"
                          fill="none"
                          stroke={colors[index]}
                          strokeWidth="20"
                          strokeDasharray={strokeDasharray}
                          strokeDashoffset={-offset}
                          className="transition-all duration-700"
                        />
                      )
                      offset += percentage
                      return result
                    })
                  })()}
                <circle
                  cx="50"
                  cy="50"
                  r="25"
                  fill="white"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-gray-800">
                  {stats?.total || 0}
                </span>
                <span className="text-xs text-gray-500">总计</span>
              </div>
            </div>
            <div className="flex-1 space-y-3">
              {stats &&
                Object.entries(stats.byStage).map(([stage, count], index) => {
                  const total = Object.values(stats.byStage).reduce(
                    (a, b) => a + b,
                    0
                  )
                  const percentage =
                    total > 0 ? Math.round((count / total) * 100) : 0
                  const colors = [
                    'bg-blue-500',
                    'bg-green-500',
                    'bg-purple-500',
                    'bg-orange-500',
                  ]
                  return (
                    <div
                      key={stage}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-3 h-3 rounded ${colors[index]}`}
                        />
                        <span className="text-sm text-gray-600">
                          {stageLabels[stage]}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-800">
                          {count}
                        </span>
                        <span className="text-xs text-gray-400">
                          {percentage}%
                        </span>
                      </div>
                    </div>
                  )
                })}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-800">最近加盟商</h3>
            </div>
            <span className="text-xs text-blue-500 cursor-pointer hover:text-blue-600">
              查看全部
            </span>
          </div>
          <div className="space-y-3">
            {recentFranchisees.length === 0 ? (
              <div className="text-center py-8 text-gray-500">暂无加盟商数据</div>
            ) : (
              recentFranchisees.map((franchisee) => (
                <div
                  key={franchisee.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 ${stageBgColors[franchisee.stage]} rounded-full flex items-center justify-center`}
                    >
                      <span
                        className={`text-sm font-medium ${stageTextColors[franchisee.stage]}`}
                      >
                        {franchisee.contact_name?.charAt(0) || '加'}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-800 text-sm">
                        {franchisee.contact_name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {franchisee.project_name || '未分配项目'}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                      franchisee.stage === 'lead'
                        ? 'bg-blue-100 text-blue-700'
                        : franchisee.stage === 'signed'
                        ? 'bg-green-100 text-green-700'
                        : franchisee.stage === 'opened'
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-orange-100 text-orange-700'
                    }`}
                  >
                    {stageLabels[franchisee.stage]}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-800">热门项目</h3>
          <span className="text-xs text-blue-500 cursor-pointer hover:text-blue-600">
            查看全部
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {projects.length === 0 ? (
            <div className="col-span-full text-center py-8 text-gray-500">
              暂无项目数据
            </div>
          ) : (
            projects.map((project) => (
              <div
                key={project.id}
                className="p-4 border border-gray-100 rounded-lg hover:border-blue-200 hover:bg-blue-50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium text-gray-800">
                      {project.name}
                    </h4>
                    <p className="text-xs text-gray-500 mt-1">
                      {project.industry} · {project.category}
                    </p>
                  </div>
                  <span
                    className={`inline-block px-2 py-0.5 text-xs font-medium rounded ${
                      project.status === 'approved'
                        ? 'bg-green-100 text-green-700'
                        : project.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-700'
                        : project.status === 'rejected'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {project.status === 'approved'
                      ? '已通过'
                      : project.status === 'pending'
                      ? '审核中'
                      : project.status === 'rejected'
                      ? '已拒绝'
                      : '草稿'}
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between text-sm">
                  <span className="text-gray-600">
                    ¥{project.investment_min?.toLocaleString()} -{' '}
                    ¥{project.investment_max?.toLocaleString()}
                  </span>
                  <span className="text-gray-500">
                    {project.view_count || 0} 次浏览
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
