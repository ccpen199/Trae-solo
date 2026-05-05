import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import MainLayout from '../components/Layout/MainLayout';
import LoginPage from '../pages/LoginPage';

const DashboardPage = lazy(() => import('../pages/DashboardPage'));
const EmployeePage = lazy(() => import('../pages/EmployeePage'));
const DepartmentPage = lazy(() => import('../pages/DepartmentPage'));
const AttendancePage = lazy(() => import('../pages/AttendancePage'));
const SalaryPage = lazy(() => import('../pages/SalaryPage'));
const TrainingPage = lazy(() => import('../pages/TrainingPage'));
const TransferPage = lazy(() => import('../pages/TransferPage'));
const RewardPunishmentPage = lazy(() => import('../pages/RewardPunishmentPage'));
const SearchPage = lazy(() => import('../pages/SearchPage'));
const UserPage = lazy(() => import('../pages/UserPage'));

const LoadingFallback = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
    加载中...
  </div>
);

const PrivateRoute: React.FC<{ children: React.ReactNode; requireAdmin?: boolean }> = ({ children, requireAdmin = false }) => {
  const { user, isLoading, isAdmin } = useAuth();

  if (isLoading) {
    return <div>加载中...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

const AppRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/"
              element={
                <PrivateRoute>
                  <MainLayout />
                </PrivateRoute>
              }
            >
              <Route index element={<DashboardPage />} />
              <Route path="employees" element={<EmployeePage />} />
              <Route
                path="departments"
                element={
                  <PrivateRoute requireAdmin>
                    <DepartmentPage />
                  </PrivateRoute>
                }
              />
              <Route path="attendances" element={<AttendancePage />} />
              <Route path="salaries" element={<SalaryPage />} />
              <Route path="trainings" element={<TrainingPage />} />
              <Route path="transfers" element={<TransferPage />} />
              <Route path="reward-punishments" element={<RewardPunishmentPage />} />
              <Route path="search" element={<SearchPage />} />
              <Route
                path="users"
                element={
                  <PrivateRoute requireAdmin>
                    <UserPage />
                  </PrivateRoute>
                }
              />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default AppRouter;
