import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { App as AntApp } from 'antd';
import { useAuthStore } from './store/auth';
import Login from './pages/Login';
import MainLayout from './components/MainLayout';
import Dashboard from './pages/Dashboard';
import DemandList from './pages/demand/List';
import DemandCreate from './pages/demand/Create';
import DemandDetail from './pages/demand/Detail';
import ContractList from './pages/contract/List';
import ContractDetail from './pages/contract/Detail';
import SupervisionList from './pages/supervision/List';
import ShowroomList from './pages/showroom/List';
import ShowroomDetail from './pages/showroom/Detail';
import GISMap from './pages/gis/Map';
import WorkOrderList from './pages/workorder/List';
import AdminDashboard from './pages/admin/Dashboard';
import ContractTracking from './pages/admin/ContractTracking';
import BomAnalysis from './pages/admin/BomAnalysis';
import WarrantyList from './pages/admin/WarrantyList';
import NPSStats from './pages/admin/NPSStats';
import UserList from './pages/admin/UserList';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  const hasValidSession = isAuthenticated && !!user;
  return hasValidSession ? <>{children}</> : <Navigate to="/login" replace />;
};

const App: React.FC = () => {
  const checkAuth = useAuthStore((state) => state.checkAuth);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const { notification, message } = AntApp.useApp();
  const [bootstrapped, setBootstrapped] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const cachedUser = localStorage.getItem('user');
    if (token && cachedUser && !isAuthenticated) {
      try {
        const parsed = JSON.parse(cachedUser);
        if (parsed && parsed.id && parsed.role) {
          useAuthStore.setState({
            token,
            user: parsed,
            isAuthenticated: true,
          });
        }
      } catch {}
    }
    setBootstrapped(true);
  }, []);

  useEffect(() => {
    if (isAuthenticated && user) {
      checkAuth().catch(() => {});
    }
  }, [isAuthenticated, user, checkAuth]);

  useEffect(() => {
    const handler = (e: any) => {
      const detail = e.detail || {};
      useAuthStore.setState({
        token: null,
        user: null,
        isAuthenticated: false,
      });
      logout();
      notification.error({
        message: '认证失效',
        description: detail.message || '登录状态已失效，请重新登录',
        duration: 4,
      });
      setTimeout(() => {
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }, 300);
    };
    window.addEventListener('auth:unauthorized', handler);
    return () => window.removeEventListener('auth:unauthorized', handler);
  }, [logout, notification]);

  if (!bootstrapped) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0f172a',
        color: '#94a3b8',
      }}>
        <span style={{ fontSize: 14 }}>家装产业协同SaaS平台 加载中...</span>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="demands" element={<DemandList />} />
        <Route path="demands/create" element={<DemandCreate />} />
        <Route path="demands/:id" element={<DemandDetail />} />
        <Route path="contracts" element={<ContractList />} />
        <Route path="contracts/:id" element={<ContractDetail />} />
        <Route path="supervision" element={<SupervisionList />} />
        <Route path="showroom" element={<ShowroomList />} />
        <Route path="showroom/:id" element={<ShowroomDetail />} />
        <Route path="gis" element={<GISMap />} />
        <Route path="workorders" element={<WorkOrderList />} />
        <Route path="admin/dashboard" element={<AdminDashboard />} />
        <Route path="admin/contracts" element={<ContractTracking />} />
        <Route path="admin/bom" element={<BomAnalysis />} />
        <Route path="admin/warranty" element={<WarrantyList />} />
        <Route path="admin/nps" element={<NPSStats />} />
        <Route path="admin/users" element={<UserList />} />
      </Route>
    </Routes>
  );
};

export default App;
