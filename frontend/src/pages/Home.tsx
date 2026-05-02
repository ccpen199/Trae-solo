import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { assetApi, orderApi, productApi } from '../services/api'
import { useAuthStore } from '../store/authStore'

interface Asset {
  id: string
  product_id: string
  product_name: string
  product_code: string
  total_shares: number
  marketValue: number
  profit: number
  profitRate: number
}

interface Order {
  id: string
  order_type: string
  product_name: string
  amount: number
  shares: number
  status: string
  created_at: string
}

interface Product {
  id: string
  code: string
  name: string
  type: string
  risk_level: number
  nav: number
}

export default function Home() {
  const { user } = useAuthStore()
  const [assets, setAssets] = useState<Asset[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [assetSummary, setAssetSummary] = useState({
    totalMarketValue: 0,
    totalProfit: 0,
    profitRate: 0
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [assetsRes, ordersRes, productsRes, summaryRes] = await Promise.all([
          assetApi.getAll().catch(() => ({ data: [] })),
          orderApi.getAll().catch(() => ({ data: [] })),
          productApi.getAll({ status: 'active' }).catch(() => ({ data: [] })),
          assetApi.getSummary().catch(() => ({ data: { totalMarketValue: 0, totalProfit: 0, profitRate: 0 } }))
        ])
        
        setAssets(assetsRes.data || [])
        setOrders((ordersRes.data || []).slice(0, 5))
        setProducts((productsRes.data || []).slice(0, 6))
        setAssetSummary(summaryRes.data || { totalMarketValue: 0, totalProfit: 0, profitRate: 0 })
      } catch (error) {
        console.error('获取数据失败', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { class: string; text: string }> = {
      pending: { class: 'badge-warning', text: '处理中' },
      locked: { class: 'badge-info', text: '已锁定' },
      confirmed: { class: 'badge-info', text: '已确认' },
      completed: { class: 'badge-success', text: '已完成' },
      rejected: { class: 'badge-danger', text: '已拒绝' },
      failed: { class: 'badge-danger', text: '失败' },
      closed: { class: 'badge-gray', text: '已关闭' },
    }
    return statusMap[status] || { class: 'badge-gray', text: status }
  }

  const getRiskLevelBadge = (level: number) => {
    const colors = [
      '',
      'bg-green-100 text-green-700',
      'bg-blue-100 text-blue-700',
      'bg-yellow-100 text-yellow-700',
      'bg-orange-100 text-orange-700',
      'bg-red-100 text-red-700',
    ]
    const names = ['', '保守型', '稳健型', '平衡型', '成长型', '激进型']
    return (
      <span className={`badge ${colors[level] || 'bg-gray-100 text-gray-700'}`}>
        {names[level] || level}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="card bg-gradient-to-r from-primary-600 to-primary-700 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-primary-100 text-sm">欢迎回来</p>
            <h2 className="text-2xl font-bold mt-1">{user?.fullName || user?.username}</h2>
          </div>
          <div className="text-right">
            <p className="text-primary-100 text-sm">风险等级</p>
            <p className="text-lg font-semibold mt-1">
              {user?.riskLevel ? ['', '保守型', '稳健型', '平衡型', '成长型', '激进型'][user.riskLevel] : '未测评'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">
          <p className="text-gray-500 text-sm">总资产（市值）</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">
            ¥{assetSummary.totalMarketValue?.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
          </p>
        </div>
        <div className="card">
          <p className="text-gray-500 text-sm">累计收益</p>
          <p className={`text-2xl font-bold mt-1 ${assetSummary.totalProfit >= 0 ? 'text-success-600' : 'text-danger-600'}`}>
            {assetSummary.totalProfit >= 0 ? '+' : ''}¥{assetSummary.totalProfit?.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
          </p>
        </div>
        <div className="card">
          <p className="text-gray-500 text-sm">收益率</p>
          <p className={`text-2xl font-bold mt-1 ${assetSummary.profitRate >= 0 ? 'text-success-600' : 'text-danger-600'}`}>
            {assetSummary.profitRate >= 0 ? '+' : ''}{assetSummary.profitRate?.toFixed(2) || '0.00'}%
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">我的持仓</h3>
            <Link to="/assets" className="text-primary-600 text-sm hover:text-primary-700">
              查看全部 →
            </Link>
          </div>
          
          {assets.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="text-4xl mb-2">📊</p>
              <p>暂无持仓</p>
              <Link to="/products" className="text-primary-600 text-sm hover:text-primary-700 block mt-2">
                去选购基金 →
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {assets.slice(0, 4).map((asset) => (
                <div key={asset.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{asset.product_name}</p>
                    <p className="text-sm text-gray-500">{asset.total_shares} 份</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">¥{asset.marketValue?.toFixed(2) || '0.00'}</p>
                    <p className={`text-sm ${asset.profit >= 0 ? 'text-success-600' : 'text-danger-600'}`}>
                      {asset.profit >= 0 ? '+' : ''}{asset.profitRate?.toFixed(2) || '0.00'}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">最近订单</h3>
            <Link to="/orders" className="text-primary-600 text-sm hover:text-primary-700">
              查看全部 →
            </Link>
          </div>
          
          {orders.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p className="text-4xl mb-2">📋</p>
              <p>暂无订单</p>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => {
                const badge = getStatusBadge(order.status)
                return (
                  <div key={order.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">
                        {order.order_type === 'purchase' ? '申购' : '赎回'} - {order.product_name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {order.amount ? `¥${order.amount.toFixed(2)}` : `${order.shares} 份`}
                      </p>
                    </div>
                    <span className={`badge ${badge.class}`}>{badge.text}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">推荐基金</h3>
          <Link to="/products" className="text-primary-600 text-sm hover:text-primary-700">
            查看全部 →
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product) => (
            <Link
              key={product.id}
              to="/products"
              className="p-4 border border-gray-100 rounded-lg hover:border-primary-300 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-gray-900">{product.name}</p>
                  <p className="text-sm text-gray-500">{product.code}</p>
                </div>
                {getRiskLevelBadge(product.risk_level)}
              </div>
              <div className="mt-3 flex items-end justify-between">
                <div>
                  <p className="text-xs text-gray-500">单位净值</p>
                  <p className="text-lg font-semibold text-gray-900">¥{product.nav.toFixed(4)}</p>
                </div>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  {product.type}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
