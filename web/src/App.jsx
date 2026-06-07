import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, App as AntApp } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import useAuthStore from './stores/auth';
import MainLayout from './layouts/MainLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Items from './pages/Items';
import ItemDetail from './pages/ItemDetail';
import Cases from './pages/Cases';
import CaseDetail from './pages/CaseDetail';
import Certificates from './pages/Certificates';
import Materials from './pages/Materials';
import Departments from './pages/Departments';
import Users from './pages/Users';
import Notifications from './pages/Notifications';
import Evaluations from './pages/Evaluations';
import Search from './pages/Search';
import Guide from './pages/Guide';

function ProtectedRoute({ children }) {
  const { isAuthenticated, authChecked } = useAuthStore();
  if (!authChecked) {
    return null;
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function AdminRoute({ children }) {
  const { isAuthenticated, user, authChecked } = useAuthStore();
  if (!authChecked) {
    return null;
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  if (user && user.role !== 'admin' && user.role !== 'super_admin') {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

function AuthInitializer({ children }) {
  const checkAuth = useAuthStore((s) => s.checkAuth);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return children;
}

export default function App() {
  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          colorPrimary: '#1890ff',
          borderRadius: 4,
        },
      }}
    >
      <AntApp>
        <BrowserRouter>
          <AuthInitializer>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
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
                <Route path="items" element={<Items />} />
                <Route path="items/create" element={<ItemDetail />} />
                <Route path="items/:id" element={<ItemDetail />} />
                <Route path="cases" element={<Cases />} />
                <Route path="cases/:id" element={<CaseDetail />} />
                <Route path="certificates" element={<Certificates />} />
                <Route path="materials" element={<Materials />} />
                <Route
                  path="departments"
                  element={
                    <AdminRoute>
                      <Departments />
                    </AdminRoute>
                  }
                />
                <Route
                  path="users"
                  element={
                    <AdminRoute>
                      <Users />
                    </AdminRoute>
                  }
                />
                <Route path="notifications" element={<Notifications />} />
                <Route path="evaluations" element={<Evaluations />} />
                <Route path="search" element={<Search />} />
                <Route path="guide" element={<Guide />} />
              </Route>
            </Routes>
          </AuthInitializer>
        </BrowserRouter>
      </AntApp>
    </ConfigProvider>
  );
}
