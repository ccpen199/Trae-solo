import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AppLayout from './components/Layout';

import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Consultations, { ConsultationDetail } from './pages/Consultations';
import CreateConsultation from './pages/CreateConsultation';
import Lawyers from './pages/Lawyers';
import Cases from './pages/Cases';
import Wallet from './pages/Wallet';
import Disputes from './pages/Disputes';

const ProtectedRoute = ({ children, requiredRole = null }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>加载中...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user.role !== requiredRole) {
    if (requiredRole === 'support' && !['support', 'admin'].includes(user.role)) {
      return <Navigate to="/" replace />;
    }
  }

  return children;
};

const LawyerRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>加载中...</div>;
  }

  if (!user || user.role !== 'lawyer') {
    return <Navigate to="/" replace />;
  }

  return children;
};

const SupportRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>加载中...</div>;
  }

  if (!user || !['support', 'admin'].includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

const AppContent = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>加载中...</div>;
  }

  return (
    <Routes>
      <Route path="/login" element={
        user ? <Navigate to="/" replace /> : <Login />
      } />
      <Route path="/register" element={
        user ? <Navigate to="/" replace /> : <Register />
      } />
      
      <Route path="/" element={
        <AppLayout>
          <Home />
        </AppLayout>
      } />
      
      <Route path="/consultations" element={
        <ProtectedRoute>
          <AppLayout>
            <Consultations />
          </AppLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/consultations/create" element={
        <ProtectedRoute>
          <AppLayout>
            <CreateConsultation />
          </AppLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/consultations/:id" element={
        <ProtectedRoute>
          <AppLayout>
            <ConsultationDetail />
          </AppLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/lawyers" element={
        user ? (
          <AppLayout>
            <Lawyers />
          </AppLayout>
        ) : (
          <Navigate to="/login" replace />
        )
      } />
      
      <Route path="/cases" element={
        <AppLayout>
          <Cases />
        </AppLayout>
      } />
      
      <Route path="/wallet" element={
        <ProtectedRoute>
          <AppLayout>
            <Wallet />
          </AppLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/disputes" element={
        <SupportRoute>
          <AppLayout>
            <Disputes />
          </AppLayout>
        </SupportRoute>
      } />
      
      <Route path="*" element={
        <div style={{ padding: '40px', textAlign: 'center' }}>
          <h2>页面不存在</h2>
          <p>您访问的页面不存在或已被移除</p>
        </div>
      } />
    </Routes>
  );
};

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
};

export default App;
