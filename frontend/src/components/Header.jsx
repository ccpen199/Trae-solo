import React from 'react'
import { Link, useLocation } from 'react-router-dom'

function Header({ currentUser }) {
  const location = useLocation()

  return (
    <header className="header">
      <div className="container">
        <div className="header-content">
          <Link to="/" className="logo">📚 二手书社区</Link>
          <nav className="nav">
            <Link to="/" className={location.pathname === '/' ? 'active' : ''}>首页</Link>
            <Link to="/cart" className={location.pathname === '/cart' ? 'active' : ''}>购物袋</Link>
            <Link to="/profile" className={location.pathname === '/profile' ? 'active' : ''}>我的</Link>
          </nav>
          {currentUser && (
            <div className="user-info">
              <img src={currentUser.avatar} alt="" className="user-avatar" />
              <span>{currentUser.username}</span>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export default Header
