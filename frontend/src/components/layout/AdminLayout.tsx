import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { UserRole } from '../types';

import MainLayout from '../components/layout/MainLayout';
import AdminLayout from '../components/layout/AdminLayout';

import HomePage from '../pages/user/HomePage';
import PostDetailPage from '../pages/user/PostDetailPage';
import CreatePostPage from '../pages/user/CreatePostPage';
import ProfilePage from '../pages/user/ProfilePage';
import GrowthPage from '../pages/user/GrowthPage';
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';

import ModeratorDashboard from '../pages/moderator/Dashboard';
import ModeratorPosts from '../pages/moderator/Posts';

import AuditorDashboard from '../pages/auditor/Dashboard';
import AuditorReports from '../pages/auditor/Reports';

import AdminDashboard from '../pages/admin/Dashboard';
import AdminUsers from '../pages/admin/Users';
import AdminAuditLogs from '../pages/admin/AuditLogs';
import AdminStats from '../pages/admin/Stats';

interface PrivateRouteProps {
  children: React.ReactNode;
  roles?: UserRole[];
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children, roles }) => {
  const { isAuthenticated, user, loading } = useAuthStore();
  const location = useLocation();

  if (loading) {
    return <div style={{ padding: '50px', textAlign: 'center' }}>加载中...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles && user && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

const AppRouter: React.FC = () => {
  const { checkAuth, loading } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  if (loading) {
    return <div style={{ padding: '50px', textAlign: 'center' }}>初始化中...</div>;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        
        <Route path="/" element={
          <PrivateRoute>
            <MainLayout />
          </PrivateRoute>
        }>
          <Route index element={<HomePage />} />
          <Route path="posts/create" element={<CreatePostPage />} />
          <Route path="posts/:id" element={<PostDetailPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="growth" element={<GrowthPage />} />
        </Route>

        <Route path="/moderator" element={
          <PrivateRoute roles={[UserRole.MODERATOR, UserRole.AUDITOR, UserRole.ADMIN]}>
            <AdminLayout />
          </PrivateRoute>
        }>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<ModeratorDashboard />} />
          <Route path="posts" element={<ModeratorPosts />} />
        </Route>

        <Route path="/auditor" element={
          <PrivateRoute roles={[UserRole.AUDITOR, UserRole.ADMIN]}>
            <AdminLayout />
          </PrivateRoute>
        }>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AuditorDashboard />} />
          <Route path="reports" element={<AuditorReports />} />
        </Route>

        <Route path="/admin" element={
          <PrivateRoute roles={[UserRole.ADMIN]}>
            <AdminLayout />
          </PrivateRoute>
        }>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="audit-logs" element={<AdminAuditLogs />} />
          <Route path="stats" element={<AdminStats />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default AppRouter;
