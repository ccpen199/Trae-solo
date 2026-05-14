import React, { useEffect, useState } from 'react'
import { adminApi, orderApi, productApi } from '../../api'

const Dashboard = () => {
  const [stats, setStats] = useState({
    total_users: 0,
    total_orders: 0,
    total_products: 0,
    total_amount: 0
  })
  const [recentOrders, setRecentOrders] = useState([])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [usersRes, ordersRes, productsRes] = await Promise.all([
        adminApi.getUsers(),
        orderApi.getList({ pageSize: 5 }),
        productApi.getList({ pageSize: 100 })
      ])
      
      if (usersRes.success) {
        setStats(prev => ({ ...prev, total_users: usersRes.pagination?.total || usersRes.data?.length || 0 }))
      }
      if (ordersRes.success) {
        setRecentOrders(ordersRes.data)
        setStats(prev => ({ 
          ...prev, 
          total_orders: ordersRes.pagination?.total || ordersRes.data?.length || 0,
          total_amount: ordersRes.data?.reduce((sum, o) => sum + (o.pay_amount || 0), 0) || 0
        }))
      }
      if (productsRes.success) {
        setStats(prev => ({ ...prev, total_products: productsRes.pagination?.total || productsRes.data?.length || 0 }))
      }
    } catch (e) {
      console.error(e)
    }
  }

  const statCards = [
    { title: '用户总数', value: stats.total_users, icon: '👥', color: '#1890ff' },
    { title: '订单总数', value: stats.total_orders, icon: '📦', color: '#52c41a' },
    { title: '商品总数', value: stats.total_products, icon: '🏷️', color: '#faad14' },
    { title: '总交易额', value: `¥${stats.total_amount.toLocaleString()}`, icon: '💰', color: '#ff4d4f' },
  ]

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 24 }}>📊 数据概览</h1>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 32 }}>
        {statCards.map((card, i) => (
          <div key={i} className="card" style={{ padding: 24, display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 56,
              height: 56,
              borderRadius: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 28,
              background: `${card.color}15`
            }}>
              {card.icon}
            </div>
            <div>
              <div style={{ color: '#999', fontSize: 13, marginBottom: 4 }}>{card.title}</div>
              <div style={{ fontSize: 24, fontWeight: 700 }}>{card.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="card" style={{ padding: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>最近订单</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #f0f0f0' }}>
              <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: 13, color: '#666', fontWeight: 500 }}>订单号</th>
              <th style={{ textAlign: 'left', padding: '12px 8px', fontSize: 13, color: '#666', fontWeight: 500 }}>状态</th>
              <th style={{ textAlign: 'right', padding: '12px 8px', fontSize: 13, color: '#666', fontWeight: 500 }}>金额</th>
              <th style={{ textAlign: 'right', padding: '12px 8px', fontSize: 13, color: '#666', fontWeight: 500 }}>时间</th>
            </tr>
          </thead>
          <tbody>
            {recentOrders.map(order => (
              <tr key={order.id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                <td style={{ padding: '12px 8px', fontSize: 13 }}>{order.order_no}</td>
                <td style={{ padding: '12px 8px' }}>
                  <span style={{
                    padding: '2px 8px',
                    background: order.status === 'completed' ? '#f6ffed' : order.status === 'pending' ? '#fffbe6' : '#e6f7ff',
                    color: order.status === 'completed' ? '#52c41a' : order.status === 'pending' ? '#faad14' : '#1890ff',
                    borderRadius: 4,
                    fontSize: 12
                  }}>
                    {order.status_text}
                  </span>
                </td>
                <td style={{ padding: '12px 8px', textAlign: 'right', fontWeight: 500 }}>¥{order.pay_amount.toFixed(2)}</td>
                <td style={{ padding: '12px 8px', textAlign: 'right', color: '#999', fontSize: 13 }}>{order.created_at}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {recentOrders.length === 0 && (
          <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>暂无订单</div>
        )}
      </div>
    </div>
  )
}

export default Dashboard
