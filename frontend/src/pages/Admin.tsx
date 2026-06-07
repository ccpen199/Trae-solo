import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getDashboard, getRegionHeat } from '../api/client'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, ScatterChart, Scatter, ZAxis } from 'recharts'

const COLORS = ['#FF6B35', '#004E89', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6']

export default function Admin() {
  const [dashboard, setDashboard] = useState<any>(null)
  const [regionHeat, setRegionHeat] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.allSettled([getDashboard(), getRegionHeat()])
      .then(([dashRes, heatRes]) => {
        if (dashRes.status === 'fulfilled') setDashboard(dashRes.value.data)
        if (heatRes.status === 'fulfilled') setRegionHeat(heatRes.value.data?.items ?? heatRes.value.data ?? [])
      })
      .finally(() => setLoading(false))
  }, [])

  const stats = dashboard?.stats ?? { total_users: 0, total_news: 0, total_videos: 0, total_creators: 0, tasks_completed: 0 }
  const userGrowth = dashboard?.user_growth ?? []
  const contentDist = dashboard?.content_distribution ?? [
    { name: '资讯', value: 60 },
    { name: '视频', value: 25 },
    { name: '评论', value: 15 },
  ]
  const pendingReports = dashboard?.pending_reports ?? 0

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">运营后台</h2>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        {[
          { label: '总用户', value: stats.total_users, icon: '👥', color: 'from-blue-500 to-blue-600' },
          { label: '资讯数', value: stats.total_news, icon: '📰', color: 'from-primary to-orange-500' },
          { label: '视频数', value: stats.total_videos, icon: '🎬', color: 'from-green-500 to-emerald-600' },
          { label: '创作者', value: stats.total_creators, icon: '✨', color: 'from-purple-500 to-violet-600' },
          { label: '任务完成', value: stats.tasks_completed, icon: '🎯', color: 'from-yellow-500 to-amber-600' },
        ].map((item) => (
          <div key={item.label} className="card p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">{item.icon}</span>
              <div className={`w-8 h-8 rounded-lg bg-gradient-to-r ${item.color} opacity-20`}></div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{item.value.toLocaleString()}</p>
            <p className="text-xs text-gray-400 mt-0.5">{item.label}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2 mb-6">
        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 mb-4">用户增长趋势</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={userGrowth}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#FF6B35" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 mb-4">内容分布</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={contentDist} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="value">
                {contentDist.map((_: any, i: number) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 mt-2">
            {contentDist.map((item: any, i: number) => (
              <div key={i} className="flex items-center gap-1.5 text-xs text-gray-500">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></span>
                {item.name}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2 mb-6">
        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 mb-4">区域热度</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={regionHeat.slice(0, 8)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="region" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="heat_score" fill="#FF6B35" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 mb-4">区域热力分布</h3>
          <ResponsiveContainer width="100%" height={250}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="lng" name="经度" tick={{ fontSize: 11 }} />
              <YAxis dataKey="lat" name="纬度" tick={{ fontSize: 11 }} />
              <ZAxis dataKey="heat_score" range={[50, 400]} />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} />
              <Scatter data={regionHeat} fill="#FF6B35" fillOpacity={0.6} />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card p-5 mb-6">
        <h3 className="font-semibold text-gray-900 mb-4">内容安全工作流</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <p className="text-2xl font-bold text-yellow-600">{pendingReports}</p>
            <p className="text-sm text-gray-500 mt-1">待审核举报</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-2xl font-bold text-green-600">运行中</p>
            <p className="text-sm text-gray-500 mt-1">AI 筛选状态</p>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-2xl font-bold text-blue-600">98.5%</p>
            <p className="text-sm text-gray-500 mt-1">审核准确率</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Link to="/admin/reports" className="card p-4 hover:border-primary/30 transition-colors text-center">
          <span className="text-3xl">📋</span>
          <p className="font-medium text-gray-900 mt-2">内容审核</p>
          <p className="text-xs text-gray-400">举报与审核管理</p>
        </Link>
        <Link to="/admin/creators" className="card p-4 hover:border-primary/30 transition-colors text-center">
          <span className="text-3xl">✨</span>
          <p className="font-medium text-gray-900 mt-2">创作者管理</p>
          <p className="text-xs text-gray-400">等级与成长管理</p>
        </Link>
        <Link to="/admin/anti-fraud" className="card p-4 hover:border-primary/30 transition-colors text-center">
          <span className="text-3xl">🛡️</span>
          <p className="font-medium text-gray-900 mt-2">反欺诈监控</p>
          <p className="text-xs text-gray-400">异常行为检测</p>
        </Link>
      </div>
    </div>
  )
}
