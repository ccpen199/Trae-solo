import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, Spin } from 'antd';
import zhCN from 'antd/locale/zh_CN';

import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CreateTask from './pages/publisher/CreateTask';
import TaskBatches from './pages/publisher/TaskBatches';
import TaskHall from './pages/worker/TaskHall';
import MyTasks from './pages/worker/MyTasks';
import WalletPage from './pages/worker/WalletPage';
import { useAuthStore } from './store/authStore';

const LoadingSpinner = () => (
  <div style={{ textAlign: 'center', padding: '100px 0' }}>
    <Spin size="large" />
    <p style={{ marginTop: 16 }}>页面加载中...</p>
  </div>
);

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

const App: React.FC = () => {
  return (
    <ConfigProvider locale={zhCN}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="publisher/batches" element={<TaskBatches />} />
            <Route path="publisher/create" element={<CreateTask />} />
            <Route path="worker/tasks" element={<TaskHall />} />
            <Route path="worker/my-tasks" element={<MyTasks />} />
            <Route path="worker/wallet" element={<WalletPage />} />
            <Route path="expert/reviews" element={<Dashboard />} />
            <Route path="admin/users" element={<Dashboard />} />
            <Route path="admin/appeals" element={<Dashboard />} />
            <Route path="admin/audit" element={<Dashboard />} />
            <Route path="admin/statistics" element={<Dashboard />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ConfigProvider>
  );
};

export default App;
