import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const navItems = [
  { path: '/', icon: '💬', label: '消息' },
  { path: '/contacts', icon: '👥', label: '通讯录' },
  { path: '/capture', icon: '📹', label: '拍摄' },
  { path: '/world', icon: '🌍', label: '世界' },
  { path: '/profile', icon: '👤', label: '我' }
];

function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div className="bottom-nav">
      {navItems.map((item) => (
        <div
          key={item.path}
          className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
          onClick={() => navigate(item.path)}
        >
          <span className="icon">{item.icon}</span>
          <span className="label">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

export default BottomNav;
