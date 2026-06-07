import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Users, Package, AlertTriangle, DollarSign, TrendingUp, ChevronRight, Clock, CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { api } from '@/lib/api'
import { useAppStore } from '@/store/useAppStore'
import { format } from 'date-fns'

interface Order {
  id: number
  order_no: string
  status: string
  rider_name: string | null
  pickup_address: string
  delivery_address: string
  created_at: string
}

interface Alert {
  id: number
  severity: string
  alert_type: string
  message: string | null
  rider_name: string
  resolved: number
}

interface TrendData {
  date: string
  total_orders: number
  delivered: number
  timeout: number
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  assigned: 'bg-blue-100 text-blue-800',
  picked_up: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  timeout: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-800',
}

const severityColors: Record<string, string> = {
  critical: 'bg-red-100 text-red-800',
  warning: 'bg-yellow-100 text-yellow-800',
  info: 'bg-blue-100 text-blue-800',
}

const statusLabels: Record<string, string> = {
  pending: '待分配',
  assigned: '已分配',
  picked_up: '已取货',
  delivered: '已送达',
  timeout: '已超时',
  cancelled: '已取消',
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { overview, fetchOverview } = useAppStore()
  const [trendData, setTrendData] = useState<TrendData[]>([])
  const [recentOrders, setRecentOrders] = useState<Order[]>([])
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [resolvingAlertId, setResolvingAlertId] = useState<number | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        await fetchOverview()
        const [trend, orders, alertsData] = await Promise.all([
          api.getOrderTrend(7),
          api.getOrders({ pageSize: 10 }),
          api.getAlerts({ resolved: 0 }),
        ])
        setTrendData(trend || [])
        setRecentOrders(orders?.list || [])
        setAlerts(alertsData || [])
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [fetchOverview])

  const handleResolveAlert = async (alertId: number) => {
    try {
      setResolvingAlertId(alertId)
      await api.resolveAlert(alertId)
      setAlerts((prev) => prev.filter((a) => a.id !== alertId))
    } catch (error) {
      console.error('Failed to resolve alert:', error)
    } finally {
      setResolvingAlertId(null)
    }
  }

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), 'MM-dd HH:mm')
    } catch {
      return dateStr
    }
  }

  const formatTrendDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), 'MM/dd')
    } catch {
      return dateStr
    }
  }

  const formatCurrency = (amount: number) => {
    return `¥${amount.toFixed(2)}`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">仪表板概览</h1>
        <span className="text-sm text-gray-500">
          最后更新: {new Date().toLocaleString('zh-CN')}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-6 border border-gray-100">
          <div className="flex items-start justify-between">
            <div className="p-3 bg-blue-50 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full cursor-pointer hover:bg-blue-100" onClick={() => navigate('/riders')}>
              骑手管理
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-sm font-medium text-gray-500">总骑手数</h3>
            <p className="text-3xl font-bold text-gray-900 mt-1">{overview?.riders.total || 0}</p>
            <div className="flex items-center gap-4 mt-3 text-sm">
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <span className="text-gray-600">在线: {overview?.riders.online || 0}</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                <span className="text-gray-600">新手: {overview?.riders.novice || 0}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-6 border border-gray-100">
          <div className="flex items-start justify-between">
            <div className="p-3 bg-purple-50 rounded-lg">
              <Package className="w-6 h-6 text-purple-600" />
            </div>
            <span className="text-xs font-medium text-purple-600 bg-purple-50 px-2 py-1 rounded-full cursor-pointer hover:bg-purple-100" onClick={() => navigate('/orders')}>
              订单统计
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-sm font-medium text-gray-500">总订单数</h3>
            <p className="text-3xl font-bold text-gray-900 mt-1">{overview?.orders.total || 0}</p>
            <div className="grid grid-cols-3 gap-2 mt-3 text-sm">
              <div className="text-center">
                <p className="text-yellow-600 font-semibold">{overview?.orders.pending || 0}</p>
                <p className="text-gray-500 text-xs">待处理</p>
              </div>
              <div className="text-center">
                <p className="text-green-600 font-semibold">{overview?.orders.delivered || 0}</p>
                <p className="text-gray-500 text-xs">已送达</p>
              </div>
              <div className="text-center">
                <p className="text-red-600 font-semibold">{overview?.orders.timeout || 0}</p>
                <p className="text-gray-500 text-xs">已超时</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-6 border border-gray-100">
          <div className="flex items-start justify-between">
            <div className="p-3 bg-red-50 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded-full">
              实时告警
            </span>
          </div>
          <div className="mt-4">
            <h3 className="text-sm font-medium text-gray-500">活跃告警</h3>
            <p className="text-3xl font-bold text-red-600 mt-1">{overview?.alerts.active || 0}</p>
            <button onClick={() => navigate('/monitoring')} className="mt-3 w-full flex items-center justify-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium">
              查看详情 <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-6 border border-gray-100">
          <div className="flex items-start justify-between">
            <div className="p-3 bg-green-50 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <div className="flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full cursor-pointer hover:bg-green-100" onClick={() => navigate('/analytics')}>
              <TrendingUp className="w-3 h-3" />
              收入
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-sm font-medium text-gray-500">总收入</h3>
            <p className="text-3xl font-bold text-gray-900 mt-1">
              {formatCurrency(overview?.income.total || 0)}
            </p>
            <div className="flex items-center gap-1 mt-3 text-sm text-green-600">
              <TrendingUp className="w-4 h-4" />
              <span className="font-medium">持续增长中</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">订单趋势</h2>
            <span className="text-sm text-gray-500">最近 7 天</span>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="date"
                  tickFormatter={formatTrendDate}
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  axisLine={{ stroke: '#e5e7eb' }}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  axisLine={{ stroke: '#e5e7eb' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  }}
                  labelFormatter={formatTrendDate}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="total_orders"
                  name="总订单"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="delivered"
                  name="已送达"
                  stroke="#22c55e"
                  strokeWidth={2}
                  dot={{ fill: '#22c55e', r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="timeout"
                  name="已超时"
                  stroke="#ef4444"
                  strokeWidth={2}
                  dot={{ fill: '#ef4444', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">最近告警</h2>
            <div className="flex items-center gap-2">
              <button onClick={() => navigate('/monitoring')} className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                查看全部
              </button>
              <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full font-medium">
                {alerts.length} 条未处理
              </span>
            </div>
          </div>
          <div className="space-y-4 max-h-80 overflow-y-auto">
            {alerts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <CheckCircle className="w-12 h-12 mb-2" />
                <p className="text-sm">暂无未处理告警</p>
              </div>
            ) : (
              alerts.map((alert) => (
                <div
                  key={alert.id}
                  className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`text-xs font-medium px-2 py-0.5 rounded-full ${severityColors[alert.severity] || severityColors.warning}`}
                        >
                          {alert.severity === 'critical' ? '严重' : alert.severity === 'warning' ? '警告' : '信息'}
                        </span>
                        <span className="text-xs text-gray-500">{alert.alert_type}</span>
                      </div>
                      <p className="text-sm text-gray-700 line-clamp-2">
                        {alert.message || '无详细信息'}
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        骑手: {alert.rider_name}
                      </p>
                    </div>
                    <button
                      onClick={() => handleResolveAlert(alert.id)}
                      disabled={resolvingAlertId === alert.id}
                      className="flex-shrink-0 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {resolvingAlertId === alert.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        '解决'
                      )}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">最近订单</h2>
          <button onClick={() => navigate('/orders')} className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
            查看全部 <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  订单号
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  状态
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  骑手
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  取货地址
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  送货地址
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  创建时间
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400">
                    <XCircle className="w-12 h-12 mx-auto mb-2" />
                    <p className="text-sm">暂无订单数据</p>
                  </td>
                </tr>
              ) : (
                recentOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-4 px-4">
                      <span className="font-medium text-gray-900">{order.order_no}</span>
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[order.status] || statusColors.pending}`}
                      >
                        {order.status === 'pending' && <Clock className="w-3 h-3 mr-1" />}
                        {order.status === 'delivered' && <CheckCircle className="w-3 h-3 mr-1" />}
                        {order.status === 'timeout' && <XCircle className="w-3 h-3 mr-1" />}
                        {statusLabels[order.status] || order.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-700">
                      {order.rider_name || '未分配'}
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-600 max-w-xs truncate" title={order.pickup_address}>
                      {order.pickup_address || '-'}
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-600 max-w-xs truncate" title={order.delivery_address}>
                      {order.delivery_address || '-'}
                    </td>
                    <td className="py-4 px-4 text-sm text-gray-500">
                      {formatDate(order.created_at)}
                    </td>
                    <td className="py-4 px-4">
                      <button onClick={() => navigate('/orders')} className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                        详情
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div onClick={() => navigate('/grids')} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-6 border border-gray-100 cursor-pointer">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-indigo-50 rounded-lg">
              <Package className="w-5 h-5 text-indigo-600" />
            </div>
            <h3 className="font-semibold text-gray-900">运力网格</h3>
          </div>
          <p className="text-sm text-gray-500">查看区域热力密度、骑手负载均衡和天气影响因子</p>
          <div className="mt-3 text-blue-600 text-sm font-medium flex items-center gap-1">
            进入运力网格 <ChevronRight className="w-4 h-4" />
          </div>
        </div>
        <div onClick={() => navigate('/training')} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-6 border border-gray-100 cursor-pointer">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-teal-50 rounded-lg">
              <Users className="w-5 h-5 text-teal-600" />
            </div>
            <h3 className="font-semibold text-gray-900">培训知识库</h3>
          </div>
          <p className="text-sm text-gray-500">模拟接单场景、异常处置SOP视频、规则考试题库</p>
          <div className="mt-3 text-blue-600 text-sm font-medium flex items-center gap-1">
            进入培训管理 <ChevronRight className="w-4 h-4" />
          </div>
        </div>
        <div onClick={() => navigate('/analytics')} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-6 border border-gray-100 cursor-pointer">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-amber-50 rounded-lg">
              <DollarSign className="w-5 h-5 text-amber-600" />
            </div>
            <h3 className="font-semibold text-gray-900">数据分析</h3>
          </div>
          <p className="text-sm text-gray-500">收入构成拆分、区域运力缺口热力图、违规行为聚类分析</p>
          <div className="mt-3 text-blue-600 text-sm font-medium flex items-center gap-1">
            进入数据分析 <ChevronRight className="w-4 h-4" />
          </div>
        </div>
      </div>
    </div>
  )
}
