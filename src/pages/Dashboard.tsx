import { useEffect, useState } from 'react'
import {
  Building2,
  Users,
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  Shield,
  AlertTriangle,
  FileCheck,
  Eye,
  UserCheck,
  Ban,
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { api } from '@/lib/api'

interface Stats {
  houses: number
  clients: number
  schedules: number
  transactions: number
  commissions: number
}

interface RecentActivity {
  id: number
  type: string
  title: string
  time: string
  status: string
}

interface UserStatus {
  cert_status: string
  cert_label: string
  role: string
  role_label: string
  permissions: string[]
}

interface Todos {
  pending_certs: number
  pending_reviews: number
  pending_houses: number
  org_members: number
}

interface DashboardData {
  stats: Stats
  activities: RecentActivity[]
  userStatus: UserStatus
  todos: Todos
}

export default function Dashboard() {
  const user = useAuthStore((state) => state.user)
  const [stats, setStats] = useState<Stats>({
    houses: 0,
    clients: 0,
    schedules: 0,
    transactions: 0,
    commissions: 0,
  })
  const [activities, setActivities] = useState<RecentActivity[]>([])
  const [userStatus, setUserStatus] = useState<UserStatus | null>(null)
  const [todos, setTodos] = useState<Todos | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const res = await api.get<DashboardData>('/dashboard/stats')
        if (res.success && res.data) {
          setStats(res.data.stats)
          setActivities(res.data.activities)
          setUserStatus(res.data.userStatus)
          setTodos(res.data.todos)
        }
      } catch (err) {
        console.error('Failed to load dashboard data:', err)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const statCards = [
    {
      title: '我的房源',
      value: stats.houses,
      icon: Building2,
      color: 'bg-primary',
      trend: '+12%',
      trendUp: true,
    },
    {
      title: '我的客户',
      value: stats.clients,
      icon: Users,
      color: 'bg-secondary',
      trend: '+8%',
      trendUp: true,
    },
    {
      title: '今日带看',
      value: stats.schedules,
      icon: Calendar,
      color: 'bg-success',
      trend: '-3%',
      trendUp: false,
    },
    {
      title: '进行中交易',
      value: stats.transactions,
      icon: Clock,
      color: 'bg-warning',
      trend: '+5%',
      trendUp: true,
    },
    {
      title: '累计佣金',
      value: `¥${stats.commissions.toLocaleString()}`,
      icon: DollarSign,
      color: 'bg-danger',
      trend: '+15%',
      trendUp: true,
    },
  ]

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'house':
        return Building2
      case 'client':
        return Users
      case 'schedule':
        return Calendar
      case 'transaction':
        return Clock
      case 'commission':
        return DollarSign
      default:
        return CheckCircle
    }
  }

  const getCertIcon = (status: string) => {
    switch (status) {
      case 'certified':
        return UserCheck
      case 'pending':
        return Clock
      case 'rejected':
        return Ban
      default:
        return AlertTriangle
    }
  }

  const getCertColor = (status: string) => {
    switch (status) {
      case 'certified':
        return 'bg-success'
      case 'pending':
        return 'bg-warning'
      case 'rejected':
        return 'bg-danger'
      default:
        return 'bg-zinc-400'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900">工作台</h1>
        <p className="text-zinc-500 mt-1">
          欢迎回来，{user?.name}！今天是 {new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
        </p>
      </div>

      {userStatus && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl p-5 shadow-sm border border-zinc-100">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm text-zinc-500 mb-1">实名认证状态</p>
                <p className="text-xl font-bold text-zinc-900">{userStatus.cert_label}</p>
                <p className="text-xs text-zinc-400 mt-1">角色：{userStatus.role_label}</p>
              </div>
              <div className={`${getCertColor(userStatus.cert_status)} p-3 rounded-lg text-white`}>
                {(() => {
                  const Icon = getCertIcon(userStatus.cert_status)
                  return <Icon className="w-5 h-5" />
                })()}
              </div>
            </div>
            {userStatus.cert_status !== 'certified' && (
              <button className="mt-3 w-full py-2 text-sm font-medium text-primary bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors">
                {userStatus.cert_status === 'pending' ? '查看审核进度' : '去实名认证'}
              </button>
            )}
          </div>

          <div className="bg-white rounded-xl p-5 shadow-sm border border-zinc-100">
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="text-sm text-zinc-500 mb-1">权限边界</p>
                <p className="text-xl font-bold text-zinc-900">{userStatus.role_label}</p>
              </div>
              <div className="bg-primary p-3 rounded-lg text-white">
                <Shield className="w-5 h-5" />
              </div>
            </div>
            <div className="flex flex-wrap gap-1">
              {userStatus.permissions.slice(0, 3).map((p, i) => (
                <span key={i} className="px-2 py-1 text-xs bg-primary/10 text-primary rounded">
                  {p}
                </span>
              ))}
              {userStatus.permissions.length > 3 && (
                <span className="px-2 py-1 text-xs bg-zinc-100 text-zinc-500 rounded">
                  +{userStatus.permissions.length - 3}
                </span>
              )}
            </div>
          </div>

          {todos && (todos.pending_certs > 0 || todos.pending_reviews > 0 || todos.pending_houses > 0 || todos.org_members > 0) && (
            <div className="bg-white rounded-xl p-5 shadow-sm border border-zinc-100">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-sm text-zinc-500 mb-1">待办复查</p>
                  <p className="text-xl font-bold text-zinc-900">
                    {todos.pending_certs + todos.pending_reviews + todos.pending_houses} 项待处理
                  </p>
                </div>
                <div className="bg-warning p-3 rounded-lg text-white">
                  <AlertTriangle className="w-5 h-5" />
                </div>
              </div>
              <div className="space-y-2 text-sm">
                {todos.pending_certs > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-600 flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-primary" /> 实名认证待审
                    </span>
                    <span className="font-medium text-danger">{todos.pending_certs}</span>
                  </div>
                )}
                {todos.pending_houses > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-600 flex items-center gap-2">
                      <FileCheck className="w-4 h-4 text-warning" /> 房源备案待审
                    </span>
                    <span className="font-medium text-danger">{todos.pending_houses}</span>
                  </div>
                )}
                {todos.pending_reviews > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-600 flex items-center gap-2">
                      <Eye className="w-4 h-4 text-secondary" /> 敏感操作复查
                    </span>
                    <span className="font-medium text-danger">{todos.pending_reviews}</span>
                  </div>
                )}
                {todos.org_members > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-600 flex items-center gap-2">
                      <Users className="w-4 h-4 text-success" /> 组织成员
                    </span>
                    <span className="font-medium text-zinc-900">{todos.org_members} 人</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {statCards.map((card, index) => {
          const Icon = card.icon
          return (
            <div
              key={index}
              className="bg-white rounded-xl p-5 shadow-sm border border-zinc-100 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-zinc-500">{card.title}</p>
                  <p className="text-2xl font-bold text-zinc-900 mt-2">
                    {card.value}
                  </p>
                  <div className="flex items-center gap-1 mt-2">
                    {card.trendUp ? (
                      <TrendingUp className="w-4 h-4 text-success" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-danger" />
                    )}
                    <span
                      className={`text-xs font-medium ${
                        card.trendUp ? 'text-success' : 'text-danger'
                      }`}
                    >
                      {card.trend}
                    </span>
                    <span className="text-xs text-zinc-400">较上月</span>
                  </div>
                </div>
                <div className={`${card.color} p-3 rounded-lg text-white`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl p-6 shadow-sm border border-zinc-100">
          <h2 className="text-lg font-semibold text-zinc-900 mb-4">最近动态</h2>
          <div className="space-y-4">
            {activities.length === 0 ? (
              <div className="text-center py-8 text-zinc-400">
                <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>暂无动态数据</p>
              </div>
            ) : (
              activities.map((activity) => {
                const Icon = getActivityIcon(activity.type)
                return (
                  <div
                    key={activity.id}
                    className="flex items-start gap-4 p-3 rounded-lg hover:bg-zinc-50 transition-colors"
                  >
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-zinc-900">
                        {activity.title}
                      </p>
                      <p className="text-xs text-zinc-500 mt-1">{activity.time}</p>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        activity.status === 'success'
                          ? 'bg-green-100 text-success'
                          : 'bg-yellow-100 text-warning'
                      }`}
                    >
                      {activity.status === 'success' ? '已完成' : '进行中'}
                    </span>
                  </div>
                )
              })
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-zinc-100">
          <h2 className="text-lg font-semibold text-zinc-900 mb-4">快捷操作</h2>
          <div className="space-y-3">
            <button className="w-full flex items-center gap-3 p-4 rounded-lg border border-zinc-200 hover:border-primary hover:bg-primary/5 transition-colors text-left">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Building2 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-zinc-900">新增房源</p>
                <p className="text-xs text-zinc-500">录入新的房源信息</p>
              </div>
            </button>
            <button className="w-full flex items-center gap-3 p-4 rounded-lg border border-zinc-200 hover:border-secondary hover:bg-secondary/5 transition-colors text-left">
              <div className="p-2 bg-secondary/10 rounded-lg">
                <Users className="w-5 h-5 text-secondary" />
              </div>
              <div>
                <p className="font-medium text-zinc-900">新增客户</p>
                <p className="text-xs text-zinc-500">添加新的客户信息</p>
              </div>
            </button>
            <button className="w-full flex items-center gap-3 p-4 rounded-lg border border-zinc-200 hover:border-success hover:bg-success/5 transition-colors text-left">
              <div className="p-2 bg-success/10 rounded-lg">
                <Calendar className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="font-medium text-zinc-900">安排带看</p>
                <p className="text-xs text-zinc-500">创建新的带看日程</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
