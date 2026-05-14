import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../store/auth'
import { notificationAPI } from '../api/endpoints'
import { Avatar, Button } from './Common'

export function Header() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [unreadCount, setUnreadCount] = useState(0)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)

  useEffect(() => {
    if (user) {
      notificationAPI.getUnreadCount().then(res => {
        if (res.data?.success) setUnreadCount(res.data.data.count)
      }).catch(() => {})
    }
  }, [user])

  const navItems = [
    { path: '/', label: '首页', icon: '🏠' },
    { path: '/questions', label: '问题', icon: '❓' },
    { path: '/articles', label: '文章', icon: '📝' },
    { path: '/question/new', label: '提问', icon: '➕' }
  ]

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  return (
    <header style={{ 
      background: '#fff', 
      borderBottom: '1px solid #e5e7eb',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', height: '60px', gap: '32px' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
            <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#3b82f6' }}>PM</span>
            <span style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937' }}>CAFF</span>
          </Link>

          <nav style={{ display: 'flex', gap: '24px', flex: 1 }}>
            {navItems.map(item => (
              <Link
                key={item.path}
                to={item.path}
                style={{
                  textDecoration: 'none',
                  color: isActive(item.path) ? '#3b82f6' : '#4b5563',
                  fontWeight: isActive(item.path) ? '600' : '400',
                  fontSize: '14px',
                  padding: '8px 4px',
                  borderBottom: isActive(item.path) ? '2px solid #3b82f6' : '2px solid transparent'
                }}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {user ? (
              <>
                <Link to="/notifications" style={{ position: 'relative', color: '#4b5563', textDecoration: 'none' }}>
                  🔔
                  {unreadCount > 0 && (
                    <span style={{
                      position: 'absolute',
                      top: '-6px',
                      right: '-6px',
                      background: '#ef4444',
                      color: '#fff',
                      fontSize: '11px',
                      padding: '2px 6px',
                      borderRadius: '10px',
                      minWidth: '18px',
                      textAlign: 'center'
                    }}>
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </Link>
                <div style={{ position: 'relative' }}>
                  <div
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                  >
                    <Avatar url={user?.avatar} name={user?.nickname || user?.username} size={36} />
                    <span style={{ fontSize: '14px', color: '#374151' }}>{user?.nickname || user?.username}</span>
                  </div>
                  {showUserMenu && (
                    <div style={{
                      position: 'absolute',
                      top: '100%',
                      right: 0,
                      background: '#fff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                      minWidth: '180px',
                      marginTop: '8px',
                      overflow: 'hidden'
                    }}>
                      <Link to={`/user/${user?.id}`} style={menuItemStyle}>个人主页</Link>
                      <Link to="/profile" style={menuItemStyle}>个人中心</Link>
                      {user?.role !== 'user' && <Link to="/admin" style={menuItemStyle}>管理后台</Link>}
                      <div style={{ height: '1px', background: '#e5e7eb' }} />
                      <div onClick={logout} style={{ ...menuItemStyle, color: '#ef4444', cursor: 'pointer' }}>退出登录</div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link to="/login" style={{ textDecoration: 'none', color: '#4b5563', fontSize: '14px' }}>登录</Link>
                <Button size="small" onClick={() => navigate('/register')}>注册</Button>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

const menuItemStyle = {
  display: 'block',
  padding: '12px 16px',
  fontSize: '14px',
  color: '#374151',
  textDecoration: 'none',
  cursor: 'pointer',
  transition: 'background 0.2s'
}

export function Footer() {
  return (
    <footer style={{ 
      background: '#fff', 
      borderTop: '1px solid #e5e7eb',
      marginTop: '40px',
      padding: '24px 20px'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center', color: '#9ca3af', fontSize: '13px' }}>
        <p>PMCAFF - 产品人成长社区</p>
        <p style={{ marginTop: '8px' }}>© 2024 PMCAFF. All rights reserved.</p>
      </div>
    </footer>
  )
}

export function Layout({ children }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />
      <main style={{ flex: 1, maxWidth: '1200px', margin: '0 auto', width: '100%', padding: '24px 20px' }}>
        {children}
      </main>
      <Footer />
    </div>
  )
}

export function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  const navigate = useNavigate()

  if (loading) return null

  if (!user) {
    navigate('/login')
    return null
  }

  return children
}

export function AdminRoute({ children }) {
  const { user, loading, isAdmin } = useAuth()
  const navigate = useNavigate()

  if (loading) return null

  if (!user) {
    navigate('/login')
    return null
  }

  if (user?.role === 'user') {
    navigate('/')
    return null
  }

  return children
}
