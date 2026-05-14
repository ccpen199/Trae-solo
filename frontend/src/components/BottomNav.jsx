import { useNavigate, useLocation } from 'react-router-dom'
import { Home, LayoutGrid, Users, User, ShoppingCart } from 'lucide-react'
import useStore from '../store/useStore'

function BottomNav() {
  const navigate = useNavigate()
  const location = useLocation()
  const cartCount = useStore((state) => state.cartCount)
  
  const navItems = [
    { path: '/', icon: Home, label: '首页' },
    { path: '/category', icon: LayoutGrid, label: '分类' },
    { path: '/community', icon: Users, label: '社区' },
    { path: '/profile', icon: User, label: '我的' }
  ]
  
  const getNavIcon = (Item, path) => {
    const isActive = location.pathname === path
    return <Item size={22} color={isActive ? '#ff4d4f' : '#999'} />
  }
  
  const getCartIcon = () => {
    const isActive = location.pathname === '/cart'
    return (
      <div className="nav-item" onClick={() => navigate('/cart')}>
        <ShoppingCart size={22} color={isActive ? '#ff4d4f' : '#999'} />
        {cartCount > 0 && (
          <span className="nav-badge">{cartCount > 99 ? '99+' : cartCount}</span>
        )}
        <span style={{ color: isActive ? '#ff4d4f' : '#999' }}>购物车</span>
      </div>
    )
  }
  
  return (
    <div className="bottom-nav">
      {navItems.map((item, index) => {
        if (index === 2) {
          return getCartIcon()
        }
        
        const isActive = location.pathname === item.path
        return (
          <div
            key={item.path}
            className={`nav-item ${isActive ? 'active' : ''}`}
            onClick={() => navigate(item.path)}
          >
            {getNavIcon(item.icon, item.path)}
            <span>{item.label}</span>
          </div>
        )
      })}
    </div>
  )
}

export default BottomNav
