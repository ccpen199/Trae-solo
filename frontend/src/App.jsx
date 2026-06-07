import { Routes, Route, Navigate } from 'react-router-dom';
import { isLoggedIn, getUserRole } from './utils/auth';
import Login from './pages/Login';
import MainLayout from './layouts/MainLayout';
import RoleGuard from './components/RoleGuard';
import PublishOrder from './pages/requester/PublishOrder';
import MyOrders from './pages/requester/MyOrders';
import OrderDetail from './pages/requester/OrderDetail';
import AvailableOrders from './pages/courier/AvailableOrders';
import MyTasks from './pages/courier/MyTasks';
import CheckIn from './pages/courier/CheckIn';
import Dashboard from './pages/admin/Dashboard';
import OrderManage from './pages/admin/OrderManage';
import CourierManage from './pages/admin/CourierManage';
import DispatchCenter from './pages/admin/DispatchCenter';
import QualityRules from './pages/admin/QualityRules';
import CreditManage from './pages/admin/CreditManage';
import EnterpriseAPI from './pages/admin/EnterpriseAPI';
import ServiceAreas from './pages/admin/ServiceAreas';
import Profile from './pages/common/Profile';

const roleRedirectMap = {
  requester: '/requester/publish',
  courier: '/courier/available',
  admin: '/admin/dashboard',
};

function IndexRedirect() {
  const loggedIn = isLoggedIn();
  if (loggedIn) {
    const role = getUserRole();
    return <Navigate to={roleRedirectMap[role] || '/login'} replace />;
  }
  return <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<IndexRedirect />} />

      <Route
        path="/requester"
        element={
          <RoleGuard allowedRole="requester">
            <MainLayout />
          </RoleGuard>
        }
      >
        <Route index element={<Navigate to="publish" replace />} />
        <Route path="publish" element={<PublishOrder />} />
        <Route path="orders" element={<MyOrders />} />
        <Route path="orders/:id" element={<OrderDetail />} />
        <Route path="profile" element={<Profile />} />
      </Route>

      <Route
        path="/courier"
        element={
          <RoleGuard allowedRole="courier">
            <MainLayout />
          </RoleGuard>
        }
      >
        <Route index element={<Navigate to="available" replace />} />
        <Route path="available" element={<AvailableOrders />} />
        <Route path="tasks" element={<MyTasks />} />
        <Route path="checkin/:id" element={<CheckIn />} />
        <Route path="profile" element={<Profile />} />
      </Route>

      <Route
        path="/admin"
        element={
          <RoleGuard allowedRole="admin">
            <MainLayout />
          </RoleGuard>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="orders" element={<OrderManage />} />
        <Route path="couriers" element={<CourierManage />} />
        <Route path="dispatch" element={<DispatchCenter />} />
        <Route path="quality" element={<QualityRules />} />
        <Route path="credit" element={<CreditManage />} />
        <Route path="enterprise" element={<EnterpriseAPI />} />
        <Route path="areas" element={<ServiceAreas />} />
        <Route path="profile" element={<Profile />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
