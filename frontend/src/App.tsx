import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import ProtectedRoute from '@/components/ProtectedRoute';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import Home from '@/pages/Home';
import Jobs from '@/pages/Jobs';
import JobDetail from '@/pages/JobDetail';
import JobCreate from '@/pages/JobCreate';
import MyApplications from '@/pages/MyApplications';
import Chat from '@/pages/Chat';
import Settlements from '@/pages/Settlements';
import RiskMap from '@/pages/RiskMap';
import University from '@/pages/University';
import AdminDashboard from '@/pages/AdminDashboard';
import AdminUsers from '@/pages/AdminUsers';
import AdminOpinionAlerts from '@/pages/AdminOpinionAlerts';
import AdminAuditLogs from '@/pages/AdminAuditLogs';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/home" replace />} />
          <Route path="home" element={<Home />} />
          <Route path="jobs" element={<Jobs />} />
          <Route path="jobs/:id" element={<JobDetail />} />
          <Route path="jobs/create" element={<JobCreate />} />
          <Route path="my-applications" element={<MyApplications />} />
          <Route path="chat" element={<Chat />} />
          <Route path="chat/:convId" element={<Chat />} />
          <Route path="settlements" element={<Settlements />} />
          <Route path="risk-map" element={<RiskMap />} />
          <Route path="university" element={<University />} />
          <Route path="admin/dashboard" element={<AdminDashboard />} />
          <Route path="admin/users" element={<AdminUsers />} />
          <Route path="admin/opinion-alerts" element={<AdminOpinionAlerts />} />
          <Route path="admin/audit-logs" element={<AdminAuditLogs />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
