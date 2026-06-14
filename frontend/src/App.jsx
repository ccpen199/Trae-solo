import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import MainLayout from './components/Layout/MainLayout';
import LoginLayout from './components/Layout/LoginLayout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Profile from './pages/user/Profile';
import Accounts from './pages/insurance/Accounts';
import Registrations from './pages/insurance/Registrations';
import Certifications from './pages/insurance/Certifications';
import Transfers from './pages/insurance/Transfers';
import Certificates from './pages/insurance/Certificates';
import Jobs from './pages/employment/Jobs';
import JobDetail from './pages/employment/JobDetail';
import Resume from './pages/employment/Resume';
import Applications from './pages/employment/Applications';
import JobFairs from './pages/employment/JobFairs';
import Training from './pages/employment/Training';
import ExamAnnouncements from './pages/exam/Announcements';
import ExamRegistrations from './pages/exam/Registrations';
import ExamTickets from './pages/exam/Tickets';
import ExamResults from './pages/exam/Results';
import ExamCertificates from './pages/exam/Certificates';
import PolicyList from './pages/policy/PolicyList';
import PolicyDetail from './pages/policy/PolicyDetail';
import Consultation from './pages/policy/Consultation';
import FAQ from './pages/policy/FAQ';
import KnowledgeGraph from './pages/policy/KnowledgeGraph';
import AnalyticsDashboard from './pages/analytics/Dashboard';
import TimeMonitoring from './pages/analytics/TimeMonitoring';
import Satisfaction from './pages/analytics/Satisfaction';
import Heatmap from './pages/analytics/Heatmap';
import AuditLogs from './pages/analytics/AuditLogs';

const ModulePlaceholder = ({ title }) => (
  <div style={{ padding: 24, textAlign: 'center' }}>
    <h2>{title}</h2>
    <p style={{ color: '#999' }}>该模块正在开发中...</p>
  </div>
);

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<LoginLayout />}>
            <Route path="/login" element={<Login />} />
          </Route>

          <Route
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/insurance/accounts" element={<Accounts />} />
            <Route path="/insurance/registrations" element={<Registrations />} />
            <Route path="/insurance/certifications" element={<Certifications />} />
            <Route path="/insurance/transfers" element={<Transfers />} />
            <Route path="/insurance/certificates" element={<Certificates />} />
            <Route path="/insurance/*" element={<ModulePlaceholder title="社保服务" />} />
            <Route path="/employment/jobs" element={<Jobs />} />
            <Route path="/employment/jobs/:id" element={<JobDetail />} />
            <Route path="/employment/resume" element={<Resume />} />
            <Route path="/employment/applications" element={<Applications />} />
            <Route path="/employment/fairs" element={<JobFairs />} />
            <Route path="/employment/training" element={<Training />} />
            <Route path="/employment/*" element={<ModulePlaceholder title="就业服务" />} />
            <Route path="/exam/announcements" element={<ExamAnnouncements />} />
            <Route path="/exam/registrations" element={<ExamRegistrations />} />
            <Route path="/exam/tickets" element={<ExamTickets />} />
            <Route path="/exam/results" element={<ExamResults />} />
            <Route path="/exam/certificates" element={<ExamCertificates />} />
            <Route path="/exam/*" element={<ModulePlaceholder title="人事考试" />} />
            <Route path="/policy/list" element={<PolicyList />} />
            <Route path="/policy/list/:id" element={<PolicyDetail />} />
            <Route path="/policy/consult" element={<Consultation />} />
            <Route path="/policy/faq" element={<FAQ />} />
            <Route path="/policy/graph" element={<KnowledgeGraph />} />
            <Route path="/policy/*" element={<ModulePlaceholder title="政策咨询" />} />
            <Route
              path="/analytics/dashboard"
              element={
                <ProtectedRoute permission="analytics:view">
                  <AnalyticsDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/analytics/time-monitoring"
              element={
                <ProtectedRoute permission="analytics:view">
                  <TimeMonitoring />
                </ProtectedRoute>
              }
            />
            <Route
              path="/analytics/satisfaction"
              element={
                <ProtectedRoute permission="analytics:view">
                  <Satisfaction />
                </ProtectedRoute>
              }
            />
            <Route
              path="/analytics/heatmap"
              element={
                <ProtectedRoute permission="analytics:view">
                  <Heatmap />
                </ProtectedRoute>
              }
            />
            <Route
              path="/analytics/audit-logs"
              element={
                <ProtectedRoute permission="analytics:view">
                  <AuditLogs />
                </ProtectedRoute>
              }
            />
            <Route
              path="/analytics/*"
              element={
                <ProtectedRoute permission="analytics:view">
                  <ModulePlaceholder title="运营管理" />
                </ProtectedRoute>
              }
            />
            <Route path="/user/profile" element={<Profile />} />
          </Route>

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
