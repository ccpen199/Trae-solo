import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api'
import { DashboardStats } from '../types'
import {
  Users, Briefcase, DollarSign, AlertTriangle, TrendingUp, Star,
  BarChart3, FileText, Shield, ChevronRight, Wallet, Scale, Eye,
  FileCheck, Award, PieChart, Bell, Zap, TrendingDown
} from 'lucide-react'

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await api.get('/admin/dashboard')
        setStats(data.data || data)
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

  const functionCards = stats ? [
    {
      title: '资金托管中心',
      subtitle: '资金管理',
      desc: '托管资金池 · 分阶段释放',
      icon: Wallet,
      color: 'from-emerald-500 to-green-600',
      bgColor: 'bg-green-50 hover:bg-green-100',
      iconColor: 'text-green-600',
      link: '/admin/disputes',
      stat: `¥${((stats.overview.totalAmount || 0) / 10000).toFixed(1)}万`,
      statLabel: '累计托管',
    },
    {
      title: '欺诈识别监控',
      subtitle: '风险管理',
      desc: '风险扫描 · 欺诈预警',
      icon: Shield,
      color: 'from-orange-500 to-red-500',
      bgColor: 'bg-orange-50 hover:bg-orange-100',
      iconColor: 'text-orange-600',
      link: '/admin/disputes',
      stat: stats.overview.pendingRiskReports,
      statLabel: '待处理风险报告',
    },
    {
      title: '原创性检测',
      subtitle: '内容审核',
      desc: '抄袭检测 · 版权保护',
      icon: FileCheck,
      color: 'from-violet-500 to-purple-600',
      bgColor: 'bg-violet-50 hover:bg-violet-100',
      iconColor: 'text-violet-600',
      link: '/admin/trends',
      stat: stats.overview.originalityCheckCount,
      statLabel: '累计检测次数',
    },
    {
      title: '争议仲裁中心',
      subtitle: '纠纷处理',
      desc: '专家仲裁 · 公平裁决',
      icon: Scale,
      color: 'from-rose-500 to-red-600',
      bgColor: 'bg-rose-50 hover:bg-rose-100',
      iconColor: 'text-rose-600',
      link: '/admin/disputes',
      stat: stats.overview.pendingDisputes,
      statLabel: '待处理争议',
    },
    {
      title: '服务商管理',
      subtitle: '等级评定',
      desc: '星级评定 · 升降级管理',
      icon: Award,
      color: 'from-blue-500 to-indigo-600',
      bgColor: 'bg-blue-50 hover:bg-blue-100',
      iconColor: 'text-blue-600',
      link: '/admin/providers',
      stat: stats.overview.totalProviders,
      statLabel: '总服务商数',
    },
    {
      title: '行业趋势分析',
      subtitle: '数据洞察',
      desc: '需求趋势 · 技能缺口',
      icon: BarChart3,
      color: 'from-teal-500 to-cyan-600',
      bgColor: 'bg-teal-50 hover:bg-teal-100',
      iconColor: 'text-teal-600',
      link: '/admin/trends',
      stat: '查看详情',
      statLabel: '趋势图',
    },
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

      {/* Function Cards - 6大功能入口 */}
      <div className="card p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <Zap className="w-5 h-5 mr-2 text-amber-500" />
            业务功能入口
          </h2>
          <span className="text-sm text-gray-500">点击卡片进入对应管理页面</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            Array(6).fill(0).map((_, i) => (
              <div key={i} className="h-32 bg-gray-100 rounded-xl animate-pulse"></div>
            ))
          ) : (
            functionCards.map((card) => (
              <Link
                key={card.title}
                to={card.link}
                className={`p-5 rounded-xl transition-all group ${card.bgColor} border border-transparent hover:border-gray-200 hover:shadow-md`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow`}>
                    <card.icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900">{card.stat}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{card.statLabel}</p>
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-gray-900">{card.title}</h3>
                    <span className="text-xs px-2 py-0.5 bg-white/60 rounded-full text-gray-600">
                      {card.subtitle}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500">{card.desc}</p>
                </div>
                <div className="flex items-center justify-end mt-3 text-sm text-gray-400 group-hover:text-gray-600 transition-colors">
                  进入管理 <ChevronRight className="w-4 h-4 ml-1" />
                </div>
              </Link>
            ))
          )}
        </div>
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
            <Link to="/admin/providers" className="text-primary-600 text-sm hover:text-primary-700 flex items-center">
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
      </div>
    </div>
  )
}
