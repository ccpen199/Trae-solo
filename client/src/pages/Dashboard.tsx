import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import api from '../api'
import { User, Settings, CreditCard, Shield, Star, Award, FileText, TrendingUp, Clock, Plus, Briefcase, FolderOpen, Gavel, LayoutDashboard, Users, BarChart3 } from 'lucide-react'

export default function Dashboard() {
  const { user } = useAuthStore()
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      setTimeout(() => {
        setStats({
          completionRate: user?.completedOrders && user.totalOrders
            ? ((user.completedOrders / user.totalOrders) * 100).toFixed(1)
            : '100'
        })
        setLoading(false)
      }, 500)
    }
    fetchStats()
  }, [user])

  const getMenuItems = () => {
    const isEmployer = user?.role === 'EMPLOYER' || user?.role === 'BOTH'
    const isProvider = user?.role === 'PROVIDER' || user?.role === 'BOTH'
    const isAdmin = user?.role === 'ADMIN'

    const items = []

    if (isAdmin) {
      items.push(
        { icon: LayoutDashboard, label: '平台管理', link: '/admin', desc: '进入后台管理系统' }
      )
    }

    if (isEmployer) {
      items.push(
        { icon: Briefcase, label: '我发布的任务', link: '/my-tasks', desc: '管理我发布的所有任务' },
        { icon: Plus, label: '发布新需求', link: '/tasks/create', desc: '发布新的任务需求' },
        { icon: CreditCard, label: '我的钱包', link: '/wallet', desc: '余额、交易记录' },
        { icon: Gavel, label: '争议处理', link: '/admin/disputes', desc: '查看和处理相关争议' }
      )
    }

    if (isProvider) {
      items.push(
        { icon: FolderOpen, label: '我中标的任务', link: '/my-tasks', desc: '查看中标的任务' },
        { icon: TrendingUp, label: '我的投标', link: '/my-bids', desc: '查看投标记录和状态' },
        { icon: CreditCard, label: '我的钱包', link: '/wallet', desc: '余额、交易记录' },
        { icon: FileText, label: '作品管理', link: '/profile', desc: '管理个人作品集' }
      )
    }

    return items
  }

  const menuItems = getMenuItems()

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">个人中心</h1>

      {/* Profile Header */}
      <div className="card p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          <img
            src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username}`}
            alt=""
            className="w-24 h-24 rounded-2xl border-4 border-gray-100"
          />
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h2 className="text-2xl font-bold text-gray-900">{user?.username}</h2>
              <span className="badge bg-primary-50 text-primary-700">
                {user?.role === 'ADMIN' ? '管理员' : user?.role === 'PROVIDER' ? '服务商' : user?.role === 'BOTH' ? '雇主+服务商' : '雇主'}
              </span>
              <span className="badge bg-amber-50 text-amber-700 flex items-center">
                <Award className="w-3.5 h-3.5 mr-1" />
                Lv.{user?.level}
              </span>
            </div>
            <p className="text-gray-500 mt-1">{user?.bio || '这个人很懒，什么都没留下...'}</p>
            <div className="flex items-center gap-6 mt-4 flex-wrap">
              <div className="flex items-center">
                <Star className="w-4 h-4 text-yellow-500 mr-1" />
                <span className="font-semibold text-gray-900">{user?.rating?.toFixed(1)}</span>
                <span className="text-gray-500 text-sm ml-1">评分</span>
              </div>
              <div>
                <span className="font-semibold text-gray-900">{user?.completedOrders || 0}</span>
                <span className="text-gray-500 text-sm ml-1">已完成订单</span>
              </div>
              <div>
                <span className="font-semibold text-gray-900">{stats?.completionRate || '0'}%</span>
                <span className="text-gray-500 text-sm ml-1">完成率</span>
              </div>
              <div className="flex items-center">
                <Clock className="w-4 h-4 text-gray-400 mr-1" />
                <span className="text-gray-500 text-sm">{user?.email}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">账户余额</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">¥{user?.balance?.toLocaleString() || 0}</p>
            </div>
            <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">冻结金额</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">¥{user?.frozenBalance?.toLocaleString() || 0}</p>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
              <Shield className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">累计接单</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{user?.totalOrders || 0}</p>
            </div>
            <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center">
              <FileText className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
        <div className="card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">经验值</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{user?.experience || 0}</p>
            </div>
            <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center">
              <Award className="w-6 h-6 text-amber-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Menu Grid */}
      <h3 className="text-lg font-semibold text-gray-900 mb-4">功能菜单</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        {menuItems.map((item) => (
          <Link
            key={item.label}
            to={item.link}
            className="card p-5 hover:shadow-md transition-all group"
          >
            <div className="flex items-start space-x-4">
              <div className="w-11 h-11 bg-primary-50 rounded-xl flex items-center justify-center group-hover:bg-primary-100 transition-colors">
                <item.icon className="w-5 h-5 text-primary-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900">{item.label}</h4>
                <p className="text-sm text-gray-500 mt-0.5">{item.desc}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Admin Section */}
      {user?.role === 'ADMIN' && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">后台管理快捷入口</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link to="/admin" className="card p-5 hover:shadow-md transition-all bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-100">
              <h4 className="font-semibold text-gray-900">数据仪表盘</h4>
              <p className="text-sm text-gray-500 mt-1">查看平台整体运营数据</p>
            </Link>
            <Link to="/admin/disputes" className="card p-5 hover:shadow-md transition-all bg-gradient-to-br from-red-50 to-orange-50 border-red-100">
              <h4 className="font-semibold text-gray-900">争议仲裁</h4>
              <p className="text-sm text-gray-500 mt-1">处理用户争议和投诉</p>
            </Link>
            <Link to="/admin/providers" className="card p-5 hover:shadow-md transition-all bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-100">
              <h4 className="font-semibold text-gray-900">服务商管理</h4>
              <p className="text-sm text-gray-500 mt-1">星级评定、升降级管理</p>
            </Link>
            <Link to="/admin/trends" className="card p-5 hover:shadow-md transition-all bg-gradient-to-br from-green-50 to-emerald-50 border-green-100">
              <h4 className="font-semibold text-gray-900">行业趋势分析</h4>
              <p className="text-sm text-gray-500 mt-1">查看行业需求和技能供需</p>
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
