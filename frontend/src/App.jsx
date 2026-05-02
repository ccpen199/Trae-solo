import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Repositories from './pages/Repositories';
import RepositoryDetail from './pages/RepositoryDetail';
import MergeRequests from './pages/MergeRequests';
import MergeRequestDetail from './pages/MergeRequestDetail';
import Pipelines from './pages/Pipelines';
import Messages from './pages/Messages';
import Audit from './pages/Audit';

const ProtectedRoute = ({ children, requiredRoles }) => {
  const { isAuthenticated, hasPermission, loading } = useAuth();

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>加载中...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRoles && !hasPermission(requiredRoles)) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h2>权限不足</h2>
        <p>您没有权限访问此页面</p>
      </div>
    );
  }

  return children;
};

const AppRoutes = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>加载中...</div>;
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />}
      />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route
          path="dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="repositories"
          element={
            <ProtectedRoute requiredRoles={['developer', 'reviewer', 'devops', 'admin']}>
              <Repositories />
            </ProtectedRoute>
          }
        />
        <Route
          path="repositories/:id"
          element={
            <ProtectedRoute requiredRoles={['developer', 'reviewer', 'devops', 'admin']}>
              <RepositoryDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="merge-requests"
          element={
            <ProtectedRoute requiredRoles={['developer', 'reviewer', 'devops', 'admin']}>
              <MergeRequests />
            </ProtectedRoute>
          }
        />
        <Route
          path="merge-requests/:id"
          element={
            <ProtectedRoute requiredRoles={['developer', 'reviewer', 'devops', 'admin']}>
              <MergeRequestDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="pipelines"
          element={
            <ProtectedRoute requiredRoles={['devops', 'admin']}>
              <Pipelines />
            </ProtectedRoute>
          }
        />
        <Route
          path="messages"
          element={
            <ProtectedRoute requiredRoles={['developer', 'reviewer', 'devops', 'admin']}>
              <Messages />
            </ProtectedRoute>
          }
        />
        <Route
          path="audit"
          element={
            <ProtectedRoute requiredRoles={['admin']}>
              <Audit />
            </ProtectedRoute>
          }
        />
      </Route>
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;
