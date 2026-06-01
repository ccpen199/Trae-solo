import React, { useState } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import Dashboard from './pages/Dashboard.jsx';
import Publish from './pages/Publish.jsx';
import Works from './pages/Works.jsx';
import DataAnalytics from './pages/DataAnalytics.jsx';
import Income from './pages/Income.jsx';
import Tools from './pages/Tools.jsx';

const App = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { key: '/', label: '创作者主页', icon: '🏠' },
    { key: '/publish', label: '发布内容', icon: '✏️' },
    { key: '/works', label: '内容管理', icon: '📁' },
    { key: '/data', label: '数据中心', icon: '📊' },
    { key: '/income', label: '收益中心', icon: '💰' },
    { key: '/tools', label: '运营工具', icon: '🔧' },
  ];

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h1>创作者工作台</h1>
        </div>
        <nav className="sidebar-nav">
          {menuItems.map(item => (
            <button
              key={item.key}
              className={`nav-item ${location.pathname === item.key ? 'active' : ''}`}
              onClick={() => navigate(item.key)}
            >
              <span style={{ marginRight: '8px' }}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>
      </aside>
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/publish" element={<Publish />} />
          <Route path="/works" element={<Works />} />
          <Route path="/data" element={<DataAnalytics />} />
          <Route path="/income" element={<Income />} />
          <Route path="/tools" element={<Tools />} />
        </Routes>
      </main>
    </div>
  );
};

export default App;
