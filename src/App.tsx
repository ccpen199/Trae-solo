import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Home from '@/pages/Home';
import Login from '@/pages/Login';
import JobDetail from '@/pages/JobDetail';
import MatchResult from '@/pages/MatchResult';
import Layout from '@/components/Layout';
import { useAuthStore } from '@/store/auth';
import StudentLayout from '@/pages/student/StudentLayout';
import StudentProfile from '@/pages/student/StudentProfile';
import StudentSchedule from '@/pages/student/StudentSchedule';
import StudentApplications from '@/pages/student/StudentApplications';
import StudentWallet from '@/pages/student/StudentWallet';
import StudentCertificate from '@/pages/student/StudentCertificate';
import CompanyLayout from '@/pages/company/CompanyLayout';
import CompanyProfile from '@/pages/company/CompanyProfile';
import CompanyJobs from '@/pages/company/CompanyJobs';
import CompanyJobNew from '@/pages/company/CompanyJobNew';
import CompanyCandidates from '@/pages/company/CompanyCandidates';
import CompanyPayroll from '@/pages/company/CompanyPayroll';
import MessageList from '@/pages/messages/MessageList';
import AdminLayout from '@/pages/admin/AdminLayout';
import AdminDashboard from '@/pages/admin/AdminDashboard';
import SchoolMonitor from '@/pages/admin/SchoolMonitor';
import ComplaintList from '@/pages/admin/ComplaintList';

function ProtectedRoute({ children, requiredRole }: { children: React.ReactNode; requiredRole?: string }) {
  const { token, userRole } = useAuthStore();
  const location = useLocation();

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRole && userRole !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route
        path="/"
        element={
          <Layout>
            <Home />
          </Layout>
        }
      />

      <Route
        path="/jobs/:id"
        element={
          <Layout>
            <JobDetail />
          </Layout>
        }
      />

      <Route
        path="/match"
        element={
          <ProtectedRoute>
            <Layout>
              <MatchResult />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/student/*"
        element={
          <ProtectedRoute requiredRole="student">
            <Layout>
              <StudentLayout />
            </Layout>
          </ProtectedRoute>
        }
      >
        <Route path="profile" element={<StudentProfile />} />
        <Route path="schedule" element={<StudentSchedule />} />
        <Route path="applications" element={<StudentApplications />} />
        <Route path="wallet" element={<StudentWallet />} />
        <Route path="certificate" element={<StudentCertificate />} />
        <Route path="" element={<Navigate to="/student/profile" replace />} />
      </Route>

      <Route
        path="/company/*"
        element={
          <ProtectedRoute requiredRole="company">
            <Layout>
              <CompanyLayout />
            </Layout>
          </ProtectedRoute>
        }
      >
        <Route path="profile" element={<CompanyProfile />} />
        <Route path="jobs" element={<CompanyJobs />} />
        <Route path="jobs/new" element={<CompanyJobNew />} />
        <Route path="candidates" element={<CompanyCandidates />} />
        <Route path="payroll" element={<CompanyPayroll />} />
        <Route path="" element={<Navigate to="/company/jobs" replace />} />
      </Route>

      <Route
        path="/messages"
        element={
          <ProtectedRoute>
            <Layout>
              <MessageList />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/messages/:id"
        element={
          <ProtectedRoute>
            <Layout>
              <MessageList />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/*"
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="schools" element={<SchoolMonitor />} />
        <Route path="complaints" element={<ComplaintList />} />
        <Route path="" element={<Navigate to="/admin/dashboard" replace />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}
