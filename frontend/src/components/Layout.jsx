import React from 'react'
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { useStore } from '../store'

export default function Layout() {
  const { user, logout } = useStore()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const isActive = (path) => location.pathname === path
  const role = user?.role

  const dashboardPath = role === 'admin' ? '/admin/dashboard' : role === 'provider' ? '/provider/dashboard' : '/client/dashboard'
  const dashboardLabel = role === 'admin' ? '管理后台' : role === 'provider' ? '服务者工作台' : '我的工作台'

  return (
    <div>
      <nav className="nav">
        <div className="container nav-inner">
          <Link to="/" className="nav-logo">⚡ 技能零工</Link>
          
          <div className="nav-links">
            <Link to="/" className={`nav-link ${isActive('/') ? 'active' : ''}`}>首页</Link>
            <Link to="/providers" className={`nav-link ${isActive('/providers') ? 'active' : ''}`}>找服务</Link>
            <Link to="/requirements" className={`nav-link ${isActive('/requirements') ? 'active' : ''}`}>需求广场</Link>
            
            {role === 'client' && (
              <>
                <Link to="/post-requirement" className="btn btn-primary" style={{ padding: '6px 16px' }}>发布需求</Link>
                <Link to="/orders" className={`nav-link ${isActive('/orders') ? 'active' : ''}`}>我的订单</Link>
                <Link to={dashboardPath} className={`nav-link ${isActive('/client/dashboard') ? 'active' : ''}`}>{dashboardLabel}</Link>
              </>
            )}

            {role === 'provider' && (
              <>
                <Link to="/orders" className={`nav-link ${isActive('/orders') ? 'active' : ''}`}>我的订单</Link>
                <Link to="/skill-profile" className={`nav-link ${isActive('/skill-profile') ? 'active' : ''}`}>技能档案</Link>
                <Link to={dashboardPath} className={`nav-link ${isActive('/provider/dashboard') ? 'active' : ''}`}>{dashboardLabel}</Link>
              </>
            )}

            {role === 'admin' && (
              <>
                <Link to={dashboardPath} className={`nav-link ${isActive('/admin/dashboard') ? 'active' : ''}`}>{dashboardLabel}</Link>
                <Link to="/admin/users" className={`nav-link ${isActive('/admin/users') ? 'active' : ''}`}>用户管理</Link>
                <Link to="/admin/disputes" className={`nav-link ${isActive('/admin/disputes') ? 'active' : ''}`}>纠纷处理</Link>
              </>
            )}

            {role ? (
              <>
                <Link to="/profile" className={`nav-link ${isActive('/profile') ? 'active' : ''}`}>
                  {user.username}
                </Link>
                <button onClick={handleLogout} className="btn btn-outline" style={{ padding: '6px 12px' }}>
                  退出
                </button>
              </>
            ) : (
              <Link to="/login" className="btn btn-primary">登录</Link>
            )}
          </div>
        </div>
      </nav>
      
      <main>
        <Outlet />
      </main>
    </div>
  )
}
