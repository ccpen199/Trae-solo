import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './store/auth'
import { ToastProvider } from './components/Toast'
import ErrorBoundary from './components/ErrorBoundary'
import Home from './pages/Home'
import Search from './pages/Search'
import QuestionDetail from './pages/QuestionDetail'
import LoginModal from './components/LoginModal'
import { useState } from 'react'

const Navigation = () => {
  const location = useLocation()
  const { user, logout } = useAuth()
  const [showLogin, setShowLogin] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)

  const navItems = [
    { path: '/', label: '首页', icon: '🏠' },
    { path: '/search', label: '搜索', icon: '🔍' }
  ]

  return (
    <>
      <nav style={styles.nav}>
        <div style={styles.navContainer}>
          <div style={styles.navLeft}>
            <span style={styles.logo}>知识社区</span>
          </div>
          
          <div style={styles.navCenter}>
            {navItems.map(item => (
              <Link
                key={item.path}
                to={item.path}
                style={{
                  ...styles.navLink,
                  ...(location.pathname === item.path ? styles.navLinkActive : {})
                }}
              >
                <span style={styles.navIcon}>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </div>

          <div style={styles.navRight}>
            {user ? (
              <div style={styles.userSection}>
                <button
                  style={styles.avatarBtn}
                  onClick={() => setShowUserMenu(!showUserMenu)}
                >
                  <img
                    src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`}
                    alt="avatar"
                    style={styles.userAvatar}
                  />
                </button>
                {showUserMenu && (
                  <div style={styles.userMenu}>
                    <div style={styles.userInfo}>
                      <span style={styles.userName}>{user.nickname}</span>
                      <span style={styles.userPhone}>{user.phone}</span>
                    </div>
                    <button style={styles.logoutBtn} onClick={logout}>退出登录</button>
                  </div>
                )}
              </div>
            ) : (
              <button style={styles.loginBtn} onClick={() => setShowLogin(true)}>
                登录
              </button>
            )}
          </div>
        </div>
      </nav>

      <div style={styles.content}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<Search />} />
          <Route path="/question/:id" element={<QuestionDetail />} />
        </Routes>
      </div>

      <LoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} />
    </>
  )
}

const App = () => {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <AuthProvider>
          <Router>
            <div style={styles.app}>
              <Navigation />
            </div>
          </Router>
        </AuthProvider>
      </ToastProvider>
    </ErrorBoundary>
  )
}

const styles = {
  app: {
    minHeight: '100vh',
    backgroundColor: '#f5f7fa'
  },
  nav: {
    position: 'sticky',
    top: 0,
    backgroundColor: 'white',
    boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
    zIndex: 100
  },
  navContainer: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 16px',
    height: '60px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  navLeft: {
    display: 'flex',
    alignItems: 'center'
  },
  logo: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#007AFF'
  },
  navCenter: {
    display: 'flex',
    gap: '8px'
  },
  navLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    padding: '10px 16px',
    borderRadius: '8px',
    textDecoration: 'none',
    color: '#666',
    fontSize: '14px',
    transition: 'all 0.2s'
  },
  navLinkActive: {
    backgroundColor: '#e8f4ff',
    color: '#007AFF',
    fontWeight: '500'
  },
  navIcon: {
    fontSize: '16px'
  },
  navRight: {
    display: 'flex',
    alignItems: 'center'
  },
  loginBtn: {
    padding: '10px 24px',
    backgroundColor: '#007AFF',
    color: 'white',
    border: 'none',
    borderRadius: '20px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer'
  },
  userSection: {
    position: 'relative'
  },
  avatarBtn: {
    border: 'none',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    padding: '4px'
  },
  userAvatar: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    backgroundColor: '#e0e0e0'
  },
  userMenu: {
    position: 'absolute',
    top: '100%',
    right: 0,
    marginTop: '8px',
    padding: '12px',
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
    minWidth: '180px'
  },
  userInfo: {
    paddingBottom: '12px',
    borderBottom: '1px solid #f0f0f0',
    marginBottom: '8px'
  },
  userName: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '500',
    color: '#333',
    marginBottom: '4px'
  },
  userPhone: {
    display: 'block',
    fontSize: '12px',
    color: '#999'
  },
  logoutBtn: {
    width: '100%',
    padding: '10px',
    border: 'none',
    backgroundColor: 'transparent',
    color: '#ff3b30',
    fontSize: '14px',
    cursor: 'pointer',
    textAlign: 'left',
    borderRadius: '4px'
  },
  content: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px 16px'
  }
}

export default App
