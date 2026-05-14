import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import useStore from '../store'

const Profile = () => {
  const navigate = useNavigate()
  const user = useStore(state => state.user)
  const clearUser = useStore(state => state.clearUser)

  const handleLogout = () => {
    if (confirm('确定退出登录？')) {
      clearUser()
      navigate('/')
    }
  }

  if (!user) {
    return null
  }

  const menuItems = [
    { icon: '📦', label: '我的订单', path: '/orders' },
    { icon: '🎫', label: '我的优惠券', path: '/coupons' },
    { icon: '💎', label: '积分中心', path: '/points' },
    { icon: '👑', label: '会员中心', path: '/member' },
  ]

  return (
    <div className="container" style={{ padding: '20px 0' }}>
      <div className="card" style={{ padding: 24, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ fontSize: 48 }}>{user.avatar || '👤'}</div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>
              {user.nickname}
              {user.is_vip && <span style={{ marginLeft: 8, color: '#faad14' }}>👑 VIP</span>}
            </div>
            <div style={{ color: '#999' }}>
              {user.phone ? `手机号：${user.phone}` : ''}
              {user.phone && user.email ? ' | ' : ''}
              {user.email ? `邮箱：${user.email}` : ''}
            </div>
            <div style={{ marginTop: 8 }}>
              <span style={{ color: '#666' }}>积分：</span>
              <span style={{ color: '#ff4d4f', fontWeight: 600 }}>{user.points}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 24, marginBottom: 20 }}>
        <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 16 }}>快捷入口</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          {menuItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 8,
                padding: 20,
                background: '#fafafa',
                borderRadius: 8,
                color: '#333'
              }}
            >
              <span style={{ fontSize: 32 }}>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
      </div>

      <div className="card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 16, fontWeight: 600 }}>账号管理</div>
          <button className="btn btn-outline" onClick={handleLogout}>
            退出登录
          </button>
        </div>
      </div>
    </div>
  )
}

export default Profile
