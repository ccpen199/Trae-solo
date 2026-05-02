import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from './store/auth';
import { UserRole } from './types';
import { Layout, PublicLayout } from './components/layout';
import { LoginPage, RegisterPage } from './pages/auth';
import { HomePage } from './pages/home';
import { ToursPage, TourDetailPage } from './pages/tours';
import { OrdersPage, OrderDetailPage } from './pages/orders';
import { GuideTasksPage, GuideReportPage, StatisticsPage } from './pages/guide';
import { GroupsPage, SettlementsPage, ProfilePage } from './pages/admin';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { isAuthenticated, user, isLoading } = useAuthStore();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

const AppRoutes: React.FC = () => {
  const { isAuthenticated, user, fetchCurrentUser } = useAuthStore();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token && isAuthenticated && !user) {
      fetchCurrentUser();
    }
  }, [isAuthenticated, user, fetchCurrentUser]);

  const isTourist = user?.role === UserRole.TOURIST;
  const isGuide = user?.role === UserRole.GUIDE;
  const isStaff = user && [UserRole.SALES, UserRole.ADMIN, UserRole.AGENCY].includes(user.role);

  const getLayout = () => {
    if (!isAuthenticated || isTourist) {
      return PublicLayout;
    }
    return Layout;
  };

  const LayoutComponent = getLayout();

  return (
    <LayoutComponent>
      <Routes>
        <Route path="/login" element={
          isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />
        } />
        <Route path="/register" element={
          isAuthenticated ? <Navigate to="/" replace /> : <RegisterPage />
        } />

        <Route path="/" element={<HomePage />} />
        <Route path="/tours" element={<ToursPage />} />
        <Route path="/tours/:id" element={<TourDetailPage />} />

        <Route path="/my-orders" element={
          <ProtectedRoute allowedRoles={[UserRole.TOURIST]}>
            <OrdersPage />
          </ProtectedRoute>
        } />
        <Route path="/my-orders/:id" element={
          <ProtectedRoute allowedRoles={[UserRole.TOURIST]}>
            <OrderDetailPage />
          </ProtectedRoute>
        } />

        <Route path="/orders" element={
          <ProtectedRoute allowedRoles={[UserRole.SALES, UserRole.ADMIN, UserRole.AGENCY]}>
            <OrdersPage />
          </ProtectedRoute>
        } />
        <Route path="/orders/:id" element={
          <ProtectedRoute allowedRoles={[UserRole.SALES, UserRole.ADMIN, UserRole.AGENCY]}>
            <OrderDetailPage />
          </ProtectedRoute>
        } />

        <Route path="/groups" element={
          <ProtectedRoute allowedRoles={[UserRole.SALES, UserRole.ADMIN, UserRole.AGENCY]}>
            <GroupsPage />
          </ProtectedRoute>
        } />

        <Route path="/settlements" element={
          <ProtectedRoute allowedRoles={[UserRole.SALES, UserRole.ADMIN, UserRole.AGENCY]}>
            <SettlementsPage />
          </ProtectedRoute>
        } />

        <Route path="/guide/tasks" element={
          <ProtectedRoute allowedRoles={[UserRole.GUIDE]}>
            <GuideTasksPage />
          </ProtectedRoute>
        } />
        <Route path="/guide/reports" element={
          <ProtectedRoute allowedRoles={[UserRole.GUIDE]}>
            <GuideReportPage />
          </ProtectedRoute>
        } />
        <Route path="/guide/reports/:groupId" element={
          <ProtectedRoute allowedRoles={[UserRole.GUIDE]}>
            <GuideReportPage />
          </ProtectedRoute>
        } />

        <Route path="/statistics" element={
          <ProtectedRoute allowedRoles={[UserRole.SALES, UserRole.ADMIN, UserRole.AGENCY]}>
            <StatisticsPage />
          </ProtectedRoute>
        } />

        <Route path="/profile" element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        } />

        <Route path="*" element={
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-6xl font-bold text-gray-300 mb-4">404</h1>
              <p className="text-xl text-gray-500 mb-8">页面不存在</p>
              <Navigate to="/" replace />
            </div>
          </div>
        } />
      </Routes>
    </LayoutComponent>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
};

export default App;
