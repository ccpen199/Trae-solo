import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuthStore, type UserRole } from '@/store/authStore';
import Layout from '@/components/Layout';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import AdminDashboard from '@/pages/dashboard/AdminDashboard';
import PropertyDashboard from '@/pages/dashboard/PropertyDashboard';
import ResidentDashboard from '@/pages/dashboard/ResidentDashboard';
import MerchantDashboard from '@/pages/dashboard/MerchantDashboard';
import BuildingList from '@/pages/BuildingList';
import BuildingDetail from '@/pages/BuildingDetail';
import TicketList from '@/pages/TicketList';
import TicketCreate from '@/pages/TicketCreate';
import TicketDetail from '@/pages/TicketDetail';
import CommunityFeed from '@/pages/CommunityFeed';
import PostCreate from '@/pages/PostCreate';
import MerchantSquare from '@/pages/MerchantSquare';
import MerchantDetail from '@/pages/MerchantDetail';
import Marketplace from '@/pages/Marketplace';
import ItemCreate from '@/pages/ItemCreate';
import CommunityMetrics from '@/pages/CommunityMetrics';
import FeeCenter from '@/pages/FeeCenter';
import AccessControl from '@/pages/AccessControl';
import NotFound from '@/pages/NotFound';

interface PrivateRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

function PrivateRoute({ children, allowedRoles }: PrivateRouteProps) {
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    const roleDashboards: Record<UserRole, string> = {
      admin: '/dashboard/admin',
      property: '/dashboard/property',
      resident: '/dashboard/resident',
      merchant: '/dashboard/merchant',
    };
    return <Navigate to={roleDashboards[user.role]} replace />;
  }

  return <>{children}</>;
}

function RoleDashboardRedirect() {
  const { user, isAuthenticated } = useAuthStore();
  
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  const roleDashboards: Record<UserRole, string> = {
    admin: '/dashboard/admin',
    property: '/dashboard/property',
    resident: '/dashboard/resident',
    merchant: '/dashboard/merchant',
  };

  return <Navigate to={roleDashboards[user.role]} replace />;
}

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }
        >
          <Route index element={<RoleDashboardRedirect />} />
          <Route path="dashboard/admin" element={
            <PrivateRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </PrivateRoute>
          } />
          <Route path="dashboard/property" element={
            <PrivateRoute allowedRoles={['admin', 'property']}>
              <PropertyDashboard />
            </PrivateRoute>
          } />
          <Route path="dashboard/resident" element={
            <PrivateRoute allowedRoles={['admin', 'resident']}>
              <ResidentDashboard />
            </PrivateRoute>
          } />
          <Route path="dashboard/merchant" element={
            <PrivateRoute allowedRoles={['admin', 'merchant']}>
              <MerchantDashboard />
            </PrivateRoute>
          } />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="buildings" element={
            <PrivateRoute allowedRoles={['admin', 'property']}>
              <BuildingList />
            </PrivateRoute>
          } />
          <Route path="buildings/:id" element={
            <PrivateRoute allowedRoles={['admin', 'property']}>
              <BuildingDetail />
            </PrivateRoute>
          } />
          <Route path="tickets" element={<TicketList />} />
          <Route path="tickets/create" element={<TicketCreate />} />
          <Route path="tickets/:id" element={<TicketDetail />} />
          <Route path="community" element={<CommunityFeed />} />
          <Route path="posts/create" element={<PostCreate />} />
          <Route path="merchants" element={<MerchantSquare />} />
          <Route path="merchants/:id" element={<MerchantDetail />} />
          <Route path="marketplace" element={<Marketplace />} />
          <Route path="items/create" element={<ItemCreate />} />
          <Route path="metrics" element={
            <PrivateRoute allowedRoles={['admin', 'property']}>
              <CommunityMetrics />
            </PrivateRoute>
          } />
          <Route path="fees" element={<FeeCenter />} />
          <Route path="access" element={
            <PrivateRoute allowedRoles={['admin', 'property']}>
              <AccessControl />
            </PrivateRoute>
          } />
        </Route>
        <Route path="/404" element={<NotFound />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}
