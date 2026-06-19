import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAdminStore } from './store/adminStore';
import Login from './pages/Login';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import TaskManage from './pages/TaskManage';
import TaskROI from './pages/TaskROI';
import UserManage from './pages/UserManage';
import WithdrawalAudit from './pages/WithdrawalAudit';
import RiskCenter from './pages/RiskCenter';
import AdConfig from './pages/AdConfig';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const token = useAdminStore((s) => s.token);
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <Layout>
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/tasks" element={<TaskManage />} />
                <Route path="/task-roi" element={<TaskROI />} />
                <Route path="/users" element={<UserManage />} />
                <Route path="/withdrawals" element={<WithdrawalAudit />} />
                <Route path="/risk" element={<RiskCenter />} />
                <Route path="/ads" element={<AdConfig />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};

export default App;
