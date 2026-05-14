import React from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import useStore from '../store'
import './AdminLayout.css'

const AdminLayout = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { admin, clearAdmin } = useStore()

  const handleLogout = () => {
    clearAdmin()
    navigate('/admin/login')
  }

  const menuItems = [
    { path: '/admin', name: '数据概览', icon: '📊' },
    { path: '/admin/products', name: '商品管理', icon: '📦' },
    { path: '/admin/orders', name: '订单管理', icon: '📋' },
    { path: '/admin/channels', name: '频道管理', icon: '📺' },
    { path: '/admin/contents', name: '内容管理', icon: '📝' },
    { path: '/admin/coupons', name: '优惠券管理', icon: '🎟️' },
    { path: '/admin/crowdfunding', name: '众筹管理', icon: '🎯' },
    { path: '/admin/users', name: '用户管理', icon: '👥' },
  ]

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-logo">
          <span className="logo-icon">🎯</span>
          <span className="logo-text">管理后台</span>
        </div>
        <nav className="admin-menu">
          {menuItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`menu-item ${location.pathname === item.path ? 'active' : ''}`}
            >
              <span className="menu-icon">{item.icon}</span>
              <span className="menu-text">{item.name}</span>
            </Link>
          ))}
        </nav>
      </aside>
      <div className="admin-main">
        <header className="admin-header">
          <div className="admin-header-left">
            <h2>精品自营电商平台</h2>
          </div>
          <div className="admin-header-right">
            {admin && (
              <>
                <span className="admin-user">
                  👤 {admin.nickname || admin.username}
                </span>
                <button className="admin-logout-btn" onClick={handleLogout}>
                  退出登录
                </button>
              </>
            )}
          </div>
        </header>
        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default AdminLayout
