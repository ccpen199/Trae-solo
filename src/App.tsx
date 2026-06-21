import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useAuthStore } from "@/store/auth.ts";
import Login from "@/pages/Login";
import StudentHome from "@/pages/student/Home";
import StudentDevices from "@/pages/student/Devices";
import StudentWatering from "@/pages/student/Watering";
import StudentBills from "@/pages/student/Bills";
import StudentRecharge from "@/pages/student/Recharge";
import InvestorDashboard from "@/pages/investor/Dashboard";
import InvestorDevices from "@/pages/investor/Devices";
import InvestorAnalytics from "@/pages/investor/Analytics";
import InvestorRevenue from "@/pages/investor/Revenue";
import AdminHome from "@/pages/admin/Home";
import AdminUsers from "@/pages/admin/Users";

function ProtectedRoute({ children, allowedRoles }: { children: JSX.Element; allowedRoles: string[] }) {
  const { isAuthenticated, user, init } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    init();
  }, [init]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    } else if (user && !allowedRoles.includes(user.role)) {
      if (user.role === 'student') navigate('/student');
      else if (user.role === 'investor') navigate('/investor');
      else if (user.role === 'admin') navigate('/admin');
    }
  }, [isAuthenticated, user, navigate, allowedRoles]);

  if (!isAuthenticated || !user || !allowedRoles.includes(user.role)) {
    return null;
  }

  return children;
}

function RoleRedirect() {
  const { user, init } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    init();
  }, [init]);

  useEffect(() => {
    if (user) {
      if (user.role === 'student') navigate('/student');
      else if (user.role === 'investor') navigate('/investor');
      else if (user.role === 'admin') navigate('/admin');
    } else {
      navigate('/login');
    }
  }, [user, navigate]);

  return null;
}

export default function App() {
  const { init } = useAuthStore();

  useEffect(() => {
    init();
  }, [init]);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<RoleRedirect />} />
        <Route path="/login" element={<Login />} />
        
        <Route path="/student" element={<ProtectedRoute allowedRoles={['student']}><StudentHome /></ProtectedRoute>} />
        <Route path="/student/devices" element={<ProtectedRoute allowedRoles={['student']}><StudentDevices /></ProtectedRoute>} />
        <Route path="/student/watering/:deviceId" element={<ProtectedRoute allowedRoles={['student']}><StudentWatering /></ProtectedRoute>} />
        <Route path="/student/bills" element={<ProtectedRoute allowedRoles={['student']}><StudentBills /></ProtectedRoute>} />
        <Route path="/student/recharge" element={<ProtectedRoute allowedRoles={['student']}><StudentRecharge /></ProtectedRoute>} />

        <Route path="/investor" element={<ProtectedRoute allowedRoles={['investor']}><InvestorDashboard /></ProtectedRoute>} />
        <Route path="/investor/devices" element={<ProtectedRoute allowedRoles={['investor']}><InvestorDevices /></ProtectedRoute>} />
        <Route path="/investor/analytics" element={<ProtectedRoute allowedRoles={['investor']}><InvestorAnalytics /></ProtectedRoute>} />
        <Route path="/investor/revenue" element={<ProtectedRoute allowedRoles={['investor']}><InvestorRevenue /></ProtectedRoute>} />

        <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminHome /></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['admin']}><AdminUsers /></ProtectedRoute>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
