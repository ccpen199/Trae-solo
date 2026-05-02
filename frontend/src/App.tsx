import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import MainLayout from './layout/MainLayout';
import LoginPage from './pages/Login';
import DashboardPage from './pages/Dashboard';
import PatientsPage from './pages/Patients';
import VisitsPage from './pages/Visits';
import PrescriptionsPage from './pages/Prescriptions';
import LabPage from './pages/Lab';
import ExceptionsPage from './pages/Exceptions';
import AuditPage from './pages/Audit';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout>
              <Navigate to="/dashboard" replace />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <MainLayout>
              <DashboardPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/patients"
        element={
          <ProtectedRoute>
            <MainLayout>
              <PatientsPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/visits"
        element={
          <ProtectedRoute>
            <MainLayout>
              <VisitsPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/prescriptions"
        element={
          <ProtectedRoute>
            <MainLayout>
              <PrescriptionsPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/lab"
        element={
          <ProtectedRoute>
            <MainLayout>
              <LabPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/exceptions"
        element={
          <ProtectedRoute>
            <MainLayout>
              <ExceptionsPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/audit"
        element={
          <ProtectedRoute>
            <MainLayout>
              <AuditPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/reports"
        element={
          <ProtectedRoute>
            <MainLayout>
              <div style={{ textAlign: 'center', padding: 50 }}>
                <h2>管理报表</h2>
                <p>此功能模块正在开发中...</p>
              </div>
            </MainLayout>
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export default App;
