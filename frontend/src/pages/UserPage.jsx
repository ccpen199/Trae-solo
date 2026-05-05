import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUserStore, useCartStore } from '../store'
import { userApi, cartApi } from '../api'

function UserPage() {
  const navigate = useNavigate()
  const { user, token, logout } = useUserStore()
  const { setCart } = useCartStore()
  
  const [toast, setToast] = useState(null)
  
  const showToast = useCallback((message) => {
    setToast(message)
    setTimeout(() => setToast(null), 2000)
  }, [])
  
  const menuItems = [
    { icon: '📋', label: '我的订单', path: '/orders' },
    { icon: '❤️', label: '我的收藏', path: '/favorites' },
    { icon: '📍', label: '收货地址', path: '/addresses' },
    { icon: '⭐', label: '会员中心', path: '/member' },
    { icon: '⚙️', label: '设置', path: '/settings' },
  ]
  
  const orderShortcuts = [
    { icon: '💳', label: '待付款', status: 'pending' },
    { icon: '📦', label: '待发货', status: 'paid' },
    { icon: '🚚', label: '配送中', status: 'shipped' },
    { icon: '📝', label: '退换货', status: 'after-sale' },
  ]
  
  const handleLogout = () => {
    logout()
    setCart([], 0, 0)
    showToast('已退出登录')
    navigate('/')
  }
  
  return (
    <div className="page-container">
      <div className="user-header">
        {token ? (
          <div className="user-info">
            <div className="user-avatar">
              {user?.avatar ? (
                <img src={user.avatar} alt="头像" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
              ) : (
                '👤'
              )}
            </div>
            <div className="user-detail">
              <div className="user-nickname">{user?.nickname || user?.username || '用户'}</div>
              <div className="user-tags">
                {user?.is_member && <span className="user-tag">会员</span>}
                {user?.is_verified && <span className="user-tag">认证用户</span>}
                <span className="user-tag">📍 {user?.city || '未识别'}</span>
              </div>
            </div>
            <button onClick={() => navigate('/profile')}>
              ⚙️
            </button>
          </div>
        ) : (
          <div className="user-info" onClick={() => navigate('/login')}>
            <div className="user-avatar">👤</div>
            <div className="user-detail">
              <div className="user-nickname">登录/注册</div>
              <div className="text-sm" style={{ opacity: 0.8 }}>登录后享受更多权益</div>
            </div>
          </div>
        )}
      </div>
      
      {token && (
        <div className="order-shortcut">
          <div className="order-shortcut-header">
            <span className="order-shortcut-title">我的订单</span>
            <span className="order-shortcut-more" onClick={() => navigate('/orders')}>
              全部订单 →
            </span>
          </div>
          <div className="order-shortcut-list">
            {orderShortcuts.map((item, index) => (
              <div
                key={index}
                className="order-shortcut-item"
                onClick={() => navigate(`/orders?status=${item.status}`)}
              >
                <span className="order-shortcut-icon">{item.icon}</span>
                <span className="order-shortcut-label">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="user-menu">
        {menuItems.map((item, index) => (
          <div
            key={index}
            className="user-menu-item"
            onClick={() => {
              if (token || item.label === '会员中心') {
                navigate(item.path)
              } else {
                navigate('/login')
              }
            }}
          >
            <span className="user-menu-icon">{item.icon}</span>
            <span className="user-menu-text">{item.label}</span>
            <span className="user-menu-arrow">›</span>
          </div>
        ))}
      </div>
      
      {token && (
        <div className="card" style={{ margin: '12px' }}>
          <button
            className="btn btn-block btn-outline"
            onClick={handleLogout}
          >
            退出登录
          </button>
        </div>
      )}
      
      {toast && (
        <div className="toast">{toast}</div>
      )}
    </div>
  )
}

export default UserPage
