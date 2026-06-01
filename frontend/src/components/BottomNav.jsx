import React from 'react';
import { NavLink } from 'react-router-dom';

const navItems = [
  { path: '/', icon: '☀️', label: '日贴' },
  { path: '/focus', icon: '⏱️', label: '专注' },
  { path: '/sleep', icon: '🌙', label: '睡眠' },
  { path: '/breath', icon: '🌬️', label: '呼吸' },
  { path: '/profile', icon: '👤', label: '我的' }
];

function BottomNav() {
  return (
    <nav className="bottom-nav">
      {navItems.map((item) => (
        <NavLink
          key={item.path}
          to={item.path}
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          end
        >
          <span className="nav-icon">{item.icon}</span>
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

export default BottomNav;
