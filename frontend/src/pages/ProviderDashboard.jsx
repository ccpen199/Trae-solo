import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../api'
import { useStore } from '../store'

export default function ProviderDashboard() {
  const { user } = useStore()
  const [stats, setStats] = useState({ orders: 0, earnings: 0, rating: 5.0, pendingOrders: 0 })
  const [recentOrders, setRecentOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboard()
  }, [])

  const loadDashboard = async () => {
    try {
      const [ordersRes, profileRes] = await Promise.all([
        api.get('/orders/my'),
        api.get('/users/profile')
      ])
      
      const orders = ordersRes.data || []
      const completedOrders = orders.filter(o => o.status === 'completed')
      const pendingOrders = orders.filter(o => ['pending_confirm', 'in_progress', 'pending_delivery', 'pending_accept'].includes(o.status))
      
      setStats({
        orders: completedOrders.length,
        earnings: completedOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0),
        rating: profileRes.data.rating || 5.0,
        pendingOrders: pendingOrders.length
      })
      
      setRecentOrders(orders.slice(0, 5))
    } catch (err) {
      console.error('加载工作台失败:', err)
    } finally {
      setLoading(false)
    }
  }

  const getStatusText = (status) => {
    const statusMap = {
      'pending_confirm': '待确认',
      'confirmed': '已确认',
      'in_progress': '进行中',
      'pending_delivery': '待交付',
      'pending_accept': '待验收',
      'completed': '已完成',
      'disputed': '纠纷中'
    }
    return statusMap[status] || status
  }

  if (loading) {
    return <div className="container" style={{ padding: '40px' }}>加载中...</div>
  }

  return (
    <div className="container" style={{ padding: '40px 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '28px', marginBottom: '8px' }}>服务者工作台</h1>
          <p style={{ color: 'var(--gray-600)', margin: 0 }}>欢迎回来，{user?.username}！</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Link to="/skill-profile" className="btn btn-outline">管理技能档案</Link>
          <Link to="/orders" className="btn btn-primary">查看全部订单</Link>
        </div>
      </div>

      <div className="stats-grid" style={{ marginBottom: '32px' }}>
        <div className="stat-card">
          <div className="stat-value">{stats.pendingOrders}</div>
          <div className="stat-label">待处理订单</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.orders}</div>
          <div className="stat-label">已完成订单</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">¥{stats.earnings.toLocaleString()}</div>
          <div className="stat-label">累计收入</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">⭐ {stats.rating.toFixed(1)}</div>
          <div className="stat-label">综合评分</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        <div className="card">
          <h2 style={{ fontSize: '20px', marginBottom: '20px' }}>最近订单</h2>
          {recentOrders.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {recentOrders.map(order => (
                <Link to={`/orders/${order.id}`} key={order.id} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'var(--gray-50)', borderRadius: '8px' }}>
                    <div>
                      <div style={{ fontWeight: '500', marginBottom: '4px' }}>{order.title}</div>
                      <div style={{ fontSize: '13px', color: 'var(--gray-600)' }}>
                        ¥{order.total_amount} · {new Date(order.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <span className={`status-badge status-${order.status}`}>
                      {getStatusText(order.status)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--gray-600)' }}>
              暂无订单
            </div>
          )}
        </div>

        <div>
          <div className="card" style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '18px', marginBottom: '16px' }}>快捷操作</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <Link to="/skill-profile" className="btn btn-outline" style={{ textAlign: 'center' }}>
                📝 编辑技能档案
              </Link>
              <Link to="/requirements" className="btn btn-outline" style={{ textAlign: 'center' }}>
                🔍 浏览需求广场
              </Link>
              <Link to="/profile" className="btn btn-outline" style={{ textAlign: 'center' }}>
                ⚙️ 账户设置
              </Link>
            </div>
          </div>

          <div className="card">
            <h3 style={{ fontSize: '18px', marginBottom: '16px' }}>服务成长</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '13px' }}>
                  <span style={{ color: 'var(--gray-600)' }}>完成 {stats.orders}/30 单</span>
                  <span>精英服务商</span>
                </div>
                <div style={{ height: '8px', background: 'var(--gray-200)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${Math.min(stats.orders / 30 * 100, 100)}%`, height: '100%', background: 'var(--primary)' }}></div>
                </div>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--gray-600)' }}>
                再完成 {Math.max(30 - stats.orders, 0)} 单即可升级为精英服务商
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
