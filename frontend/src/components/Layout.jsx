import React from 'react'
import { NavLink, useLocation } from 'react-router-dom'

const roleNavItems = {
  owner: [
    { path: '/', label: '首页', icon: '🏠' },
    { path: '/pets', label: '我的宠物', icon: '🐾' },
    { path: '/services', label: '服务项目', icon: '📋' },
    { path: '/appointments', label: '我的预约', icon: '📅' },
    { path: '/fees', label: '费用账单', icon: '💰' },
    { path: '/reviews', label: '我的评价', icon: '⭐' },
    { path: '/complaints', label: '投诉建议', icon: '💬' }
  ],
  store: [
    { path: '/', label: '首页', icon: '🏠' },
    { path: '/appointments', label: '预约管理', icon: '📅' },
    { path: '/services', label: '服务管理', icon: '📋' },
    { path: '/records', label: '服务记录', icon: '📝' },
    { path: '/transport', label: '接送任务', icon: '🚗' },
    { path: '/fees', label: '费用管理', icon: '💰' },
    { path: '/reviews', label: '评价管理', icon: '⭐' },
    { path: '/complaints', label: '投诉处理', icon: '💬' },
    { path: '/store', label: '门店设置', icon: '⚙️' },
    { path: '/dashboard', label: '运营统计', icon: '📊' }
  ],
  staff: [
    { path: '/', label: '首页', icon: '🏠' },
    { path: '/appointments', label: '我的任务', icon: '📅' },
    { path: '/records', label: '服务记录', icon: '📝' },
    { path: '/services', label: '服务项目', icon: '📋' }
  ],
  driver: [
    { path: '/', label: '首页', icon: '🏠' },
    { path: '/transport', label: '接送任务', icon: '🚗' }
  ],
  customer_service: [
    { path: '/', label: '首页', icon: '🏠' },
    { path: '/appointments', label: '预约查询', icon: '📅' },
    { path: '/complaints', label: '投诉处理', icon: '💬' },
    { path: '/fees', label: '费用争议', icon: '💰' },
    { path: '/dashboard', label: '运营统计', icon: '📊' }
  ],
  admin: [
    { path: '/', label: '首页', icon: '🏠' },
    { path: '/pets', label: '宠物档案', icon: '🐾' },
    { path: '/services', label: '服务管理', icon: '📋' },
    { path: '/appointments', label: '预约管理', icon: '📅' },
    { path: '/transport', label: '接送任务', icon: '🚗' },
    { path: '/records', label: '服务记录', icon: '📝' },
    { path: '/fees', label: '费用管理', icon: '💰' },
    { path: '/reviews', label: '评价管理', icon: '⭐' },
    { path: '/complaints', label: '投诉处理', icon: '💬' },
    { path: '/store', label: '门店管理', icon: '🏪' },
    { path: '/dashboard', label: '运营统计', icon: '📊' }
  ]
}

const roleNames = {
  owner: '宠物主人',
  store: '门店管理员',
  staff: '服务人员',
  driver: '司机',
  customer_service: '客服',
  admin: '系统管理员'
}

export default function Layout({ user, onLogout, children }) {
  const location = useLocation()
  const navItems = roleNavItems[user.role] || roleNavItems.owner

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <span style={{ fontSize: '24px' }}>🐕</span>
          <h1>宠物服务平台</h1>
        </div>
        
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        
        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">
              {user.name?.charAt(0) || 'U'}
            </div>
            <div className="user-details">
              <h4>{user.name}</h4>
              <p>{roleNames[user.role]}</p>
            </div>
          </div>
          <button className="logout-btn" onClick={onLogout}>
            退出登录
          </button>
        </div>
      </aside>
      
      <main className="main-content">
        {children}
      </main>
    </div>
  )
}
