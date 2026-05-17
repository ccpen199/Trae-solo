import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

const AdminDashboard = ({ showToast }) => {
  const navigate = useNavigate()
  const [stats, setStats] = useState(null)
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [statsRes, ordersRes] = await Promise.all([
        axios.get('/api/admin/stats'),
        axios.get('/api/admin/orders')
      ])

      if (statsRes.data.success) setStats(statsRes.data.data)
      if (ordersRes.data.success) setOrders(ordersRes.data.data)
    } catch (error) {
      if (error.response?.status === 401) {
        navigate('/admin/login')
      }
      showToast('加载失败')
    } finally {
      setLoading(false)
    }
  }

  const getStatusText = (status) => {
    const map = {
      pending: '待处理',
      paid: '已支付',
      in_progress: '进行中',
      completed: '已完成'
    }
    return map[status] || status
  }

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    )
  }

  return (
    <div className="page">
      <div className="header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ cursor: 'pointer' }} onClick={() => navigate('/')}>←</span>
          <h1>管理后台</h1>
        </div>
        <p style={{ opacity: 0.9, marginTop: 8, fontSize: 14 }}>
          快问律师平台数据
        </p>
      </div>

      <div className="admin-stats">
        <div className="stat-card">
          <div className="stat-value">{stats?.userCount || 0}</div>
          <div className="stat-label">用户数</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats?.orderCount || 0}</div>
          <div className="stat-label">订单数</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{stats?.lawyerCount || 0}</div>
          <div className="stat-label">律师数</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">¥{stats?.todayRevenue || 0}</div>
          <div className="stat-label">今日营收</div>
        </div>
      </div>

      <h3 style={{ marginBottom: 16, color: '#333' }}>最近订单</h3>
      {orders.map((order) => (
        <div key={order.id} className="card" style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontWeight: 500, color: '#333' }}>
              {order.question_type_name || order.type}
            </span>
            <span style={{ fontSize: 12, color: '#52c41a' }}>
              {getStatusText(order.status)}
            </span>
          </div>
          <div style={{ fontSize: 13, color: '#666', marginTop: 8 }}>
            用户: {order.user_name || '匿名'} · 律师: {order.lawyer_name || '待分配'}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
            <span style={{ fontSize: 12, color: '#999' }}>
              {order.created_at?.slice(0, 16)}
            </span>
            <span style={{ color: '#667eea', fontWeight: 600 }}>¥{order.amount}</span>
          </div>
        </div>
      ))}

      {orders.length === 0 && (
        <div className="empty">
          <p>暂无订单</p>
        </div>
      )}
    </div>
  )
}

export default AdminDashboard
