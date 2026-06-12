import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAppStore } from './store';
import MainLayout from './layouts/MainLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Resumes from './pages/Resumes';
import ResumeDetail from './pages/ResumeDetail';
import ResumeForm from './pages/ResumeForm';
import Jobs from './pages/Jobs';
import JobDetail from './pages/JobDetail';
import JobForm from './pages/JobForm';
import Matching from './pages/Matching';
import Community from './pages/Community';
import CommunityTopic from './pages/CommunityTopic';
import CommunityModeration from './pages/CommunityModeration';
import Chat from './pages/Chat';
import Leads from './pages/Leads';
import BusinessCard from './pages/BusinessCard';
import PushEngine from './pages/PushEngine';
import Courses from './pages/Courses';
import CourseDetail from './pages/CourseDetail';
import CourseForm from './pages/CourseForm';
import MyLearning from './pages/MyLearning';
import Certificates from './pages/Certificates';
import Users from './pages/Users';
import AuditLogs from './pages/AuditLogs';
import Profile from './pages/Profile';
import Notifications from './pages/Notifications';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = useAppStore(s => s.token);
  const location = useLocation();
  if (!token) return <Navigate to="/login" replace state={{ from: location }} />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="resumes" element={<Resumes />} />
        <Route path="resumes/new" element={<ResumeForm />} />
        <Route path="resumes/:id" element={<ResumeDetail />} />
        <Route path="resumes/:id/edit" element={<ResumeForm />} />
        <Route path="jobs" element={<Jobs />} />
        <Route path="jobs/new" element={<JobForm />} />
        <Route path="jobs/:id" element={<JobDetail />} />
        <Route path="jobs/:id/edit" element={<JobForm />} />
        <Route path="matching" element={<Matching />} />
        <Route path="community" element={<Community />} />
        <Route path="community/topics/:id" element={<CommunityTopic />} />
        <Route path="community/moderation" element={<CommunityModeration />} />
        <Route path="chat" element={<Chat />} />
        <Route path="leads" element={<Leads />} />
        <Route path="business-card" element={<BusinessCard />} />
        <Route path="push-engine" element={<PushEngine />} />
        <Route path="courses" element={<Courses />} />
        <Route path="courses/new" element={<CourseForm />} />
        <Route path="courses/:id" element={<CourseDetail />} />
        <Route path="courses/:id/edit" element={<CourseForm />} />
        <Route path="my-learning" element={<MyLearning />} />
        <Route path="certificates" element={<Certificates />} />
        <Route path="users" element={<Users />} />
        <Route path="audit-logs" element={<AuditLogs />} />
        <Route path="profile" element={<Profile />} />
        <Route path="notifications" element={<Notifications />} />
      </Route>
    </Routes>
  );
}
