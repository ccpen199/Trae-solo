import { Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './components/Layout';
import Login from './components/Login';
import Register from './components/Register';
import LandingPage from './pages/LandingPage';
import Home from './pages/Home';
import JobList from './pages/enterprise/JobList';
import JobForm from './pages/enterprise/JobForm';
import ResumeParse from './pages/enterprise/ResumeParse';
import TalentRecommend from './pages/enterprise/TalentRecommend';
import InterviewManage from './pages/enterprise/InterviewManage';
import ResumeEditor from './pages/jobseeker/ResumeEditor';
import PortfolioManager from './pages/jobseeker/PortfolioManager';
import JobSquare from './pages/jobseeker/JobSquare';
import JobDetail from './pages/jobseeker/JobDetail';
import Community from './pages/jobseeker/Community';
import PostDetail from './pages/jobseeker/PostDetail';
import MyInterviews from './pages/jobseeker/MyInterviews';
import EnterpriseList from './pages/admin/EnterpriseList';
import CreditArchive from './pages/admin/CreditArchive';
import SensitiveWordManage from './pages/admin/SensitiveWordManage';
import WarningList from './pages/admin/WarningList';
import SystemStatistics from './pages/admin/SystemStatistics';
import { isLoggedIn, isEnterprise, isJobseeker, isAdmin } from './utils/auth';

const EnterpriseRoute = ({ children }: { children: React.ReactNode }) => {
  if (!isLoggedIn()) return <Navigate to="/login" replace />;
  if (!isEnterprise()) return <Navigate to="/" replace />;
  return <>{children}</>;
};

const JobseekerRoute = ({ children }: { children: React.ReactNode }) => {
  if (!isLoggedIn()) return <Navigate to="/login" replace />;
  if (!isJobseeker()) return <Navigate to="/" replace />;
  return <>{children}</>;
};

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  if (!isLoggedIn()) return <Navigate to="/login" replace />;
  if (!isAdmin()) return <Navigate to="/" replace />;
  return <>{children}</>;
};

const App = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/landing" element={<LandingPage />} />
      <Route
        path="/"
        element={isLoggedIn() ? <AppLayout /> : <LandingPage />}
      >
        <Route index element={isLoggedIn() ? <Home /> : <LandingPage />} />
      </Route>

      <Route path="/enterprise" element={<AppLayout />}>
        <Route
          path="jobs"
          element={
            <EnterpriseRoute>
              <JobList />
            </EnterpriseRoute>
          }
        />
        <Route
          path="jobs/new"
          element={
            <EnterpriseRoute>
              <JobForm />
            </EnterpriseRoute>
          }
        />
        <Route
          path="jobs/:id/edit"
          element={
            <EnterpriseRoute>
              <JobForm />
            </EnterpriseRoute>
          }
        />
        <Route
          path="resumes"
          element={
            <EnterpriseRoute>
              <ResumeParse />
            </EnterpriseRoute>
          }
        />
        <Route
          path="recommend"
          element={
            <EnterpriseRoute>
              <TalentRecommend />
            </EnterpriseRoute>
          }
        />
        <Route
          path="interviews"
          element={
            <EnterpriseRoute>
              <InterviewManage />
            </EnterpriseRoute>
          }
        />
      </Route>

      <Route path="/jobseeker" element={<AppLayout />}>
        <Route
          path="resume"
          element={
            <JobseekerRoute>
              <ResumeEditor />
            </JobseekerRoute>
          }
        />
        <Route
          path="portfolio"
          element={
            <JobseekerRoute>
              <PortfolioManager />
            </JobseekerRoute>
          }
        />
        <Route
          path="jobs"
          element={
            <JobseekerRoute>
              <JobSquare />
            </JobseekerRoute>
          }
        />
        <Route
          path="jobs/:id"
          element={
            <JobseekerRoute>
              <JobDetail />
            </JobseekerRoute>
          }
        />
        <Route
          path="community"
          element={
            <JobseekerRoute>
              <Community />
            </JobseekerRoute>
          }
        />
        <Route
          path="community/:id"
          element={
            <JobseekerRoute>
              <PostDetail />
            </JobseekerRoute>
          }
        />
        <Route
          path="interviews"
          element={
            <JobseekerRoute>
              <MyInterviews />
            </JobseekerRoute>
          }
        />
      </Route>

      <Route path="/admin" element={<AppLayout />}>
        <Route
          path="enterprises"
          element={
            <AdminRoute>
              <EnterpriseList />
            </AdminRoute>
          }
        />
        <Route
          path="credit/:companyId"
          element={
            <AdminRoute>
              <CreditArchive />
            </AdminRoute>
          }
        />
        <Route
          path="sensitive-words"
          element={
            <AdminRoute>
              <SensitiveWordManage />
            </AdminRoute>
          }
        />
        <Route
          path="warnings"
          element={
            <AdminRoute>
              <WarningList />
            </AdminRoute>
          }
        />
        <Route
          path="statistics"
          element={
            <AdminRoute>
              <SystemStatistics />
            </AdminRoute>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
