import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store';
import Login from '@/pages/Login';
import Scheduling from '@/pages/Scheduling';
import ConfigManagement from '@/pages/ConfigManagement';
import Reports from '@/pages/Reports';
import UserManagement from '@/pages/UserManagement';
import Layout from '@/components/Layout';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token } = useAuthStore();
  return token ? <>{children}</> : <Navigate to="/login" replace />;
};

const App: React.FC = () => {
  return (
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
          <Route index element={<Navigate to="/scheduling" replace />} />
          <Route path="scheduling" element={<Scheduling />} />
          <Route path="configs" element={<ConfigManagement />} />
          <Route path="reports" element={<Reports />} />
          <Route path="users" element={<UserManagement />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
