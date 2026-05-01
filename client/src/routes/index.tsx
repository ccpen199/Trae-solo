import React, { useEffect, useMemo } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';

import MainLayout from '@/layouts/MainLayout';
import LoginPage from '@/pages/Login';
import DashboardPage from '@/pages/Dashboard';
import CouponTemplatesPage from '@/pages/CouponTemplates';
import CouponDistributePage from '@/pages/CouponDistribute';
import MyCouponsPage from '@/pages/MyCoupons';
import OrdersPage from '@/pages/Orders';
import FinancePage from '@/pages/Finance';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRoles }) => {
  const { isAuthenticated, user, checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRoles && requiredRoles.length > 0) {
    if (!user || !requiredRoles.includes(user.role)) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <>{children}</>;
};

const AppRouter: React.FC = () => {
  const { isAuthenticated, checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            isAuthenticated ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <LoginPage />
            )
          }
        />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route
            path="coupons/templates"
            element={
              <ProtectedRoute requiredRoles={['admin', 'operator']}>
                <CouponTemplatesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="coupons/distribute"
            element={
              <ProtectedRoute requiredRoles={['admin', 'operator']}>
                <CouponDistributePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="coupons/my-coupons"
            element={
              <ProtectedRoute>
                <MyCouponsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="orders"
            element={
              <ProtectedRoute>
                <OrdersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="finance"
            element={
              <ProtectedRoute requiredRoles={['admin', 'finance']}>
                <FinancePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="finance/audit"
            element={
              <ProtectedRoute requiredRoles={['admin', 'finance']}>
                <FinancePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="system"
            element={
              <ProtectedRoute requiredRoles={['admin']}>
                <div style={{ padding: 24 }}>
                  <h2>系统设置</h2>
                  <p>功能开发中...</p>
                </div>
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;
