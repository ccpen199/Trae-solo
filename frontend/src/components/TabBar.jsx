import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

function TabBar() {
  const location = useLocation();
  const navigate = useNavigate();

  const tabs = [
    { path: '/', label: '翻译', icon: '🔤' },
    { path: '/wordbook', label: '单词', icon: '📚' },
    { path: '/discover', label: '发现', icon: '🔍' },
    { path: '/profile', label: '我的', icon: '👤' },
  ];

  const isTabActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const hideTabBar = location.pathname.startsWith('/login') ||
    location.pathname.startsWith('/daily') ||
    location.pathname.startsWith('/book');

  if (hideTabBar) {
    return null;
  }

  return (
    <div className="tab-bar">
      {tabs.map((tab) => (
        <div
          key={tab.path}
          className={`tab-item ${isTabActive(tab.path) ? 'active' : ''}`}
          onClick={() => navigate(tab.path)}
        >
          <span className="tab-icon">{tab.icon}</span>
          <span>{tab.label}</span>
        </div>
      ))}
    </div>
  );
}

export default TabBar;
