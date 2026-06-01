import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout.jsx';
import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import JobList from './pages/JobList.jsx';
import JobDetail from './pages/JobDetail.jsx';
import ResumeList from './pages/ResumeList.jsx';
import ResumeDetail from './pages/ResumeDetail.jsx';
import MyResumes from './pages/MyResumes.jsx';
import ResumeEditor from './pages/ResumeEditor.jsx';
import MyJobs from './pages/MyJobs.jsx';
import JobEditor from './pages/JobEditor.jsx';
import Chat from './pages/Chat.jsx';
import LiveList from './pages/LiveList.jsx';
import LiveRoom from './pages/LiveRoom.jsx';
import CommunityList from './pages/CommunityList.jsx';
import CommunityDetail from './pages/CommunityDetail.jsx';
import Applications from './pages/Applications.jsx';
import AdminDashboard from './pages/admin/Dashboard.jsx';
import AdminReports from './pages/admin/Reports.jsx';
import AdminVerifications from './pages/admin/Verifications.jsx';
import AdminUsers from './pages/admin/Users.jsx';

function PrivateRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();
  
  if (loading) return <div className="loading" style={{ padding: 40, textAlign: 'center' }}>加载中...</div>;
  
  if (!user) return <Navigate to="/login" replace />;
  
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }
  
  return children;
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="jobs" element={<JobList />} />
        <Route path="jobs/:id" element={<JobDetail />} />
        <Route path="resumes" element={<ResumeList />} />
        <Route path="resumes/:id" element={<ResumeDetail />} />
        <Route path="live" element={<LiveList />} />
        <Route path="live/:id" element={<LiveRoom />} />
        <Route path="communities" element={<CommunityList />} />
        <Route path="communities/:id" element={<CommunityDetail />} />
        
        <Route path="my/resumes" element={
          <PrivateRoute allowedRoles={['jobseeker']}><MyResumes /></PrivateRoute>
        } />
        <Route path="my/resumes/new" element={
          <PrivateRoute allowedRoles={['jobseeker']}><ResumeEditor /></PrivateRoute>
        } />
        <Route path="my/resumes/:id/edit" element={
          <PrivateRoute allowedRoles={['jobseeker']}><ResumeEditor /></PrivateRoute>
        } />
        
        <Route path="my/jobs" element={
          <PrivateRoute allowedRoles={['hr']}><MyJobs /></PrivateRoute>
        } />
        <Route path="my/jobs/new" element={
          <PrivateRoute allowedRoles={['hr']}><JobEditor /></PrivateRoute>
        } />
        <Route path="my/jobs/:id/edit" element={
          <PrivateRoute allowedRoles={['hr']}><JobEditor /></PrivateRoute>
        } />
        
        <Route path="applications" element={
          <PrivateRoute allowedRoles={['jobseeker', 'hr']}><Applications /></PrivateRoute>
        } />
        
        <Route path="chat" element={
          <PrivateRoute allowedRoles={['jobseeker', 'hr', 'admin']}><Chat /></PrivateRoute>
        } />
        <Route path="chat/:chatId" element={
          <PrivateRoute allowedRoles={['jobseeker', 'hr', 'admin']}><Chat /></PrivateRoute>
        } />
        
        <Route path="admin" element={
          <PrivateRoute allowedRoles={['admin']}><AdminDashboard /></PrivateRoute>
        } />
        <Route path="admin/reports" element={
          <PrivateRoute allowedRoles={['admin']}><AdminReports /></PrivateRoute>
        } />
        <Route path="admin/verifications" element={
          <PrivateRoute allowedRoles={['admin']}><AdminVerifications /></PrivateRoute>
        } />
        <Route path="admin/users" element={
          <PrivateRoute allowedRoles={['admin']}><AdminUsers /></PrivateRoute>
        } />
      </Route>
    </Routes>
  );
}

export default App;
