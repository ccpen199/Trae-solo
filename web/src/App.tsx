import { Routes, Route, Navigate } from 'react-router-dom';
import ResidentLayout from './components/Layout/ResidentLayout';
import AdminLayout from './components/Layout/AdminLayout';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/resident/HomePage';
import DeviceListPage from './pages/resident/DeviceListPage';
import DeviceDetailPage from './pages/resident/DeviceDetailPage';
import OrderListPage from './pages/resident/OrderListPage';
import RewardsPage from './pages/resident/RewardsPage';
import ProfilePage from './pages/resident/ProfilePage';
import ReportPage from './pages/resident/ReportPage';
import ScanModal from './pages/resident/ScanModal';
import PropertyDashboardPage from './pages/property/DashboardPage';
import DeviceMonitorPage from './pages/property/DeviceMonitorPage';
import WorkOrderPage from './pages/property/WorkOrderPage';
import OperatorDashboardPage from './pages/operator/DashboardPage';
import HeatmapPage from './pages/operator/HeatmapPage';
import AnalyticsPage from './pages/operator/AnalyticsPage';
import PackagePage from './pages/operator/PackagePage';
import DeviceManagePage from './pages/operator/DeviceManagePage';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/scan" element={<ProtectedRoute requiredRole="resident"><ScanModal /></ProtectedRoute>} />
      <Route path="/report" element={<ProtectedRoute requiredRole="resident"><ReportPage /></ProtectedRoute>} />

      <Route path="/" element={
        <ProtectedRoute requiredRole="resident"><ResidentLayout /></ProtectedRoute>
      }>
        <Route index element={<Navigate to="/home" replace />} />
        <Route path="home" element={<HomePage />} />
        <Route path="devices" element={<DeviceListPage />} />
        <Route path="devices/:id" element={<DeviceDetailPage />} />
        <Route path="orders" element={<OrderListPage />} />
        <Route path="rewards" element={<RewardsPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>

      <Route path="/property" element={
        <ProtectedRoute requiredRole={['property', 'operator']}>
          <AdminLayout role="property" />
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="/property/dashboard" replace />} />
        <Route path="dashboard" element={<PropertyDashboardPage />} />
        <Route path="devices" element={<DeviceMonitorPage />} />
        <Route path="workorders" element={<WorkOrderPage />} />
      </Route>

      <Route path="/operator" element={
        <ProtectedRoute requiredRole="operator"><AdminLayout role="operator" /></ProtectedRoute>
      }>
        <Route index element={<Navigate to="/operator/dashboard" replace />} />
        <Route path="dashboard" element={<OperatorDashboardPage />} />
        <Route path="heatmap" element={<HeatmapPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="packages" element={<PackagePage />} />
        <Route path="devices" element={<DeviceManagePage />} />
      </Route>

      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );
}

export default App;
