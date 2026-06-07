import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../api'

const statusLabels = {
  pending_confirm: '待确认',
  confirmed: '已确认',
  in_progress: '进行中',
  delivered: '待验收',
  completed: '已完成',
  disputed: '纠纷中',
  cancelled: '已取消'
}

export default function Orders() {
  const [orders, setOrders] = useState([])
  const [activeTab, setActiveTab] = useState('all')

  useEffect(() => {
    loadOrders()
  }, [activeTab])

  const loadOrders = () => {
    const params = {}
    if (activeTab !== 'all') params.status = activeTab
    api.get('/orders', { params }).then(res => setOrders(res.data))
  }

  const tabs = [
    { key: 'all', label: '全部' },
    { key: 'pending_confirm', label: '待确认' },
    { key: 'in_progress', label: '进行中' },
    { key: 'delivered', label: '待验收' },
    { key: 'completed', label: '已完成' },
  ]

  return (
    <div className="container" style={{ padding: '40px 20px' }}>
      <h1 style={{ fontSize: '32px', marginBottom: '24px' }}>我的订单</h1>

      <div className="tabs">
        {tabs.map(tab => (
          <div
            key={tab.key}
            className={`tab ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {orders.map(order => (
          <Link
            key={order.id}
            to={`/orders/${order.id}`}
            style={{ textDecoration: 'none', color: 'inherit' }}
          >
            <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                  <h3 style={{ fontSize: '18px', margin: 0 }}>{order.title}</h3>
                  <span className={`status-badge status-${order.status === 'delivered' ? 'matched' : order.status}`}>
                    {statusLabels[order.status] || order.status}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '24px', fontSize: '14px', color: 'var(--gray-600)' }}>
                  <span>订单号: #{order.id}</span>
                  <span>金额: ¥{order.total_amount}</span>
                  <span>客户: {order.client_name}</span>
                  <span>服务者: {order.provider_name}</span>
                </div>
              </div>
              <div style={{ color: 'var(--gray-500)' }}>
                {new Date(order.created_at).toLocaleDateString()}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {orders.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px', color: '#6b7280' }}>
          暂无订单
        </div>
      )}
    </div>
  )
}
