import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store'
import { userApi } from '../api'

const Profile = ({ showToast }) => {
  const navigate = useNavigate()
  const { user, token, logout, setUser } = useStore()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (token) {
      loadOrders()
    }
  }, [token])

  const loadOrders = async () => {
    setLoading(true)
    try {
      const res = await userApi.getOrders()
      if (res.success) {
        setOrders(res.data)
      }
    } catch (error) {
      showToast('加载失败')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    logout()
    showToast('已退出登录')
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

  if (!token) {
    return (
      <div className="page">
        <div className="header">
          <h1>我的</h1>
        </div>
        <div className="empty" style={{ marginTop: 60 }}>
          <p style={{ fontSize: 48, marginBottom: 16 }}>👤</p>
          <p style={{ marginBottom: 20 }}>请先登录</p>
          <button className="btn btn-primary" style={{ width: 'auto', padding: '10px 32px' }} onClick={() => navigate('/login')}>
            去登录
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <div className="header">
        <h1>我的</h1>
      </div>

      <div className="card" style={{ marginTop: -10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: 20,
            fontWeight: 600
          }}>
            {user?.nickname?.charAt(0) || '用'}
          </div>
          <div>
            <h3 style={{ color: '#333' }}>{user?.nickname || '用户'}</h3>
            <p style={{ color: '#999', fontSize: 13, marginTop: 4 }}>{user?.phone || ''}</p>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h4 style={{ marginBottom: 16, color: '#333' }}>我的订单 ({orders.length})</h4>
        {loading ? (
          <div className="loading" style={{ padding: 20 }}>
            <div className="spinner" style={{ width: 24, height: 24 }}></div>
          </div>
        ) : orders.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#999', padding: 20 }}>暂无订单</p>
        ) : (
          orders.slice(0, 5).map((order) => (
            <div
              key={order.id}
              style={{
                padding: '12px 0',
                borderBottom: '1px solid #f0f0f0',
                cursor: 'pointer'
              }}
              onClick={() => navigate(`/consult/${order.id}`)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#333' }}>
                  {order.question_type_name || order.type || '法律咨询'}
                </span>
                <span style={{ fontSize: 12, color: '#52c41a' }}>
                  {getStatusText(order.status)}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                <span style={{ fontSize: 12, color: '#999' }}>
                  {order.lawyer_name || '待分配律师'}
                </span>
                <span style={{ fontSize: 12, color: '#667eea', fontWeight: 600 }}>
                  ¥{order.amount}
                </span>
              </div>
            </div>
          ))
        )}
        {orders.length > 5 && (
          <div style={{ textAlign: 'center', paddingTop: 12, color: '#999', fontSize: 13 }}>
            查看全部订单 →
          </div>
        )}
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <div
          style={{ padding: '12px 0', cursor: 'pointer', borderBottom: '1px solid #f0f0f0' }}
          onClick={() => navigate('/messages')}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>我的咨询</span>
            <span style={{ color: '#999' }}>→</span>
          </div>
        </div>
        <div style={{ padding: '12px 0', cursor: 'pointer', borderBottom: '1px solid #f0f0f0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>平台担保</span>
            <span style={{ color: '#999' }}>→</span>
          </div>
        </div>
        <div style={{ padding: '12px 0', cursor: 'pointer' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>联系客服</span>
            <span style={{ color: '#999' }}>→</span>
          </div>
        </div>
      </div>

      <button
        className="btn"
        style={{
          width: '100%',
          marginTop: 24,
          background: '#fff1f0',
          color: '#ff4d4f',
          border: '1px solid #ffccc7'
        }}
        onClick={handleLogout}
      >
        退出登录
      </button>
    </div>
  )
}

export default Profile
