import React from 'react';
import { Routes, Route, NavLink } from 'react-router-dom';
import Dashboard from './pages/Dashboard.jsx';
import JobList from './pages/JobList.jsx';
import JobCreate from './pages/JobCreate.jsx';
import CandidateList from './pages/CandidateList.jsx';
import CandidateDetail from './pages/CandidateDetail.jsx';
import CandidateCreate from './pages/CandidateCreate.jsx';
import SmartInvitation from './pages/SmartInvitation.jsx';
import Analytics from './pages/Analytics.jsx';
import CompanyAuth from './pages/CompanyAuth.jsx';
import HRISIntegration from './pages/HRISIntegration.jsx';

function App() {
  return (
    <div className="app">
      <aside className="sidebar">
        <div className="sidebar-logo">🎯 招聘效能平台</div>
        <nav>
          <ul className="sidebar-nav">
            <li>
              <NavLink to="/" end className={({ isActive }) => isActive ? 'active' : ''}>
                📊 数据看板
              </NavLink>
            </li>
            <li>
              <NavLink to="/jobs" className={({ isActive }) => isActive ? 'active' : ''}>
                💼 职位管理
              </NavLink>
            </li>
            <li>
              <NavLink to="/jobs/new" className={({ isActive }) => isActive ? 'active' : ''}>
                ➕ 发布职位
              </NavLink>
            </li>
            <li>
              <NavLink to="/candidates" className={({ isActive }) => isActive ? 'active' : ''}>
                👥 人才库
              </NavLink>
            </li>
            <li>
              <NavLink to="/candidates/new" className={({ isActive }) => isActive ? 'active' : ''}>
                ➕ 添加人才
              </NavLink>
            </li>
            <li>
              <NavLink to="/invitations" className={({ isActive }) => isActive ? 'active' : ''}>
                📧 智能邀约
              </NavLink>
            </li>
            <li>
              <NavLink to="/analytics" className={({ isActive }) => isActive ? 'active' : ''}>
                📈 成本分析
              </NavLink>
            </li>
            <li>
              <NavLink to="/company-auth" className={({ isActive }) => isActive ? 'active' : ''}>
                🔐 企业认证
              </NavLink>
            </li>
            <li>
              <NavLink to="/hris" className={({ isActive }) => isActive ? 'active' : ''}>
                🔗 HRIS对接
              </NavLink>
            </li>
          </ul>
        </nav>
      </aside>
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/jobs" element={<JobList />} />
          <Route path="/jobs/new" element={<JobCreate />} />
          <Route path="/candidates" element={<CandidateList />} />
          <Route path="/candidates/new" element={<CandidateCreate />} />
          <Route path="/candidates/:id" element={<CandidateDetail />} />
          <Route path="/invitations" element={<SmartInvitation />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/company-auth" element={<CompanyAuth />} />
          <Route path="/hris" element={<HRISIntegration />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
