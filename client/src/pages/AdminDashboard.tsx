import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api'
import { DashboardStats } from '../types'
import {
  Users, Briefcase, DollarSign, AlertTriangle, TrendingUp, Star,
  BarChart3, FileText, Shield, ChevronRight
} from 'lucide-react'

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await api.get('/admin/dashboard')
        setStats(data)
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  const statCards = stats ? [
    { label: '注册用户', value: stats.overview.totalUsers, icon: Users, color: 'from-blue-500 to-blue-600' },
    { label: '任务总数', value: stats.overview.totalTasks, icon: Briefcase, color: 'from-green-500 to-green-600' },
    { label: '投标总数', value: stats.overview.totalBids, icon: FileText, color: 'from-purple-500 to-purple-600' },
    { label: '累计成交', value: `¥${(stats.overview.totalAmount / 10000).toFixed(1)}万`, icon: DollarSign, color: 'from-amber-500 to-amber-600' },
    { label: '进行中任务', value: stats.overview.activeTasks, icon: TrendingUp, color: 'from-indigo-500 to-indigo-600' },
    { label: '待处理争议', value: stats.overview.pendingDisputes, icon: AlertTriangle, color: 'from-red-500 to-red-600' },
  ] : []

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">后台管理</h1>
          <p className="text-gray-500 mt-1">平台运营数据总览</p>
        </div>
        <div className="flex gap-3">
          <Link to="/admin/disputes" className="btn-secondary">
            争议仲裁
          </Link>
          <Link to="/admin/trends" className="btn-primary">
            趋势分析
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {loading ? (
          Array(6).fill(0).map((_, i) => (
            <div key={i} className="card p-5 animate-pulse">
              <div className="h-10 bg-gray-200 rounded-lg w-10 mb-3"></div>
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-1"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))
        ) : (
          statCards.map((stat) => (
            <div key={stat.label} className="card p-5 hover:shadow-md transition-shadow">
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-3`}>
                <stat.icon className="w-5 h-5 text-white" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
              <div className="text-sm text-gray-500">{stat.label}</div>
            </div>
          ))
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Tasks */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <Briefcase className="w-5 h-5 mr-2 text-primary-600" />
              最新任务
            </h2>
            <Link to="/tasks" className="text-primary-600 text-sm hover:text-primary-700 flex items-center">
              查看全部 <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {loading ? (
            <div className="space-y-3">
              {Array(5).fill(0).map((_, i) => (
                <div key={i} className="h-14 bg-gray-100 rounded-lg animate-pulse"></div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {stats?.recentTasks.map((task) => (
                <Link
                  key={task.id}
                  to={`/tasks/${task.id}`}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-primary-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{task.title}</p>
                      <p className="text-xs text-gray-500">{task.employer?.username}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-amber-600 font-semibold text-sm">
                      ¥{task.budgetMin.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(task.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Top Providers */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <Star className="w-5 h-5 mr-2 text-amber-500" />
              优秀服务商
            </h2>
          </div>

          {loading ? (
            <div className="space-y-3">
              {Array(5).fill(0).map((_, i) => (
                <div key={i} className="h-14 bg-gray-100 rounded-lg animate-pulse"></div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {stats?.topProviders.map((provider, index) => (
                <Link
                  key={provider.id}
                  to={`/profile/${provider.id}`}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <img
                        src={provider.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${provider.username}`}
                        alt=""
                        className="w-10 h-10 rounded-full"
                      />
                      <span className={`absolute -top-1 -right-1 w-5 h-5 rounded-full text-xs flex items-center justify-center font-bold text-white ${
                        index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-amber-600' : 'bg-gray-300'
                      }`}>
                        {index + 1}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{provider.username}</p>
                      <div className="flex items-center space-x-2 text-xs text-gray-500">
                        <span className="flex items-center">
                          <Star className="w-3 h-3 text-yellow-500 mr-0.5" />
                          {provider.rating.toFixed(1)}
                        </span>
                        <span>{provider.completedOrders}单</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1 max-w-[140px] justify-end">
                    {provider.skills?.slice(0, 2).map((s) => (
                      <span key={s.id} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                        {s.name}
                      </span>
                    ))}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="card p-6 lg:col-span-2">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">快捷操作</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link to="/admin/disputes" className="p-5 bg-red-50 hover:bg-red-100 rounded-xl transition-colors">
              <Shield className="w-8 h-8 text-red-600 mb-3" />
              <h3 className="font-semibold text-gray-900">争议仲裁</h3>
              <p className="text-sm text-gray-500 mt-1">处理用户争议投诉</p>
            </Link>
            <Link to="/admin/trends" className="p-5 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors">
              <BarChart3 className="w-8 h-8 text-blue-600 mb-3" />
              <h3 className="font-semibold text-gray-900">行业趋势</h3>
              <p className="text-sm text-gray-500 mt-1">查看需求和供需分析</p>
            </Link>
            <Link to="/tasks" className="p-5 bg-green-50 hover:bg-green-100 rounded-xl transition-colors">
              <Briefcase className="w-8 h-8 text-green-600 mb-3" />
              <h3 className="font-semibold text-gray-900">任务管理</h3>
              <p className="text-sm text-gray-500 mt-1">查看和管理所有任务</p>
            </Link>
            <Link to="/admin/trends" className="p-5 bg-purple-50 hover:bg-purple-100 rounded-xl transition-colors">
              <TrendingUp className="w-8 h-8 text-purple-600 mb-3" />
              <h3 className="font-semibold text-gray-900">技能供需</h3>
              <p className="text-sm text-gray-500 mt-1">分析技能缺口和预警</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
