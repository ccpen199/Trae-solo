import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import CourierWorkbench from './pages/CourierWorkbench';
import CourierPackages from './pages/CourierPackages';
import Performance from './pages/Performance';
import BranchManager from './pages/BranchManager';
import BranchTasks from './pages/BranchTasks';
import BranchSettlements from './pages/BranchSettlements';
import BranchAlerts from './pages/BranchAlerts';
import LockerStations from './pages/LockerStations';
import CustomerGroups from './pages/CustomerGroups';
import ShopOrders from './pages/ShopOrders';
import AdminPanel from './pages/AdminPanel';
import AdminBranches from './pages/AdminBranches';
import AdminSettlements from './pages/AdminSettlements';
import AdminAlerts from './pages/AdminAlerts';
import AdminAuditLogs from './pages/AdminAuditLogs';
import { ReactNode } from 'react';

function PrivateRoute({ children, roles }: { children: ReactNode; roles?: string[] }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400">加载中...</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function HomeRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  const map: Record<string, string> = { admin: '/admin', platform: '/branch', ops: '/courier' };
  return <Navigate to={map[user.role] || '/login'} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<HomeRedirect />} />
      <Route element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route path="/courier" element={<PrivateRoute roles={['ops']}><CourierWorkbench /></PrivateRoute>} />
        <Route path="/courier/packages" element={<PrivateRoute roles={['ops']}><CourierPackages /></PrivateRoute>} />
        <Route path="/courier/performance" element={<PrivateRoute roles={['ops']}><Performance userId="me" /></PrivateRoute>} />
        <Route path="/branch" element={<PrivateRoute roles={['platform']}><BranchManager /></PrivateRoute>} />
        <Route path="/branch/tasks" element={<PrivateRoute roles={['platform']}><BranchTasks /></PrivateRoute>} />
        <Route path="/branch/locker-stations" element={<PrivateRoute roles={['platform']}><LockerStations /></PrivateRoute>} />
        <Route path="/branch/settlements" element={<PrivateRoute roles={['platform']}><BranchSettlements /></PrivateRoute>} />
        <Route path="/branch/customer-groups" element={<PrivateRoute roles={['platform']}><CustomerGroups /></PrivateRoute>} />
        <Route path="/branch/shop-orders" element={<PrivateRoute roles={['platform']}><ShopOrders /></PrivateRoute>} />
        <Route path="/branch/alerts" element={<PrivateRoute roles={['platform']}><BranchAlerts /></PrivateRoute>} />
        <Route path="/admin" element={<PrivateRoute roles={['admin']}><AdminPanel /></PrivateRoute>} />
        <Route path="/admin/branches" element={<PrivateRoute roles={['admin']}><AdminBranches /></PrivateRoute>} />
        <Route path="/admin/locker-stations" element={<PrivateRoute roles={['admin']}><LockerStations /></PrivateRoute>} />
        <Route path="/admin/settlements" element={<PrivateRoute roles={['admin']}><AdminSettlements /></PrivateRoute>} />
        <Route path="/admin/performance" element={<PrivateRoute roles={['admin']}><Performance /></PrivateRoute>} />
        <Route path="/admin/customer-groups" element={<PrivateRoute roles={['admin']}><CustomerGroups /></PrivateRoute>} />
        <Route path="/admin/shop-orders" element={<PrivateRoute roles={['admin']}><ShopOrders /></PrivateRoute>} />
        <Route path="/admin/alerts" element={<PrivateRoute roles={['admin']}><AdminAlerts /></PrivateRoute>} />
        <Route path="/admin/audit-logs" element={<PrivateRoute roles={['admin']}><AdminAuditLogs /></PrivateRoute>} />
      </Route>
    </Routes>
  );
}
