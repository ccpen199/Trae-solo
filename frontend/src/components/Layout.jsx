import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import './Layout.css'

function Layout({ children }) {
  const { user, logout, hasPermission } = useAuth()
  const navigate = useNavigate()

  const allNavItems = [
    { path: '/', label: '库存看板', icon: '📊', permission: null },
    { path: '/linen-items', label: '布草档案', icon: '📋', permission: null },
    { path: '/distributions', label: '布草发放', icon: '📤', permission: null },
    { path: '/collections', label: '布草回收', icon: '📥', permission: null },
    { path: '/washing', label: '洗涤管理', icon: '🧺', permission: null },
    { path: '/damage-reports', label: '布草报损', icon: '📝', permission: 'report_damage' },
    { path: '/damage-approval', label: '报损审批', icon: '✅', permission: 'approve_damage' },
    { path: '/settlements', label: '供应商结算', icon: '💰', permission: null },
    { path: '/suppliers', label: '供应商管理', icon: '🏢', permission: null },
  ]

  const navItems = allNavItems.filter(item => 
    item.permission === null || hasPermission(item.permission)
  )

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h1>🏨 布草洗涤管理系统</h1>
        </div>
        <nav className="nav-menu">
          {navItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">{user?.name?.[0] || '?'}</div>
            <div className="user-detail">
              <div className="user-name">{user?.name}</div>
              <div className="user-role">
                {user?.role === 'staff' ? '客房员工' : user?.role === 'manager' ? '部门经理' : '系统管理员'}
              </div>
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            🚪 退出
          </button>
        </div>
      </aside>
      <main className="main-content">
        {children}
      </main>
    </div>
  )
}

export default Layout
