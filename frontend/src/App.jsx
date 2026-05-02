import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginPage from './pages/LoginPage';
import ResidentDashboard from './pages/ResidentDashboard';
import RiderDashboard from './pages/RiderDashboard';
import CenterDashboard from './pages/CenterDashboard';
import OperatorDashboard from './pages/OperatorDashboard';
import OrderDetailPage from './pages/OrderDetailPage';

const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        加载中...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to={`/${user.role}`} replace />;
  }

  return children;
};

const RoleRedirect = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        加载中...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to={`/${user.role}`} replace />;
};

const AppContent = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<RoleRedirect />} />
      
      <Route 
        path="/resident/*" 
        element={
          <ProtectedRoute requiredRole="resident">
            <Routes>
              <Route path="/" element={<ResidentDashboard />} />
              <Route path="/order/:orderId" element={<OrderDetailPage />} />
            </Routes>
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/rider/*" 
        element={
          <ProtectedRoute requiredRole="rider">
            <Routes>
              <Route path="/" element={<RiderDashboard />} />
              <Route path="/order/:orderId" element={<OrderDetailPage />} />
            </Routes>
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/center/*" 
        element={
          <ProtectedRoute requiredRole="center">
            <Routes>
              <Route path="/" element={<CenterDashboard />} />
              <Route path="/order/:orderId" element={<OrderDetailPage />} />
            </Routes>
          </ProtectedRoute>
        } 
      />
      
      <Route 
        path="/operator/*" 
        element={
          <ProtectedRoute requiredRole="operator">
            <Routes>
              <Route path="/" element={<OperatorDashboard />} />
              <Route path="/order/:orderId" element={<OrderDetailPage />} />
            </Routes>
          </ProtectedRoute>
        } 
      />
      
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;
