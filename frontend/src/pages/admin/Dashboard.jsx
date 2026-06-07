import React, { useState, useEffect } from 'react'
import {
  UsersIcon,
  BuildingOfficeIcon,
  ShoppingBagIcon,
  ClipboardDocumentListIcon,
  UserGroupIcon,
  TicketIcon,
  ClockIcon,
  ClipboardDocumentCheckIcon,
  ChevronRightIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline'
import { adminAPI } from '../../api/client'
import { useNavigate } from 'react-router-dom'

const AdminDashboard = () => {
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [recentOrders, setRecentOrders] = useState([])
  const [pendingReviews, setPendingReviews] = useState(0)
  const [expiringCount, setExpiringCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, reviewsRes, expiringRes] = await Promise.all([
          adminAPI.getStats(),
          adminAPI.getAuditReviews({ page: 1, pageSize: 1, reviewed: 'false' }),
          adminAPI.getExpiringItems(7),
        ])
        setStats(statsRes.data)
        setRecentOrders(statsRes.data?.recentOrders || [])
        setPendingReviews(reviewsRes.data?.pendingCount || 0)
        setExpiringCount(expiringRes.data?.stats?.expiringCodesCount || 0)
      } catch (err) {
        setError('获取平台数据失败')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  const statCards = [
    { title: '用户总数', value: stats?.stats?.totalUsers || 0, icon: UsersIcon, color: 'bg-blue-50 text-blue-600', iconBg: 'bg-blue-100' },
    { title: '企业总数', value: stats?.stats?.totalEnterprises || 0, icon: BuildingOfficeIcon, color: 'bg-green-50 text-green-600', iconBg: 'bg-green-100' },
    { title: '商品总数', value: stats?.stats?.totalProducts || 0, icon: ShoppingBagIcon, color: 'bg-purple-50 text-purple-600', iconBg: 'bg-purple-100' },
    { title: '订单总数', value: stats?.stats?.totalOrders || 0, icon: ClipboardDocumentListIcon, color: 'bg-orange-50 text-orange-600', iconBg: 'bg-orange-100' },
  ]

  const quickActions = [
    { path: '/admin/audience-rules', icon: UserGroupIcon, label: '人群圈选', desc: '管理商品适用人群规则', color: 'from-blue-500 to-indigo-600' },
    { path: '/admin/redemption', icon: TicketIcon, label: '权益核销', desc: '核销码管理与核销操作', color: 'from-emerald-500 to-teal-600' },
    { path: '/admin/expiry', icon: ClockIcon, label: '过期失效', desc: '即将到期权益预警处理', color: 'from-amber-500 to-orange-600' },
    { path: '/admin/audit-review', icon: ClipboardDocumentCheckIcon, label: '审计复查', desc: '敏感操作合规审查', color: 'from-rose-500 to-pink-600' },
  ]

  const todoItems = [
    { count: pendingReviews, label: '条待审计复查', path: '/admin/audit-review', color: 'bg-red-100 text-red-700' },
    { count: expiringCount, label: '个核销码即将到期', path: '/admin/expiry', color: 'bg-amber-100 text-amber-700' },
  ]

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">运营概览</h2>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">{error}</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <div key={card.title} className={`${card.color} rounded-xl p-5`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-80">{card.title}</p>
                <p className="text-2xl font-bold mt-1">{card.value}</p>
              </div>
              <div className={`${card.iconBg} p-3 rounded-lg`}>
                <card.icon className="w-6 h-6" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">业务快捷入口</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {quickActions.map((action) => (
                <button
                  key={action.path}
                  onClick={() => navigate(action.path)}
                  className="p-5 bg-white border border-gray-100 rounded-xl hover:shadow-md transition-all text-left group"
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center flex-shrink-0 shadow-lg`}>
                      <action.icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-gray-800">{action.label}</h4>
                        <ChevronRightIcon className="w-4 h-4 text-gray-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                      </div>
                      <p className="text-sm text-gray-500 mt-1">{action.desc}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">最近订单</h3>
            {recentOrders.length === 0 ? (
              <p className="text-gray-400 text-center py-8">暂无订单</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 text-gray-500 font-medium">订单号</th>
                      <th className="text-left py-2 text-gray-500 font-medium">用户</th>
                      <th className="text-left py-2 text-gray-500 font-medium">商品</th>
                      <th className="text-left py-2 text-gray-500 font-medium">金额</th>
                      <th className="text-left py-2 text-gray-500 font-medium">状态</th>
                      <th className="text-left py-2 text-gray-500 font-medium">时间</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map((order) => (
                      <tr key={order.id} className="border-b border-gray-50">
                        <td className="py-2.5 text-gray-700 font-mono">#{order.id}</td>
                        <td className="py-2.5 text-gray-700">{order.userName || order.user || '-'}</td>
                        <td className="py-2.5 text-gray-700">{order.productName || order.product || '-'}</td>
                        <td className="py-2.5 text-gray-700">¥{order.amount || order.price || 0}</td>
                        <td className="py-2.5">
                          <span
                            className={`text-xs px-2 py-0.5 rounded font-medium ${
                              order.status === 'completed'
                                ? 'bg-green-100 text-green-700'
                                : order.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {order.status === 'completed'
                              ? '已完成'
                              : order.status === 'pending'
                              ? '待处理'
                              : order.status}
                          </span>
                        </td>
                        <td className="py-2.5 text-gray-500">{order.createdAt}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-6 text-white">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-white/20 p-2 rounded-lg">
                <ExclamationTriangleIcon className="w-6 h-6" />
              </div>
              <h3 className="font-semibold">运营工作台</h3>
            </div>
            <p className="text-sm text-white/80 mb-4">
              欢迎回来！这里是福利商城运营管理中心，您可以管理商品、用户、权益核销等业务。
            </p>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/70">今日活跃用户</span>
                <span className="font-bold">{stats?.stats?.activeUsers || 0}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-white/70">用户增长率</span>
                <span className="font-bold text-green-300">+12.5%</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h3 className="font-semibold text-gray-800 mb-4">待办事项</h3>
            <div className="space-y-3">
              {todoItems.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => navigate(item.path)}
                  className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-2 py-1 rounded font-medium ${item.color}`}>
                      {item.count}
                    </span>
                    <span className="text-sm text-gray-700">{item.label}</span>
                  </div>
                  <ChevronRightIcon className="w-4 h-4 text-gray-400" />
                </button>
              ))}
              {todoItems.filter(t => t.count > 0).length === 0 && (
                <p className="text-center text-gray-400 text-sm py-4">暂无待办事项</p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-6">
            <h3 className="font-semibold text-gray-800 mb-4">角色权限说明</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 mt-1.5 rounded-full bg-blue-500"></div>
                <div>
                  <p className="font-medium text-gray-800">职场人</p>
                  <p className="text-gray-500 text-xs">社保测算、AI面试、法律咨询、福利商城</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 mt-1.5 rounded-full bg-green-500"></div>
                <div>
                  <p className="font-medium text-gray-800">企业HR</p>
                  <p className="text-gray-500 text-xs">员工管理、社保开户、合规巡检、风险预警</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 mt-1.5 rounded-full bg-amber-500"></div>
                <div>
                  <p className="font-medium text-gray-800">福利商城运营</p>
                  <p className="text-gray-500 text-xs">商品上架、订单审核、审计日志、用户管理</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard
