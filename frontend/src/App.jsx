import React, { useState, useEffect } from 'react';
import { Routes, Route, NavLink, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard.jsx';
import Audits from './pages/Audits.jsx';
import AuditDetail from './pages/AuditDetail.jsx';
import Materials from './pages/Materials.jsx';
import Risks from './pages/Risks.jsx';
import RiskDetail from './pages/RiskDetail.jsx';
import Rectifications from './pages/Rectifications.jsx';
import RectificationDetail from './pages/RectificationDetail.jsx';
import Reports from './pages/Reports.jsx';
import Exceptions from './pages/Exceptions.jsx';
import Rules from './pages/Rules.jsx';
import { usersApi } from './api.js';

function App() {
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    usersApi.get(1).then(res => {
      if (res.data.success) {
        setCurrentUser(res.data.data);
      }
    }).catch(() => {});
  }, []);

  return (
    <div className="app">
      <aside className="sidebar">
        <h1>🛡️ AI 合规审计助手</h1>
        <nav>
          <NavLink to="/dashboard">📊 数据看板</NavLink>
          <NavLink to="/audits">📋 审计台账</NavLink>
          <NavLink to="/materials">📁 材料管理</NavLink>
          <NavLink to="/risks">⚠️ 风险清单</NavLink>
          <NavLink to="/rectifications">✅ 整改跟踪</NavLink>
          <NavLink to="/rules">⚙️ 规则管理</NavLink>
          <NavLink to="/reports">📈 报表导出</NavLink>
          <NavLink to="/exceptions">🔧 异常处理</NavLink>
        </nav>
        {currentUser && (
          <div style={{ padding: '20px', borderTop: '1px solid #34495e', marginTop: '20px' }}>
            <div style={{ fontSize: '12px', color: '#bdc3c7' }}>当前用户</div>
            <div style={{ fontWeight: 'bold' }}>{currentUser.name}</div>
            <div style={{ fontSize: '12px', color: '#95a5a6' }}>{currentUser.role}</div>
          </div>
        )}
      </aside>
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/audits" element={<Audits />} />
          <Route path="/audits/:id" element={<AuditDetail />} />
          <Route path="/materials" element={<Materials />} />
          <Route path="/risks" element={<Risks />} />
          <Route path="/risks/:id" element={<RiskDetail />} />
          <Route path="/rectifications" element={<Rectifications />} />
          <Route path="/rectifications/:id" element={<RectificationDetail />} />
          <Route path="/rules" element={<Rules />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/exceptions" element={<Exceptions />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
