import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../api'
import { useStore } from '../store'

export default function ClientDashboard() {
  const { user } = useStore()
  const [stats, setStats] = useState({ orders: 0, spending: 0, activeOrders: 0 })
  const [recentOrders, setRecentOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboard()
  }, [])

  const loadDashboard = async () => {
    try {
      const ordersRes = await api.get('/orders/my')
      const orders = ordersRes.data || []
      
      const completedOrders = orders.filter(o => o.status === 'completed')
      const activeOrders = orders.filter(o => ['pending_confirm', 'in_progress', 'pending_delivery', 'pending_accept'].includes(o.status))
      
      setStats({
        orders: completedOrders.length,
        spending: completedOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0),
        activeOrders: activeOrders.length
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
          <h1 style={{ fontSize: '28px', marginBottom: '8px' }}>客户工作台</h1>
          <p style={{ color: 'var(--gray-600)', margin: 0 }}>欢迎回来，{user?.username}！</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Link to="/post-requirement" className="btn btn-primary">发布需求</Link>
          <Link to="/orders" className="btn btn-outline">我的订单</Link>
        </div>
      </div>

      <div className="stats-grid" style={{ marginBottom: '32px' }}>
        <div className="stat-card">
          <div className="stat-value">{stats.activeOrders}</div>
          <div className="stat-label">进行中订单</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats.orders}</div>
          <div className="stat-label">已完成订单</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">¥{stats.spending.toLocaleString()}</div>
          <div className="stat-label">累计消费</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">100%</div>
          <div className="stat-label">好评率</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        <div className="card">
          <h2 style={{ fontSize: '20px', marginBottom: '20px' }}>我的订单</h2>
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
              <p style={{ marginBottom: '16px' }}>暂无订单</p>
              <Link to="/post-requirement" className="btn btn-primary">发布第一个需求</Link>
            </div>
          )}
        </div>

        <div>
          <div className="card" style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '18px', marginBottom: '16px' }}>快捷操作</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <Link to="/post-requirement" className="btn btn-primary" style={{ textAlign: 'center' }}>
                📝 发布需求
              </Link>
              <Link to="/providers" className="btn btn-outline" style={{ textAlign: 'center' }}>
                🔍 寻找服务者
              </Link>
              <Link to="/profile" className="btn btn-outline" style={{ textAlign: 'center' }}>
                ⚙️ 账户设置
              </Link>
            </div>
          </div>

          <div className="card">
            <h3 style={{ fontSize: '18px', marginBottom: '16px' }}>热门服务</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <Link to="/providers?category=搬家服务" style={{ padding: '12px', background: 'var(--gray-50)', borderRadius: '8px', textDecoration: 'none', color: 'inherit', fontSize: '14px' }}>
                📦 搬家服务
              </Link>
              <Link to="/providers?category=家政保洁" style={{ padding: '12px', background: 'var(--gray-50)', borderRadius: '8px', textDecoration: 'none', color: 'inherit', fontSize: '14px' }}>
                🧹 家政保洁
              </Link>
              <Link to="/providers?category=家电维修" style={{ padding: '12px', background: 'var(--gray-50)', borderRadius: '8px', textDecoration: 'none', color: 'inherit', fontSize: '14px' }}>
                🔧 家电维修
              </Link>
              <Link to="/providers?category=宠物照料" style={{ padding: '12px', background: 'var(--gray-50)', borderRadius: '8px', textDecoration: 'none', color: 'inherit', fontSize: '14px' }}>
                🐾 宠物照料
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
