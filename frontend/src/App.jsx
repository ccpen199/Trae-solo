import React, { useState } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import DramaList from './pages/DramaList.jsx';
import DramaDetail from './pages/DramaDetail.jsx';
import EpisodeManager from './pages/EpisodeManager.jsx';
import ReviewCenter from './pages/ReviewCenter.jsx';
import Distribution from './pages/Distribution.jsx';
import Analytics from './pages/Analytics.jsx';

const navItems = [
  { path: '/', label: '剧集档案', icon: '📁' },
  { path: '/episodes', label: '分集管理', icon: '🎬' },
  { path: '/reviews', label: '审核流程', icon: '✅' },
  { path: '/distribution', label: '分发运营', icon: '🚀' },
  { path: '/analytics', label: '数据分析', icon: '📊' }
];

export default function App() {
  const location = useLocation();
  const [activeDramaId, setActiveDramaId] = useState(null);

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="logo">
          <span className="logo-icon">🎭</span>
          <span className="logo-text">短剧运营平台</span>
        </div>
        <nav className="nav-menu">
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="version">v1.0.0</div>
        </div>
      </aside>
      <main className="main-content">
        <header className="top-bar">
          <div className="page-title">
            {navItems.find(n => n.path === location.pathname)?.label || '短剧运营平台'}
          </div>
          <div className="user-area">
            <span className="user-avatar">👤</span>
            <span className="user-name">运营管理员</span>
          </div>
        </header>
        <div className="content-body">
          <Routes>
            <Route path="/" element={<DramaList onSelectDrama={(id) => { setActiveDramaId(id); }} />} />
            <Route path="/drama/:id" element={<DramaDetail />} />
            <Route path="/episodes" element={<EpisodeManager />} />
            <Route path="/reviews" element={<ReviewCenter />} />
            <Route path="/distribution" element={<Distribution />} />
            <Route path="/analytics" element={<Analytics />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}
