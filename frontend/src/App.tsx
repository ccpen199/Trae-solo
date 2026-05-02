import React, { createContext, useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, App as AntdApp } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { useAuth, User } from './store/auth';
import { LoginPage } from './pages/Login';
import { CitizenLayout } from './layouts/CitizenLayout';
import { AuditorLayout } from './layouts/AuditorLayout';
import { WindowLayout } from './layouts/WindowLayout';
import { AdminLayout } from './layouts/AdminLayout';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  hasRole: (role: string | string[]) => boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within AuthProvider');
  }
  return context;
};

const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const auth = useAuth();
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
};

const ProtectedRoute: React.FC<{
  children: React.ReactNode;
  roles?: string[];
}> = ({ children, roles }) => {
  const { user, loading, isAuthenticated } = useAuthContext();

  if (loading) {
    return <div>加载中...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (roles && user && !roles.includes(user.role)) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const RoleBasedHome: React.FC = () => {
  const { user } = useAuthContext();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  switch (user.role) {
    case 'CITIZEN':
      return <Navigate to="/citizen" replace />;
    case 'AUDITOR':
      return <Navigate to="/auditor" replace />;
    case 'WINDOW_STAFF':
      return <Navigate to="/window" replace />;
    case 'ADMIN':
      return <Navigate to="/admin" replace />;
    default:
      return <Navigate to="/login" replace />;
  }
};

const AppContent: React.FC = () => {
  const auth = useAuthContext();

  if (auth.loading) {
    return <div style={{ padding: '50px', textAlign: 'center' }}>系统加载中...</div>;
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          auth.isAuthenticated ? (
            <RoleBasedHome />
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
      <Route
        path="/citizen/*"
        element={
          <ProtectedRoute roles={['CITIZEN']}>
            <CitizenLayout />
          </ProtectedRoute>
        }
      />
      <Route
        path="/auditor/*"
        element={
          <ProtectedRoute roles={['AUDITOR']}>
            <AuditorLayout />
          </ProtectedRoute>
        }
      />
      <Route
        path="/window/*"
        element={
          <ProtectedRoute roles={['WINDOW_STAFF']}>
            <WindowLayout />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/*"
        element={
          <ProtectedRoute roles={['ADMIN']}>
            <AdminLayout />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};

export const App: React.FC = () => {
  return (
    <ConfigProvider locale={zhCN}>
      <AntdApp>
        <BrowserRouter>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </BrowserRouter>
      </AntdApp>
    </ConfigProvider>
  );
};
