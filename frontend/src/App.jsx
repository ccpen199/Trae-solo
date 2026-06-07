import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ProviderList from './pages/providers/ProviderList';
import ProviderAudit from './pages/providers/ProviderAudit';
import ProductList from './pages/products/ProductList';
import OrderList from './pages/orders/OrderList';
import FeeConfig from './pages/admin/FeeConfig';
import Arbitration from './pages/admin/Arbitration';
import Reports from './pages/admin/Reports';
import RiskEvents from './pages/risk/RiskEvents';

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="providers" element={<ProviderList />} />
        <Route path="providers/audit" element={<ProviderAudit />} />
        <Route path="products" element={<ProductList />} />
        <Route path="orders" element={<OrderList />} />
        <Route path="fee-config" element={<FeeConfig />} />
        <Route path="arbitrations" element={<Arbitration />} />
        <Route path="reports" element={<Reports />} />
        <Route path="risk-events" element={<RiskEvents />} />
      </Route>
    </Routes>
  );
}
