import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import Home from '@/pages/Home';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import NotFound from '@/pages/NotFound';
import Forbidden from '@/pages/Forbidden';
import JobListPage from '@/pages/JobListPage';
import JobDetailPage from '@/pages/JobDetailPage';
import RadarPage from '@/pages/RadarPage';
import CompanyDetailPage from '@/pages/CompanyDetailPage';
import CommunityPage from '@/pages/CommunityPage';
import QuestionDetailPage from '@/pages/QuestionDetailPage';
import ReferralPage from '@/pages/ReferralPage';
import ReferralDetailPage from '@/pages/ReferralDetailPage';
import ToolsHomePage from '@/pages/ToolsHomePage';
import ResumeToolPage from '@/pages/ResumeToolPage';
import JournalToolPage from '@/pages/JournalToolPage';
import AssessmentPage from '@/pages/AssessmentPage';
import StudentProfilePage from '@/pages/StudentProfilePage';
import EnterpriseDashboard from '@/pages/EnterpriseDashboard';
import JobPublishPage from '@/pages/JobPublishPage';
import QualificationPage from '@/pages/QualificationPage';
import MePage from '@/pages/MePage';
import ApplicationsPage from '@/pages/ApplicationsPage';

function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-cream-100">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}

function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-hero-gradient">
      <Navbar />
      <main className="flex-1 flex items-center justify-center py-12">{children}</main>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            <PublicLayout>
              <Home />
            </PublicLayout>
          }
        />
        <Route
          path="/jobs"
          element={
            <PublicLayout>
              <JobListPage />
            </PublicLayout>
          }
        />
        <Route
          path="/jobs/:id"
          element={
            <PublicLayout>
              <JobDetailPage />
            </PublicLayout>
          }
        />
        <Route
          path="/company/:id"
          element={
            <PublicLayout>
              <CompanyDetailPage />
            </PublicLayout>
          }
        />
        <Route
          path="/radar"
          element={
            <PublicLayout>
              <RadarPage />
            </PublicLayout>
          }
        />
        <Route
          path="/community"
          element={
            <PublicLayout>
              <CommunityPage />
            </PublicLayout>
          }
        />
        <Route
          path="/community/:id"
          element={
            <PublicLayout>
              <QuestionDetailPage />
            </PublicLayout>
          }
        />
        <Route
          path="/referral"
          element={
            <PublicLayout>
              <ReferralPage />
            </PublicLayout>
          }
        />
        <Route
          path="/referral/:id"
          element={
            <PublicLayout>
              <ReferralDetailPage />
            </PublicLayout>
          }
        />
        <Route
          path="/tools"
          element={
            <PublicLayout>
              <ToolsHomePage />
            </PublicLayout>
          }
        />
        <Route
          path="/tools/resume"
          element={
            <PublicLayout>
              <ResumeToolPage />
            </PublicLayout>
          }
        />
        <Route
          path="/tools/journal"
          element={
            <PublicLayout>
              <JournalToolPage />
            </PublicLayout>
          }
        />
        <Route
          path="/tools/assessment"
          element={
            <PublicLayout>
              <AssessmentPage />
            </PublicLayout>
          }
        />
        <Route
          path="/student/profile"
          element={
            <PublicLayout>
              <StudentProfilePage />
            </PublicLayout>
          }
        />
        <Route
          path="/enterprise/dashboard"
          element={
            <PublicLayout>
              <EnterpriseDashboard />
            </PublicLayout>
          }
        />
        <Route
          path="/enterprise/publish"
          element={
            <PublicLayout>
              <JobPublishPage />
            </PublicLayout>
          }
        />
        <Route
          path="/enterprise/qualification"
          element={
            <PublicLayout>
              <QualificationPage />
            </PublicLayout>
          }
        />
        <Route
          path="/me"
          element={
            <PublicLayout>
              <MePage />
            </PublicLayout>
          }
        />
        <Route
          path="/me/applications"
          element={
            <PublicLayout>
              <ApplicationsPage />
            </PublicLayout>
          }
        />

        <Route
          path="/login"
          element={
            <AuthLayout>
              <Login />
            </AuthLayout>
          }
        />
        <Route
          path="/register"
          element={
            <AuthLayout>
              <Register />
            </AuthLayout>
          }
        />

        <Route
          path="/403"
          element={
            <PublicLayout>
              <Forbidden />
            </PublicLayout>
          }
        />
        <Route
          path="*"
          element={
            <PublicLayout>
              <NotFound />
            </PublicLayout>
          }
        />
      </Routes>
    </Router>
  );
}
