import { useNavigate, useLocation } from 'react-router-dom'
import { useCartStore } from '../store'

const navItems = [
  { key: 'home', label: '首页', icon: '🏠', path: '/' },
  { key: 'category', label: '分类', icon: '📋', path: '/category' },
  { key: 'video', label: '视频', icon: '🎬', path: '/video' },
  { key: 'cart', label: '购物车', icon: '🛒', path: '/cart' },
  { key: 'user', label: '我的', icon: '👤', path: '/user' }
]

function BottomNav() {
  const navigate = useNavigate()
  const location = useLocation()
  const { totalCount } = useCartStore()
  
  const currentPath = location.pathname
  const activeKey = navItems.find(item => item.path === currentPath)?.key || 'home'
  
  const handleNav = (item) => {
    navigate(item.path)
  }
  
  return (
    <nav className="bottom-nav safe-area-bottom">
      {navItems.map(item => (
        <button
          key={item.key}
          className={`nav-item ${activeKey === item.key ? 'active' : ''}`}
          onClick={() => handleNav(item)}
        >
          <span className="nav-item-icon">{item.icon}</span>
          <span className="nav-item-label">{item.label}</span>
          {item.key === 'cart' && totalCount > 0 && (
            <span className="nav-badge">{totalCount > 99 ? '99+' : totalCount}</span>
          )}
        </button>
      ))}
    </nav>
  )
}

export default BottomNav
