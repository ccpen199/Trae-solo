import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AppLayout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import VesselPlans from './pages/VesselPlans';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: 18
      }}>
        加载中...
      </div>
    );
  }
  
  return user ? children : <Navigate to="/login" replace />;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <AppLayout />
          </PrivateRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="vessel-plans" element={<VesselPlans />} />
        <Route path="vessel-plans/:id" element={<VesselPlans />} />
        <Route path="containers" element={<Dashboard />} />
        <Route path="tasks" element={<Dashboard />} />
        <Route path="yard" element={<Dashboard />} />
        <Route path="gate-appointments" element={<Dashboard />} />
        <Route path="exceptions" element={<Dashboard />} />
        <Route path="messages" element={<Dashboard />} />
      </Route>
    </Routes>
  );
};

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
