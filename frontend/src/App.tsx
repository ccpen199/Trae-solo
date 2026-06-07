import { Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import RiderLayout from './components/Layout'
import AdminLayout from './components/Layout'
import RiderDashboard from './pages/rider/DashboardPage'
import OrdersPage from './pages/rider/OrdersPage'
import NearbyOrdersPage from './pages/rider/NearbyOrdersPage'
import OrderDetailPage from './pages/rider/OrderDetailPage'
import WalletPage from './pages/rider/WalletPage'
import ProfilePage from './pages/rider/ProfilePage'
import VerifyPage from './pages/rider/VerifyPage'
import AdminDashboard from './pages/admin/DashboardPage'
import RidersPage from './pages/admin/RidersPage'
import AdminOrdersPage from './pages/admin/OrdersPage'
import RiskPage from './pages/admin/RiskPage'
import CapacityPage from './pages/admin/CapacityPage'
import ContractsPage from './pages/admin/ContractsPage'
import ConfigPage from './pages/admin/ConfigPage'

function RedirectByRole() {
  const riderStr = localStorage.getItem('rider')
  let role = 'rider'
  try {
    if (riderStr) {
      role = JSON.parse(riderStr).role || 'rider'
    }
  } catch { /* ignore */ }
  return <Navigate to={role === 'admin' ? '/admin/dashboard' : '/rider/dashboard'} replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/rider"
        element={<RiderLayout type="rider" />}
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<RiderDashboard />} />
        <Route path="orders" element={<OrdersPage />} />
        <Route path="orders/nearby" element={<NearbyOrdersPage />} />
        <Route path="orders/:id" element={<OrderDetailPage />} />
        <Route path="wallet" element={<WalletPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="verify" element={<VerifyPage />} />
      </Route>
      <Route
        path="/admin"
        element={<AdminLayout type="admin" />}
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="riders" element={<RidersPage />} />
        <Route path="orders" element={<AdminOrdersPage />} />
        <Route path="risk" element={<RiskPage />} />
        <Route path="capacity" element={<CapacityPage />} />
        <Route path="contracts" element={<ContractsPage />} />
        <Route path="config" element={<ConfigPage />} />
      </Route>
      <Route path="/redirect" element={<RedirectByRole />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}
