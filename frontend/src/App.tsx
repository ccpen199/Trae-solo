import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import MainLayout from './layouts/MainLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ContentList from './pages/content/ContentList';
import ContentEditor from './pages/content/ContentEditor';
import MediaLibrary from './pages/media/MediaLibrary';
import ReviewCenter from './pages/workflow/ReviewCenter';
import WorkflowDetail from './pages/workflow/WorkflowDetail';
import DistributionList from './pages/distribution/DistributionList';
import DistributionSchedule from './pages/distribution/DistributionSchedule';
import AnalyticsDashboard from './pages/analytics/AnalyticsDashboard';
import AuditLogs from './pages/audit/AuditLogs';
import UserManagement from './pages/system/UserManagement';
import Profile from './pages/Profile';

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <MainLayout />
            </PrivateRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="content">
            <Route index element={<ContentList />} />
            <Route path="create" element={<ContentEditor />} />
            <Route path="edit/:id" element={<ContentEditor />} />
          </Route>
          <Route path="media" element={<MediaLibrary />} />
          <Route path="workflow">
            <Route index element={<ReviewCenter />} />
            <Route path=":id" element={<WorkflowDetail />} />
          </Route>
          <Route path="distribution">
            <Route index element={<DistributionList />} />
            <Route path="schedule" element={<DistributionSchedule />} />
          </Route>
          <Route path="analytics" element={<AnalyticsDashboard />} />
          <Route path="audit" element={<AuditLogs />} />
          <Route path="system">
            <Route path="users" element={<UserManagement />} />
          </Route>
          <Route path="profile" element={<Profile />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
