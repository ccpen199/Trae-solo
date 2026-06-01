import React from 'react';
import { Routes, Route, NavLink, useNavigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard.jsx';
import AuditPlans from './pages/AuditPlans.jsx';
import Checklist from './pages/Checklist.jsx';
import Issues from './pages/Issues.jsx';
import Reports from './pages/Reports.jsx';

function App() {
  return (
    <div className="app-container">
      <header className="header">
        <h1>工厂验厂报告系统</h1>
        <span style={{ fontSize: '14px', opacity: 0.8 }}>品牌采购 · 第三方审核 · 供应商管理</span>
      </header>
      
      <div className="main-layout">
        <aside className="sidebar">
          <ul className="sidebar-menu">
            <li>
            <NavLink to="/" className={({ isActive }) => isActive ? 'active' : ''} end>
              📊 数据概览
            </NavLink>
          </li>
          <li>
            <NavLink to="/plans" className={({ isActive }) => isActive ? 'active' : ''}>
              📅 验厂计划
            </NavLink>
          </li>
          <li>
            <NavLink to="/checklist" className={({ isActive }) => isActive ? 'active' : ''}>
              ✅ 检查清单
            </NavLink>
          </li>
          <li>
            <NavLink to="/issues" className={({ isActive }) => isActive ? 'active' : ''}>
              ⚠️ 问题整改
            </NavLink>
          </li>
          <li>
            <NavLink to="/reports" className={({ isActive }) => isActive ? 'active' : ''}>
              📄 报告归档
            </NavLink>
          </li>
          </ul>
        </aside>
        
        <main className="content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/plans" element={<AuditPlans />} />
            <Route path="/checklist" element={<Checklist />} />
            <Route path="/checklist/:planId" element={<Checklist />} />
            <Route path="/issues" element={<Issues />} />
            <Route path="/issues/:planId" element={<Issues />} />
            <Route path="/reports" element={<Reports />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default App;
