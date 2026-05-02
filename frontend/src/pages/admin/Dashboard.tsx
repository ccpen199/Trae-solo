import { useEffect, useState } from 'react'
import { adminApi } from '../../services/api'

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<{
    stats: {
      total_users: number
      total_purchase_amount: number
      total_redemption_amount: number
      total_assets: number
      purchase_redemption_ratio: number
      average_holding_days: number
    }
    recentOrders: any[]
    topHoldings: any[]
  } | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const response = await adminApi.getDashboard()
      setData(response.data)
    } catch (error) {
      console.error('获取管理面板数据失败', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  const stats = data?.stats || {}

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">运营看板</h1>
        <p className="text-gray-500 mt-1">平台整体运营数据概览</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">总用户数</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total_users || 0}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
              <span className="text-2xl">👥</span>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">总申购金额</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                ¥{(stats.total_purchase_amount || 0).toFixed(2)}
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-success-100 flex items-center justify-center">
              <span className="text-2xl">📈</span>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">总赎回金额</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                ¥{(stats.total_redemption_amount || 0).toFixed(2)}
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-danger-100 flex items-center justify-center">
              <span className="text-2xl">📉</span>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">申赎比</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {(stats.purchase_redemption_ratio || 0).toFixed(2)}
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-info-100 flex items-center justify-center">
              <span className="text-2xl">⚖️</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">最近订单</h2>
          {(!data?.recentOrders || data.recentOrders.length === 0) ? (
            <p className="text-gray-500 text-center py-8">暂无订单</p>
          ) : (
            <div className="space-y-3">
              {data.recentOrders.slice(0, 5).map((order) => (
                <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{order.product_name}</p>
                    <p className="text-sm text-gray-500">
                      {order.order_type === 'purchase' ? '申购' : '赎回'}
                      {' · '}{new Date(order.created_at).toLocaleString('zh-CN')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">
                      {order.amount ? `¥${order.amount.toFixed(2)}` : `${order.shares?.toFixed(4) || 0} 份`}
                    </p>
                    <span className={`badge ${
                      order.status === 'completed' ? 'badge-success' :
                      order.status === 'rejected' ? 'badge-danger' :
                      order.status === 'locked' || order.status === 'confirmed' ? 'badge-info' : 'badge-warning'
                    }`}>
                      {order.status === 'completed' ? '已完成' :
                       order.status === 'rejected' ? '已拒绝' :
                       order.status === 'locked' ? '已锁定' :
                       order.status === 'confirmed' ? '已确认' :
                       order.status === 'pending' ? '待处理' : order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">持仓集中度</h2>
          {(!data?.topHoldings || data.topHoldings.length === 0) ? (
            <p className="text-gray-500 text-center py-8">暂无持仓数据</p>
          ) : (
            <div className="space-y-4">
              {data.topHoldings.slice(0, 5).map((holding, index) => {
                const total = data.topHoldings.reduce((sum: number, h: any) => sum + h.shares_value, 0)
                const percentage = total > 0 ? (holding.shares_value / total * 100) : 0
                return (
                  <div key={holding.product_id}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-gray-900">{holding.product_name}</span>
                      <span className="text-sm text-gray-500">{percentage.toFixed(1)}%</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          index === 0 ? 'bg-primary-500' :
                          index === 1 ? 'bg-success-500' :
                          index === 2 ? 'bg-info-500' :
                          index === 3 ? 'bg-warning-500' : 'bg-gray-400'
                        }`}
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card bg-gradient-to-r from-warning-50 to-warning-100 border-warning-200">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-warning-200 flex items-center justify-center flex-shrink-0">
              <span className="text-2xl">⚠️</span>
            </div>
            <div>
              <h3 className="font-semibold text-warning-900">申赎比监控</h3>
              <p className="text-sm text-warning-700 mt-1">
                当前申赎比: {(stats.purchase_redemption_ratio || 0).toFixed(2)}
                {stats.purchase_redemption_ratio < 0.8 ? ' - 赎回压力较大，请关注' : ' - 处于正常范围'}
              </p>
            </div>
          </div>
        </div>

        <div className="card bg-gradient-to-r from-info-50 to-info-100 border-info-200">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-info-200 flex items-center justify-center flex-shrink-0">
              <span className="text-2xl">📊</span>
            </div>
            <div>
              <h3 className="font-semibold text-info-900">平均持仓天数</h3>
              <p className="text-sm text-info-700 mt-1">
                {stats.average_holding_days ? `${stats.average_holding_days.toFixed(0)} 天` : '暂无数据'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
