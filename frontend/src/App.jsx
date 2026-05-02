import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import LoginPage from './pages/LoginPage';
import MFAPage from './pages/MFAPage';
import MainLayout from './layouts/MainLayout';
import DashboardPage from './pages/DashboardPage';
import OrganizationPage from './pages/OrganizationPage';
import UsersPage from './pages/UsersPage';
import AuditPage from './pages/AuditPage';
import MonitorPage from './pages/MonitorPage';
import ProfilePage from './pages/ProfilePage';

const PrivateRoute = ({ children }) => {
  const { user, token, loading } = useAuth();
  
  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingSpinner}></div>
        <p style={styles.loadingText}>加载中...</p>
      </div>
    );
  }
  
  if (!user || !token) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

function App() {
  const { user, token } = useAuth();

  return (
    <Routes>
      <Route 
        path="/login" 
        element={user && token ? <Navigate to="/dashboard" replace /> : <LoginPage />} 
      />
      <Route 
        path="/mfa" 
        element={<MFAPage />} 
      />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <MainLayout />
          </PrivateRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="organization" element={<OrganizationPage />} />
        <Route path="users" element={<UsersPage />} />
        <Route path="audit" element={<AuditPage />} />
        <Route path="monitor" element={<MonitorPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

const styles = {
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    backgroundColor: '#f5f7fa'
  },
  loadingSpinner: {
    width: '40px',
    height: '40px',
    border: '4px solid #e0e0e0',
    borderTopColor: '#1890ff',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  },
  loadingText: {
    marginTop: '16px',
    color: '#666',
    fontSize: '14px'
  }
};

const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;
document.head.appendChild(styleSheet);

export default App;
