import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore, getRoleDefaultRoute } from '@/stores/authStore';
import Layout from '@/components/Layout';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import Monitor from '@/pages/Monitor';
import Trajectory from '@/pages/Trajectory';
import Fence from '@/pages/Fence';
import Alerts from '@/pages/Alerts';
import Schedule from '@/pages/Schedule';
import DriverBehavior from '@/pages/DriverBehavior';
import Devices from '@/pages/Devices';
import Organization from '@/pages/Organization';
import ApiGateway from '@/pages/ApiGateway';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const fetchProfile = useAuthStore((s) => s.fetchProfile);
  const location = useLocation();

  useEffect(() => {
    if (isAuthenticated && !user) {
      fetchProfile();
    }
  }, [isAuthenticated, user, fetchProfile]);

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return <>{children}</>;
}

function RoleRedirect() {
  const user = useAuthStore((s) => s.user);
  const target = user ? getRoleDefaultRoute(user.role) : '/dashboard';
  return <Navigate to={target} replace />;
}

function LoginRoute() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);

  if (isAuthenticated && user) {
    const target = getRoleDefaultRoute(user.role);
    return <Navigate to={target} replace />;
  }
  return <Login />;
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginRoute />} />
        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/monitor" element={<Monitor />} />
          <Route path="/trajectory" element={<Trajectory />} />
          <Route path="/fence" element={<Fence />} />
          <Route path="/alerts" element={<Alerts />} />
          <Route path="/schedule" element={<Schedule />} />
          <Route path="/driver-behavior" element={<DriverBehavior />} />
          <Route path="/devices" element={<Devices />} />
          <Route path="/organization" element={<Organization />} />
          <Route path="/api-gateway" element={<ApiGateway />} />
        </Route>
        <Route path="/" element={<ProtectedRoute><RoleRedirect /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
