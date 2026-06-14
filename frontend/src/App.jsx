import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate, Link, useLocation } from 'react-router-dom';
import HomePage from './pages/HomePage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import JobDetailPage from './pages/JobDetailPage.jsx';
import JobListPage from './pages/JobListPage.jsx';
import CompanyPage from './pages/CompanyPage.jsx';
import CompanyDetailPage from './pages/CompanyDetailPage.jsx';
import PostJobPage from './pages/PostJobPage.jsx';
import MyApplicationsPage from './pages/MyApplicationsPage.jsx';
import CompanyApplicationsPage from './pages/CompanyApplicationsPage.jsx';
import VoiceSearchPage from './pages/VoiceSearchPage.jsx';
import ARNavigatePage from './pages/ARNavigatePage.jsx';
import InterviewsPage from './pages/InterviewsPage.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import { authAPI } from './utils/api.js';

function AdminGate({ user }) {
  if (user?.role === 'admin') return <AdminDashboard />;
  return <Navigate to="/login" replace />;
}

function App() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (token && userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/');
  };

  const isActive = (path) => location.pathname.startsWith(path);

  return (
    <div>
      <header className="header">
        <div className="container">
          <div className="logo" onClick={() => navigate('/')}>
            🏙️ 服务业求职平台
          </div>
          <nav className="nav">
            <Link to="/" className={isActive('/') && !isActive('/jobs') && !isActive('/companies') ? 'active' : ''}>首页</Link>
            <Link to="/jobs" className={isActive('/jobs') ? 'active' : ''}>找工作</Link>
            <Link to="/companies" className={isActive('/companies') ? 'active' : ''}>企业</Link>
            <Link to="/admin" className={isActive('/admin') ? 'active' : ''}>管理后台</Link>
            
            {!user && (
              <>
                <Link to="/login">登录</Link>
                <Link to="/register" className="btn btn-outline btn-sm">注册</Link>
              </>
            )}
            
            {user && user.role === 'seeker' && (
              <>
                <Link to="/voice-search" className={isActive('/voice-search') ? 'active' : ''}>🎤 语音搜索</Link>
                <Link to="/applications" className={isActive('/applications') ? 'active' : ''}>我的投递</Link>
                <Link to="/interviews" className={isActive('/interviews') ? 'active' : ''}>面试邀约</Link>
              </>
            )}
            
            {user && user.role === 'company' && (
              <>
                <Link to="/post-job" className={isActive('/post-job') ? 'active' : ''}>发布职位</Link>
                <Link to="/company/applications" className={isActive('/company/applications') ? 'active' : ''}>收到的简历</Link>
                <Link to="/company/interviews" className={isActive('/company/interviews') ? 'active' : ''}>面试管理</Link>
              </>
            )}
            
            {user && user.role === 'admin' && (
              <Link to="/admin" className={isActive('/admin') ? 'active' : ''}>管理后台</Link>
            )}
            
            {user && (
              <>
                <span style={{ opacity: 0.9 }}>👤 {user.username}</span>
                <button className="btn btn-outline btn-sm" onClick={handleLogout}>退出</button>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="main">
        <div className="container">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage onLogin={(u) => setUser(u)} />} />
            <Route path="/register" element={<RegisterPage onLogin={(u) => setUser(u)} />} />
            <Route path="/jobs" element={<JobListPage user={user} />} />
            <Route path="/jobs/:id" element={<JobDetailPage user={user} />} />
            <Route path="/companies" element={<CompanyPage />} />
            <Route path="/companies/:id" element={<CompanyDetailPage user={user} />} />
            
            <Route path="/post-job" element={
              user?.role === 'company' ? <PostJobPage /> : <Navigate to="/login" />
            } />
            <Route path="/applications" element={
              user?.role === 'seeker' ? <MyApplicationsPage /> : <Navigate to="/login" />
            } />
            <Route path="/company/applications" element={
              user?.role === 'company' ? <CompanyApplicationsPage /> : <Navigate to="/login" />
            } />
            <Route path="/voice-search" element={<VoiceSearchPage user={user} />} />
            <Route path="/ar-navigate/:jobId" element={<ARNavigatePage user={user} />} />
            <Route path="/interviews" element={
              user?.role === 'seeker' ? <InterviewsPage role="seeker" /> : <Navigate to="/login" />
            } />
            <Route path="/company/interviews" element={
              user?.role === 'company' ? <InterviewsPage role="company" /> : <Navigate to="/login" />
            } />
            <Route path="/admin" element={
              <AdminGate user={user} />
            } />
          </Routes>
        </div>
      </main>

      <footer className="footer">
        <div className="container">
          <p>© 2024 都市服务业青年专属求职平台 | 聚焦餐饮、零售、物流行业</p>
          <p style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>
            信用体系 · 语音搜索 · AR导航 · AI舆情监控 · 电话录音存档
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
