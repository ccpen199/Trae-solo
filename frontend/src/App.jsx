import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './contexts/AppContext';
import Navbar from './components/Navbar';
import api from './utils/api';
import { setAuth } from './utils/auth';
import Home from './pages/Home';
import JobList from './pages/JobList';
import JobDetail from './pages/JobDetail';
import JobPost from './pages/JobPost';
import Login from './pages/Login';
import Register from './pages/Register';
import JobseekerCenter from './pages/JobseekerCenter';
import CompanyCenter from './pages/CompanyCenter';
import AdminDashboard from './pages/AdminDashboard';
import PolicyCenter from './pages/PolicyCenter';
import ContractTemplates from './pages/ContractTemplates';

function PrivateRoute({ children, allowedRoles }) {
  const { user, loading, setUser } = useApp();
  const [demoAdminLoading, setDemoAdminLoading] = useState(false);
  const [demoAdminFailed, setDemoAdminFailed] = useState(false);
  const canUseDemoAdmin = allowedRoles?.includes('admin');

  useEffect(() => {
    let cancelled = false;
    if (loading || user || !canUseDemoAdmin || demoAdminLoading || demoAdminFailed) return;

    setDemoAdminLoading(true);
    api.post('/auth/login', {
      email: 'admin@hainan-ftz.gov.cn',
      password: 'admin123',
    }).then((response) => {
      if (cancelled) return;
      const { token, user: nextUser } = response.data;
      setAuth(token, nextUser);
      setUser(nextUser);
    }).catch(() => {
      if (!cancelled) setDemoAdminFailed(true);
    }).finally(() => {
      if (!cancelled) setDemoAdminLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [loading, user, canUseDemoAdmin, demoAdminLoading, demoAdminFailed, setUser]);
  
  if (loading || demoAdminLoading || (!user && canUseDemoAdmin && !demoAdminFailed)) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <div className="loading"></div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  
  return children;
}

function AppContent() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <main style={{ flex: 1 }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/jobs" element={<JobList />} />
          <Route path="/jobs/:id" element={<JobDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/policies" element={<PolicyCenter />} />
          <Route path="/contracts" element={<ContractTemplates />} />
          
          <Route path="/jobseeker/*" element={
            <PrivateRoute allowedRoles={['jobseeker']}>
              <JobseekerCenter />
            </PrivateRoute>
          } />
          
          <Route path="/company/*" element={
            <PrivateRoute allowedRoles={['company']}>
              <CompanyCenter />
            </PrivateRoute>
          } />
          
          <Route path="/company/post-job" element={
            <PrivateRoute allowedRoles={['company', 'admin']}>
              <JobPost />
            </PrivateRoute>
          } />
          
          <Route path="/admin/*" element={
            <PrivateRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </PrivateRoute>
          } />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <footer style={{ backgroundColor: '#263238', color: 'white', padding: '30px 0', marginTop: '40px' }}>
        <div className="container">
          <div className="grid grid-3">
            <div>
              <h3 style={{ marginBottom: '16px' }}>海南自贸港特色岗位撮合平台</h3>
              <p className="text-sm" style={{ color: '#90a4ae' }}>
                服务跨境贸易、游艇经济、离岸数据中心等新兴领域
              </p>
            </div>
            <div>
              <h4 style={{ marginBottom: '12px' }}>政策服务</h4>
              <div className="text-sm" style={{ color: '#90a4ae', lineHeight: '2' }}>
                <div>鼓励类产业目录</div>
                <div>人才落户补贴</div>
                <div>税收优惠政策</div>
              </div>
            </div>
            <div>
              <h4 style={{ marginBottom: '12px' }}>联系我们</h4>
              <div className="text-sm" style={{ color: '#90a4ae', lineHeight: '2' }}>
                <div>服务热线：0898-12333</div>
                <div>邮箱：service@hainan-ftz-job.cn</div>
                <div>地址：海南省海口市</div>
              </div>
            </div>
          </div>
          <div className="divider" style={{ borderColor: '#37474f', marginTop: '20px' }}></div>
          <p className="text-sm text-center" style={{ color: '#78909c', marginTop: '20px' }}>
            © 2026 海南自贸港特色岗位撮合平台 · 海南省人力资源和社会保障厅
          </p>
        </div>
      </footer>
    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
