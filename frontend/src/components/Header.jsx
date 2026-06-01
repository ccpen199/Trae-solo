import React from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function Header({ user, onLogout }) {
  const location = useLocation();

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <header className="header">
      <div className="container header-content">
        <Link to="/" className="logo">📚 读书会</Link>
        
        <nav className="nav">
          <Link to="/" className={isActive('/') ? 'active' : ''}>共读计划</Link>
          <Link to="/notes" className={isActive('/notes') ? 'active' : ''}>成员端</Link>
          <Link to="/discussions" className={isActive('/discussions') ? 'active' : ''}>讨论区</Link>
          <Link to="/activities" className={isActive('/activities') ? 'active' : ''}>活动</Link>
          {(user.role === 'admin' || user.role === 'host') && (
            <Link to="/admin" className={isActive('/admin') ? 'active' : ''}>报表</Link>
          )}
        </nav>

        <div className="user-menu">
          <span style={{ color: 'var(--gray-600)' }}>
            <span className="badge badge-primary">{user.name}</span>
          </span>
          <button onClick={onLogout} className="btn btn-sm btn-secondary">退出</button>
        </div>
      </div>
    </header>
  );
}
