import { useNavigate } from 'react-router-dom'
import { useUserStore } from '../store'

function Header({ showSearch = true, showLocation = true, title, onSearch }) {
  const navigate = useNavigate()
  const { user, city } = useUserStore()
  
  const displayCity = user?.city || city || '选择城市'
  
  return (
    <header className="header">
      <div className="header-content">
        {showLocation && (
          <div className="header-location" onClick={() => navigate('/city-select')}>
            <span>📍</span>
            <span>{displayCity}</span>
            <span>▼</span>
          </div>
        )}
        
        {title && <h2 style={{ flex: 1 }}>{title}</h2>}
        
        {showSearch && (
          <div className="header-search" onClick={() => navigate('/search')}>
            <span>🔍</span>
            <input
              type="text"
              placeholder="搜索商品"
              readOnly
            />
          </div>
        )}
        
        {!title && !showSearch && <div style={{ flex: 1 }}></div>}
        
        <button className="header-icon" onClick={() => navigate('/message')}>
          🔔
        </button>
      </div>
    </header>
  )
}

export default Header
