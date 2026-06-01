import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Navigation: React.FC = () => {
  const location = useLocation();
  
  const navItems = [
    { path: '/', icon: '🏠', label: '首页' },
    { path: '/tasks', icon: '💪', label: '任务' },
    { path: '/profile', icon: '👤', label: '我的' }
  ];

  const isHidden = ['/login', '/wallet', '/passport', '/base', '/settings'].includes(location.pathname);

  if (isHidden) {
    return null;
  }

  return (
    <nav className="nav">
      {navItems.map(item => (
        <Link 
          key={item.path} 
          to={item.path}
          className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
        >
          <span className="nav-icon">{item.icon}</span>
          <span>{item.label}</span>
        </Link>
      ))}
    </nav>
  );
};

export default Navigation;
