import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Users, Newspaper, ShoppingCart, DollarSign, FileText, Store, TrendingUp, BarChart3 } from 'lucide-react'
import { api } from '@/lib/api'
import AdminLayout from './AdminLayout'

interface Stats {
  total_users: number
  total_news: number
  total_orders: number
  total_revenue: number
}

interface RegionalStat {
  region_name: string
  user_count: number
  order_count: number
}

interface HotKeyword {
  keyword: string
  total_count: number
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [regionalStats, setRegionalStats] = useState<RegionalStat[]>([])
  const [hotKeywords, setHotKeywords] = useState<HotKeyword[]>([])

  useEffect(() => {
    api.get<Stats>('/admin/stats').then(setStats).catch(() => {})
    api.get<RegionalStat[]>('/admin/regional-stats').then(setRegionalStats).catch(() => {})
    api.get<HotKeyword[]>('/sentiment/hot').then(setHotKeywords).catch(() => {})
  }, [])

  const maxUsers = Math.max(...regionalStats.map(r => r.user_count), 1)
  const maxOrders = Math.max(...regionalStats.map(r => r.order_count), 1)
  const maxCount = Math.max(...hotKeywords.map(k => k.total_count), 1)

  const statCards = [
    { label: '总用户数', value: stats?.total_users ?? 0, icon: Users, bg: 'bg-blue-500', light: 'bg-blue-50 text-blue-700' },
    { label: '新闻总数', value: stats?.total_news ?? 0, icon: Newspaper, bg: 'bg-green-500', light: 'bg-green-50 text-green-700' },
    { label: '订单总数', value: stats?.total_orders ?? 0, icon: ShoppingCart, bg: 'bg-orange-500', light: 'bg-orange-50 text-orange-700' },
    { label: '总营收', value: `¥${(stats?.total_revenue ?? 0).toLocaleString()}`, icon: DollarSign, bg: 'bg-purple-500', light: 'bg-purple-50 text-purple-700' },
  ]

  const quickLinks = [
    { path: '/admin/news', label: '新闻管理', icon: FileText },
    { path: '/admin/merchants', label: '商户审核', icon: Store },
    { path: '/admin/sentiment', label: '舆情监测', icon: TrendingUp },
    { path: '/admin/activity', label: '活动看板', icon: BarChart3 },
  ]

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">数据概览</h1>

      <div className="grid grid-cols-4 gap-4 mb-8">
        {statCards.map((card) => {
          const Icon = card.icon
          return (
            <div key={card.label} className={`${card.light} rounded-xl p-5`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-70 mb-1">{card.label}</p>
                  <p className="text-3xl font-bold">{typeof card.value === 'number' ? card.value.toLocaleString() : card.value}</p>
                </div>
                <div className={`${card.bg} p-3 rounded-lg text-white`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">地域热度地图</h2>
          <div className="space-y-3">
            {regionalStats.map((region) => (
              <div key={region.region_name} className="flex items-center gap-3">
                <span className="w-20 text-sm text-gray-600 shrink-0 truncate">{region.region_name}</span>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 w-8">用户</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-3.5 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${(region.user_count / maxUsers) * 100}%`,
                          backgroundColor: `hsl(${120 - (region.user_count / maxUsers) * 120}, 70%, 45%)`,
                        }}
                      />
                    </div>
                    <span className="text-xs text-gray-500 w-12 text-right">{region.user_count}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 w-8">订单</span>
                    <div className="flex-1 bg-gray-100 rounded-full h-3.5 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${(region.order_count / maxOrders) * 100}%`,
                          backgroundColor: `hsl(${120 - (region.order_count / maxOrders) * 120}, 70%, 45%)`,
                        }}
                      />
                    </div>
                    <span className="text-xs text-gray-500 w-12 text-right">{region.order_count}</span>
                  </div>
                </div>
              </div>
            ))}
            {regionalStats.length === 0 && <p className="text-gray-400 text-sm">暂无数据</p>}
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">舆情热词</h2>
          <div className="flex flex-wrap gap-2">
            {hotKeywords.map((kw) => {
              const ratio = kw.total_count / maxCount
              const size = 0.75 + ratio * 0.75
              return (
                <span
                  key={kw.keyword}
                  className="inline-block px-3 py-1 rounded-full font-medium"
                  style={{
                    fontSize: `${size}rem`,
                    backgroundColor: `hsl(${ratio * 30 + 200}, 70%, 92%)`,
                    color: `hsl(${ratio * 30 + 200}, 70%, 35%)`,
                  }}
                >
                  {kw.keyword} ({kw.total_count})
                </span>
              )
            })}
            {hotKeywords.length === 0 && <p className="text-gray-400 text-sm">暂无数据</p>}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">快捷操作</h2>
        <div className="grid grid-cols-4 gap-4">
          {quickLinks.map((link) => {
            const Icon = link.icon
            return (
              <Link
                key={link.path}
                to={link.path}
                className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:border-red-300 hover:bg-red-50 transition-colors"
              >
                <Icon className="w-5 h-5 text-red-600" />
                <span className="text-sm font-medium text-gray-700">{link.label}</span>
              </Link>
            )
          })}
        </div>
      </div>
    </AdminLayout>
  )
}
