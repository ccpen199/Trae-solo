import { Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from '@/layouts/AdminLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import RiderList from '@/pages/RiderList';
import RiderDetail from '@/pages/RiderDetail';
import OrderList from '@/pages/OrderList';
import OrderDetail from '@/pages/OrderDetail';
import AuditList from '@/pages/AuditList';
import Settings from '@/pages/Settings';

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="riders" element={<RiderList />} />
        <Route path="rider/:id" element={<RiderDetail />} />
        <Route path="orders" element={<OrderList />} />
        <Route path="order/:id" element={<OrderDetail />} />
        <Route path="audits" element={<AuditList />} />
        <Route path="settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export default App;
