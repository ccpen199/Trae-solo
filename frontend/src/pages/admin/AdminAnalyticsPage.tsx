import { useState, useEffect } from 'react'
import { BarChart3, TrendingUp, Users, FileText, Loader2 } from 'lucide-react'
import api from '../../utils/api'

export default function AdminAnalyticsPage() {
  const [analytics, setAnalytics] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('daily')

  useEffect(() => {
    setLoading(true)
    api.get('/api/admin/analytics', { params: { period } }).then(res => {
      if (res.data.code === 0) {
        setAnalytics(res.data.data)
      }
    }).catch(() => {}).finally(() => setLoading(false))
  }, [period])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 text-primary-600 animate-spin" />
      </div>
    )
  }

  const stats = analytics?.stats || {}

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">数据分析</h1>
        <div className="flex items-center gap-2">
          {[
            { key: 'daily', label: '今日' },
            { key: 'weekly', label: '近7天' },
            { key: 'monthly', label: '近30天' },
          ].map(p => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                period === p.key ? 'bg-primary-50 text-primary-600' : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {[
          { label: '新增用户', value: stats.newUsers || 0, icon: Users, color: 'bg-blue-50 text-blue-600' },
          { label: '新增内容', value: stats.newContents || 0, icon: FileText, color: 'bg-green-50 text-green-600' },
          { label: '新增评论', value: stats.newComments || 0, icon: BarChart3, color: 'bg-purple-50 text-purple-600' },
          { label: '打赏金额', value: `¥${stats.newTips || 0}`, icon: TrendingUp, color: 'bg-orange-50 text-orange-600' },
          { label: '广告收益', value: `¥${stats.newAdRevenue || 0}`, icon: TrendingUp, color: 'bg-yellow-50 text-yellow-600' },
        ].map(card => {
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <div className="p-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">热门内容</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {(analytics?.topContents || []).map((content: any, i: number) => (
              <div key={i} className="px-4 py-3 flex items-center gap-3">
                <span className="text-sm font-bold text-gray-400 w-6">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700 truncate">{content.title}</p>
                  <p className="text-xs text-gray-400">{content.author_nickname} · {content.view_count} 浏览 · {content.like_count} 赞</p>
                </div>
              </div>
            ))}
            {(!analytics?.topContents || analytics.topContents.length === 0) && (
              <div className="p-8 text-center text-gray-400 text-sm">暂无数据</div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="p-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">活跃用户</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {(analytics?.topAuthors || []).map((user: any, i: number) => (
              <div key={i} className="px-4 py-3 flex items-center gap-3">
                <span className="text-sm font-bold text-gray-400 w-6">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700 truncate">{user.nickname}</p>
                  <p className="text-xs text-gray-400">{user.content_count} 内容 · {user.like_count} 获赞 · {user.follower_count} 粉丝</p>
                </div>
              </div>
            ))}
            {(!analytics?.topAuthors || analytics.topAuthors.length === 0) && (
              <div className="p-8 text-center text-gray-400 text-sm">暂无数据</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
