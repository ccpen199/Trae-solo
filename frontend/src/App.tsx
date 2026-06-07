import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/auth';
import MainLayout from './components/Layout';
import HomePage from './pages/Home';
import JobListPage from './pages/JobList';
import JobDetailPage from './pages/JobDetail';
import LoginPage from './pages/Login';
import RegisterPage from './pages/Register';
import JobseekerProfile from './pages/jobseeker/Profile';
import JobseekerApplications from './pages/jobseeker/Applications';
import JobseekerInterviews from './pages/jobseeker/Interviews';
import HRDashboard from './pages/hr/Dashboard';
import HRJobManage from './pages/hr/JobManage';
import HRJobForm from './pages/hr/JobForm';
import HRApplications from './pages/hr/Applications';
import HRInterviews from './pages/hr/Interviews';
import AdminDashboard from './pages/admin/Dashboard';
import AdminRiskControl from './pages/admin/RiskControl';
import AdminAnalytics from './pages/admin/Analytics';

function App() {
  const token = useAuthStore((state) => state.token);
  const loadProfile = useAuthStore((state) => state.loadProfile);

  useEffect(() => {
    if (token) {
      loadProfile();
    }
  }, [token, loadProfile]);

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      
      <Route path="/" element={<MainLayout />}>
        <Route index element={<HomePage />} />
        <Route path="jobs" element={<JobListPage />} />
        <Route path="jobs/:id" element={<JobDetailPage />} />
        
        <Route path="jobseeker/profile" element={
          <ProtectedRoute roles={['jobseeker']}><JobseekerProfile /></ProtectedRoute>
        } />
        <Route path="jobseeker/applications" element={
          <ProtectedRoute roles={['jobseeker']}><JobseekerApplications /></ProtectedRoute>
        } />
        <Route path="jobseeker/interviews" element={
          <ProtectedRoute roles={['jobseeker']}><JobseekerInterviews /></ProtectedRoute>
        } />
        
        <Route path="hr/dashboard" element={
          <ProtectedRoute roles={['hr']}><HRDashboard /></ProtectedRoute>
        } />
        <Route path="hr/jobs" element={
          <ProtectedRoute roles={['hr']}><HRJobManage /></ProtectedRoute>
        } />
        <Route path="hr/jobs/new" element={
          <ProtectedRoute roles={['hr']}><HRJobForm /></ProtectedRoute>
        } />
        <Route path="hr/jobs/:id/edit" element={
          <ProtectedRoute roles={['hr']}><HRJobForm /></ProtectedRoute>
        } />
        <Route path="hr/applications" element={
          <ProtectedRoute roles={['hr']}><HRApplications /></ProtectedRoute>
        } />
        <Route path="hr/interviews" element={
          <ProtectedRoute roles={['hr']}><HRInterviews /></ProtectedRoute>
        } />
        
        <Route path="admin/dashboard" element={
          <ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>
        } />
        <Route path="admin/risk-control" element={
          <ProtectedRoute roles={['admin']}><AdminRiskControl /></ProtectedRoute>
        } />
        <Route path="admin/analytics" element={
          <ProtectedRoute roles={['admin']}><AdminAnalytics /></ProtectedRoute>
        } />
      </Route>
    </Routes>
  );
}

function ProtectedRoute({ children, roles }: { children: JSX.Element; roles: string[] }) {
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  
  if (!token) {
    return <Navigate to="/login" />;
  }
  
  if (user && !roles.includes(user.role)) {
    return <Navigate to="/" />;
  }
  
  return children;
}

export default App;
