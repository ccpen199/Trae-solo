import React from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/auth';
import LoginPage from '@/pages/LoginPage';
import TasksPage from '@/pages/TasksPage';
import TaskDetailPage from '@/pages/TaskDetailPage';
import StatsPage from '@/pages/StatsPage';
import ProfilePage from '@/pages/ProfilePage';
import { HomeOutlined, BarChartOutlined, UserOutlined, InboxOutlined } from '@ant-design/icons';

const Protected: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const token = useAuthStore(s => s.token);
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const Nav: React.FC = () => {
  const navigate = useNavigate();
  const loc = useLocation();
  const items = [
    { key: '/', icon: <InboxOutlined />, label: '工单' },
    { key: '/stats', icon: <BarChartOutlined />, label: '绩效' },
    { key: '/profile', icon: <UserOutlined />, label: '我的' },
  ];
  if (['/task/'].some(p => loc.pathname.startsWith(p))) return null;
  return (
    <div className="bottom-nav-courier">
      {items.map(n => (
        <div key={n.key} className={`nav-item ${loc.pathname === n.key ? 'active' : ''}`} onClick={() => navigate(n.key)}>
          <div style={{ fontSize: 20, marginBottom: 2 }}>{n.icon}</div>{n.label}
        </div>
      ))}
    </div>
  );
};

const ProtectedRoutes: React.FC = () => (
  <Protected>
    <>
      <Routes>
        <Route path="/" element={<TasksPage />} />
        <Route path="/task/:id" element={<TaskDetailPage />} />
        <Route path="/stats" element={<StatsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Routes>
      <Nav />
    </>
  </Protected>
);

const App: React.FC = () => (
  <div className="courier-app" style={{ paddingBottom: 64 }}>
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/*" element={<ProtectedRoutes />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </div>
);

export default App;
