import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DataProvider, ProtectedRoute } from './ProtectedRoute';
import { RoleLayout } from '@/components/layout/RoleLayout';
import LoginPage from '@/pages/LoginPage';

import ShipperDashboard from '@/pages/shipper/ShipperDashboard';
import PublishCargo from '@/pages/shipper/PublishCargo';
import ShipperOrderList from '@/pages/shipper/ShipperOrderList';
import OrderDetail from '@/pages/shipper/OrderDetail';
import ShipperHeatmap from '@/pages/shipper/ShipperHeatmap';
import InsuranceCenter from '@/pages/shipper/InsuranceCenter';

import DriverDashboard from '@/pages/driver/DriverDashboard';
import OrderHall from '@/pages/driver/OrderHall';

import DispatchCenter from '@/pages/dispatch/DispatchCenter';
import SaturationWarning from '@/pages/dispatch/SaturationWarning';

import AdminOverview from '@/pages/admin/AdminOverview';
import AdminOrderManage from '@/pages/admin/AdminOrderManage';
import UserManagement from '@/pages/admin/UserManagement';
import InsuranceManage from '@/pages/admin/InsuranceManage';

const ShipperLayout = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute allowedRoles={['SHIPPER']}>
    <RoleLayout>{children}</RoleLayout>
  </ProtectedRoute>
);

const DriverLayout = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute allowedRoles={['DRIVER']}>
    <RoleLayout>{children}</RoleLayout>
  </ProtectedRoute>
);

const AdminLayout = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute allowedRoles={['ADMIN']}>
    <RoleLayout>{children}</RoleLayout>
  </ProtectedRoute>
);

export function AppRouter() {
  return (
    <BrowserRouter>
      <DataProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          {/* 货主路由 */}
          <Route path="/shipper/dashboard" element={<ShipperLayout><ShipperDashboard /></ShipperLayout>} />
          <Route path="/shipper/publish" element={<ShipperLayout><PublishCargo /></ShipperLayout>} />
          <Route path="/shipper/orders" element={<ShipperLayout><ShipperOrderList /></ShipperLayout>} />
          <Route path="/shipper/orders/:id" element={<ShipperLayout><OrderDetail /></ShipperLayout>} />
          <Route path="/shipper/heatmap" element={<ShipperLayout><ShipperHeatmap /></ShipperLayout>} />
          <Route path="/shipper/insurance" element={<ShipperLayout><InsuranceCenter /></ShipperLayout>} />
          <Route path="/shipper" element={<Navigate to="/shipper/dashboard" replace />} />

          {/* 司机路由 */}
          <Route path="/driver/dashboard" element={<DriverLayout><DriverDashboard /></DriverLayout>} />
          <Route path="/driver/hall" element={<DriverLayout><OrderHall /></DriverLayout>} />
          <Route path="/driver/orders/:id" element={<DriverLayout><OrderDetail /></DriverLayout>} />
          <Route path="/driver" element={<Navigate to="/driver/dashboard" replace />} />

          {/* 调度/运营路由 */}
          <Route path="/dispatch/center" element={<AdminLayout><DispatchCenter /></AdminLayout>} />
          <Route path="/dispatch/saturation" element={<AdminLayout><SaturationWarning /></AdminLayout>} />
          <Route path="/dispatch" element={<Navigate to="/dispatch/center" replace />} />

          {/* 管理后台路由 */}
          <Route path="/admin/overview" element={<AdminLayout><AdminOverview /></AdminLayout>} />
          <Route path="/admin/orders" element={<AdminLayout><AdminOrderManage /></AdminLayout>} />
          <Route path="/admin/users" element={<AdminLayout><UserManagement /></AdminLayout>} />
          <Route path="/admin/insurance" element={<AdminLayout><InsuranceManage /></AdminLayout>} />
          <Route path="/admin" element={<Navigate to="/admin/overview" replace />} />

          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </DataProvider>
    </BrowserRouter>
  );
}
