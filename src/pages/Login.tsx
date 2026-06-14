import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiPost, api } from '@/lib/api'
import { useAuth } from '@/stores/auth'
import {
  Lock, User, AlertCircle, Loader2, Crown, Edit3, UserCircle,
  Newspaper, Building2, MessageSquareWarning, TrendingUp,
  ChevronRight, ArrowRight, CheckCircle, Clock, Zap
} from 'lucide-react'

interface LoginError {
  error_code?: string
  error: string
}

interface OverviewData {
  stats: {
    total_news: number
    published_news: number
    total_complaints: number
    resolved_complaints: number
    total_services: number
    total_pois: number
    pending_reviews: number
  }
  latest_news: { id: number; title: string; category: string; published_at: string }[]
  hot_services: { id: number; name: string; bureau: string; category: string }[]
  recent_complaints: { id: number; title: string; status: string; priority: string; assigned_department: string; created_at: string }[]
  hot_opinion: { keyword: string; total_heat: number; sentiment: string }[]
}

interface RoleCapability {
  module: string
  desc: string
  path: string
}

interface RoleData {
  role: string
  label: string
  workspace: string
  workspace_path: string
  description: string
  capabilities: RoleCapability[]
}

const ROLE_ICONS: Record<string, React.ReactNode> = {
  admin: <Crown className="w-6 h-6" />,
  editor: <Edit3 className="w-6 h-6" />,
  user: <UserCircle className="w-6 h-6" />,
}

const ROLE_COLORS: Record<string, { bg: string; border: string; icon: string; badge: string }> = {
  admin: { bg: 'bg-amber-50', border: 'border-amber-200', icon: 'text-amber-600', badge: 'bg-amber-100 text-amber-700' },
  editor: { bg: 'bg-blue-50', border: 'border-blue-200', icon: 'text-blue-600', badge: 'bg-blue-100 text-blue-700' },
  user: { bg: 'bg-emerald-50', border: 'border-emerald-200', icon: 'text-emerald-600', badge: 'bg-emerald-100 text-emerald-700' },
}

const DEMO_CREDENTIALS: Record<string, { username: string; password: string }> = {
  admin: { username: 'admin', password: 'admin123' },
  editor: { username: 'editor1', password: 'editor123' },
  user: { username: 'user1', password: 'user123' },
}

const COMPLAINT_STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending: { label: '待处理', color: 'bg-yellow-100 text-yellow-700' },
  processing: { label: '处理中', color: 'bg-blue-100 text-blue-700' },
  resolved: { label: '已解决', color: 'bg-green-100 text-green-700' },
  closed: { label: '已关闭', color: 'bg-slate-100 text-slate-600' },
  rejected: { label: '已驳回', color: 'bg-red-100 text-red-700' },
}

const SENTIMENT_MAP: Record<string, { label: string; color: string }> = {
  positive: { label: '正面', color: 'bg-green-100 text-green-700' },
  neutral: { label: '中性', color: 'bg-slate-100 text-slate-600' },
  negative: { label: '负面', color: 'bg-red-100 text-red-700' },
}

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<LoginError | null>(null)
  const [loading, setLoading] = useState(false)
  const [overview, setOverview] = useState<OverviewData | null>(null)
  const [roles, setRoles] = useState<RoleData[]>([])
  const [dataLoading, setDataLoading] = useState(true)
  const [transitioning, setTransitioning] = useState(false)
  const navigate = useNavigate()
  const { login } = useAuth()

  useEffect(() => {
    const fetchData = async () => {
      setDataLoading(true)
      try {
        const [overviewRes, rolesRes] = await Promise.all([
          api<OverviewData>('/public/overview'),
          api<RoleData[]>('/public/roles'),
        ])
        if (overviewRes.success) setOverview(overviewRes.data)
        if (rolesRes.success) setRoles(rolesRes.data)
      } catch {
        // silently fail for public data
      } finally {
        setDataLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleSubmit = async (e?: React.FormEvent, overrideUsername?: string, overridePassword?: string) => {
    if (e) e.preventDefault()
    setError(null)

    const u = overrideUsername ?? username
    const p = overridePassword ?? password

    if (!u) {
      setError({ error_code: 'EMPTY_USERNAME', error: '账号不能为空' })
      return
    }
    if (!p) {
      setError({ error_code: 'EMPTY_PASSWORD', error: '密码不能为空' })
      return
    }

    setLoading(true)
    try {
      const res = await apiPost('/auth/login', { username: u, password: p }) as any
      if (res.success) {
        login(res.data.user, res.data.token, res.data.workspace)
        const targetPath = res.data.workspace?.path || '/'
        setTransitioning(true)
        setTimeout(() => {
          navigate(targetPath)
        }, 1500)
      } else {
        setError({ error_code: res.error_code, error: res.error || '登录失败' })
      }
    } catch {
      setError({ error_code: 'NETWORK_ERROR', error: '网络连接失败，请检查网络' })
    } finally {
      setLoading(false)
    }
  }

  const handleQuickLogin = (role: string) => {
    const creds = DEMO_CREDENTIALS[role]
    if (!creds) return
    setUsername(creds.username)
    setPassword(creds.password)
    setError(null)
    handleSubmit(undefined, creds.username, creds.password)
  }

  const getErrorSuggestion = (code?: string) => {
    switch (code) {
      case 'USER_NOT_FOUND': return '请确认账号后重试，或联系系统管理员注册'
      case 'INVALID_PASSWORD': return '连续5次输错将临时锁定账号'
      case 'WORKSPACE_ERROR': return '请刷新页面重试'
      case 'NETWORK_ERROR': return '请检查网络连接，或稍后重试'
      default: return ''
    }
  }

  const fieldHasError = (field: 'username' | 'password') => {
    if (!error?.error_code) return false
    if (field === 'username') return error.error_code === 'EMPTY_USERNAME'
    if (field === 'password') return error.error_code === 'EMPTY_PASSWORD'
    return false
  }

  const isCardError = error?.error_code && !['EMPTY_USERNAME', 'EMPTY_PASSWORD'].includes(error.error_code)

  return (
    <div className="min-h-screen bg-slate-50">
      {transitioning && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-white animate-spin mx-auto mb-4" />
            <p className="text-white text-xl font-medium">正在进入工作台...</p>
          </div>
        </div>
      )}

      <header className="bg-gradient-to-r from-slate-900 via-blue-900 to-slate-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h1 className="text-xl sm:text-2xl font-bold tracking-wide">广州市融媒体公共服务中枢平台</h1>
            {overview?.stats && (
              <div className="flex flex-wrap items-center gap-3 sm:gap-5 text-sm">
                <span className="flex items-center gap-1.5">
                  <Newspaper className="w-4 h-4 text-blue-300" />
                  已发布新闻 <strong className="text-blue-200">{overview.stats.published_news}</strong>
                </span>
                <span className="flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-emerald-300" />
                  服务事项 <strong className="text-emerald-200">{overview.stats.total_services}</strong>
                </span>
                <span className="flex items-center gap-1.5">
                  <MessageSquareWarning className="w-4 h-4 text-amber-300" />
                  诉求总量 <strong className="text-amber-200">{overview.stats.total_complaints}</strong>
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-green-300" />
                  已办结 <strong className="text-green-200">{overview.stats.resolved_complaints}</strong>
                </span>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="hidden lg:block w-[60%] space-y-5">
            <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-3 border-b border-slate-100 bg-slate-50/50">
                <Newspaper className="w-4 h-4 text-blue-500" />
                <h2 className="font-semibold text-slate-800 text-sm">最新资讯</h2>
              </div>
              <div className="divide-y divide-slate-100">
                {dataLoading ? (
                  <div className="px-5 py-8 text-center text-slate-400 text-sm">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
                    加载中...
                  </div>
                ) : overview?.latest_news.length ? overview.latest_news.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 cursor-pointer group transition-colors">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-600 shrink-0">
                      {item.category}
                    </span>
                    <span className="text-sm text-slate-700 truncate group-hover:text-blue-600 transition-colors flex-1">
                      {item.title}
                    </span>
                    <span className="text-xs text-slate-400 shrink-0">{item.published_at?.slice(0, 10)}</span>
                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-400 transition-colors shrink-0" />
                  </div>
                )) : (
                  <div className="px-5 py-6 text-center text-slate-400 text-sm">暂无资讯</div>
                )}
              </div>
            </section>

            <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-3 border-b border-slate-100 bg-slate-50/50">
                <Building2 className="w-4 h-4 text-emerald-500" />
                <h2 className="font-semibold text-slate-800 text-sm">热门服务</h2>
              </div>
              <div className="p-4">
                {dataLoading ? (
                  <div className="py-4 text-center text-slate-400 text-sm">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
                    加载中...
                  </div>
                ) : overview?.hot_services.length ? (
                  <div className="grid grid-cols-2 gap-2">
                    {overview.hot_services.map((item) => (
                      <div key={item.id} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-50 hover:bg-emerald-50 border border-slate-100 hover:border-emerald-200 cursor-pointer transition-colors group">
                        <Zap className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-slate-700 truncate group-hover:text-emerald-700">{item.name}</p>
                          <p className="text-xs text-slate-400 truncate">{item.bureau}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-4 text-center text-slate-400 text-sm">暂无服务</div>
                )}
              </div>
            </section>

            <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-3 border-b border-slate-100 bg-slate-50/50">
                <MessageSquareWarning className="w-4 h-4 text-amber-500" />
                <h2 className="font-semibold text-slate-800 text-sm">问政动态</h2>
              </div>
              <div className="divide-y divide-slate-100">
                {dataLoading ? (
                  <div className="px-5 py-6 text-center text-slate-400 text-sm">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
                    加载中...
                  </div>
                ) : overview?.recent_complaints.length ? overview.recent_complaints.map((item) => {
                  const statusInfo = COMPLAINT_STATUS_MAP[item.status] || { label: item.status, color: 'bg-slate-100 text-slate-600' }
                  return (
                    <div key={item.id} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 cursor-pointer group transition-colors">
                      <span className="text-sm text-slate-700 truncate flex-1 group-hover:text-amber-600 transition-colors">{item.title}</span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium shrink-0 ${statusInfo.color}`}>
                        {statusInfo.label}
                      </span>
                      <span className="text-xs text-slate-400 shrink-0">{item.assigned_department}</span>
                    </div>
                  )
                }) : (
                  <div className="px-5 py-6 text-center text-slate-400 text-sm">暂无问政</div>
                )}
              </div>
            </section>

            <section className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-3 border-b border-slate-100 bg-slate-50/50">
                <TrendingUp className="w-4 h-4 text-rose-500" />
                <h2 className="font-semibold text-slate-800 text-sm">舆情热词</h2>
              </div>
              <div className="p-4">
                {dataLoading ? (
                  <div className="py-4 text-center text-slate-400 text-sm">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
                    加载中...
                  </div>
                ) : overview?.hot_opinion.length ? (
                  <div className="flex flex-wrap gap-2">
                    {overview.hot_opinion.map((item, idx) => {
                      const sentimentInfo = SENTIMENT_MAP[item.sentiment] || { label: item.sentiment, color: 'bg-slate-100 text-slate-600' }
                      return (
                        <div key={idx} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-200 hover:border-rose-300 hover:bg-rose-50 cursor-pointer transition-colors">
                          <span className="text-sm font-medium text-slate-700">{item.keyword}</span>
                          <span className="text-xs text-slate-400">热度 {item.total_heat}</span>
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${sentimentInfo.color}`}>
                            {sentimentInfo.label}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="py-4 text-center text-slate-400 text-sm">暂无舆情</div>
                )}
              </div>
            </section>
          </div>

          <div className="w-full lg:w-[40%]">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 sm:p-8">
              <h2 className="text-xl font-bold text-slate-800 mb-1">登录工作台</h2>
              <p className="text-sm text-slate-400 mb-6">选择角色工作台并登录，或直接输入账号密码</p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">账号</label>
                  <div className="relative">
                    <User size={18} className={`absolute left-3 top-1/2 -translate-y-1/2 ${fieldHasError('username') ? 'text-red-400' : 'text-slate-400'}`} />
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => {
                        setUsername(e.target.value)
                        if (error?.error_code === 'EMPTY_USERNAME') setError(null)
                      }}
                      className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-sm ${
                        fieldHasError('username') ? 'border-red-400 bg-red-50' : 'border-slate-300'
                      }`}
                      placeholder="请输入账号"
                      autoComplete="username"
                    />
                  </div>
                  {fieldHasError('username') && (
                    <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle size={12} /> 账号不能为空
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">密码</label>
                  <div className="relative">
                    <Lock size={18} className={`absolute left-3 top-1/2 -translate-y-1/2 ${fieldHasError('password') ? 'text-red-400' : 'text-slate-400'}`} />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value)
                        if (error?.error_code === 'EMPTY_PASSWORD') setError(null)
                      }}
                      className={`w-full pl-10 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-sm ${
                        fieldHasError('password') ? 'border-red-400 bg-red-50' : 'border-slate-300'
                      }`}
                      placeholder="请输入密码"
                      autoComplete="current-password"
                    />
                  </div>
                  {fieldHasError('password') && (
                    <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle size={12} /> 密码不能为空
                    </p>
                  )}
                </div>

                {isCardError && (
                  <div className="text-red-600 text-sm bg-red-50 border border-red-200 py-3 px-4 rounded-lg flex items-start gap-2">
                    <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-medium">{error.error}</p>
                      {getErrorSuggestion(error.error_code) && (
                        <p className="text-xs text-red-400 mt-0.5">{getErrorSuggestion(error.error_code)}</p>
                      )}
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition flex items-center justify-center gap-2 text-sm"
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      登录中...
                    </>
                  ) : (
                    <>
                      登 录
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>

        <section className="mt-8 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-slate-500" />
            <h2 className="text-lg font-semibold text-slate-800">选择角色工作台</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {dataLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 animate-pulse">
                  <div className="h-5 bg-slate-200 rounded w-24 mb-3" />
                  <div className="h-4 bg-slate-100 rounded w-40 mb-5" />
                  <div className="space-y-2">
                    {Array.from({ length: 3 }).map((_, j) => (
                      <div key={j} className="h-4 bg-slate-100 rounded" />
                    ))}
                  </div>
                </div>
              ))
            ) : roles.map((role) => {
              const colors = ROLE_COLORS[role.role] || ROLE_COLORS.user
              return (
                <div key={role.role} className={`bg-white rounded-xl shadow-sm border ${colors.border} overflow-hidden hover:shadow-md transition-shadow`}>
                  <div className={`${colors.bg} px-5 py-4 border-b ${colors.border}`}>
                    <div className="flex items-center gap-3">
                      <span className={`${colors.icon}`}>{ROLE_ICONS[role.role]}</span>
                      <div>
                        <h3 className="font-semibold text-slate-800">{role.label}</h3>
                        <p className="text-xs text-slate-500">{role.workspace}</p>
                      </div>
                    </div>
                  </div>
                  <div className="px-5 py-4">
                    <p className="text-xs text-slate-500 mb-1">工作台路径</p>
                    <p className="text-sm font-mono text-slate-700 mb-4 bg-slate-50 px-2 py-1 rounded inline-block">{role.workspace_path}</p>
                    <p className="text-xs text-slate-500 mb-2">功能权限</p>
                    <ul className="space-y-1.5 mb-5">
                      {role.capabilities.slice(0, 4).map((cap) => (
                        <li key={cap.module} className="flex items-start gap-2 text-sm">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                          <span className="text-slate-600">
                            <span className="font-medium text-slate-700">{cap.module}</span>
                            <span className="text-slate-400 mx-1">·</span>
                            {cap.desc}
                          </span>
                        </li>
                      ))}
                      {role.capabilities.length > 4 && (
                        <li className="text-xs text-slate-400 pl-5.5">还有 {role.capabilities.length - 4} 项权限</li>
                      )}
                    </ul>
                    <button
                      onClick={() => handleQuickLogin(role.role)}
                      disabled={loading}
                      className={`w-full py-2 rounded-lg text-sm font-medium transition flex items-center justify-center gap-1.5 ${colors.bg} ${colors.icon} hover:opacity-80 border ${colors.border} disabled:opacity-50`}
                    >
                      <Zap size={14} />
                      快速登录
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      </main>
    </div>
  )
}
