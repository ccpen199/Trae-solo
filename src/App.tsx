import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { useEffect, useCallback } from "react";
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
import { Loader2 } from 'lucide-react';

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-water-texture-dark flex items-center justify-center">
      <div className="text-center">
        <Loader2 size={48} className="text-aqua-400 animate-spin mx-auto mb-4" />
        <p className="text-aqua-200 font-medium">正在加载...</p>
      </div>
    </div>
  );
}

function ProtectedRoute({ children, allowedRoles }: { children: JSX.Element; allowedRoles: string[] }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const isInitialized = useAuthStore((s) => s.isInitialized);
  const init = useAuthStore((s) => s.init);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isInitialized) init();
  }, [isInitialized, init]);

  const checkAndRedirect = useCallback(() => {
    if (!isInitialized) return;
    if (!isAuthenticated) {
      navigate('/login', { replace: true });
      return;
    }
    if (user && !allowedRoles.includes(user.role)) {
      const routes: Record<string, string> = {
        student: '/student',
        investor: '/investor',
        admin: '/admin',
      };
      navigate(routes[user.role] || '/login', { replace: true });
    }
  }, [isInitialized, isAuthenticated, user, allowedRoles, navigate]);

  useEffect(() => {
    checkAndRedirect();
  }, [checkAndRedirect]);

  if (!isInitialized) return <LoadingScreen />;
  if (!isAuthenticated || !user || !allowedRoles.includes(user.role)) return null;
  return children;
}

function RoleRedirect() {
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isInitialized = useAuthStore((s) => s.isInitialized);
  const init = useAuthStore((s) => s.init);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isInitialized) init();
  }, [isInitialized, init]);

  useEffect(() => {
    if (!isInitialized) return;
    if (isAuthenticated && user) {
      const routes: Record<string, string> = {
        student: '/student',
        investor: '/investor',
        admin: '/admin',
      };
      navigate(routes[user.role] || '/login', { replace: true });
    } else {
      navigate('/login', { replace: true });
    }
  }, [isInitialized, isAuthenticated, user, navigate]);

  return <LoadingScreen />;
}

export default function App() {
  const isInitialized = useAuthStore((s) => s.isInitialized);
  const init = useAuthStore((s) => s.init);

  useEffect(() => {
    init();
  }, [init]);

  if (!isInitialized) return <LoadingScreen />;

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
