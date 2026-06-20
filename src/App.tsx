import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import NotFound from '@/pages/NotFound';
import Home from '@/pages/Home';
import TaskList from '@/pages/TaskList';
import TaskDetail from '@/pages/TaskDetail';
import OrderList from '@/pages/OrderList';
import OrderDetail from '@/pages/OrderDetail';
import CourierList from '@/pages/CourierList';
import CourierDetail from '@/pages/CourierDetail';
import MessageCenter from '@/pages/MessageCenter';
import FinanceCenter from '@/pages/FinanceCenter';
import GlobalDashboard from '@/pages/GlobalDashboard';
import OfflinePickup from '@/pages/OfflinePickup';
import WaybillTemplate from '@/pages/WaybillTemplate';
import WaybillAccount from '@/pages/WaybillAccount';
import WaybillRecharge from '@/pages/WaybillRecharge';
import BankCardManage from '@/pages/BankCardManage';
import WithdrawRecord from '@/pages/WithdrawRecord';
import UserProfile from '@/pages/UserProfile';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Layout } from '@/components/Layout';
import { useAuthStore } from '@/store';
import type { UserRole } from 'shared/types';

function AuthInitializer({ children }: { children: React.ReactNode }) {
  const initialize = useAuthStore((s) => s.initialize);
  useEffect(() => {
    initialize();
  }, [initialize]);
  return <>{children}</>;
}

const allRoles: UserRole[] = ['courier', 'admin', 'operator'];
const adminOpRoles: UserRole[] = ['admin', 'operator'];
const operatorRoles: UserRole[] = ['operator'];
const courierRoles: UserRole[] = ['courier'];

function AuthenticatedLayout() {
  return (
    <ProtectedRoute>
      <Layout />
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <Router>
      <AuthInitializer>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route element={<AuthenticatedLayout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/home" element={<Home />} />
            <Route path="/tasks" element={<ProtectedRoute allowedRoles={allRoles}><TaskList /></ProtectedRoute>} />
            <Route path="/tasks/:id" element={<ProtectedRoute allowedRoles={allRoles}><TaskDetail /></ProtectedRoute>} />
            <Route path="/orders" element={<ProtectedRoute allowedRoles={adminOpRoles}><OrderList /></ProtectedRoute>} />
            <Route path="/orders/:id" element={<ProtectedRoute allowedRoles={adminOpRoles}><OrderDetail /></ProtectedRoute>} />
            <Route path="/couriers" element={<ProtectedRoute allowedRoles={adminOpRoles}><CourierList /></ProtectedRoute>} />
            <Route path="/couriers/:id" element={<ProtectedRoute allowedRoles={adminOpRoles}><CourierDetail /></ProtectedRoute>} />
            <Route path="/messages" element={<MessageCenter />} />
            <Route path="/finance" element={<ProtectedRoute allowedRoles={adminOpRoles}><FinanceCenter /></ProtectedRoute>} />
            <Route path="/global-dashboard" element={<ProtectedRoute allowedRoles={operatorRoles}><GlobalDashboard /></ProtectedRoute>} />
            <Route path="/offline-pickup" element={<ProtectedRoute allowedRoles={courierRoles}><OfflinePickup /></ProtectedRoute>} />
            <Route path="/waybill-template" element={<ProtectedRoute allowedRoles={adminOpRoles}><WaybillTemplate /></ProtectedRoute>} />
            <Route path="/waybill-account" element={<ProtectedRoute allowedRoles={adminOpRoles}><WaybillAccount /></ProtectedRoute>} />
            <Route path="/waybill-recharge" element={<ProtectedRoute allowedRoles={adminOpRoles}><WaybillRecharge /></ProtectedRoute>} />
            <Route path="/bank-cards" element={<ProtectedRoute allowedRoles={adminOpRoles}><BankCardManage /></ProtectedRoute>} />
            <Route path="/withdraw-records" element={<ProtectedRoute allowedRoles={adminOpRoles}><WithdrawRecord /></ProtectedRoute>} />
            <Route path="/profile" element={<UserProfile />} />
          </Route>

          <Route path="/403" element={
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
              <div className="text-center">
                <h1 className="text-6xl font-bold text-gray-300 mb-4">403</h1>
                <p className="text-xl text-gray-600 mb-8">您没有权限访问此页面</p>
                <button
                  onClick={() => window.location.href = '/dashboard'}
                  className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  返回首页
                </button>
              </div>
            </div>
          } />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthInitializer>
    </Router>
  );
}
