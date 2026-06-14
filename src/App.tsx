import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from '@/components/MainLayout';
import Home from '@/pages/Home';
import Insurance from '@/pages/Insurance';
import Payment from '@/pages/Payment';
import Family from '@/pages/Family';
import Benefit from '@/pages/Benefit';
import Calculator from '@/pages/Calculator';
import Policy from '@/pages/Policy';
import WarningList from '@/pages/admin/WarningList';
import AuditRules from '@/pages/admin/AuditRules';
import DataShare from '@/pages/admin/DataShare';

type UserType = 'resident' | 'flexible' | 'admin_tax' | 'admin_ops' | null;

const isAdmin = (): boolean => {
  const userStr = localStorage.getItem('user');
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      return user.userType === 'admin_tax' || user.userType === 'admin_ops';
    } catch {
      return false;
    }
  }
  return import.meta.env.DEV;
};

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  if (!isAdmin()) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
};

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Home />} />
          <Route path="insurance" element={<Insurance />} />
          <Route path="payment" element={<Payment />} />
          <Route path="family" element={<Family />} />
          <Route path="benefit" element={<Benefit />} />
          <Route path="calculator" element={<Calculator />} />
          <Route path="policy" element={<Policy />} />
          <Route path="admin" element={<Navigate to="/admin/warning" replace />} />
          <Route
            path="admin/warning"
            element={
              <AdminRoute>
                <WarningList />
              </AdminRoute>
            }
          />
          <Route
            path="admin/audit"
            element={
              <AdminRoute>
                <AuditRules />
              </AdminRoute>
            }
          />
          <Route
            path="admin/datashare"
            element={
              <AdminRoute>
                <DataShare />
              </AdminRoute>
            }
          />
        </Route>
      </Routes>
    </Router>
  );
}
