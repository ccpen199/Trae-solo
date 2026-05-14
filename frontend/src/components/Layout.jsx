import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

const navItems = [
  { path: '/', label: '首页', icon: '🏠' },
  { path: '/lost-found', label: '失物招领', icon: '🔍' },
  { path: '/secondhand', label: '二手交易', icon: '🛒' },
  { path: '/errands', label: '跑腿服务', icon: '🏃' },
  { path: '/experience', label: '经验谈', icon: '💡' },
  { path: '/stations', label: '服务站', icon: '🏪' },
  { path: '/profile', label: '我的', icon: '👤' },
]

export default function Layout({ children }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { isAuthenticated, user, logout } = useAuthStore()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header style={{ 
        background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a5a 100%)', 
        color: 'white',
        padding: '15px 0',
        boxShadow: '0 2px 10px rgba(255,107,107,0.3)'
      }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '28px' }}>🍊</span>
            <h1 style={{ fontSize: '22px', fontWeight: '700' }}>西柚找找</h1>
          </Link>
          
          <nav style={{ display: 'flex', gap: '30px', alignItems: 'center' }}>
            {navItems.slice(0, 5).map(item => (
              <Link 
                key={item.path} 
                to={item.path}
                style={{ 
                  fontSize: '14px',
                  opacity: location.pathname === item.path ? 1 : 0.8,
                  fontWeight: location.pathname === item.path ? '600' : '400'
                }}
              >
                {item.label}
              </Link>
            ))}
            
            {isAuthenticated ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <Link to="/profile" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>{user?.nickname || '用户'}</span>
                </Link>
                <button 
                  onClick={handleLogout}
                  style={{ 
                    background: 'rgba(255,255,255,0.2)', 
                    color: 'white',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '13px'
                  }}
                >
                  退出
                </button>
              </div>
            ) : (
              <Link 
                to="/login"
                style={{ 
                  background: 'white', 
                  color: '#ff6b6b',
                  padding: '8px 20px',
                  borderRadius: '20px',
                  fontSize: '14px',
                  fontWeight: '600'
                }}
              >
                登录
              </Link>
            )}
          </nav>
        </div>
      </header>

      <main style={{ flex: 1, padding: '30px 0' }}>
        {children}
      </main>

      <footer style={{ 
        background: '#1a1a2e', 
        color: '#9ca3af',
        padding: '30px 0',
        marginTop: 'auto'
      }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <p style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '10px' }}>
            <span>🍊</span>
            <span style={{ fontWeight: '600', color: 'white' }}>西柚找找</span>
          </p>
          <p style={{ fontSize: '13px' }}>校园信息共享服务平台 | 让校园生活更美好</p>
        </div>
      </footer>
    </div>
  )
}
