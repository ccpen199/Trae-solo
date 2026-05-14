import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './components/Toast';
import ErrorBoundary from './components/ErrorBoundary';
import Login from './pages/Login';
import Surveys from './pages/Surveys';
import SurveyDetail from './pages/SurveyDetail';
import Publish from './pages/Publish';
import Profile from './pages/Profile';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>加载中...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

const Navigation = () => {
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return null;
  }

  const navItems = [
    { path: '/surveys', label: '问卷', icon: '📋' },
    { path: '/publish', label: '发布', icon: '🚀' },
    { path: '/profile', label: '我的', icon: '👤' }
  ];

  return (
    <nav style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      background: '#fff',
      borderTop: '1px solid #f0f0f0',
      display: 'flex',
      zIndex: 100
    }}>
      {navItems.map(item => (
        <Link
          key={item.path}
          to={item.path}
          style={{
            flex: 1,
            padding: '12px 8px',
            textAlign: 'center',
            textDecoration: 'none',
            color: location.pathname === item.path ? '#667eea' : '#666',
            fontSize: '14px',
            borderTop: location.pathname === item.path ? '2px solid #667eea' : '2px solid transparent'
          }}
        >
          <div style={{ fontSize: '20px', marginBottom: '4px' }}>{item.icon}</div>
          <div>{item.label}</div>
        </Link>
      ))}
    </nav>
  );
};

const AppContent = () => {
  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', paddingBottom: '80px' }}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Navigate to="/surveys" replace />} />
        <Route path="/surveys" element={<ProtectedRoute><Surveys /></ProtectedRoute>} />
        <Route path="/survey/:id" element={<ProtectedRoute><SurveyDetail /></ProtectedRoute>} />
        <Route path="/publish" element={<ProtectedRoute><Publish /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/surveys" replace />} />
      </Routes>
      <Navigation />
    </div>
  );
};

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <ToastProvider>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </ToastProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
