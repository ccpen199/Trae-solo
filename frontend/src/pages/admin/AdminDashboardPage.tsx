import { useState, useEffect } from 'react'
import { Users, FileText, CheckSquare, TrendingUp, Loader2 } from 'lucide-react'
import api from '../../utils/api'

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/api/admin/dashboard').then(res => {
      if (res.data.code === 0) {
        setStats(res.data.data)
      }
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 text-primary-600 animate-spin" />
      </div>
    )
  }

  const statCards = [
    { label: '总用户数', value: stats?.totalUsers || 0, icon: Users, color: 'bg-blue-50 text-blue-600' },
    { label: '总内容数', value: stats?.totalContents || 0, icon: FileText, color: 'bg-green-50 text-green-600' },
    { label: '待审核', value: stats?.pendingReviews || 0, icon: CheckSquare, color: 'bg-orange-50 text-orange-600' },
    { label: '今日新增', value: stats?.todayContents || 0, icon: TrendingUp, color: 'bg-purple-50 text-purple-600' },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">管理仪表盘</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map(card => {
          const Icon = card.icon
          return (
            <div key={card.label} className="card p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">{card.label}</p>
                  <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                </div>
                <div className={`p-3 rounded-xl ${card.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card">
          <div className="p-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">平台数据</h2>
          </div>
          <div className="p-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">总评论数</span>
              <span className="font-medium">{stats?.totalComments || 0}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">打赏总额</span>
              <span className="font-medium">¥{stats?.totalTips || 0}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">广告收益</span>
              <span className="font-medium">¥{stats?.totalAdRevenue || 0}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">今日新用户</span>
              <span className="font-medium">{stats?.todayUsers || 0}</span>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="p-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">快捷操作</h2>
          </div>
          <div className="p-4 space-y-2">
            <a href="/admin/review" className="block text-sm text-primary-600 hover:underline">审核待处理内容 →</a>
            <a href="/admin/topics" className="block text-sm text-primary-600 hover:underline">管理话题 →</a>
            <a href="/admin/sensitive" className="block text-sm text-primary-600 hover:underline">敏感词管理 →</a>
            <a href="/admin/analytics" className="block text-sm text-primary-600 hover:underline">数据复盘 →</a>
          </div>
        </div>
      </div>
    </div>
  )
}
