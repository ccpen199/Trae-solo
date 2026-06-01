import { useState } from 'react'
import { useUser } from '../contexts/UserContext'

function UserSwitcher() {
  const { currentUser, setCurrentUser, mockUsers } = useUser()
  const [isOpen, setIsOpen] = useState(false)

  const getRoleColor = (role) => {
    switch (role) {
      case 'applicant': return '#1890ff'
      case 'reviewer': return '#52c41a'
      case 'risk': return '#faad14'
      case 'admin': return '#722ed1'
      default: return '#666'
    }
  }

  return (
    <div className="user-switcher">
      <div 
        className="current-user"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div 
          className="user-avatar"
          style={{ backgroundColor: getRoleColor(currentUser.role) }}
        >
          {currentUser.name.charAt(0)}
        </div>
        <div className="user-info">
          <div className="user-name">{currentUser.name}</div>
          <div className="user-role">{currentUser.roleName}</div>
        </div>
        <span className="dropdown-arrow">▼</span>
      </div>

      {isOpen && (
        <div className="user-dropdown">
          <div className="dropdown-title">切换账号</div>
          {mockUsers.map(user => (
            <div
              key={user.id}
              className={`dropdown-item ${user.id === currentUser.id ? 'active' : ''}`}
              onClick={() => {
                setCurrentUser(user)
                setIsOpen(false)
              }}
            >
              <div 
                className="user-avatar small"
                style={{ backgroundColor: getRoleColor(user.role) }}
              >
                {user.name.charAt(0)}
              </div>
              <div className="user-info">
                <div className="user-name">{user.name}</div>
                <div className="user-role">{user.roleName}</div>
              </div>
              {user.id === currentUser.id && <span className="check-mark">✓</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default UserSwitcher
