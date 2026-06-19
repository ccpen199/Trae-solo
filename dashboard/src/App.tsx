import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import Layout from './components/layout/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CouponList from './pages/CouponList';
import CouponDetail from './pages/CouponDetail';
import CouponCreate from './pages/CouponCreate';
import Inventory from './pages/Inventory';
import Verification from './pages/Verification';
import Reports from './pages/Reports';
import Alerts from './pages/Alerts';
import RiskControl from './pages/RiskControl';
import Merchant from './pages/Merchant';
import Provincial from './pages/Provincial';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: location } });
    }
  }, [isAuthenticated, navigate, location]);

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}

function AppRoutes() {
  const { isAuthenticated } = useAuthStore();
  const location = useLocation();

  if (location.pathname === '/login') {
    if (isAuthenticated) {
      return <Navigate to="/dashboard" replace />;
    }
    return <Login />;
  }

  return (
    <ProtectedRoute>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/coupons" element={<CouponList />} />
          <Route path="/coupons/:id" element={<CouponDetail />} />
          <Route path="/coupons/create" element={<CouponCreate />} />
          <Route path="/coupons/edit/:id" element={<CouponCreate />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/verification" element={<Verification />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/alerts" element={<Alerts />} />
          <Route path="/risk-control" element={<RiskControl />} />
          <Route path="/merchants" element={<Merchant />} />
          <Route path="/provincial" element={<Provincial />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Layout>
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}
