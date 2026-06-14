import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
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

export function AppRouter() {
  return (
    <BrowserRouter>
      <DataProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route
            path="/shipper/*"
            element={
              <ProtectedRoute allowedRoles={['SHIPPER']}>
                <RoleLayout>
                  <Routes>
                    <Route path="dashboard" element={<ShipperDashboard />} />
                    <Route path="publish" element={<PublishCargo />} />
                    <Route path="orders" element={<ShipperOrderList />} />
                    <Route path="orders/:id" element={<OrderDetail />} />
                    <Route path="heatmap" element={<ShipperHeatmap />} />
                    <Route path="insurance" element={<InsuranceCenter />} />
                    <Route path="" element={<Navigate to="/shipper/dashboard" replace />} />
                    <Route path="*" element={<Navigate to="/shipper/dashboard" replace />} />
                  </Routes>
                </RoleLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/driver/*"
            element={
              <ProtectedRoute allowedRoles={['DRIVER']}>
                <RoleLayout>
                  <Routes>
                    <Route path="dashboard" element={<DriverDashboard />} />
                    <Route path="hall" element={<OrderHall />} />
                    <Route path="orders/:id" element={<OrderDetail />} />
                    <Route path="" element={<Navigate to="/driver/dashboard" replace />} />
                    <Route path="*" element={<Navigate to="/driver/dashboard" replace />} />
                  </Routes>
                </RoleLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/dispatch/*"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <RoleLayout>
                  <Routes>
                    <Route path="center" element={<DispatchCenter />} />
                    <Route path="saturation" element={<SaturationWarning />} />
                    <Route path="" element={<Navigate to="/dispatch/center" replace />} />
                    <Route path="*" element={<Navigate to="/dispatch/center" replace />} />
                  </Routes>
                </RoleLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/*"
            element={
              <ProtectedRoute allowedRoles={['ADMIN']}>
                <RoleLayout>
                  <Routes>
                    <Route path="overview" element={<AdminOverview />} />
                    <Route path="orders" element={<AdminOrderManage />} />
                    <Route path="users" element={<UserManagement />} />
                    <Route path="insurance" element={<InsuranceManage />} />
                    <Route path="" element={<Navigate to="/admin/overview" replace />} />
                    <Route path="*" element={<Navigate to="/admin/overview" replace />} />
                  </Routes>
                </RoleLayout>
              </ProtectedRoute>
            }
          />

          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </DataProvider>
    </BrowserRouter>
  );
}
