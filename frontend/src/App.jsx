import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './store/authStore';
import MainLayout from './components/Layout/MainLayout.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Home from './pages/Home.jsx';
import JobDetail from './pages/JobDetail.jsx';
import SeekerProfile from './pages/seeker/SeekerProfile.jsx';
import SeekerResume from './pages/seeker/SeekerResume.jsx';
import SeekerCertificates from './pages/seeker/SeekerCertificates.jsx';
import SeekerApplications from './pages/seeker/SeekerApplications.jsx';
import EnterpriseDashboard from './pages/enterprise/EnterpriseDashboard.jsx';
import EnterpriseJobs from './pages/enterprise/EnterpriseJobs.jsx';
import EnterpriseApplications from './pages/enterprise/EnterpriseApplications.jsx';
import EnterpriseInterviews from './pages/enterprise/EnterpriseInterviews.jsx';
import EnterpriseTemplates from './pages/enterprise/EnterpriseTemplates.jsx';
import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import AdminEnterprises from './pages/admin/AdminEnterprises.jsx';
import AdminAuditLogs from './pages/admin/AdminAuditLogs.jsx';
import DataDashboard from './pages/DataDashboard.jsx';
import ResumeView from './pages/ResumeView.jsx';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, token } = useAuthStore();
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  
  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

function App() {
  const setUserFromStorage = useAuthStore((s) => s.setUserFromStorage);
  const getCurrentUser = useAuthStore((s) => s.getCurrentUser);
  const token = useAuthStore((s) => s.token);

  useEffect(() => {
    setUserFromStorage();
    if (token) {
      getCurrentUser();
    }
  }, [token]);

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/" element={<MainLayout />}>
        <Route index element={<Home />} />
        <Route path="jobs/:id" element={<JobDetail />} />
        <Route path="resume/:id" element={<ResumeView />} />
        <Route path="dashboard" element={
          <ProtectedRoute allowedRoles={['admin', 'hr', 'jobseeker']}>
            <DataDashboard />
          </ProtectedRoute>
        } />
        <Route path="seeker/profile" element={
          <ProtectedRoute allowedRoles={['jobseeker']}>
            <SeekerProfile />
          </ProtectedRoute>
        } />
        <Route path="seeker/resume" element={
          <ProtectedRoute allowedRoles={['jobseeker']}>
            <SeekerResume />
          </ProtectedRoute>
        } />
        <Route path="seeker/certificates" element={
          <ProtectedRoute allowedRoles={['jobseeker']}>
            <SeekerCertificates />
          </ProtectedRoute>
        } />
        <Route path="seeker/applications" element={
          <ProtectedRoute allowedRoles={['jobseeker']}>
            <SeekerApplications />
          </ProtectedRoute>
        } />
        <Route path="enterprise/dashboard" element={
          <ProtectedRoute allowedRoles={['hr', 'admin']}>
            <EnterpriseDashboard />
          </ProtectedRoute>
        } />
        <Route path="enterprise/jobs" element={
          <ProtectedRoute allowedRoles={['hr', 'admin']}>
            <EnterpriseJobs />
          </ProtectedRoute>
        } />
        <Route path="enterprise/applications" element={
          <ProtectedRoute allowedRoles={['hr', 'admin']}>
            <EnterpriseApplications />
          </ProtectedRoute>
        } />
        <Route path="enterprise/interviews" element={
          <ProtectedRoute allowedRoles={['hr', 'admin']}>
            <EnterpriseInterviews />
          </ProtectedRoute>
        } />
        <Route path="enterprise/templates" element={
          <ProtectedRoute allowedRoles={['hr', 'admin']}>
            <EnterpriseTemplates />
          </ProtectedRoute>
        } />
        <Route path="admin/dashboard" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        } />
        <Route path="admin/enterprises" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminEnterprises />
          </ProtectedRoute>
        } />
        <Route path="admin/audit-logs" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminAuditLogs />
          </ProtectedRoute>
        } />
      </Route>
    </Routes>
  );
}

export default App;
