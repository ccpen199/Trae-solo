import React from 'react'
import { Link, useLocation } from 'react-router-dom'

const navItems = [
  { path: '/', label: '首页', icon: '🏠' },
  { path: '/bill', label: '账单', icon: '💳' },
  { path: '/message', label: '消息', icon: '📬' },
  { path: '/wealth', label: '财富', icon: '💰' },
  { path: '/loan', label: '借钱', icon: '💵' },
  { path: '/profile', label: '我的', icon: '👤' }
]

function BottomNav() {
  const location = useLocation()

  return (
    <nav className="bottom-nav">
      {navItems.map((item) => (
        <Link
          key={item.path}
          to={item.path}
          className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
        >
          <span className="nav-icon">{item.icon}</span>
          <span>{item.label}</span>
        </Link>
      ))}
    </nav>
  )
}

export default BottomNav
